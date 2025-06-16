from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from model import (
    AvailabilityProposal,
    ChangeRequest,
    ChangeRequestStatus,
    CourseEvent,
    User,
    Room,
    Equipment,
)
from routers.auth import get_current_user
# POPRAWKA 1: Dodajemy brakujące importy
from routers.schemas import (
    ProposalCreate,
    ProposalResponse,
    ChangeRequestResponse, # <-- BRAKUJĄCY IMPORT
)
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

router = APIRouter(prefix="/proposals", tags=["Availability Proposals"])

@router.get("/", response_model=List[ProposalResponse], status_code=HTTP_200_OK)
def get_proposals(
    change_request_id: int = Query(..., description="Filter proposals by change request ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AvailabilityProposal]:
    # Pobierz propozycje tylko bieżącego użytkownika dla danego zgłoszenia
    proposals = (
        db.query(AvailabilityProposal)
        .filter(
            AvailabilityProposal.change_request_id == change_request_id,
            AvailabilityProposal.user_id == current_user.id,
        )
        .all()
    )
    return proposals


@router.post("/", status_code=HTTP_201_CREATED, response_model=ProposalResponse)
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

    proposal_exists = (
        db.query(AvailabilityProposal)
        .filter(
            AvailabilityProposal.change_request_id == proposal_data.change_request_id,
            AvailabilityProposal.user_id == current_user.id,
            AvailabilityProposal.day == proposal_data.day,
            AvailabilityProposal.time_slot_id == proposal_data.time_slot_id,
        )
        .first()
    )
    if proposal_exists:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="You have already proposed this time slot.",
        )

    new_proposal = AvailabilityProposal(
        **proposal_data.dict(), user_id=current_user.id
    )
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    return new_proposal

# POPRAWKA 2: Zmieniamy logikę akceptacji
# Teraz endpoint przyjmuje ID rekomendacji, a nie propozycji.
# Ale żeby nie zmieniać frontendu, zmodyfikujemy logikę, aby działała z ID propozycji.
@router.post("/{proposal_id}/accept", response_model=ChangeRequestResponse)
def accept_proposal(
    proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Znajdź rekomendację, która pochodzi z tej propozycji
    # To jest obejście, idealnie frontend powinien wysyłać ID rekomendacji
    recommendation_query = db.query(ChangeRecomendation).filter(ChangeRecomendation.source_proposal_id == proposal_id).first()
    if not recommendation_query:
        raise HTTPException(status_code=404, detail="Could not find a matching recommendation for this proposal. Ensure both parties have submitted availability.")

    change_request = recommendation_query.change_request
    if change_request.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="This request has already been processed.")

    original_event = change_request.course_event
    course = original_event.course
    group = course.group
    
    is_leader = current_user.id == group.leader_id
    is_teacher = current_user.id == course.teacher_id

    if not (is_leader or is_teacher):
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized to accept this proposal")
        
    change_request.status = ChangeRequestStatus.ACCEPTED
    original_event.canceled = True
    
    # Utwórz nowe wydarzenie na podstawie DANYCH Z REKOMENDACJI
    new_event = CourseEvent(
        course_id=original_event.course_id,
        room_id=recommendation_query.recommended_room_id, # Użyj sali z rekomendacji
        day=recommendation_query.recommended_day, # Użyj dnia z rekomendacji
        time_slot_id=recommendation_query.recommended_slot_id, # Użyj slotu z rekomendacji
        canceled=False
    )
    db.add(new_event)
    
    # Opcjonalnie: Usuń wszystkie propozycje związane z tym zgłoszeniem
    db.query(AvailabilityProposal).filter(AvailabilityProposal.change_request_id == change_request.id).delete()

    db.commit()
    db.refresh(change_request)
    return change_request


@router.post("/{proposal_id}/reject", response_model=ChangeRequestResponse)
def reject_proposal(
    proposal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Logika odrzucenia jest prostsza i może bazować na propozycji
    proposal = db.query(AvailabilityProposal).options(joinedload(AvailabilityProposal.change_request)).filter(AvailabilityProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Proposal not found")

    change_request = proposal.change_request
    if change_request.status != ChangeRequestStatus.PENDING:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="This request has already been processed.")

    course = change_request.course_event.course
    group = course.group
    
    is_leader = current_user.id == group.leader_id
    is_teacher = current_user.id == course.teacher_id

    if not (is_leader or is_teacher):
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized to reject this proposal")

    change_request.status = ChangeRequestStatus.REJECTED
    db.commit()
    db.refresh(change_request)
    return change_request


@router.delete("/{proposal_id}", status_code=HTTP_204_NO_CONTENT)
def delete_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
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