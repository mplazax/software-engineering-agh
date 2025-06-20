from typing import List, Union
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from model import (
    AvailabilityProposal,
    ChangeRequest,
    User,
    CourseEvent,
    ChangeRequestStatus,
    UserRole
)
# Ważne: importujemy funkcje z innych routerów
from routers.change_recommendation import find_recommendations, accept_recommendation
from routers.auth import get_current_user, role_required
from routers.schemas import (
    ProposalCreate,
    ProposalResponse,
)
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

from routers.schemas import ChangeRecomendationResponse, EquipmentResponse, ProposalCreateResponse, AvailabilityProposalResponse, RoomResponse

router = APIRouter(prefix="/proposals", tags=["Availability Proposals"])

@router.get("", response_model=List[ProposalResponse], status_code=HTTP_200_OK)
@router.get("/", response_model=List[ProposalResponse], status_code=HTTP_200_OK, include_in_schema=False)
def get_proposals(
    change_request_id: int = Query(..., description="Filter proposals by change request ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AvailabilityProposal]:
    proposals = (
        db.query(AvailabilityProposal)
        .filter(
            AvailabilityProposal.change_request_id == change_request_id,
            AvailabilityProposal.user_id == current_user.id,
        )
        .all()
    )
    return proposals


@router.post("", status_code=HTTP_201_CREATED, response_model=ProposalCreateResponse)
@router.post("/", status_code=HTTP_201_CREATED, include_in_schema=False, response_model=ProposalCreateResponse)
def create_proposal(
    proposal_data: ProposalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvailabilityProposal:
    change_request = (
        db.query(ChangeRequest)
        .filter(ChangeRequest.id == proposal_data.change_request_id)
        .first()
    )
    if not change_request:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Change request not found"
        )
    # ... walidacja ...
    new_proposal = AvailabilityProposal(**proposal_data.dict(), user_id=current_user.id)
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)

    # --- NOWA LOGIKA AUTO-AKCEPTACJI ---
    # Po dodaniu propozycji sprawdzamy, czy obie strony już coś zaproponowały
    teacher_id = change_request.course_event.course.teacher_id
    leader_id = change_request.course_event.course.group.leader_id
    
    teacher_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == change_request.id, AvailabilityProposal.user_id == teacher_id).first()
    leader_proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == change_request.id, AvailabilityProposal.user_id == leader_id).first()

    if teacher_proposal and leader_proposal:
        # Obie strony podały dostępność, generujemy rekomendacje
        recommendations = find_recommendations(change_request.id, db, current_user)
        if recommendations:
            parsed_recommendations = [
                ChangeRecomendationResponse(
                    id=r.id,
                    change_request_id=r.change_request_id,
                    recommended_day=r.recommended_day,
                    recommended_slot_id=r.recommended_slot_id,
                    recommended_room_id=r.recommended_room_id,
                    source_proposal_id=r.source_proposal_id,
                    accepted_by_teacher=r.accepted_by_teacher,
                    accepted_by_leader=r.accepted_by_leader,
                    rejected_by_teacher=r.rejected_by_teacher,
                    rejected_by_leader=r.rejected_by_leader,
                    recommended_room=RoomResponse(
                        id=r.recommended_room.id,
                        name=r.recommended_room.name,
                        capacity=r.recommended_room.capacity,
                        type=r.recommended_room.type,
                        equipment=[EquipmentResponse.from_orm(e) for e in r.recommended_room.equipment]
                    )
                )
                for r in recommendations
            ]
            return ProposalCreateResponse(
                type="recommendations",
                data=parsed_recommendations
            )

    return ProposalCreateResponse(
        type="proposal",
        data=AvailabilityProposalResponse.from_orm(new_proposal)
    )

@router.delete("/by-user-and-change-request", status_code=204)
def delete_proposals_by_user_and_change_request(
    user_id: int,
    change_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.KOORDYNATOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.query(AvailabilityProposal).filter(
        AvailabilityProposal.user_id == user_id,
        AvailabilityProposal.change_request_id == change_request_id
    ).delete(synchronize_session=False)
    db.commit()


@router.delete("/{proposal_id}", status_code=HTTP_204_NO_CONTENT)
def delete_proposal(proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> None:
    # ... reszta funkcji bez zmian ...
    proposal = (
        db.query(AvailabilityProposal)
        .filter(AvailabilityProposal.id == proposal_id)
        .first()
    )
    if not proposal:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Proposal not found")

    if proposal.user_id != current_user.id:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Not authorized to delete this proposal"
        )

    db.delete(proposal)
    db.commit()
    return None

@router.get(
    "/by-change-id/{change_request_id}",
    response_model=list[ProposalResponse],
    status_code=HTTP_200_OK,
)
async def get_change_request_proposals(
    change_request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AvailabilityProposal]:
    """
    Retrieve all proposals for a specific change request.

    Args:
        change_request_id (int): ID of the change request.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If no proposals are found for the change request.

    Returns:
        list[AvailabilityProposal]: List of proposals for the specified change request.
    """
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


@router.post("/{proposal_id}/changestatus/leader", response_model=ProposalResponse)
async def change_status_by_leader(
        proposal_id: int, new_status: bool, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.PROWADZACY]))
):
    proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Request not found")

    request = proposal.change_request
    proposal.accepted_by_leader = new_status

    if new_status == False:
        request.status = ChangeRequestStatus.REJECTED
    elif proposal.accepted_by_leader and proposal.accepted_by_representative:
        request.status = ChangeRequestStatus.ACCEPTED

        course_event = request.course_event
        recommendation = request.change_to_recommendation[0] if request.change_to_recommendation else None

        if course_event and recommendation:
            course_event.day = recommendation.recommended_day
            course_event.time_slot_id = recommendation.recommended_slot_id
            course_event.room_id = recommendation.recommended_room_id

    db.commit()
    db.refresh(request)
    db.refresh(proposal)
    return proposal


@router.post("/{proposal_id}/changestatus/representative", response_model=ProposalResponse)
async def change_status_by_representative(
        proposal_id: int, new_status: bool, db: Session = Depends(get_db), current_user: User = Depends(role_required([UserRole.STAROSTA]))
):
    proposal = db.query(AvailabilityProposal).filter(AvailabilityProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Request not found")

    request = proposal.change_request
    proposal.accepted_by_representative = new_status

    if new_status == False:
        request.status = ChangeRequestStatus.REJECTED
    elif proposal.accepted_by_leader and proposal.accepted_by_representative:
        request.status = ChangeRequestStatus.ACCEPTED

        course_event = request.course_event
        recommendation = request.change_to_recommendation[0] if request.change_to_recommendation else None

        if course_event and recommendation:
            course_event.day = recommendation.recommended_day
            course_event.time_slot_id = recommendation.recommended_slot_id
            course_event.room_id = recommendation.recommended_room_id

    db.commit()
    db.refresh(request)
    db.refresh(proposal)
    return proposal


@router.delete("/{proposal_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete an availability proposal.

    Args:
        proposal_id (int): ID of the proposal to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user.

    Raises:
        HTTPException: If proposal is not found.
    """
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
