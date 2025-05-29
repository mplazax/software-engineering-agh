from datetime import datetime, date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, not_
from sqlalchemy.orm import Session
from database import get_db
from model import Room, UserRole
from model import CourseEvent
from routers.auth import role_required, get_current_user
from routers.schemas import RoomCreate, RoomUpdate, RoomResponse
from model import RoomUnavailability, RoomType
from starlette.status import HTTP_404_NOT_FOUND, HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST, \
    HTTP_204_NO_CONTENT

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("/", status_code=HTTP_200_OK, response_model=List[RoomResponse])
async def get_rooms(
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    rooms = db.query(Room).offset(skip).limit(limit).all()
    return rooms

@router.get("/check-availability", status_code=HTTP_200_OK, response_model=List[RoomResponse])
async def get_available_rooms(
    seats: int,
    room_type: RoomType,
    start: date = Query(..., description="Start of desired interval"),
    end: date = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if end <= start:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="End time must be greater than start time")
    if seats <= 0:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Seats must be greater than zero")

    query = db.query(Room).filter(
        Room.capacity >= seats,
        Room.type == room_type
    )

    busy_rooms_subq = db.query(Room.id).join(CourseEvent).filter(
        CourseEvent.day >= start,
        CourseEvent.day <= end,
        CourseEvent.canceled == False
    ).distinct().subquery()

    unavailable_rooms_subq = db.query(Room.id).join(RoomUnavailability).filter(
        not_(
            or_(
                RoomUnavailability.end_datetime <= start,
                RoomUnavailability.start_datetime >= end
            )
        )
    ).distinct().subquery()

    available_rooms = query.filter(
        Room.id.not_in(busy_rooms_subq),
        Room.id.not_in(unavailable_rooms_subq)
    ).all()

    return available_rooms

@router.get("/check-availability/{room_id}", status_code=HTTP_200_OK, response_model=dict)
async def get_room_availability(
    room_id: int,
    start: datetime = Query(..., description="Start of desired interval"),
    end: datetime = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if end <= start:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="End time must be greater than start time")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    is_busy = db.query(CourseEvent).filter(
        CourseEvent.room_id == room_id,
        CourseEvent.day >= start.date(),
        CourseEvent.day <= end.date(),
        CourseEvent.canceled == False
    ).first() is not None

    is_unavailable = db.query(RoomUnavailability).filter(
        RoomUnavailability.room_id == room_id,
        not_(
            or_(
                RoomUnavailability.end_datetime <= start,
                RoomUnavailability.start_datetime >= end
            )
        )
    ).first() is not None

    return {"available": not (is_busy or is_unavailable)}

@router.get("/{room_id}", status_code=HTTP_200_OK, response_model=RoomResponse)
async def get_room(
        room_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")
    return room


@router.post("/", status_code=HTTP_201_CREATED, response_model=RoomResponse)
async def create_room(
        room: RoomCreate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    if room.capacity <= 0:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Capacity must be greater than zero")
    existing_room = db.query(Room).filter(Room.name == room.name).first()
    if existing_room:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Room with this name already exists")
    if room.type not in RoomType:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Invalid room type")

    new_room = Room(**room.dict())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.put("/{room_id}", status_code=HTTP_200_OK, response_model=RoomResponse)
async def update_room(
        room_id: int,
        room: RoomUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_room = db.query(Room).filter(Room.id == room_id).first()
    if not existing_room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")
    if room.capacity is not None and room.capacity <= 0:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Capacity must be greater than zero")
    if room.type is not None and room.type not in RoomType:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Invalid room type")
    if room.name is not None:
        existing_name_room = db.query(Room).filter(Room.name == room.name, Room.id != room_id).first()
        if existing_name_room:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Room with this name already exists")

    for key, value in room.dict(exclude_unset=True).items():
        setattr(existing_room, key, value)
    db.commit()
    db.refresh(existing_room)
    return existing_room

@router.delete("/{room_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_room(
        room_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")
    db.delete(room)
    db.commit()
    return
