
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Group, User, UserRole
from routers.auth import role_required, get_current_user
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
    current_user: User = Depends(get_current_user),
) -> list[Group]:
    """
    Retrieve a paginated list of all groups.

    Args:
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 10.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Returns:
        list[Group]: List of group objects.
    """
    groups = db.query(Group).offset(skip).limit(limit).all()
    return groups


@router.get("/{group_id}", status_code=HTTP_200_OK, response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Group:
    """
    Retrieve a single group by ID.

    Args:
        group_id (int): ID of the group to retrieve.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If group with the specified ID is not found.

    Returns:
        Group: The requested group object.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.post("/", status_code=HTTP_201_CREATED, response_model=GroupResponse)
async def create_group(
    group: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Group:
    """
    Create a new group.

    Args:
        group (GroupCreate): Group data for creation.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If user is not found, year is invalid, or leader is not a STAROSTA.

    Returns:
        Group: The newly created group object.
    """
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
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Group:
    """
    Update an existing group.

    Args:
        group_id (int): ID of the group to update.
        group (GroupUpdate): Updated group data.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If group or user is not found, year is invalid, or leader is not a STAROSTA.

    Returns:
        Group: The updated group object.
    """
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
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    """
    Delete a group by ID.

    Args:
        group_id (int): ID of the group to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If group with the specified ID is not found.
    """
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")
    db.delete(group)
    db.commit()
