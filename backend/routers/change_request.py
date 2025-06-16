from datetime import datetime
from typing import List, Optional

from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from model import ChangeRequest, Course, CourseEvent, Group, User, ChangeRequestStatus, UserRole
from routers.auth import get_current_user
from routers.schemas import ChangeRequestCreate, ChangeRequestResponse, ChangeRequestUpdate
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND

router = APIRouter(prefix="/change-requests", tags=["Change Requests"])

@router.get("/related", response_model=List[ChangeRequestResponse], status_code=HTTP_200_OK)
def get_related_requests(
    status: Optional[ChangeRequestStatus] = Query(None, description="Optional status filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ChangeRequestResponse]:
    # POPRAWKA: Używamy .scalar_subquery() aby uniknąć ostrzeżeń SAWarning
    teacher_course_ids = db.query(Course.id).filter(Course.teacher_id == current_user.id).scalar_subquery()
    
    leader_group_ids = db.query(Group.id).filter(Group.leader_id == current_user.id).scalar_subquery()
    leader_course_ids = db.query(Course.id).filter(Course.group_id.in_(leader_group_ids)).scalar_subquery()

    related_course_ids = db.query(Course.id).filter(
        or_(Course.id.in_(teacher_course_ids), Course.id.in_(leader_course_ids))
    ).scalar_subquery()
    
    related_event_ids = db.query(CourseEvent.id).filter(CourseEvent.course_id.in_(related_course_ids)).scalar_subquery()

    query = db.query(ChangeRequest).filter(
        or_(
            ChangeRequest.initiator_id == current_user.id,
            ChangeRequest.course_event_id.in_(related_event_ids),
        )
    ).options(joinedload(ChangeRequest.course_event))

    if status:
        query = query.filter(ChangeRequest.status == status)

    return query.order_by(ChangeRequest.created_at.desc()).all()

@router.post("/", response_model=ChangeRequestResponse, status_code=HTTP_201_CREATED)
def create_request(
    request_data: ChangeRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChangeRequest:
    course_event = db.query(CourseEvent).filter(CourseEvent.id == request_data.course_event_id).first()
    if not course_event:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Course event not found")

    new_request = ChangeRequest(
        **request_data.dict(exclude={"created_at"}),
        initiator_id=current_user.id,
        status=ChangeRequestStatus.PENDING,
        created_at=datetime.utcnow()
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/{request_id}", response_model=ChangeRequestResponse, status_code=HTTP_200_OK)
def get_request_by_id(request_id: int, db: Session = Depends(get_db)) -> ChangeRequest:
    request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Change request not found")
    return request

@router.put("/{request_id}", response_model=ChangeRequestResponse, status_code=HTTP_200_OK)
def update_request(
    request_id: int,
    request_data: ChangeRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChangeRequest:
    db_request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Request not found")

    if db_request.initiator_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.KOORDYNATOR]:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized to update this request")
        
    update_data = request_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_request, key, value)
        
    db.commit()
    db.refresh(db_request)
    return db_request