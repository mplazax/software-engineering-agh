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
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND, HTTP_409_CONFLICT

router = APIRouter(prefix="/recommendations", tags=["Change Recommendations"])

@router.get("/{change_request_id}", response_model=List[ChangeRecomendationResponse])
def get_recommendations(change_request_id: int, db: Session = Depends(get_db)):
    recs = db.query(ChangeRecomendation).options(
        joinedload(ChangeRecomendation.recommended_room)
    ).filter_by(change_request_id=change_request_id).all()

    seen = set()
    unique_recs = []
    for r in recs:
        key = (r.recommended_day, r.recommended_slot_id, r.recommended_room_id)
        if key in seen:
            continue
        seen.add(key)
        unique_recs.append(r)

    unique_recs.sort(key=lambda r: (
        r.recommended_day,
        r.recommended_slot_id,
        r.recommended_room_id
    ))

    return unique_recs

@router.post("/{change_request_id}")
def find_recommendations(
    change_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_request = db.query(ChangeRequest).filter(ChangeRequest.id == change_request_id).first()
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")

    existing_rec = db.query(ChangeRecomendation).filter(ChangeRecomendation.change_request_id == change_request_id).all()
    if existing_rec:
        return existing_rec

    course_event = change_request.course_event
    teacher = course_event.course.teacher
    group = course_event.course.group
    group_leader = group.leader

    if not teacher or not group_leader:
        raise HTTPException(status_code=404, detail="Could not determine both parties for the request.")

    teacher_proposals = db.query(
        AvailabilityProposal.day,
        AvailabilityProposal.time_slot_id
    ).filter(
        AvailabilityProposal.change_request_id == change_request_id,
        AvailabilityProposal.user_id == teacher.id
    ).subquery()

    # Wspólne sloty (dzień + slot) obu stron – UNIKALNIE
    common_slots = db.query(
        AvailabilityProposal.day,
        AvailabilityProposal.time_slot_id
    ).filter(
        AvailabilityProposal.change_request_id == change_request_id,
        AvailabilityProposal.user_id == group_leader.id
    ).join(
        teacher_proposals,
        (AvailabilityProposal.day == teacher_proposals.c.day) &
        (AvailabilityProposal.time_slot_id == teacher_proposals.c.time_slot_id)
    ).distinct().all()

    if not common_slots:
        return []

    recommendations = []
    processed_keys = set()

    for day, slot_id in common_slots:
        # --- Sprawdź niedostępne sale ---
        unavailable_by_block = db.query(RoomUnavailability.room_id).filter(
            RoomUnavailability.start_datetime <= day,
            RoomUnavailability.end_datetime >= day
        ).subquery()

        unavailable_by_event = db.query(CourseEvent.room_id).filter(
            CourseEvent.day == day,
            CourseEvent.time_slot_id == slot_id,
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
            required_eq_names = [
                name.strip().lower()
                for name in change_request.room_requirements.split(',')
                if name.strip()
            ]
            if required_eq_names:
                base_query = base_query.join(Room.equipment).filter(
                    func.lower(Equipment.name).in_(required_eq_names)
                ).group_by(Room.id).having(
                    func.count(Equipment.id) >= len(required_eq_names)
                )

        available_rooms = base_query.order_by(Room.capacity).all()

        for room in available_rooms:
            key = (day, slot_id, room.id)
            if key in processed_keys:
                continue

            # Upewnij się, że nie istnieje w bazie (np. po wielokrotnym kliknięciu)
            existing = db.query(ChangeRecomendation).filter_by(
                change_request_id=change_request_id,
                recommended_day=day,
                recommended_slot_id=slot_id,
                recommended_room_id=room.id
            ).first()
            if existing:
                continue

            # Sprawdź konflikty nauczyciela i grupy
            teacher_conflict = db.query(CourseEvent).join(Course).filter(
                Course.teacher_id == teacher.id,
                CourseEvent.day == day,
                CourseEvent.time_slot_id == slot_id,
                CourseEvent.canceled == False
            ).first()
            if teacher_conflict:
                continue

            group_conflict = db.query(CourseEvent).join(Course).filter(
                Course.group_id == group.id,
                CourseEvent.day == day,
                CourseEvent.time_slot_id == slot_id,
                CourseEvent.canceled == False
            ).first()
            if group_conflict:
                continue

            # Wszystko OK – dodaj
            processed_keys.add(key)
            recommendation = ChangeRecomendation(
                change_request_id=change_request_id,
                recommended_day=day,
                recommended_slot_id=slot_id,
                recommended_room_id=room.id,
                source_proposal_id=None  # lub przypisz, jeśli chcesz
            )
            try:
                db.add(recommendation)
                db.flush()
            except IntegrityError:
                db.rollback()
                continue
            # db.add(recommendation)
            # db.flush()
            recommendation.recommended_room = room
            recommendations.append(recommendation)

    db.commit()

    return recommendations


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

    if is_teacher:
        recommendation.rejected_by_teacher = True
    elif is_leader:
        recommendation.rejected_by_leader = True
    # db.delete(recommendation)
    db.commit()
    return

@router.post("/{recommendation_id}/accept", response_model=ChangeRequestResponse)
def accept_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(ChangeRecomendation).options(
        joinedload(ChangeRecomendation.change_request).joinedload(ChangeRequest.course_event).joinedload(CourseEvent.course)
    ).filter(ChangeRecomendation.id == recommendation_id).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    course = rec.change_request.course_event.course

    if current_user.id == course.teacher_id:
        print("teacher")
        rec.accepted_by_teacher = True
    elif current_user.id == course.group.leader_id:
        print("leader")
        rec.accepted_by_leader = True
    else:
        raise HTTPException(status_code=403, detail="Not authorized to accept this recommendation.")

    db.flush()

    if rec.accepted_by_teacher and rec.accepted_by_leader:
        return finalize_recommendation(rec, db)

    db.commit()
    return rec.change_request

def finalize_recommendation(rec: ChangeRecomendation, db: Session):
    change_request = rec.change_request
    original_event = change_request.course_event
    course = original_event.course
    group = course.group

    if change_request.cyclical:
        original_weekday = (original_event.day.weekday() + 1) % 7
        target_weekday = rec.recommended_day.weekday()

        related_events = db.query(CourseEvent).filter(
            CourseEvent.course_id == original_event.course_id,
            extract('dow', CourseEvent.day) == original_weekday,
            CourseEvent.time_slot_id == original_event.time_slot_id,
            CourseEvent.day >= rec.recommended_day,
            CourseEvent.canceled == False
        ).all()

        for event in related_events:
            new_day = shift_to_weekday(event.day, target_weekday)
            new_event = CourseEvent(
                course_id=event.course_id,
                room_id=rec.recommended_room_id,
                day=new_day,
                time_slot_id=rec.recommended_slot_id,
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
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Room is already booked.")

            group_conflict = db.query(CourseEvent).join(Course).filter(
                Course.group_id == group.id,
                CourseEvent.time_slot_id == new_event.time_slot_id,
                CourseEvent.day == new_event.day,
                CourseEvent.canceled == False,
            ).first()
            if group_conflict:
                raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Group has other event")

            db.add(new_event)
            event.canceled = True

    else:
        new_event = CourseEvent(
            course_id=original_event.course_id,
            room_id=rec.recommended_room_id,
            day=rec.recommended_day,
            time_slot_id=rec.recommended_slot_id,
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
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Room is already booked.")

        db.add(new_event)
        original_event.canceled = True

    change_request.status = ChangeRequestStatus.ACCEPTED

    # Czyszczenie danych pomocniczych
    db.query(ChangeRecomendation).filter(
        ChangeRecomendation.change_request_id == change_request.id
    ).delete(synchronize_session=False)

    db.query(AvailabilityProposal).filter(
        AvailabilityProposal.change_request_id == change_request.id
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(change_request)
    return change_request

@router.get("/{recommendation_id}/acceptance-status")
def get_acceptance_status(recommendation_id: int, db: Session = Depends(get_db)):
    rec = db.query(ChangeRecomendation).filter(ChangeRecomendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {
        "accepted_by_teacher": rec.accepted_by_teacher,
        "accepted_by_leader": rec.accepted_by_leader,
    }