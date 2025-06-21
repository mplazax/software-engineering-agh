from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Room, RoomUnavailability, User, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import RoomUnavailabilityCreate, RoomUnavailabilityResponse, RoomUnavailabilityUpdate
from sqlalchemy import and_
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/room-unavailability", tags=["Room Unavailability"])

@router.get("", response_model=List[RoomUnavailabilityResponse])
@router.get("/", response_model=List[RoomUnavailabilityResponse], include_in_schema=False)
def get_room_unavailabilities(db: Session = Depends(get_db)) -> List[RoomUnavailability]:
    return db.query(RoomUnavailability).all()

@router.post("", response_model=RoomUnavailabilityResponse, status_code=HTTP_201_CREATED)
@router.post("/", response_model=RoomUnavailabilityResponse, status_code=HTTP_201_CREATED, include_in_schema=False)
def create_room_unavailability(
    unavailability: RoomUnavailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> RoomUnavailability:
    if unavailability.start_datetime >= unavailability.end_datetime:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="End time must be after start time")
    if not db.query(Room).filter(Room.id == unavailability.room_id).first():
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    new_unavailability = RoomUnavailability(**unavailability.dict())
    db.add(new_unavailability)
    db.commit()
    db.refresh(new_unavailability)
    return new_unavailability

@router.delete("/{unavailability_id}", status_code=HTTP_204_NO_CONTENT)
def delete_room_unavailability(
    unavailability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not unavailability:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found")
    db.delete(unavailability)
    db.commit()
    return