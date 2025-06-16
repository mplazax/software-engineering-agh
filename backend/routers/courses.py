from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Course, CourseEvent, Group, Room, TimeSlots, User, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import CourseCreate, CourseEventCreate, CourseEventResponse, CourseUpdate, CourseResponse
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_201_CREATED, HTTP_204_NO_CONTENT, HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT, HTTP_422_UNPROCESSABLE_ENTITY
)

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("", response_model=List[CourseResponse])
@router.get("/", response_model=List[CourseResponse], include_in_schema=False)
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Course).all()

@router.post("", response_model=CourseResponse, status_code=HTTP_201_CREATED)
@router.post("/", response_model=CourseResponse, status_code=HTTP_201_CREATED, include_in_schema=False)
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    teacher = db.query(User).filter(User.id == course.teacher_id, User.role == UserRole.PROWADZACY).first()
    if not teacher:
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["teacher_id"], "msg": "Wybrany użytkownik nie jest prowadzącym lub nie istnieje."}])

    if not db.query(Group).filter(Group.id == course.group_id).first():
        raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["group_id"], "msg": "Wybrana grupa nie istnieje."}])

    db_course = Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Kurs nie znaleziony.")
    return course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Kurs nie znaleziony.")
    
    update_data = course_data.dict(exclude_unset=True)
    if "teacher_id" in update_data:
        teacher = db.query(User).filter(User.id == update_data["teacher_id"], User.role == UserRole.PROWADZACY).first()
        if not teacher:
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["teacher_id"], "msg": "Wybrany użytkownik nie jest prowadzącym lub nie istnieje."}])
    if "group_id" in update_data:
        if not db.query(Group).filter(Group.id == update_data["group_id"]).first():
            raise HTTPException(status_code=HTTP_422_UNPROCESSABLE_ENTITY, detail=[{"loc": ["group_id"], "msg": "Wybrana grupa nie istnieje."}])

    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}", status_code=HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Kurs nie znaleziony.")
    db.delete(course)
    db.commit()
    return None

@router.post("/events", response_model=CourseEventResponse, status_code=HTTP_201_CREATED)
def create_event(event_data: CourseEventCreate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    if not db.query(Course).filter(Course.id == event_data.course_id).first():
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Kurs nie znaleziony.")
    if event_data.room_id and not db.query(Room).filter(Room.id == event_data.room_id).first():
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Sala nie istnieje.")
    if not db.query(TimeSlots).filter(TimeSlots.id == event_data.time_slot_id).first():
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Slot czasowy nie istnieje.")
    conflict = db.query(CourseEvent).filter(CourseEvent.room_id == event_data.room_id, CourseEvent.day == event_data.day, CourseEvent.time_slot_id == event_data.time_slot_id, CourseEvent.canceled == False).first()
    if conflict:
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f"Sala {event_data.room_id} jest już zarezerwowana.")
    new_event = CourseEvent(**event_data.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.get("/{course_id}/events", response_model=List[CourseEventResponse])
def get_events_for_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not db.query(Course).filter(Course.id == course_id).first():
        raise HTTPException(status_code=404, detail="Kurs nie znaleziony.")
    return db.query(CourseEvent).filter(CourseEvent.course_id == course_id).all()

@router.get("/events/{event_id}", response_model=CourseEventResponse)
def get_course_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course_event = db.query(CourseEvent).filter(CourseEvent.id == event_id).first()
    if not course_event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wydarzenie nie znalezione.")
    return course_event