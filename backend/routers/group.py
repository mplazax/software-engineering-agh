from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import Group, UserRole
from routers.auth import role_required
from routers.schemas import GroupCreate, GroupUpdate
from model import User

router = APIRouter(prefix="/groups", tags=["groups"])

@router.get("/")
async def get_groups(
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    groups = db.query(Group).offset(skip).limit(limit).all()
    return groups


@router.get("/{group_id}")
async def get_group(
        group_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post("/", status_code=201)
async def create_group(
        group: GroupCreate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    user = db.query(User).filter(User.id == group.leader_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # year constraint ??
    new_group = Group(**group.dict())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


@router.put("/{group_id}")
async def update_group(
        group_id: int,
        group: GroupUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    existing_group = db.query(Group).filter(Group.id == group_id).first()
    if not existing_group:
        raise HTTPException(status_code=404, detail="Group not found")
    user = db.query(User).filter(User.id == group.leader_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in group.dict(exclude_unset=True).items():
        setattr(existing_group, key, value)
    db.commit()
    db.refresh(existing_group)
    return existing_group

@router.delete("/{group_id}", status_code=204)
async def delete_group(
        group_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"detail": "Group deleted successfully"}