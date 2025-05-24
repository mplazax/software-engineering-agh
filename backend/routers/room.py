from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from database import get_db
from model import Room, UserRole
from model import CourseEvent
from routers.auth import role_required, get_current_user
from routers.schemas import RoomCreate, CourseEventOut, RoomAddUnavailability
from model import RoomUnavailability, RoomType
from starlette.status import HTTP_404_NOT_FOUND, HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST

from backend.routers.schemas import RoomUpdate, RoomResponse

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
async def get_available_rooms(seats: int, room_type: RoomType,
    start: datetime = Query(..., description="Start of desired interval"),
    end: datetime = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if end <= start:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="End time must be greater than start time")

    subquery_course_event = (
        db.query(CourseEvent.room_id)
        .filter(CourseEvent.start_datetime < end, CourseEvent.end_datetime > start)
        .distinct()
        .subquery()
    )
    subquery_unavailability = (
        db.query(RoomUnavailability.room_id)
        .filter(RoomUnavailability.start_datetime < end, RoomUnavailability.end_datetime > start)
        .distinct()
        .subquery()
    )

    available_rooms = db.query(Room).filter(Room.id.notin_(subquery_course_event), Room.id.notin_(subquery_unavailability), Room.capacity >= seats, Room.type == room_type).all() # equipment

    return available_rooms

@router.get("/check-availability/{room_id}", status_code=HTTP_200_OK, response_model=dict)
async def get_room_availability(room_id: int,
    start: datetime = Query(..., description="Start of desired interval"),
    end: datetime = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)):

    if end <= start:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="End time must be greater than start time")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    unavailability = db.query(RoomUnavailability).filter(
        RoomUnavailability.room_id == room_id,
        or_(
            and_(RoomUnavailability.start_datetime <= start, RoomUnavailability.end_datetime > start),
            and_(RoomUnavailability.start_datetime < end, RoomUnavailability.end_datetime >= end),
            and_(RoomUnavailability.start_datetime >= start, RoomUnavailability.end_datetime <= end)
        )
    ).first()

    conflict = db.query(CourseEvent).filter(
        CourseEvent.room_id == room_id,
        or_(
            and_(CourseEvent.start_datetime <= start, CourseEvent.end_datetime > start),
            and_(CourseEvent.start_datetime < end, CourseEvent.end_datetime >= end),
            and_(CourseEvent.start_datetime >= start, CourseEvent.end_datetime <= end)
        )
    ).first()

    if not conflict and not unavailability:
        return {"available": True}

    if unavailability:
        return {
            "available": False,
            "reason": "unavailability",
            "start": str(unavailability.start_datetime),
            "end": str(unavailability.end_datetime)
        }

    if conflict:
        return {
            "available": False,
            "reason": "event",
            "start": str(conflict.start_datetime),
            "end": str(conflict.end_datetime)
        }

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
    for key, value in room.dict(exclude_unset=True).items():
        setattr(existing_room, key, value)
    db.commit()
    db.refresh(existing_room)
    return existing_room

@router.delete("/{room_id}", status_code=HTTP_200_OK, response_model=dict)
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
    return {"message": "Room deleted"}
