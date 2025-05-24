from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session
from database import get_db
from model import Room, RoomUnavailability, ChangeRecomendation
from model import AvailabilityProposal
from model import CourseEvent
from model import ChangeRequest
from routers.auth import get_current_user
from routers.schemas import ChangeRecomendationResponse
from starlette.status import HTTP_204_NO_CONTENT

router = APIRouter(prefix="/change_recommendation", tags=["change_recommendation"])


@router.post("/common-availability")
async def find_and_add_common_availability(
        user1_id: int,
        user2_id: int,
        change_request_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    user1_proposals = (db.query(AvailabilityProposal)
                       .filter(AvailabilityProposal.user_id == user1_id,
                               AvailabilityProposal.change_request_id == change_request_id).all())
    user2_proposals = (db.query(AvailabilityProposal)
                       .filter(AvailabilityProposal.user_id == user2_id,
                               AvailabilityProposal.change_request_id == change_request_id).all())

    common_intervals = []
    for proposal1 in user1_proposals:
        for proposal2 in user2_proposals:
            start = max(proposal1.available_start_datetime, proposal2.available_start_datetime)
            end = min(proposal1.available_end_datetime, proposal2.available_end_datetime)
            if start < end:
                common_intervals.append((start, end))

    if not common_intervals:
        raise HTTPException(status_code=404, detail="No common availability found")

    for start, end in common_intervals:
        rooms = db.query(Room).filter(
            ~db.query(CourseEvent).filter(
                and_(
                    CourseEvent.room_id == Room.id,
                    CourseEvent.start_datetime < end,
                    CourseEvent.end_datetime > start
                )
            ).exists(),
            ~db.query(RoomUnavailability).filter(
                and_(
                    RoomUnavailability.room_id == Room.id,
                    RoomUnavailability.start_datetime < end,
                    RoomUnavailability.end_datetime > start
                )
            ).exists()
        ).all()

        for room in rooms:
            new_recommendation = ChangeRecomendation(
                change_request_id=change_request_id,
                recommended_start_datetime=start,
                recommended_end_datetime=end,
                recommended_room_id=room.id
            )
            db.add(new_recommendation)

    db.commit()
    return {"message": "Recommendations added successfully"}


@router.get("/{change_request_id}/recommendations", response_model=list[ChangeRecomendationResponse])
async def get_proposals(
        change_request_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    change_request = db.query(ChangeRequest).filter(ChangeRequest.id == change_request_id).first()
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")

    change_recommendations = db.query(ChangeRecomendation).filter(
        ChangeRecomendation.change_request_id == change_request_id).all()
    return change_recommendations



@router.delete("/{change_request_id}/recommendations", status_code=HTTP_204_NO_CONTENT)
async def delete_recommendations(
        change_request_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    change_request = db.query(ChangeRequest).filter(ChangeRequest.id == change_request_id).first()
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")

    db.query(ChangeRecomendation).filter(ChangeRecomendation.change_request_id == change_request_id).delete()
    db.commit()
    return
