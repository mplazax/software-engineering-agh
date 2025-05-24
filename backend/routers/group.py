from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import Group, UserRole
from routers.auth import role_required
from routers.schemas import GroupCreate, GroupUpdate, GroupResponse
from model import User
from starlette.status import HTTP_404_NOT_FOUND, HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT

router = APIRouter(prefix="/groups", tags=["groups"])

@router.get("/", response_model=List[GroupResponse], status_code=HTTP_200_OK)
async def get_groups(
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    groups = db.query(Group).offset(skip).limit(limit).all()
    return groups


@router.get("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
async def get_group(
        group_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.post("/", status_code=HTTP_201_CREATED, response_model=GroupResponse)
async def create_group(
        group: GroupCreate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    user = db.query(User).filter(User.id == group.leader_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    new_group = Group(**group.dict())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


@router.put("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
async def update_group(
        group_id: int,
        group: GroupUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_group = db.query(Group).filter(Group.id == group_id).first()
    if not existing_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    if group.leader_id is not None:
        user = db.query(User).filter(User.id == group.leader_id).first()
        if not user:
            raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    for key, value in group.dict(exclude_unset=True).items():
        setattr(existing_group, key, value)
    db.commit()
    db.refresh(existing_group)
    return existing_group

@router.delete("/{group_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_group(
        group_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"detail": "Group deleted successfully"}