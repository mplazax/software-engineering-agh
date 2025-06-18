from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Equipment, User, UserRole
from routers.auth import role_required
from routers.schemas import EquipmentCreate, EquipmentResponse
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND, HTTP_409_CONFLICT, HTTP_422_UNPROCESSABLE_ENTITY
)

router = APIRouter(prefix="/equipment", tags=["Equipment"])

@router.get("", response_model=List[EquipmentResponse])
@router.get("/", response_model=List[EquipmentResponse], include_in_schema=False)
def get_all_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()

@router.post("", response_model=EquipmentResponse, status_code=HTTP_201_CREATED)
@router.post("/", response_model=EquipmentResponse, status_code=HTTP_201_CREATED, include_in_schema=False)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    if db.query(Equipment).filter(Equipment.name == equipment.name).first():
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Wyposażenie o tej nazwie już istnieje.")
    new_equipment = Equipment(**equipment.dict())
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)
    return new_equipment

@router.get("/{equipment_id}", response_model=EquipmentResponse)
def get_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wyposażenie nie znalezione.")
    return equipment

@router.put("/{equipment_id}", response_model=EquipmentResponse)
def update_equipment(equipment_id: int, equipment_data: EquipmentCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    db_equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wyposażenie nie znalezione.")
    
    # Sprawdzenie, czy nowa nazwa nie jest już zajęta przez inny element
    if equipment_data.name != db_equipment.name:
        if db.query(Equipment).filter(Equipment.name == equipment_data.name).first():
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Wyposażenie o tej nazwie już istnieje.")
            
    db_equipment.name = equipment_data.name
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

@router.delete("/{equipment_id}", status_code=HTTP_204_NO_CONTENT)
def delete_equipment(equipment_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wyposażenie nie znalezione.")
    db.delete(eq)
    db.commit()
    return None