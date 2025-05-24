from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import RoomUnavailability, Room, UserRole
from typing import List

from routers.auth import role_required, get_current_user
from routers.schemas import RoomUnavailabilityResponse, RoomUnavailabilityCreate
from starlette.status import HTTP_404_NOT_FOUND, HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT

from backend.routers.schemas import RoomUnavailabilityUpdate

router = APIRouter(prefix="/room-unavailability", tags=["room-unavailability"])

@router.get("/", response_model=List[RoomUnavailabilityResponse])
def get_room_unavailability(
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    unavailability = db.query(RoomUnavailability).all()
    return unavailability


@router.get("/{unavailability_id}", response_model=RoomUnavailabilityResponse, status_code=HTTP_200_OK)
def get_room_unavailability_by_id(
        unavailability_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not unavailability:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found")
    return unavailability


@router.post("/", response_model=RoomUnavailabilityResponse, status_code=HTTP_201_CREATED)
def create_room_unavailability(
        unavailability: RoomUnavailabilityCreate,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    room = db.query(Room).filter(Room.id == unavailability.room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    new_unavailability = RoomUnavailability(
        room_id=unavailability.room_id,
        start_datetime=unavailability.start_datetime,
        end_datetime=unavailability.end_datetime
    )
    db.add(new_unavailability)
    db.commit()
    db.refresh(new_unavailability)
    return new_unavailability

@router.put("/{unavailability_id}", response_model=RoomUnavailabilityResponse, status_code=HTTP_200_OK)
def update_room_unavailability(
        unavailability_id: int,
        unavailability: RoomUnavailabilityUpdate,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not existing_unavailability:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found")

    existing_unavailability.start_datetime = unavailability.start_datetime
    existing_unavailability.end_datetime = unavailability.end_datetime
    db.commit()
    db.refresh(existing_unavailability)
    return existing_unavailability


@router.delete("/{unavailability_id}", status_code=HTTP_204_NO_CONTENT)
def delete_room_unavailability(
        unavailability_id: int,
        db: Session = Depends(get_db),
        current_user = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.id == unavailability_id).first()
    if not existing_unavailability:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found")
    db.delete(existing_unavailability)
    db.commit()
    return
