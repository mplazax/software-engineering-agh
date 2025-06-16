from typing import List

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Equipment, User, UserRole
from routers.auth import role_required
from routers.schemas import EquipmentCreate, EquipmentResponse
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
)

router = APIRouter(prefix="/equipment", tags=["Equipment"])

@router.post("/", response_model=EquipmentResponse, status_code=HTTP_201_CREATED)
def create_equipment(
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    existing = db.query(Equipment).filter(Equipment.name == equipment.name).first()
    if existing:
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Equipment with this name already exists")
    new_equipment = Equipment(**equipment.dict())
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)
    return new_equipment

@router.get("", response_model=List[EquipmentResponse])
@router.get("/", response_model=List[EquipmentResponse], include_in_schema=False)
def get_all_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()

@router.delete("/{equipment_id}", status_code=HTTP_204_NO_CONTENT)
def delete_equipment(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Equipment not found")
    db.delete(eq)
    db.commit()
    return None