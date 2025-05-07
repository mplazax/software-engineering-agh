from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from typing import List
from model import User, UserRole
from routers.schemas import UserCreate, UserResponse
from routers.auth import get_password_hash
from model import Group

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/create", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    group = db.query(Group).filter(Group.id == user.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
        group_id=user.group_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    response_user = UserResponse(
        id=db_user.id,
        name=db_user.name,
        email=db_user.email
    )
    return response_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    email = db.query(User).filter(User.email == user.email).first()
    if email is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    group = db.query(Group).filter(Group.id == user.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    hashed_password = get_password_hash(user.password)

    db_user.email = user.email
    db_user.password = hashed_password
    db_user.name = user.name
    db_user.role = user.role
    db_user.group_id = user.group_id
    db.commit()
    db.refresh(db_user)

    return db_user

# cascade delete error, TODO
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}
