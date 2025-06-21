from typing import List
from database import get_db
from fastapi import APIRouter, Depends
from model import User, Room, ChangeRequest, CourseEvent, ChangeRequestStatus, UserRole
from routers.auth import role_required
from routers.schemas import DashboardDataResponse, DashboardStatCard, ChangeRequestResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardDataResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    total_users = db.query(func.count(User.id)).scalar()
    total_rooms = db.query(func.count(Room.id)).scalar()
    
    pending_change_requests_count = db.query(ChangeRequest).filter(
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).count()

    active_events_count = db.query(CourseEvent).filter(
        CourseEvent.canceled == False
    ).count()

    stats = DashboardStatCard(
        total_users=total_users,
        total_rooms=total_rooms,
        pending_change_requests=pending_change_requests_count,
        active_events_count=active_events_count
    )

    recent_pending_requests = db.query(ChangeRequest).filter(
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).order_by(ChangeRequest.created_at.desc()).limit(5).all()

    return DashboardDataResponse(
        stats=stats,
        recent_pending_requests=recent_pending_requests
    )