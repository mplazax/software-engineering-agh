from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from model import Room, RoomType, TimeSlots, CourseEvent, ChangeRequest, ChangeRequestStatus, AvailabilityProposal, User, UserRole
from main import app

client = TestClient(app)

def test_find_common_availability(db: Session):
    # Create test data
    now = datetime.now()
    
    # Create users
    user1 = User(email="user1@test.com", role=UserRole.TEACHER)
    user2 = User(email="user2@test.com", role=UserRole.TEACHER)
    db.add_all([user1, user2])
    db.flush()
    
    # Create time slots
    time_slot1 = TimeSlots(start_time=datetime.strptime("08:00", "%H:%M").time(),
                          end_time=datetime.strptime("09:30", "%H:%M").time())
    time_slot2 = TimeSlots(start_time=datetime.strptime("09:45", "%H:%M").time(),
                          end_time=datetime.strptime("11:15", "%H:%M").time())
    db.add_all([time_slot1, time_slot2])
    db.flush()
    
    # Create room
    room = Room(name="Test Room", capacity=30, type=RoomType.LECTURE_HALL)
    db.add(room)
    db.flush()
    
    # Create course event
    course_event = CourseEvent(
        course_id=1,
        room_id=room.id,
        time_slot_id=time_slot1.id,
        day=(now + timedelta(days=1)).date(),
        canceled=False
    )
    db.add(course_event)
    db.flush()
    
    # Create change request
    change_request = ChangeRequest(
        course_event_id=course_event.id,
        initiator_id=user1.id,
        status=ChangeRequestStatus.PENDING,
        reason="Test reason",
        room_requirements="Projector",
        created_at=now
    )
    db.add(change_request)
    db.flush()
    
    # Create availability proposals
    proposal1 = AvailabilityProposal(
        change_request_id=change_request.id,
        user_id=user1.id,
        time_slot_id=time_slot2.id,
        day=(now + timedelta(days=2)).date()
    )
    proposal2 = AvailabilityProposal(
        change_request_id=change_request.id,
        user_id=user2.id,
        time_slot_id=time_slot2.id,
        day=(now + timedelta(days=2)).date()
    )
    db.add_all([proposal1, proposal2])
    db.commit()
    
    # Test finding common availability
    response = client.post(
        f"/change_recommendation/common-availability?user1_id={user1.id}&user2_id={user2.id}&change_request_id={change_request.id}"
    )
    assert response.status_code == 200
    assert response.json() == {"message": "Recommendations added successfully"}
    
    # Verify recommendations were created
    recommendations = db.query(ChangeRecomendation).filter(
        ChangeRecomendation.change_request_id == change_request.id
    ).all()
    assert len(recommendations) > 0
    assert recommendations[0].recommended_slot_id == time_slot2.id
    assert recommendations[0].recommended_day == (now + timedelta(days=2)).date()
    assert recommendations[0].recommended_room_id == room.id

def test_no_common_availability(db: Session):
    # Create test data
    now = datetime.now()
    
    # Create users
    user1 = User(email="user1@test.com", role=UserRole.TEACHER)
    user2 = User(email="user2@test.com", role=UserRole.TEACHER)
    db.add_all([user1, user2])
    db.flush()
    
    # Create time slots
    time_slot1 = TimeSlots(start_time=datetime.strptime("08:00", "%H:%M").time(),
                          end_time=datetime.strptime("09:30", "%H:%M").time())
    time_slot2 = TimeSlots(start_time=datetime.strptime("09:45", "%H:%M").time(),
                          end_time=datetime.strptime("11:15", "%H:%M").time())
    db.add_all([time_slot1, time_slot2])
    db.flush()
    
    # Create room
    room = Room(name="Test Room", capacity=30, type=RoomType.LECTURE_HALL)
    db.add(room)
    db.flush()
    
    # Create course event
    course_event = CourseEvent(
        course_id=1,
        room_id=room.id,
        time_slot_id=time_slot1.id,
        day=(now + timedelta(days=1)).date(),
        canceled=False
    )
    db.add(course_event)
    db.flush()
    
    # Create change request
    change_request = ChangeRequest(
        course_event_id=course_event.id,
        initiator_id=user1.id,
        status=ChangeRequestStatus.PENDING,
        reason="Test reason",
        room_requirements="Projector",
        created_at=now
    )
    db.add(change_request)
    db.flush()
    
    # Create availability proposals with different time slots
    proposal1 = AvailabilityProposal(
        change_request_id=change_request.id,
        user_id=user1.id,
        time_slot_id=time_slot1.id,
        day=(now + timedelta(days=2)).date()
    )
    proposal2 = AvailabilityProposal(
        change_request_id=change_request.id,
        user_id=user2.id,
        time_slot_id=time_slot2.id,
        day=(now + timedelta(days=2)).date()
    )
    db.add_all([proposal1, proposal2])
    db.commit()
    
    # Test finding common availability
    response = client.post(
        f"/change_recommendation/common-availability?user1_id={user1.id}&user2_id={user2.id}&change_request_id={change_request.id}"
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "No common availability found"} 