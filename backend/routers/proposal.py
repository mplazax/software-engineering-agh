from typing import List
from database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from model import (
    AvailabilityProposal,
    ChangeRequest,
    User,
    CourseEvent,
    ChangeRequestStatus
)
# Ważne: importujemy funkcje z innych routerów
from routers.change_recommendation import get_recommendations, accept_recommendation
from routers.auth import get_current_user
from routers.schemas import (
    ProposalCreate,
    ProposalResponse,
)
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
)

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


@router.post("", status_code=HTTP_201_CREATED, response_model=ProposalResponse)
@router.post("/", status_code=HTTP_201_CREATED, response_model=ProposalResponse, include_in_schema=False)
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
        recommendations = get_recommendations(change_request.id, db, current_user)
        if recommendations:
            # Wybieramy "najlepszą" (pierwszą z listy, która jest już posortowana)
            best_recommendation = recommendations[0]
            # Automatycznie akceptujemy
            accept_recommendation(best_recommendation.source_proposal_id, db, current_user)
            # Nie musimy tu nic zwracać, bo akceptacja modyfikuje stan,
            # a frontend odświeży dane i zobaczy zmieniony status zgłoszenia
    
    return new_proposal


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