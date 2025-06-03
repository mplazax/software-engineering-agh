
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import ChangeRequest, CourseEvent, User
from routers.auth import get_current_user
from routers.schemas import (
    ChangeRequestCreate,
    ChangeRequestResponse,
    ChangeRequestUpdate,
)
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/change_requests", tags=["change_requests"])


@router.get("/", response_model=list[ChangeRequestResponse], status_code=HTTP_200_OK)
async def get_requests(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    requests = db.query(ChangeRequest).offset(skip).limit(limit).all()
    return requests


@router.get(
    "/{event_id}", response_model=ChangeRequestResponse, status_code=HTTP_200_OK
)
async def get_request_by_id(request_id: int, db: Session = Depends(get_db)):
    request = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    if not request:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Change request not found"
        )
    return request


@router.post("/", response_model=ChangeRequestResponse, status_code=HTTP_201_CREATED)
async def create_request(
    request: ChangeRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    course_event = (
        db.query(CourseEvent).filter(CourseEvent.id == request.course_event_id).first()
    )
    if not course_event:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Course event not found"
        )
    user = db.query(User).filter(User.id == request.initiator_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    new_request = ChangeRequest(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


@router.put(
    "/{request_id}", response_model=ChangeRequestResponse, status_code=HTTP_200_OK
)
async def update_request(
    request: ChangeRequestUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing_request = (
        db.query(ChangeRequest)
        .filter(ChangeRequest.id == request.change_request_id)
        .first()
    )
    if existing_request is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Request not found")

    course_event = (
        db.query(CourseEvent).filter(CourseEvent.id == request.course_event_id).first()
    )
    if not course_event:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Course event not found"
        )

    user = db.query(User).filter(User.id == request.initiator_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    for key, value in request.dict(exclude_unset=True).items():
        setattr(existing_request, key, value)
    db.commit()
    db.refresh(existing_request)
    return existing_request


@router.delete("/{request_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing_request = (
        db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    )
    if existing_request is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Request not found")
    db.delete(existing_request)
    db.commit()
    return


@router.get("/my", status_code=HTTP_200_OK, response_model=list[ChangeRequestResponse])
async def get_my_requests(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return (
        db.query(ChangeRequest)
        .filter(ChangeRequest.initiator_id == current_user.id)
        .all()
    )
