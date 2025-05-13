from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import AvailabilityProposal
from routers.auth import role_required, get_current_user
from routers.schemas import ProposalCreate
from model import ChangeRequest
from routers.schemas import ChangeRequestCreate
from routers.schemas import ProposalUpdate
from model import User

router = APIRouter(prefix="/proposals", tags=["proposals"])

@router.get("/")
async def get_proposals(
        skip: int = 0,
        limit: int = 10,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    proposals = db.query(AvailabilityProposal).offset(skip).limit(limit).all()
    return proposals

@router.get("/{proposal_id}")
async def get_proposal(
        proposal_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.get("/{change_request_id}")
async def get_change_request_proposals(
        change_request_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    proposals = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == change_request_id).all()
    if not proposals:
        raise HTTPException(status_code=404, detail="Change request not found")
    return proposals

# @router.post("/{proposal_id}")
# async def create_proposal(
#         proposal: ProposalCreate,
#         db: Session = Depends(get_db),
#         current_user=Depends(get_current_user)
# ):
#     change_request = db.query(ChangeRequest).filter(ChangeRequest.id == proposal.change_request_id).first()
#     if not change_request:
#         raise HTTPException(status_code=404, detail="Change request not found")
#     user = db.query(User).filter(User.id == proposal.user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     if proposal.interval.start_date >= proposal.interval.end_date:
#         raise HTTPException(status_code=400, detail="Start date must be before end date")
#
#     new_proposal = AvailabilityProposal(change_request_id=proposal.change_request_id, user_id=proposal.user_id,
#                                         available_start_datetime=proposal.interval.start_date,
#                                         available_end_datetime=proposal.interval.end_date)
#     db.add(new_proposal)
#     db.commit()
#     db.refresh(new_proposal)
#     return new_proposal

@router.post("/", status_code=201)
async def create_proposal(
        proposal: ProposalCreate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    change_request = db.query(ChangeRequest).filter(ChangeRequest.id == proposal.change_request_id).first()
    if not change_request:
        raise HTTPException(status_code=404, detail="Change request not found")
    user = db.query(User).filter(User.id == proposal.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if proposal.interval.start_date >= proposal.interval.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    new_proposal = AvailabilityProposal(
        change_request_id=proposal.change_request_id,
        user_id=proposal.user_id,
        available_start_datetime=proposal.interval.start_date,
        available_end_datetime=proposal.interval.end_date
    )
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    return new_proposal

@router.put("/{proposal_id}")
async def update_proposal(
        proposal_id: int,
        proposal: ProposalUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    existing_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == proposal_id).first()
    if not existing_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    user = db.query(User).filter(User.id == proposal.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if proposal.interval.start_date >= proposal.interval.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    setattr(existing_proposal, "user_id", proposal.user_id)
    setattr(existing_proposal, "available_start_datetime", proposal.interval.start_date)
    setattr(existing_proposal, "available_end_datetime", proposal.interval.end_date)
    db.commit()
    db.refresh(existing_proposal)
    return existing_proposal

@router.delete("/{proposal_id}")
async def delete_proposal(
        proposal_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    existing_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == proposal_id).first()
    if not existing_proposal:
        raise HTTPException(status_code=404, detail="Change request not found")
    db.delete(existing_proposal)
    db.commit()
    return {"message": "Proposal deleted"}