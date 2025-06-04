
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import (
    Course,
    CourseEvent,
    Group,
    Room,
    RoomUnavailability,
    TimeSlots,
    User,
    UserRole,
)
from routers.auth import get_current_user, role_required
from routers.schemas import (
    CourseCreate,
    CourseEventCreate,
    CourseEventResponse,
    CourseEventUpdate,
    CourseResponse,
)
from sqlalchemy import and_
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_ENTITY,
)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/", response_model=CourseResponse, status_code=HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY])
    ),
) -> Course:
    """
    Create a new course.

    Args:
        course (CourseCreate): Course data for creation
        db (Session): Database session
        current_user (User): Current authenticated user (must be ADMIN, KOORDYNATOR or PROWADZACY)

    Raises:
        HTTPException: If teacher or group is not found

    Returns:
        Course: The created course
    """
    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Teacher not found")

    existing_group = db.query(Group).filter(Group.id == course.group_id).first()
    if not existing_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    db_course = Course(
        name=course.name, teacher_id=course.teacher_id, group_id=course.group_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/", response_model=list[CourseResponse], status_code=HTTP_200_OK)
async def get_courses(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Course]:
    """
    Get all courses.

    Args:
        db (Session): Database session
        current_user (User): Current authenticated user

    Returns:
        list[Course]: List of all courses
    """
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse, status_code=HTTP_200_OK)
async def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Course:
    """
    Get a single course by ID.

    Args:
        course_id (int): ID of the course to retrieve
        db (Session): Database session
        current_user (User): Current authenticated user

    Raises:
        HTTPException: If course is not found

    Returns:
        Course: The requested course
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.delete("/{course_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    """
    Delete a course by ID.

    Args:
        course_id (int): ID of the course to delete
        db (Session): Database session
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR)

    Raises:
        HTTPException: If course is not found
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")
    db.delete(course)
    db.commit()
    return


@router.put("/{course_id}", response_model=CourseResponse, status_code=HTTP_200_OK)
async def update_course(
    course_id: int,
    course: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> Course:
    """
    Update a course by ID.

    Args:
        course_id (int): ID of the course to update
        course (CourseCreate): Updated course data
        db (Session): Database session
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR)

    Raises:
        HTTPException: If course, teacher, or group is not found

    Returns:
        Course: The updated course
    """
    existing_course = db.query(Course).filter(Course.id == course_id).first()
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")

    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Teacher not found")

    existing_group = db.query(Group).filter(Group.id == course.group_id).first()
    if not existing_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    for key, value in course.dict(exclude_unset=True).items():
        setattr(existing_course, key, value)
    db.commit()
    db.refresh(existing_course)
    return existing_course


@router.post(
    "/events", response_model=CourseEventResponse, status_code=HTTP_201_CREATED
)
async def create_event(
    event: CourseEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY])
    ),
) -> CourseEvent:
    """
    Create a new course event (schedule a class).

    Args:
        event (CourseEventCreate): Event data for creation
        db (Session): Database session
        current_user (User): Current authenticated user (must be ADMIN, KOORDYNATOR or PROWADZACY)

    Raises:
        HTTPException: If course, room, or time slot is not found, or if time slot is already taken

    Returns:
        CourseEvent: The created course event
    """
    course = db.query(Course).filter(Course.id == event.course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")

    db_room = db.query(Room).filter(Room.id == event.room_id).first()
    if not db_room:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room does not exist"
        )

    existing_course_event = (
        db.query(CourseEvent)
        .filter(
            CourseEvent.room_id == event.room_id,
            and_(
                CourseEvent.time_slot_id == event.time_slot_id,
                CourseEvent.day == event.day,
            ),
        )
        .first()
    )

    if existing_course_event:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Event time is taken by another event",
        )

    unavailability = (
        db.query(RoomUnavailability)
        .filter(
            RoomUnavailability.room_id == event.room_id,
            and_(
                RoomUnavailability.start_datetime <= event.day,
                RoomUnavailability.end_datetime >= event.day,
            ),
        )
        .first()
    )

    if unavailability:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Room unavailable in selected time",
        )

    time_slot = db.query(TimeSlots).filter(TimeSlots.id == event.time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Time slot does not exist"
        )

    course_event = CourseEvent(
        course_id=event.course_id,
        room_id=event.room_id,
        day=event.day,
        time_slot_id=event.time_slot_id,
        canceled=event.canceled,
    )
    db.add(course_event)
    db.commit()
    db.refresh(course_event)
    return course_event


@router.put(
    "/events/{event_id}", response_model=CourseEventResponse, status_code=HTTP_200_OK
)
async def update_event(
    event_id: int,
    event: CourseEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY])
    ),
) -> CourseEvent:
    """
    Update a course event by ID.

    Args:
        event_id (int): ID of the event to update
        event (CourseEventUpdate): Updated event data
        db (Session): Database session
        current_user (User): Current authenticated user (must be ADMIN, KOORDYNATOR or PROWADZACY)

    Raises:
        HTTPException: If event, course, room, or time slot is not found, or if time slot is already taken

    Returns:
        CourseEvent: The updated course event
    """
    course_event = db.query(CourseEvent).filter(CourseEvent.id == event_id).first()
    if not course_event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Event not found")

    room = db.query(Room).filter(Room.id == event.room_id).first()
    if not room:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room does not exist"
        )

    time_slot = db.query(TimeSlots).filter(TimeSlots.id == event.time_slot_id).first()
    if not time_slot:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Time slot does not exist"
        )

    existing_course_event = (
        db.query(CourseEvent)
        .filter(
            CourseEvent.room_id == event.room_id,
            and_(
                CourseEvent.time_slot_id == event.time_slot_id,
                CourseEvent.day == event.day,
            ),
        )
        .first()
    )

    if existing_course_event:
        raise HTTPException(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Event time is taken by another event",
        )

    unavailability = (
        db.query(RoomUnavailability)
        .filter(
            RoomUnavailability.room_id == event.room_id,
            and_(
                RoomUnavailability.start_datetime <= event.day,
                RoomUnavailability.end_datetime >= event.day,
            ),
        )
        .first()
    )
    if unavailability:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Room unavailable in selected time"
        )

    for key, value in event.dict(exclude_unset=True).items():
        setattr(course_event, key, value)
    db.add(course_event)
    db.commit()
    db.refresh(course_event)
    return course_event


@router.get(
    "/{course_id}/events",
    response_model=list[CourseEventResponse],
    status_code=HTTP_200_OK,
)
async def get_events_for_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CourseEvent]:
    """
    Get all events for a specific course.

    Args:
        course_id (int): ID of the course
        db (Session): Database session
        current_user (User): Current authenticated user

    Returns:
        list[CourseEvent]: List of events for the specified course
    """
    return db.query(CourseEvent).filter(CourseEvent.course_id == course_id).all()


@router.get(
    "/events/{course_event_id}",
    response_model=CourseEventResponse,
    status_code=HTTP_200_OK,
)
async def get_course_event(
    course_event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CourseEvent:
    """
    Get a single course event by ID.

    Args:
        course_event_id (int): ID of the course event
        db (Session): Database session
        current_user (User): Current authenticated user

    Raises:
        HTTPException: If event is not found

    Returns:
        CourseEvent: The requested course event
    """
    course_event = (
        db.query(CourseEvent).filter(CourseEvent.id == course_event_id).first()
    )
    if not course_event:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Course event not found"
        )
    return course_event
