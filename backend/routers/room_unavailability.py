from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import RoomUnavailability, Room, UserRole
from typing import List

from routers.auth import role_required, get_current_user
from routers.schemas import RoomUnavailabilityResponse, RoomUnavailabilityCreate

router = APIRouter(prefix="/room-unavailability", tags=["room-unavailability"])


@router.get("/", response_model=List[RoomUnavailabilityResponse])
def get_room_unavailability(
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    unavailability = db.query(RoomUnavailability).all()
    return unavailability


@router.get("/{unavailability_id}", response_model=RoomUnavailabilityResponse)
def get_room_unavailability_by_id(
        unavailability_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not unavailability:
        raise HTTPException(status_code=404, detail="Room unavailability not found")
    return unavailability


@router.post("/", response_model=RoomUnavailabilityResponse, status_code=201)
def create_room_unavailability(
        unavailability: RoomUnavailabilityCreate,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    room = db.query(Room).filter(Room.id == unavailability.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if unavailability.start_datetime >= unavailability.end_datetime:
        raise HTTPException(status_code=400, detail="Start datetime must be before end datetime")

    new_unavailability = RoomUnavailability(
        room_id=unavailability.room_id,
        start_datetime=unavailability.start_datetime,
        end_datetime=unavailability.end_datetime
    )
    db.add(new_unavailability)
    db.commit()
    db.refresh(new_unavailability)
    return new_unavailability


@router.put("/{unavailability_id}", response_model=RoomUnavailabilityResponse)
def update_room_unavailability(
        unavailability_id: int,
        unavailability: RoomUnavailabilityCreate,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not existing_unavailability:
        raise HTTPException(status_code=404, detail="Room unavailability not found")
    if unavailability.start_datetime >= unavailability.end_datetime:
        raise HTTPException(status_code=400, detail="Start datetime must be before end datetime")

    existing_unavailability.room_id = unavailability.room_id
    existing_unavailability.start_datetime = unavailability.start_datetime
    existing_unavailability.end_datetime = unavailability.end_datetime
    db.commit()
    db.refresh(existing_unavailability)
    return existing_unavailability


@router.delete("/{unavailability_id}")
def delete_room_unavailability(
        unavailability_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not existing_unavailability:
        raise HTTPException(status_code=404, detail="Room unavailability not found")
    db.delete(existing_unavailability)
    db.commit()
    return {"message": "Room unavailability deleted successfully"}
