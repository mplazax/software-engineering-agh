from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import AvailabilityProposal
from routers.schemas import ProposalCreate
from routers.schemas import ProposalUpdate

router = APIRouter(prefix="/proposals", tags=["proposals"])

@router.get("/")
async def get_proposals(db: Session = Depends(get_db)):
    proposals = db.query(AvailabilityProposal).all()
    return proposals

@router.post("/") # TODO
async def create_proposal(proposal: ProposalCreate, db: Session = Depends(get_db)):
    created = []
    for interval in proposal.intervals:
        if interval.available_start_datetime >= interval.available_end_datetime:
            raise HTTPException(status_code=400, detail="Start time must be before end time")

        proposal = AvailabilityProposal(
            change_request_id=proposal.change_request_id,
            user_id=proposal.user_id,
            available_start_datetime=interval.available_start_datetime,
            available_end_datetime=interval.available_end_datetime,
        )
        db.add(proposal)
        created.append(proposal)

    db.commit()
    return {"created": len(created)}

@router.get("/{proposal_id}")
async def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.put("/{proposal_id}") # TODO
async def update_proposal(proposal_id: int, proposal: ProposalUpdate, db: Session = Depends(get_db)):
    existing_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == proposal_id).first()
    if not existing_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    for key, value in proposal.dict().items():
        setattr(existing_proposal, key, value)
    db.commit()
    db.refresh(existing_proposal)
    return existing_proposal

@router.delete("/{proposal_id}")
async def delete_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    db.delete(proposal)
    db.commit()
    return {"message": "Proposal deleted"}