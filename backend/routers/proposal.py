
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import AvailabilityProposal, ChangeRequest, User
from routers.auth import get_current_user
from routers.schemas import ProposalCreate, ProposalResponse, ProposalUpdate
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.get("/", response_model=list[ProposalResponse], status_code=HTTP_200_OK)
async def get_proposals(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    proposals = db.query(AvailabilityProposal).offset(skip).limit(limit).all()
    return proposals


@router.get("/{proposal_id}", response_model=ProposalResponse, status_code=HTTP_200_OK)
async def get_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    proposal = (
        db.query(AvailabilityProposal)
        .filter(AvailabilityProposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Proposal not found")
    return proposal


@router.get(
    "/{change_request_id}",
    response_model=list[ProposalResponse],
    status_code=HTTP_200_OK,
)
async def get_change_request_proposals(
    change_request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    proposals = (
        db.query(AvailabilityProposal)
        .filter(AvailabilityProposal.change_request_id == change_request_id)
        .all()
    )
    if not proposals:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Change requests not found"
        )
    return proposals


@router.post("/", status_code=HTTP_201_CREATED, response_model=ProposalResponse)
async def create_proposal(
    proposal: ProposalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    change_request = (
        db.query(ChangeRequest)
        .filter(ChangeRequest.id == proposal.change_request_id)
        .first()
    )
    if not change_request:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Change request not found"
        )
    user = db.query(User).filter(User.id == proposal.user_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    proposal_exists = (
        db.query(AvailabilityProposal)
        .filter(
            AvailabilityProposal.change_request_id == proposal.change_request_id,
            AvailabilityProposal.user_id == proposal.user_id,
            AvailabilityProposal.day == proposal.day,
            AvailabilityProposal.time_slot_id == proposal.time_slot_id,
        )
        .first()
    )

    if proposal_exists:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Proposal already exists for this user and time slot",
        )

    new_proposal = AvailabilityProposal(
        change_request_id=proposal.change_request_id,
        user_id=proposal.user_id,
        time_slot_id=proposal.time_slot_id,
        day=proposal.day,
    )
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    return new_proposal


@router.put("/{proposal_id}", response_model=ProposalResponse, status_code=HTTP_200_OK)
async def update_proposal(
    proposal_id: int,
    proposal: ProposalUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing_proposal = (
        db.query(AvailabilityProposal)
        .filter(AvailabilityProposal.id == proposal_id)
        .first()
    )
    if not existing_proposal:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Proposal not found")
    user = db.query(User).filter(User.id == proposal.user_id).first()
    if not user:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    existing_proposal.user_id = proposal.user_id
    existing_proposal.day = proposal.day
    existing_proposal.time_slot_id = proposal.time_slot_id
    db.commit()
    db.refresh(existing_proposal)
    return existing_proposal


@router.delete("/{proposal_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing_proposal = (
        db.query(AvailabilityProposal)
        .filter(AvailabilityProposal.id == proposal_id)
        .first()
    )
    if not existing_proposal:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Change request not found"
        )
    db.delete(existing_proposal)
    db.commit()
    return
