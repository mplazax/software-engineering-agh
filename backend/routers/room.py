from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Equipment, Room, User, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import RoomCreate, RoomResponse, RoomUpdate
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_201_CREATED, HTTP_204_NO_CONTENT, HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT, HTTP_422_UNPROCESSABLE_ENTITY
)

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("", response_model=List[RoomResponse])
@router.get("/", response_model=List[RoomResponse], include_in_schema=False)
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.post("", status_code=HTTP_201_CREATED, response_model=RoomResponse)
@router.post("/", status_code=HTTP_201_CREATED, response_model=RoomResponse, include_in_schema=False)
def create_room(room_data: RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    if db.query(Room).filter(Room.name == room_data.name).first():
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Sala o tej nazwie już istnieje.")
    
    new_room = Room(name=room_data.name, capacity=room_data.capacity, type=room_data.type)

    if room_data.equipment_ids:
        equipment_items = db.query(Equipment).filter(Equipment.id.in_(room_data.equipment_ids)).all()
        if len(equipment_items) != len(room_data.equipment_ids):
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["equipment_ids"], "msg": "Wybrano nieistniejący element wyposażenia."}])
        new_room.equipment = equipment_items

    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Sala nie znaleziona.")
    return room

@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, room_data: RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Sala nie znaleziona.")
    
    update_data = room_data.dict(exclude_unset=True)

    if "name" in update_data and update_data["name"] != db_room.name:
        if db.query(Room).filter(Room.name == update_data["name"]).first():
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Sala o tej nazwie już istnieje.")

    if "equipment_ids" in update_data:
        equipment_ids = update_data.pop("equipment_ids")
        if equipment_ids is not None:
            equipment_items = db.query(Equipment).filter(Equipment.id.in_(equipment_ids)).all()
            if len(equipment_items) != len(set(equipment_ids)):
                raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["equipment_ids"], "msg": "Wybrano nieistniejący element wyposażenia."}])
            db_room.equipment = equipment_items
        else:
            db_room.equipment = []

    for key, value in update_data.items():
        setattr(db_room, key, value)

    db.commit()
    db.refresh(db_room)
    return db_room

@router.delete("/{room_id}", status_code=HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Sala nie znaleziona.")
    db.delete(room)
    db.commit()
    return None