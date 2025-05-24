from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import between, or_, and_
from sqlalchemy.orm import Session
from typing import List

from model import Course, UserRole, User, Room, CourseEvent, RoomUnavailability, Group
from database import get_db
from routers.schemas import CourseCreate, CourseResponse, CourseEventResponse, CourseEventCreate
from routers.auth import get_current_user, role_required
from starlette.status import HTTP_201_CREATED, HTTP_404_NOT_FOUND, HTTP_200_OK, HTTP_204_NO_CONTENT, \
    HTTP_422_UNPROCESSABLE_ENTITY

from backend.routers.schemas import CourseEventUpdate

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/", response_model=CourseResponse, status_code=HTTP_201_CREATED)
def create_course(course: CourseCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY]))):
    teacher = db.query(User).filter(User.id == course.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Teacher not found")

    existing_group = db.query(Group).filter(Group.id == course.group_id).first()
    if not existing_group:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Group not found")

    db_course = Course(
        name=course.name,
        teacher_id=course.teacher_id,
        group_id=course.group_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/", response_model=List[CourseResponse], status_code=HTTP_200_OK)
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse, status_code=HTTP_200_OK)
def get_course(course_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.delete("/{course_id}", status_code=HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")
    db.delete(course)
    db.commit()
    return

@router.put("/{course_id}", response_model=CourseResponse, status_code=HTTP_200_OK)
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    existing_course = db.query(Course).filter(Course.id == course_id).first()
    if not existing_course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in course.dict(exclude_unset=True).items():
        setattr(existing_course, key, value)
    db.commit()
    db.refresh(existing_course)
    return existing_course

@router.post("/events", response_model=CourseEventResponse, status_code=HTTP_201_CREATED)
def create_event(event: CourseEventCreate, db: Session = Depends(get_db),
                 current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY]))):
    course = db.query(Course).filter(Course.id == event.course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course not found")

    db_room = db.query(Room).filter(Room.id == event.room_id).first()
    if not db_room:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room does not exist")

    existing_course_event = db.query(CourseEvent).filter(CourseEvent.room_id == event.room_id,
        or_(
            and_(CourseEvent.start_datetime <= event.interval.start_date, CourseEvent.end_datetime > event.interval.start_date),
            and_(CourseEvent.start_datetime < event.interval.end_date, CourseEvent.end_datetime >= event.interval.end_date),
            and_(CourseEvent.start_datetime >= event.interval.start_date, CourseEvent.end_datetime <= event.interval.end_date)
        )).first()

    if existing_course_event:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Event time is taken by another event")

    unavailability = db.query(RoomUnavailability).filter(RoomUnavailability.room_id == event.room_id,
        or_(
            and_(RoomUnavailability.start_datetime <= event.interval.start_date, RoomUnavailability.end_datetime > event.interval.start_date),
            and_(RoomUnavailability.start_datetime < event.interval.end_date, RoomUnavailability.end_datetime >= event.interval.end_date),
            and_(RoomUnavailability.start_datetime >= event.interval.start_date, RoomUnavailability.end_datetime <= event.interval.end_date)
        )).first()
    if unavailability:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Room unavailable in selected time")

    course_event = CourseEvent(
        course_id=event.course_id,
        room_id=event.room_id,
        start_datetime=event.interval.start_date,
        end_datetime=event.interval.end_date,
        canceled=event.canceled
    )
    db.add(course_event)
    db.commit()
    db.refresh(course_event)
    return course_event

@router.put("/events/{event_id}", response_model=CourseEventResponse, status_code=HTTP_200_OK)
def update_event(event_id: int, event: CourseEventUpdate, db: Session = Depends(get_db),
                 current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY]))):
    course_event = db.query(CourseEvent).filter(CourseEvent.id == event_id).first()
    if not course_event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Event not found")

    room_id = event.room_id if event.room_id is not None else course_event.room_id
    if not room_id:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Room does not exist")

    if event.interval and event.interval.start_date and event.interval.end_date:
        start = event.interval.start_date
        end = event.interval.end_date
        existing_course_event = db.query(CourseEvent).filter(
            CourseEvent.id != event_id,
            CourseEvent.room_id == room_id,
            or_(
                and_(CourseEvent.start_datetime <= start, CourseEvent.end_datetime > start),
                and_(CourseEvent.start_datetime < end, CourseEvent.end_datetime >= end),
                and_(CourseEvent.start_datetime >= start, CourseEvent.end_datetime <= end)
            )).first()

        if existing_course_event:
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Event time is taken by another event")

        unavailability = db.query(RoomUnavailability).filter(
            RoomUnavailability.room_id == room_id,
            or_(
                and_(RoomUnavailability.start_datetime <= start, RoomUnavailability.end_datetime > start),
                and_(RoomUnavailability.start_datetime < end, RoomUnavailability.end_datetime >= end),
                and_(RoomUnavailability.start_datetime >= start, RoomUnavailability.end_datetime <= end)
            )).first()
        if unavailability:
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail="Room unavailable in selected time")

    for key, value in event.dict(exclude_unset=True).items():
        if key == "interval" and value:
            course_event.start_datetime = value.start_date
            course_event.end_datetime = value.end_date
        else:
            setattr(course_event, key, value)
    db.add(course_event)
    db.commit()
    db.refresh(course_event)
    return course_event


@router.get("/{course_id}/events", response_model=List[CourseEventResponse], status_code=HTTP_200_OK)
def get_events_for_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(CourseEvent).filter(CourseEvent.course_id == course_id).all()
