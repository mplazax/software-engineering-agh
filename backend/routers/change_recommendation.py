from datetime import date, timedelta
from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import (
    AvailabilityProposal, ChangeRecomendation, ChangeRequest, CourseEvent,
    Equipment, Room, RoomUnavailability, User, ChangeRequestStatus, Course, Group
)
from routers.auth import get_current_user
from routers.schemas import ChangeRecomendationResponse, ChangeRequestResponse
from sqlalchemy import func, or_, extract
from sqlalchemy.orm import Session, joinedload
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND, HTTP_409_CONFLICT

router = APIRouter(prefix="/recommendations", tags=["Change Recommendations"])

@router.get("/", response_model=List[ChangeRecomendationResponse])
def get_all_recomendations(db: Session = Depends(get_db)):
    return db.query(ChangeRecomendation).all()

@router.get("/{change_request_id}", response_model=List[ChangeRecomendationResponse])
def get_recommendations(change_request_id: int, db: Session = Depends(get_db)):
    recs = db.query(ChangeRecomendation).options(
        joinedload(ChangeRecomendation.recommended_room)
    ).filter_by(change_request_id=change_request_id).all()

    return recs

@router.post("/{change_request_id}", response_model=List[ChangeRecomendationResponse])
def find_recommendations(change_request_id: int, db: Session = Depends(get_db),
                         current_user: User = Depends(get_current_user)) -> List[ChangeRecomendation]:
    change_request = db.query(ChangeRequest).filter(ChangeRequest.id == change_request_id).first()
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")

    course_event = change_request.course_event
    teacher = course_event.course.teacher
    group_leader = course_event.course.group.leader

    if not teacher or not group_leader:
        raise HTTPException(status_code=404, detail="Could not determine both parties for the request.")

    teacher_proposals = db.query(AvailabilityProposal.day, AvailabilityProposal.time_slot_id).filter(
        AvailabilityProposal.change_request_id == change_request_id,
        AvailabilityProposal.user_id == teacher.id
    ).subquery()

    leader_proposals = db.query(AvailabilityProposal).filter(
        AvailabilityProposal.change_request_id == change_request_id,
        AvailabilityProposal.user_id == group_leader.id
    )

    common_proposals = leader_proposals.join(
        teacher_proposals,
        (AvailabilityProposal.day == teacher_proposals.c.day) & (
                    AvailabilityProposal.time_slot_id == teacher_proposals.c.time_slot_id)
    ).all()

    if not common_proposals:
        return []

    recommendations = []
    processed_slots = set()
    next_id = 1

    for proposal in common_proposals:
        slot_key = (proposal.day, proposal.time_slot_id)
        if slot_key in processed_slots:
            continue
        processed_slots.add(slot_key)

        unavailable_by_block = db.query(RoomUnavailability.room_id).filter(
            RoomUnavailability.start_datetime <= proposal.day,
            RoomUnavailability.end_datetime >= proposal.day
        ).subquery()

        unavailable_by_event = db.query(CourseEvent.room_id).filter(
            CourseEvent.day == proposal.day,
            CourseEvent.time_slot_id == proposal.time_slot_id,
            CourseEvent.canceled == False,
            CourseEvent.room_id.isnot(None)
        ).subquery()

        base_query = db.query(Room).filter(
            Room.id.notin_(unavailable_by_block),
            Room.id.notin_(unavailable_by_event),
        )

        if change_request.minimum_capacity > 0:
            base_query = base_query.filter(Room.capacity >= change_request.minimum_capacity)

        if change_request.room_requirements:
            required_eq_names = [name.strip().lower() for name in change_request.room_requirements.split(',') if
                                 name.strip()]
            if required_eq_names:
                base_query = base_query.join(Room.equipment).filter(
                    func.lower(Equipment.name).in_(required_eq_names)
                ).group_by(Room.id).having(
                    func.count(Equipment.id) >= len(required_eq_names)
                )

        available_rooms = base_query.order_by(Room.capacity).all()

        for room in available_rooms:
            # Używamy ID propozycji źródłowej jako ID rekomendacji - to upraszcza logikę akceptacji
            recommendation = ChangeRecomendation(
                change_request_id=change_request_id,
                recommended_day=proposal.day,
                recommended_slot_id=proposal.time_slot_id,
                recommended_room_id=room.id,
                source_proposal_id=proposal.id,
            )
            db.add(recommendation)
            db.flush()
            recommendation.recommended_room = room
            recommendations.append(recommendation)
    db.commit()
    result = db.query(ChangeRecomendation).filter(
        ChangeRecomendation.change_request_id == change_request_id
    ).order_by(ChangeRecomendation.id.desc()).limit(len(recommendations)).all()
    return result


