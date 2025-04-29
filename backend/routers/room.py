from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import Room
from model import CourseEvent
from pydantic import BaseModel


router = APIRouter(prefix="/rooms", tags=["rooms"])


class RoomCreate(BaseModel):
    name: str
    group_id: int
    year: int | None


class DateInterval(BaseModel):
    start_month: int
    end_month: int
    start_day: int
    end_day: int


class CourseEventOut(BaseModel):
    id: int
    course_id: int
    room_id: int
    start_datetime: datetime
    end_datetime: datetime
    canceled: bool


@router.get("/")
async def get_rooms(db: Session = Depends(get_db)):
    groups = db.query(Room).all()
    return groups


@router.get("/{room_id}")
async def get_room(room_id: int, db: Session = Depends(get_db)):
    group = db.query(Room).filter(Room.id == room_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/interval", response_model=List[CourseEventOut])
async def get_groups_in_interval(room_id: int,
                                 start: datetime,
                                 end: datetime,
                                 db: Session = Depends(get_db)
                                 ):

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    events = (
        db.query(CourseEvent)
        .filter(
            CourseEvent.room_id == room_id,
            CourseEvent.start_datetime.between(start, end),
            CourseEvent.end_datetime.between(start, end)
        )
        .all()
    )
    return events


@router.post("/", status_code=201)
async def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    new_room = Room(**room.dict())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


@router.put("/{group_id}")
async def update_room(room_id: int, group: RoomCreate, db: Session = Depends(get_db)):
    existing_room = db.query(Room).filter(Room.id == room_id).first()
    if not existing_room:
        raise HTTPException(status_code=404, detail="Group not found")
    for key, value in group.dict(exclude_unset=True).items():
        setattr(existing_room, key, value)
    db.commit()
    db.refresh(existing_room)
    return existing_room


@router.delete("/{room_id}", status_code=204)
async def delete_group(room_id: int, db: Session = Depends(get_db)):
    group = db.query(Room).filter(Room.id == room_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
