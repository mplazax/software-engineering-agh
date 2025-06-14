from fastapi import Query
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import ChangeRequest, CourseEvent, User, ChangeRequestStatus, Course, Group
from routers.auth import get_current_user
from routers.schemas import (
    ChangeRequestCreate,
    ChangeRequestResponse,
    ChangeRequestUpdate,
)
from sqlalchemy import or_
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
    current_user: User = Depends(get_current_user),
) -> list[ChangeRequest]:
    """
    Retrieve a paginated list of all change requests.

    Args:
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 10.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Returns:
        list[ChangeRequest]: List of change requests.
    """
    requests = db.query(ChangeRequest).offset(skip).limit(limit).all()
    return requests


@router.get("/related", response_model=list[ChangeRequestResponse], status_code=HTTP_200_OK)
async def get_related_requests(
        status: ChangeRequestStatus | None = Query(default=None, description="Optional status filter"),
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> list[ChangeRequestResponse]:
    """
    Get all change requests related to the current user, optionally filtered by status,
    with pagination.
    Includes requests:
    - created by the user
    - for courses where the user is the teacher
    - for courses where the user is group leader (starosta)
    """
    # kursy, jeśli prowadzący
    teacher_event_ids = (
        db.query(CourseEvent.id)
        .join(Course)
        .filter(Course.teacher_id == current_user.id)
        .subquery()
    )

    # kursy, gdzie jest starostą grupy
    leader_event_ids = (
        db.query(CourseEvent.id)
        .join(Course)
        .join(Group)
        .filter(Group.leader_id == current_user.id)
        .subquery()
    )

    query = (
        db.query(ChangeRequest)
        .filter(
            or_(
                ChangeRequest.initiator_id == current_user.id,
                ChangeRequest.course_event_id.in_(teacher_event_ids),
                ChangeRequest.course_event_id.in_(leader_event_ids),
            )
        )
    )

    if status:
        query = query.filter(ChangeRequest.status == status)

    return query.offset(skip).limit(limit).all()


@router.get(
    "/{event_id}", response_model=ChangeRequestResponse, status_code=HTTP_200_OK
)
async def get_request_by_id(
    request_id: int, 
    db: Session = Depends(get_db)
) -> ChangeRequest:
    """
    Retrieve a specific change request by ID.

    Args:
        request_id (int): ID of the change request to retrieve.
        db (Session): Database session.

    Raises:
        HTTPException: If change request with the specified ID is not found.

    Returns:
        ChangeRequest: The requested change request.
    """
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
    current_user: User = Depends(get_current_user),
) -> ChangeRequest:
    """
    Create a new change request.

    Args:
        request (ChangeRequestCreate): Data for the new change request.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If course event or user is not found.

    Returns:
        ChangeRequest: The newly created change request.
    """
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
    current_user: User = Depends(get_current_user),
) -> ChangeRequest:
    """
    Update an existing change request.

    Args:
        request (ChangeRequestUpdate): Updated change request data.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If change request, course event, or user is not found.

    Returns:
        ChangeRequest: The updated change request.
    """
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
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a change request by ID.

    Args:
        request_id (int): ID of the change request to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If change request with the specified ID is not found.
    """
    existing_request = (
        db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
    )
    if existing_request is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Request not found")
    db.delete(existing_request)
    db.commit()
    return