from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from model import Room
from model import CourseEvent
from routers.schemas import RoomCreate, DateInterval, CourseEventOut

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("/")
async def get_rooms(db: Session = Depends(get_db)):
    groups = db.query(Room).all()
    return groups

@router.get("/check-availability")
async def get_available_rooms(seats: int, room_type: str,
    start: datetime = Query(..., description="Start of desired interval"),
    end: datetime = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db)
):
    if start >= end:
        raise HTTPException(status_code=400, detail="Start time must be before end time")

    subquery = (
        db.query(CourseEvent.room_id)
        .filter(CourseEvent.start_datetime < end, CourseEvent.end_datetime > start)
        .distinct()
        .subquery()
    )
    available_rooms = db.query(Room).filter(Room.id.notin_(subquery), Room.capacity >= seats, Room.type == room_type).all()

    return available_rooms

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
    return {"message": "Group deleted"}
