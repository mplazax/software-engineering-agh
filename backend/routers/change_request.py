from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from model import ChangeRequest
from routers.schemas import ChangeRequestCreate
from model import AvailabilityProposal
from routers.schemas import ProposalCreate, ChangeRequestUpdate
from model import CourseEvent
from model import User
from model import ChangeRequestStatus
from model import ChangeRequest, UserRole
from routers.auth import role_required, get_current_user

router = APIRouter(prefix="/change_requests", tags=["change_requests"])

@router.get("/")
async def get_requests(
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    requests = db.query(ChangeRequest).offset(skip).limit(limit).all()
    return requests

@router.post("/")
async def create_request(
        request: ChangeRequestCreate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    course_event = db.query(CourseEvent).filter(CourseEvent.course_id == request.course_event_id).first()
    if not course_event:
        raise HTTPException(status_code=404, detail="Course event not found")
    user = db.query(User).filter(User.id == request.initiator_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_request = ChangeRequest(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.put("/{request_id}")
async def update_request(
        request_id: int,
        request: ChangeRequestUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    existing_request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    course_event = db.query(CourseEvent).filter(CourseEvent.id == request.course_event_id).first()
    if not course_event:
        raise HTTPException(status_code=404, detail="Course event not found")
    user = db.query(User).filter(User.id == request.initiator_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in request.dict(exclude_unset=True).items():
        setattr(existing_request, key, value)
    db.commit()
    db.refresh(existing_request)
    return existing_request

@router.delete("/{request_id}")
async def delete_request(request_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    existing_request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(existing_request)
    db.commit()
    return {"message": "Request deleted"}

@router.get("/my")
async def get_my_requests(
    initiator_id: int = Query(..., description="ID użytkownika"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == initiator_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    requests = db.query(ChangeRequest).filter(ChangeRequest.initiator_id == initiator_id).all()
    return requests