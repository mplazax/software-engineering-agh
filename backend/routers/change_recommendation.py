from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import (
    AvailabilityProposal, ChangeRecomendation, ChangeRequest, CourseEvent,
    Equipment, Room, RoomUnavailability, User
)
from routers.auth import get_current_user
from routers.schemas import ChangeRecomendationResponse
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

router = APIRouter(prefix="/recommendations", tags=["Change Recommendations"])

@router.get("/{change_request_id}", response_model=List[ChangeRecomendationResponse])
def get_recommendations(change_request_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[ChangeRecomendation]:
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
        (AvailabilityProposal.day == teacher_proposals.c.day) & (AvailabilityProposal.time_slot_id == teacher_proposals.c.time_slot_id)
    ).all()
    
    if not common_proposals:
        return []

    recommendations = []
    processed_slots = set()

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
            required_eq_names = [name.strip() for name in change_request.room_requirements.split(',') if name.strip()]
            if required_eq_names:
                base_query = base_query.join(Room.equipment).filter(
                    Equipment.name.in_(required_eq_names)
                ).group_by(Room.id).having(
                    func.count(Equipment.id) >= len(required_eq_names)
                )

        available_rooms = base_query.order_by(Room.capacity).all()
        
        for room in available_rooms:
            recommendations.append(
                ChangeRecomendation(
                    id=len(recommendations) + 1,
                    change_request_id=change_request_id,
                    recommended_day=proposal.day,
                    recommended_slot_id=proposal.time_slot_id,
                    recommended_room_id=room.id,
                    source_proposal_id=proposal.id,
                    recommended_room=room,
                    source_proposal=proposal
                )
            )

    # Logika priorytetyzacji zintegrowana z `main`
    # 1. Preferowanie terminów nie-wieczornych
    non_evening_recs = [rec for rec in recommendations if rec.recommended_slot_id not in [6, 7]]
    if len(non_evening_recs) > 0:
        recommendations = non_evening_recs

    # 2. Preferowanie terminów "doklejonych" do innych zajęć
    adjacent_recs = []
    for rec in recommendations:
        neighboring_events = db.query(CourseEvent.id).filter(
            CourseEvent.day == rec.recommended_day,
            or_(
                CourseEvent.time_slot_id == rec.recommended_slot_id + 1,
                CourseEvent.time_slot_id == rec.recommended_slot_id - 1
            )
        ).first()
        if neighboring_events:
            adjacent_recs.append(rec)
            
    if len(adjacent_recs) > 0:
        recommendations = adjacent_recs
            
    return recommendations