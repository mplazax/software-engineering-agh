
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Room, RoomUnavailability, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import (
    RoomUnavailabilityCreate,
    RoomUnavailabilityResponse,
    RoomUnavailabilityUpdate,
)
from sqlalchemy import and_
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/room-unavailability", tags=["room-unavailability"])


@router.get("/", response_model=list[RoomUnavailabilityResponse])
def get_room_unavailability(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[RoomUnavailability]:
    """
    Retrieve a list of all room unavailability periods.

    Args:
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Returns:
        list[RoomUnavailability]: List of all room unavailability periods.
    """
    unavailability = db.query(RoomUnavailability).all()
    return unavailability


@router.get(
    "/{unavailability_id}",
    response_model=RoomUnavailabilityResponse,
    status_code=HTTP_200_OK,
)
def get_room_unavailability_by_id(
    unavailability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RoomUnavailability:
    """
    Retrieve a specific room unavailability period by ID.

    Args:
        unavailability_id (int): ID of the unavailability period to retrieve.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If the unavailability period is not found.

    Returns:
        RoomUnavailability: The requested room unavailability period.
    """
    unavailability = (
        db.query(RoomUnavailability)
        .filter(RoomUnavailability.id == unavailability_id)
        .first()
    )
    if not unavailability:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found"
        )
    return unavailability


@router.post(
    "/", response_model=RoomUnavailabilityResponse, status_code=HTTP_201_CREATED
)
def create_room_unavailability(
    unavailability: RoomUnavailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> RoomUnavailability:
    """
    Create a new room unavailability period.

    Args:
        unavailability (RoomUnavailabilityCreate): Data for the new unavailability period.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If end time is not greater than start time, room is not found,
                      or the period overlaps with existing unavailability.

    Returns:
        RoomUnavailability: The newly created room unavailability period.
    """
    if unavailability.start_datetime > unavailability.end_datetime:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="End time must be greater than start time",
        )

    room = db.query(Room).filter(Room.id == unavailability.room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    existing_unavailability = (
        db.query(RoomUnavailability)
        .filter(
            RoomUnavailability.room_id == unavailability.room_id,
            and_(
                and_(
                    RoomUnavailability.start_datetime <= unavailability.end_datetime,
                    RoomUnavailability.end_datetime >= unavailability.start_datetime,
                ),
                and_(
                    RoomUnavailability.start_datetime >= unavailability.start_datetime,
                    RoomUnavailability.end_datetime <= unavailability.end_datetime,
                ),
            ),
        )
        .first()
    )

    if existing_unavailability:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Room unavailability overlaps with existing unavailability",
        )

    new_unavailability = RoomUnavailability(
        room_id=unavailability.room_id,
        start_datetime=unavailability.start_datetime,
        end_datetime=unavailability.end_datetime,
    )
    db.add(new_unavailability)
    db.commit()
    db.refresh(new_unavailability)
    return new_unavailability


@router.put(
    "/{unavailability_id}",
    response_model=RoomUnavailabilityResponse,
    status_code=HTTP_200_OK,
)
def update_room_unavailability(
    unavailability_id: int,
    unavailability: RoomUnavailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> RoomUnavailability:
    """
    Update an existing room unavailability period.

    Args:
        unavailability_id (int): ID of the unavailability period to update.
        unavailability (RoomUnavailabilityUpdate): Updated unavailability data.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If the unavailability period is not found or end time is not greater than start time.

    Returns:
        RoomUnavailability: The updated room unavailability period.
    """
    existing_unavailability = (
        db.query(RoomUnavailability)
        .filter(RoomUnavailability.id == unavailability_id)
        .first()
    )
    if not existing_unavailability:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found"
        )

    if unavailability.start_datetime > unavailability.end_datetime:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="End time must be greater than start time",
        )

    existing_unavailability.start_datetime = unavailability.start_datetime
    existing_unavailability.end_datetime = unavailability.end_datetime
    db.commit()
    db.refresh(existing_unavailability)
    return existing_unavailability


@router.delete("/{unavailability_id}", status_code=HTTP_204_NO_CONTENT)
def delete_room_unavailability(
    unavailability_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    """
    Delete a room unavailability period by ID.

    Args:
        unavailability_id (int): ID of the unavailability period to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If the unavailability period is not found.
    """
    existing_unavailability = (
        db.query(RoomUnavailability)
        .filter(RoomUnavailability.id == unavailability_id)
        .first()
    )
    if not existing_unavailability:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room unavailability not found"
        )
    db.delete(existing_unavailability)
    db.commit()
    return
