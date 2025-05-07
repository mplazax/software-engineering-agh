from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from model import ChangeRequest
from routers.schemas import ChangeRequestCreate
from model import AvailabilityProposal
from routers.schemas import ProposalCreate, ChangeRequestUpdate

router = APIRouter(prefix="/change_requests", tags=["change_requests"])

@router.get("/")
async def get_requests(db: Session = Depends(get_db)):
    requests = db.query(ChangeRequest).all()
    return requests

@router.post("/")
async def create_request(request: ChangeRequestCreate, db: Session = Depends(get_db)):
    new_request = ChangeRequest(**request.dict())
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.put("/{request_id}")
async def update_request(request_id: int, request: ChangeRequestUpdate, db: Session = Depends(get_db)):
    existing_request = db.query(ChangeRequest).filter(ChangeRequest.change_request_id == request_id).first()
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    for key, value in request.dict(exclude_unset=True).items():
        setattr(existing_request, key, value)
    db.commit()
    db.refresh(existing_request)
    return existing_request

@router.delete("/{request_id}")
async def delete_request(request_id: int, db: Session = Depends(get_db)):
    existing_request = db.query(ChangeRequest).filter(ChangeRequest.change_request_id == request_id).first()
    if existing_request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(existing_request)
    db.commit()
    return {"message": "Request deleted"}

@router.get("/my")
async def get_my_requests(
    initiator_id: int = Query(..., description="ID użytkownika"),
    db: Session = Depends(get_db)
):
    requests = db.query(ChangeRequest).filter(ChangeRequest.initiator_id == initiator_id).all()
    return requests