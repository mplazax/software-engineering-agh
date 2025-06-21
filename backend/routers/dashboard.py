# Plik: ./backend/routers/dashboard.py
from datetime import date
from database import get_db
from fastapi import APIRouter, Depends
from model import (
    User, Room, Course, ChangeRequest, CourseEvent,
    UserRole, ChangeRequestStatus
)
from routers.auth import role_required
from routers.schemas import DashboardStatsResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR]))
):
    """
    Zwraca kluczowe statystyki dla panelu administratora/koordynatora.
    """
    total_users = db.query(User).filter(User.active == True).count()
    total_rooms = db.query(Room).count()
    total_courses = db.query(Course).count()
    pending_requests_count = db.query(ChangeRequest).filter(
        ChangeRequest.status == ChangeRequestStatus.PENDING
    ).count()
    events_today_count = db.query(CourseEvent).filter(
        CourseEvent.day == date.today(),
        CourseEvent.canceled == False
    ).count()

    return DashboardStatsResponse(
        total_users=total_users,
        total_rooms=total_rooms,
        total_courses=total_courses,
        pending_requests_count=pending_requests_count,
        events_today_count=events_today_count,
    )