from datetime import date, datetime

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from model import CourseEvent, Room, RoomType, RoomUnavailability, UserRole, User, Equipment
from routers.auth import get_current_user, role_required
from routers.schemas import RoomCreate, RoomResponse, RoomUpdate
from sqlalchemy import not_, or_
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", status_code=HTTP_200_OK, response_model=list[RoomResponse])
async def get_rooms(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Room]:
    """
    Retrieve a paginated list of all rooms.

    Args:
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 10.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Returns:
        list[Room]: List of room objects.
    """
    rooms = db.query(Room).offset(skip).limit(limit).all()
    return rooms


@router.get(
    "/check-availability", status_code=HTTP_200_OK, response_model=list[RoomResponse]
)
async def get_available_rooms(
    seats: int,
    room_type: RoomType,
    start: date = Query(..., description="Start of desired interval"),
    end: date = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Room]:
    """
    Find all available rooms matching the criteria within a specified time interval.

    Args:
        seats (int): Minimum number of seats required in the room.
        room_type (RoomType): Type of room required.
        start (date): Start date of the desired interval.
        end (date): End date of the desired interval.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If end time is not greater than start time or if seats is not positive.

    Returns:
        list[Room]: List of available rooms matching the criteria.
    """
    if end <= start:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="End time must be greater than start time",
        )
    if seats <= 0:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="Seats must be greater than zero"
        )

    query = db.query(Room).filter(Room.capacity >= seats, Room.type == room_type)

    busy_rooms_subq = (
        db.query(Room.id)
        .join(CourseEvent)
        .filter(
            CourseEvent.day >= start,
            CourseEvent.day <= end,
            CourseEvent.canceled == False,
        )
        .distinct()
        .subquery()
    )

    unavailable_rooms_subq = (
        db.query(Room.id)
        .join(RoomUnavailability)
        .filter(
            not_(
                or_(
                    RoomUnavailability.end_datetime <= start,
                    RoomUnavailability.start_datetime >= end,
                )
            )
        )
        .distinct()
        .subquery()
    )

    available_rooms = query.filter(
        Room.id.not_in(busy_rooms_subq), Room.id.not_in(unavailable_rooms_subq)
    ).all()

    return available_rooms


@router.get(
    "/check-availability/{room_id}", status_code=HTTP_200_OK, response_model=dict
)
async def get_room_availability(
    room_id: int,
    start: datetime = Query(..., description="Start of desired interval"),
    end: datetime = Query(..., description="End of desired interval"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Check if a specific room is available during a given time interval.

    Args:
        room_id (int): ID of the room to check.
        start (datetime): Start datetime of the interval.
        end (datetime): End datetime of the interval.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If end time is not greater than start time or if room is not found.

    Returns:
        dict: Dictionary with 'available' key indicating room availability.
    """
    if end <= start:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="End time must be greater than start time",
        )

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    is_busy = (
        db.query(CourseEvent)
        .filter(
            CourseEvent.room_id == room_id,
            CourseEvent.day >= start.date(),
            CourseEvent.day <= end.date(),
            CourseEvent.canceled == False,
        )
        .first()
        is not None
    )

    is_unavailable = (
        db.query(RoomUnavailability)
        .filter(
            RoomUnavailability.room_id == room_id,
            not_(
                or_(
                    RoomUnavailability.end_datetime <= start,
                    RoomUnavailability.start_datetime >= end,
                )
            ),
        )
        .first()
        is not None
    )

    return {"available": not (is_busy or is_unavailable)}


@router.get("/{room_id}", status_code=HTTP_200_OK, response_model=RoomResponse)
async def get_room(
    room_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Room:
    """
    Retrieve a single room by its ID.

    Args:
        room_id (int): ID of the room to retrieve.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If room with the specified ID is not found.

    Returns:
        Room: The requested room object.
    """
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")
    return room


@router.post("/", status_code=HTTP_201_CREATED, response_model=RoomResponse)
async def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Room:
    """
    Create a new room.

    Args:
        room (RoomCreate): Room data for creation.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If capacity is not positive, room name already exists, or room type is invalid.

    Returns:
        Room: The newly created room object.
    """
    if room.capacity <= 0:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than zero",
        )
    existing_room = db.query(Room).filter(Room.name == room.name).first()
    if existing_room:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Room with this name already exists",
        )

    new_room = Room(
        name=room.name,
        capacity=room.capacity,
        type=room.type,
    )

    if room.equipment_ids:
        equipment_objs = db.query(Equipment).filter(Equipment.id.in_(room.equipment_ids)).all()
        new_room.equipment = equipment_objs

    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room


@router.put("/{room_id}", status_code=HTTP_200_OK, response_model=RoomResponse)
async def update_room(
    room_id: int,
    room: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Room:
    """
    Update an existing room.

    Args:
        room_id (int): ID of the room to update.
        room (RoomUpdate): Updated room data.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If room is not found, capacity is not positive, room name already exists,
                      or room type is invalid.

    Returns:
        Room: The updated room object.
    """
    existing_room = db.query(Room).filter(Room.id == room_id).first()
    if not existing_room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")

    if room.capacity is not None and room.capacity <= 0:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than zero",
        )

    if room.name:
        duplicate = db.query(Room).filter(Room.name == room.name, Room.id != room_id).first()
        if duplicate:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Room with this name already exists")
        existing_room.name = room.name

    if room.capacity is not None:
        if room.capacity <= 0:
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="Capacity must be greater than zero")
        existing_room.capacity = room.capacity

    if room.type is not None:
        existing_room.type = room.type

    if room.equipment_ids is not None:
        equipment_objs = db.query(Equipment).filter(Equipment.id.in_(room.equipment_ids)).all()
        existing_room.equipment = equipment_objs

    db.commit()
    db.refresh(existing_room)
    return existing_room


@router.delete("/{room_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    """
    Delete a room by ID.

    Args:
        room_id (int): ID of the room to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If room with the specified ID is not found.
    """
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room not found")
    db.delete(room)
    db.commit()
    return
