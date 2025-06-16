from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Group, User, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import GroupCreate, GroupResponse, GroupUpdate
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_ENTITY,
)

router = APIRouter(prefix="/groups", tags=["Groups"])

@router.get("", response_model=List[GroupResponse])
@router.get("/", response_model=List[GroupResponse], include_in_schema=False)
def get_groups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Group).all()

@router.get("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
def get_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Group:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    return group

@router.post("", response_model=GroupResponse, status_code=HTTP_201_CREATED)
@router.post("/", response_model=GroupResponse, status_code=HTTP_201_CREATED, include_in_schema=False)
def create_group(
    group_data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Group:
    leader = db.query(User).filter(User.id == group_data.leader_id).first()
    if not leader:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Leader user not found")
    if leader.role != UserRole.STAROSTA:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="The assigned leader must have the 'STAROSTA' role.")
    if db.query(Group).filter(Group.name == group_data.name).first():
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Group with this name already exists")
    if db.query(Group).filter(Group.leader_id == group_data.leader_id).first():
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="This user is already a leader of another group")

    new_group = Group(**group_data.dict())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.put("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Group:
    db_group = db.query(Group).filter(Group.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    update_data = group_data.dict(exclude_unset=True)

    if "leader_id" in update_data and update_data["leader_id"] is not None:
        leader = db.query(User).filter(User.id == update_data["leader_id"]).first()
        if not leader:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Leader user not found")
        if leader.role != UserRole.STAROSTA:
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="The assigned leader must have the 'STAROSTA' role.")
        existing_leadership = db.query(Group).filter(Group.leader_id == update_data["leader_id"], Group.id != group_id).first()
        if existing_leadership:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail="This user is already a leader of another group")

    if "name" in update_data and update_data["name"] != db_group.name:
        if db.query(Group).filter(Group.name == update_data["name"]).first():
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Group with this name already exists")
            
    for key, value in update_data.items():
        setattr(db_group, key, value)
        
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/{group_id}", status_code=HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    db.delete(group)
    db.commit()
    return None