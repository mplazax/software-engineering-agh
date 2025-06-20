from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import Course, CourseEvent, Group, Room, TimeSlots, User, UserRole
from routers.auth import get_current_user, role_required
from routers.schemas import (
    CourseCreate, CourseEventCreate, CourseEventResponse, CourseUpdate,
    CourseResponse, CourseEventUpdate, CourseEventWithDetailsResponse
)
from sqlalchemy.orm import Session, joinedload
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

# --- Events Management ---

@router.get("/events/all", response_model=List[CourseEventWithDetailsResponse], tags=["Course Events"])
def get_all_events(db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR, UserRole.PROWADZACY, UserRole.STAROSTA]))):
    """
    Retrieves all course events with their associated course and room details.
    This is an optimized endpoint to prevent N+1 query problems on the client-side.
    """
    events = db.query(CourseEvent).options(
        joinedload(CourseEvent.course).joinedload(Course.teacher),
        joinedload(CourseEvent.course).joinedload(Course.group).joinedload(Group.leader),
        joinedload(CourseEvent.room)
    ).order_by(CourseEvent.day.desc(), CourseEvent.time_slot_id).all()
    return events

@router.post("/events", response_model=CourseEventResponse, status_code=HTTP_201_CREATED, tags=["Course Events"])
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

@router.put("/events/{event_id}", response_model=CourseEventResponse, tags=["Course Events"])
def update_event(event_id: int, event_data: CourseEventUpdate, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    """
    Updates a specific course event.
    """
    db_event = db.query(CourseEvent).filter(CourseEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wydarzenie nie znalezione.")
    
    update_data = event_data.dict(exclude_unset=True)

    # Conflict check if day, time_slot or room changes
    new_day = update_data.get("day", db_event.day)
    new_time_slot_id = update_data.get("time_slot_id", db_event.time_slot_id)
    new_room_id = update_data.get("room_id", db_event.room_id)

    if new_room_id and (
        "day" in update_data or "time_slot_id" in update_data or "room_id" in update_data
    ):
         conflict = db.query(CourseEvent).filter(
            CourseEvent.id != event_id,
            CourseEvent.room_id == new_room_id,
            CourseEvent.day == new_day,
            CourseEvent.time_slot_id == new_time_slot_id,
            CourseEvent.canceled == False
        ).first()
         if conflict:
            raise HTTPException(status_code=HTTP_409_CONFLICT, detail=f"Sala {new_room_id} jest już zarezerwowana w tym terminie.")

    for key, value in update_data.items():
        setattr(db_event, key, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/events/{event_id}", status_code=HTTP_204_NO_CONTENT, tags=["Course Events"])
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))):
    """
    Deletes a specific course event.
    """
    event = db.query(CourseEvent).filter(CourseEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Wydarzenie nie znalezione.")
    
    if event.change_requests:
        raise HTTPException(status_code=HTTP_409_CONFLICT, detail="Nie można usunąć wydarzenia, ponieważ istnieją powiązane z nim zgłoszenia zmiany. Anuluj je najpierw.")

    db.delete(event)
    db.commit()
    return None

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