def shift_to_weekday(original_date: date, target_weekday: int) -> date:
    """Zwraca datę z tego samego tygodnia co `original_date`, ale z podmienionym dniem tygodnia (0=pon, 6=niedz)."""
    current_weekday = original_date.weekday()
    return original_date + timedelta(days=(target_weekday - current_weekday))

@router.post("/{recommendation_id}/reject", status_code=204)
def reject_single_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recommendation = db.query(ChangeRecomendation).filter(
        ChangeRecomendation.id == recommendation_id
    ).first()

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    change_request = recommendation.change_request
    course = change_request.course_event.course
    is_leader = current_user.id == course.group.leader_id
    is_teacher = current_user.id == course.teacher_id
    if not (is_leader or is_teacher):
        raise HTTPException(status_code=403, detail="Not authorized to reject recommendation")

    recommendation.source_proposal_id = None
    db.flush()

    db.delete(recommendation)
    db.commit()
    return

@router.post("/{source_proposal_id}/accept", response_model=ChangeRequestResponse)
def accept_recommendation(
        source_proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Znajdujemy propozycję, która jest podstawą akceptacji
    source_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == source_proposal_id).first()
    if not source_proposal:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Source proposal for this recommendation not found.")

    change_request = source_proposal.change_request
    if not change_request:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Associated change request not found.")

    if change_request.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="This request has already been processed.")

    # Rekonstruujemy zaakceptowaną rekomendację
    # Musimy znaleźć pasującą salę
    # Ta logika jest skomplikowana, ale wynika z obecnej struktury
    accepted_rec = db.query(ChangeRecomendation).filter(
        ChangeRecomendation.source_proposal_id == source_proposal_id,
        ChangeRecomendation.change_request_id == change_request.id
    ).first()

    if not accepted_rec:
        raise HTTPException(status_code=404, detail="Recommendation not found or no longer valid.")

    original_event = change_request.course_event
    course = original_event.course
    group = course.group

    is_leader = current_user.id == course.group.leader_id
    is_teacher = current_user.id == course.teacher_id
    if not (is_leader or is_teacher):
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized to accept this recommendation.")

    if change_request.cyclical:
        original_weekday = original_event.day.weekday()
        target_weekday = accepted_rec.recommended_day.weekday()

        related_events = db.query(CourseEvent).filter(
            CourseEvent.course_id == original_event.course_id,
            extract('dow', CourseEvent.day) == original_weekday,
            CourseEvent.time_slot_id == original_event.time_slot_id,
            CourseEvent.canceled == False
        ).all()

        for event in related_events:
            new_day = shift_to_weekday(event.day, target_weekday)
            new_event = CourseEvent(
                course_id=event.course_id,
                room_id=accepted_rec.recommended_room_id,
                day=new_day,
                time_slot_id=accepted_rec.recommended_slot_id,
                canceled=False,
                was_rescheduled=False
            )
            conflict = db.query(CourseEvent).filter(
                CourseEvent.room_id == new_event.room_id,
                CourseEvent.day == new_event.day,
                CourseEvent.time_slot_id == new_event.time_slot_id,
                CourseEvent.canceled == False,
            ).first()

            if conflict:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f"Room is already booked.")

            conflict = db.query(CourseEvent).join(Course).filter(
                Course.group_id == group.id,
                CourseEvent.time_slot_id == new_event.time_slot_id,
                CourseEvent.day == new_event.day,
                CourseEvent.canceled == False,
            ).first()

            if conflict:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f"Group has other event")

            db.add(new_event)
            event.canceled = True
    else:
        new_event = CourseEvent(
            course_id=original_event.course_id,
            room_id=accepted_rec.recommended_room_id,
            day=accepted_rec.recommended_day,
            time_slot_id=accepted_rec.recommended_slot_id,
            canceled=False,
            was_rescheduled=True
        )
        conflict = db.query(CourseEvent).filter(
            CourseEvent.room_id == new_event.room_id,
            CourseEvent.day == new_event.day,
            CourseEvent.time_slot_id == new_event.time_slot_id,
            CourseEvent.canceled == False,
        ).first()

        if conflict:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f"Room is already booked.")
        db.add(new_event)
        original_event.canceled = True

    change_request.status = ChangeRequestStatus.ACCEPTED

    # Czyszczenie po udanej operacji
    db.query(ChangeRecomendation).filter(
        ChangeRecomendation.change_request_id == change_request.id
    ).delete(synchronize_session=False)

    db.query(AvailabilityProposal).filter(
        AvailabilityProposal.change_request_id == change_request.id
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(change_request)
    return change_request