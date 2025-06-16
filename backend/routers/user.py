from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import User, UserRole
from routers.auth import get_current_user, get_password_hash, role_required
from routers.schemas import UserCreate, UserResponse, UserUpdate
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_201_CREATED, HTTP_204_NO_CONTENT, HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT, HTTP_422_UNPROCESSABLE_ENTITY
)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse], include_in_schema=False)
def get_users(db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    return db.query(User).filter(User.active).all()

@router.post("", response_model=UserResponse, status_code=HTTP_201_CREATED)
@router.post("/", response_model=UserResponse, status_code=HTTP_201_CREATED, include_in_schema=False)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["email"], "msg": "Użytkownik z tym adresem email już istnieje."}])
    hashed_password = get_password_hash(user.password)
    db_user = User(name=user.name, surname=user.surname, email=user.email, password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    update_data = user_update.dict(exclude_unset=True)
    if "email" in update_data and update_data["email"] != db_user.email:
        if db.query(User).filter(User.email == update_data["email"]).first():
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["email"], "msg": "Ten adres email jest już zajęty."}])
    if "password" in update_data and update_data["password"]:
        update_data["password"] = get_password_hash(update_data["password"])
    elif "password" in update_data:
        del update_data["password"]
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN]))):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Użytkownik nie znaleziony.")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Nie możesz usunąć własnego konta.")
    db_user.active = False
    db.commit()
    db.refresh(db_user)
    return None