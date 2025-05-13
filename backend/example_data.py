from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from model import Base, User, Group, Room, Course, CourseEvent, RoomUnavailability, ChangeRequest, \
    AvailabilityProposal, ChangeRecomendation, RoomType, UserRole, ChangeRequestStatus

DATABASE_URL = "postgresql+psycopg2://admin:admin@localhost:5433/database"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

now = datetime.now()

# Users
admin = User(email="admin@example.com", password="admin123", name="Admin User", role=UserRole.ADMIN)
teacher = User(email="teacher@example.com", password="teach123", name="John Smith", role=UserRole.PROWADZACY)
student = User(email="student@example.com", password="stud123", name="Anna Kowalska", role=UserRole.STAROSTA)
coordinator = User(email="koord@example.com", password="koord123", name="Coord Person", role=UserRole.KOORDYNATOR)

session.add_all([admin, teacher, student, coordinator])
session.flush()

# Groups
group1 = Group(name="Group A", year=1, leader_id=student.id)
student.group = group1

session.add_all([group1])
session.flush()

# Rooms
room1 = Room(name="Lab 101", capacity=30, equipment="PCs, Projector", type=RoomType.LABORATORY)
room2 = Room(name="Hall A", capacity=100, equipment="Microphones", type=RoomType.LECTURE_HALL)

session.add_all([room1, room2])
session.flush()

# Room unavailability
unavailable1 = RoomUnavailability(room_id=room1.id, start_datetime=now + timedelta(days=3), end_datetime=now + timedelta(days=3, hours=2))
unavailable2 = RoomUnavailability(room_id=room2.id, start_datetime=now + timedelta(days=5), end_datetime=now + timedelta(days=5, hours=4))

session.add_all([unavailable1, unavailable2])
session.flush()

# Courses
course1 = Course(name="Python 101", teacher_id=teacher.id, group_id=group1.id)
course2 = Course(name="Databases", teacher_id=teacher.id, group_id=group1.id)

session.add_all([course1, course2])
session.flush()

# Course events
event1 = CourseEvent(course_id=course1.id, room_id=room1.id, start_datetime=now + timedelta(days=1), end_datetime=now + timedelta(days=1, hours=2), canceled=False)
event2 = CourseEvent(course_id=course2.id, room_id=room2.id, start_datetime=now + timedelta(days=2), end_datetime=now + timedelta(days=2, hours=1, minutes=30), canceled=False)

session.add_all([event1, event2])
session.flush()

# Change requests
req1 = ChangeRequest(course_event_id=event1.id, initiator_id=student.id, status=ChangeRequestStatus.PENDING, reason="Need different time", room_requirements="Projector", created_at=now)
req2 = ChangeRequest(course_event_id=event2.id, initiator_id=teacher.id, status=ChangeRequestStatus.ACCEPTED, reason="Room too small", room_requirements="Capacity > 80", created_at=now)

session.add_all([req1, req2])
session.flush()

# Availability proposals
proposal1 = AvailabilityProposal(change_request_id=req1.id, user_id=student.id, available_start_datetime=now + timedelta(days=1, hours=3), available_end_datetime=now + timedelta(days=1, hours=5))
proposal2 = AvailabilityProposal(change_request_id=req1.id, user_id=teacher.id, available_start_datetime=now + timedelta(days=1, hours=4), available_end_datetime=now + timedelta(days=1, hours=6))

session.add_all([proposal1, proposal2])
session.flush()

# Change recommendation
recommendation1 = ChangeRecomendation(change_request_id=req1.id, recommended_start_datetime=now + timedelta(days=2), recommended_end_datetime=now + timedelta(days=2, hours=2), recommended_room_id=room2.id)

session.add_all([recommendation1])
session.flush()

session.commit()
session.close()
