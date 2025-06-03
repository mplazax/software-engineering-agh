
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Group, User, UserRole
from routers.auth import role_required
from routers.schemas import GroupCreate, GroupResponse, GroupUpdate
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=list[GroupResponse], status_code=HTTP_200_OK)
async def get_groups(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    groups = db.query(Group).offset(skip).limit(limit).all()
    return groups


@router.get("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.post("/", status_code=HTTP_201_CREATED, response_model=GroupResponse)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    user = db.query(User).filter(User.id == group.leader_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    if group.year is not None and (group.year < 1 or group.year > 5):
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Year must be between 1 and 6",
        )

    leader = db.query(User).filter(User.id == group.leader_id).first()

    if leader.role != UserRole.STAROSTA:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="User must not be a student",
        )

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
    current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    existing_group = db.query(Group).filter(Group.id == group_id).first()
    if not existing_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    user = db.query(User).filter(User.id == group.leader_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    if group.year is not None and (group.year < 1 or group.year > 5):
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Year must be between 1 and 6",
        )

    leader = db.query(User).filter(User.id == group.leader_id).first()

    if leader.role != UserRole.STAROSTA:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="User must not be a student",
        )

    for key, value in group.dict(exclude_unset=True).items():
        setattr(existing_group, key, value)
    db.commit()
    db.refresh(existing_group)
    return existing_group


@router.delete("/{group_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    db.delete(group)
    db.commit()
    return {"detail": "Group deleted successfully"}
