from sqlalchemy import create_engine, Date
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, time
from model import Base, User, Group, Room, Course, CourseEvent, RoomUnavailability, ChangeRequest, \
    AvailabilityProposal, ChangeRecomendation, RoomType, UserRole, ChangeRequestStatus, TimeSlots
from routers.auth import get_password_hash

DATABASE_URL = "postgresql+psycopg2://admin:admin@localhost:5433/database"


def add_data():
    engine = create_engine(DATABASE_URL, echo=True)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    now = datetime.now()

    intervals = [
        TimeSlots(start_time=time(8, 0), end_time=time(9, 30)),
        TimeSlots(start_time=time(9, 45), end_time=time(11, 15)),
        TimeSlots(start_time=time(11, 30), end_time=time(13, 0)),
        TimeSlots(start_time=time(13, 15), end_time=time(14, 45)),
        TimeSlots(start_time=time(15, 0), end_time=time(16, 30)),
        TimeSlots(start_time=time(16, 45), end_time=time(18, 15)),
        TimeSlots(start_time=time(18, 30), end_time=time(20, 0)),
    ]

    session.add_all(intervals)
    session.flush()

    # Users
    admin = User(email="admin@example.com", password=get_password_hash("admin123"), name="Admin", surname="User",
                 role=UserRole.ADMIN)
    teacher = User(email="teacher@example.com", password=get_password_hash("teach123"), name="John", surname="Smith",
                   role=UserRole.PROWADZACY)
    student = User(email="student@example.com", password=get_password_hash("stud123"), name="Anna", surname="Kowalska",
                   role=UserRole.STAROSTA)
    coordinator = User(email="koord@example.com", password=get_password_hash("koord123"), name="Coord",
                       surname="Person",
                       role=UserRole.KOORDYNATOR)

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
    unavailable1 = RoomUnavailability(room_id=room1.id, start_datetime=now + timedelta(days=3),
                                      end_datetime=now + timedelta(days=3, hours=2))
    unavailable2 = RoomUnavailability(room_id=room2.id, start_datetime=now + timedelta(days=5),
                                      end_datetime=now + timedelta(days=5, hours=4))

    session.add_all([unavailable1, unavailable2])
    session.flush()

    # Courses
    course1 = Course(name="Python 101", teacher_id=teacher.id, group_id=group1.id)
    course2 = Course(name="Databases", teacher_id=teacher.id, group_id=group1.id)

    session.add_all([course1, course2])
    session.flush()

    # Course events
    event1 = CourseEvent(course_id=course1.id, room_id=room1.id, time_slot_id=1,
                         day=(now + timedelta(days=1)).date(), canceled=False)
    event2 = CourseEvent(course_id=course2.id, room_id=room2.id, time_slot_id=2,
                         day=(now + timedelta(days=2)).date(), canceled=False)

    session.add_all([event1, event2])
    session.flush()

    # Change requests
    req1 = ChangeRequest(course_event_id=event1.id, initiator_id=student.id, status=ChangeRequestStatus.PENDING,
                         reason="Need different time", room_requirements="Projector", created_at=now)
    req2 = ChangeRequest(course_event_id=event2.id, initiator_id=teacher.id, status=ChangeRequestStatus.ACCEPTED,
                         reason="Room too small", room_requirements="Capacity > 80", created_at=now)

    session.add_all([req1, req2])
    session.flush()

    # Availability proposals
    proposal1 = AvailabilityProposal(change_request_id=req1.id, user_id=student.id,
                                     time_slot_id=1,
                                     day=(now + timedelta(days=2)).date(), )
    proposal2 = AvailabilityProposal(change_request_id=req1.id, user_id=teacher.id,
                                     time_slot_id=2,
                                     day=(now + timedelta(days=3)).date())

    session.add_all([proposal1, proposal2])
    session.flush()

    # Change recommendation
    recommendation1 = ChangeRecomendation(change_request_id=req1.id, recommended_day=(now + timedelta(days=2)).date(),
                                          recommended_slot_id=1,
                                          recommended_room_id=room2.id)

    session.add_all([recommendation1])
    session.flush()

    session.commit()
    session.close()
