from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from model import Course, UserRole, User, Room, CourseEvent
from database import get_db
from routers.schemas import CourseCreate, CourseResponse, CourseEventResponse, CourseEventCreate
from routers.auth import get_current_user, role_required

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/", response_model=CourseResponse, status_code=201)
def create_course(course: CourseCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY]))):
    db_course = Course(
        name=course.name,
        teacher_id=course.teacher_id,
        group_id=course.group_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Course).all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return

@router.put("/{course_id}", response_model=CourseResponse)
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

@router.post("/{course_id}/events", response_model=CourseEventResponse, status_code=201)
def create_event(course_id: int, event: CourseEventCreate, db: Session = Depends(get_db),
                 current_user=Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY]))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db_room = db.query(Room).filter(Room.id == event.room_id).first() if event.room_id else None
    if event.room_id and not db_room:
        raise HTTPException(status_code=400, detail="Room does not exist")

    course_event = CourseEvent(
        course_id=course_id,
        room_id=event.room_id,
        start_datetime=event.start_datetime,
        end_datetime=event.end_datetime,
        canceled=event.canceled
    )
    db.add(course_event)
    db.commit()
    db.refresh(course_event)
    return course_event


@router.get("/{course_id}/events", response_model=List[CourseEventResponse])
def get_events_for_course(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(CourseEvent).filter(CourseEvent.course_id == course_id).all()
