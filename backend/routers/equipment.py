from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from model import Equipment
from routers.schemas import EquipmentResponse, EquipmentCreate
from sqlalchemy.orm import Session

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.post("/", response_model=EquipmentResponse)
def add_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Equipment).filter(Equipment.name == equipment.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Equipment already exists")
    new_equipment = Equipment(name=equipment.name)
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)
    return new_equipment

@router.get("/", response_model=list[EquipmentResponse])
def get_all_equipment(db: Session = Depends(get_db)):
    return db.query(Equipment).all()

@router.delete("/{equipment_id}", status_code=204)
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(eq)
    db.commit()