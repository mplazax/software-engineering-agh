from datetime import datetime, time, timedelta

# TODO: add room requirements
from model import (
    AvailabilityProposal,
    ChangeRecomendation,
    ChangeRequest,
    ChangeRequestStatus,
    Course,
    CourseEvent,
    Group,
    Room,
    RoomType,
    RoomUnavailability,
    TimeSlots,
    User,
    UserRole, Equipment,
)

# Import your password hashing function
from routers.auth import get_password_hash
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def add_data(DATABASE_URL):
    """Adds example data to the database. Assumes tables are already created."""
    engine = create_engine(DATABASE_URL, echo=True)  # echo=True shows SQL logs
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    now = datetime.now()

    try:
        # --- Add Users ---
        admin = User(
            email="admin@example.com",
            password=get_password_hash("admin123"),
            name="Admin",
            surname="User",
            role=UserRole.ADMIN,
        )
        teacher = User(
            email="teacher@example.com",
            password=get_password_hash("teach123"),
            name="John",
            surname="Smith",
            role=UserRole.PROWADZACY,
        )
        student = User(
            email="student@example.com",
            password=get_password_hash("stud123"),
            name="Anna",
            surname="Kowalska",
            role=UserRole.STAROSTA,
        )
        coordinator = User(
            email="koord@example.com",
            password=get_password_hash("koord123"),
            name="Coord",
            surname="Person",
            role=UserRole.KOORDYNATOR,
        )

        session.add_all([admin, teacher, student, coordinator])
        session.flush()  # Get IDs for users before referencing them

        # --- Add Groups ---
        # Use relationship for leader
        group1 = Group(name="Group A", year=1, leader=student)
        session.add(group1)
        session.flush()  # Get ID for group before referencing it

        # Link the group back to the student (Starosta)
        student.group = group1
        session.flush()  # Ensure student's group_id is updated

        # --- Add Equipment ---
        projector = Equipment(name="Projector")
        whiteboard = Equipment(name="Whiteboard")
        pc_lab = Equipment(name="PC Lab")

        session.add_all([projector, whiteboard, pc_lab])
        session.flush()

        # --- Add Rooms ---
        room1 = Room(
            name="Lab 101",
            capacity=30,
            type=RoomType.LABORATORY,
        )
        room2 = Room(
            name="Hall A",
            capacity=100,
            type=RoomType.LECTURE_HALL,
        )


        room1.equipment.append(pc_lab)
        room1.equipment.append(projector)
        room2.equipment.append(whiteboard)
        room2.equipment.append(projector)

        session.add_all([room1, room2])
        session.flush()  # Get IDs for rooms

        # --- Add Room unavailability ---
        # Use relationships for rooms and .date() for Date columns
        unavailable1 = RoomUnavailability(
            room=room1,
            start_datetime=(now + timedelta(days=3)).date(),
            end_datetime=(now + timedelta(days=3, hours=2)).date(),
        )
        unavailable2 = RoomUnavailability(
            room=room2,
            start_datetime=(now + timedelta(days=5)).date(),
            end_datetime=(now + timedelta(days=5, hours=4)).date(),
        )

        session.add_all([unavailable1, unavailable2])
        session.flush()  # Get IDs for unavailability entries

        # --- Add Time Slots ---
        # Define example time slots (adjust times as needed)
        time_slots_data = [
            (time(8, 0), time(9, 30)),
            (time(9, 45), time(11, 15)),
            (time(11, 30), time(13, 0)),
            (time(13, 15), time(14, 45)),
            (time(15, 0), time(16, 30)),
        ]
        # Create TimeSlots objects and store them for later reference
        time_slot_objects = []
        for start_t, end_t in time_slots_data:
            ts = TimeSlots(start_time=start_t, end_time=end_t)
            session.add(ts)
            time_slot_objects.append(ts)

        session.flush()  # <-- CRITICAL: Flush here to ensure time_slot_objects have IDs before used in FKs

        # --- Add Courses ---
        # Use relationships for teacher and group
        course1 = Course(name="Python 101", teacher=teacher, group=group1)
        course2 = Course(name="Databases", teacher=teacher, group=group1)

        session.add_all([course1, course2])
        session.flush()  # Get IDs for courses

        # --- Add Course events ---
        # Use relationships for course, room, and time_slot
        # Reference the time_slot_objects created and flushed earlier
        # Use index 0 for the first time slot (8:00-9:30) and index 1 for the second (9:45-11:15)
        # Use 'slot_id' keyword for the relationship
        event1 = CourseEvent(
            course=course1,
            room=room1,
            slot_id=time_slot_objects[0],
            day=(now + timedelta(days=1)).date(),
            canceled=False,
        )
        event2 = CourseEvent(
            course=course2,
            room=room2,
            slot_id=time_slot_objects[1],
            day=(now + timedelta(days=2)).date(),
            canceled=False,
        )

        session.add_all([event1, event2])
        session.flush()  # Get IDs for course events

        # --- Add Change requests ---
        # Use relationships for course_event and initiator
        req1 = ChangeRequest(
            course_event=event1,
            initiator=student,
            status=ChangeRequestStatus.PENDING,
            reason="Need different time",
            room_requirements="Projector",
            minimum_capacity=30,
            created_at=now,
        )
        req2 = ChangeRequest(
            course_event=event2,
            initiator=teacher,
            status=ChangeRequestStatus.ACCEPTED,
            reason="Room too small",
            room_requirements="Capacity >= 80",
            minimum_capacity=80,
            created_at=now,
        )

        session.add_all([req1, req2])
        session.flush()  # Get IDs for change requests

        # --- Add Availability proposals ---
        # Use relationships for change_request, user, and time_slot
        # Reference time_slot_objects - proposing slot 3 (index 2) and slot 4 (index 3)
        proposal1 = AvailabilityProposal(
            change_request=req1,
            user=student,
            time_slot=time_slot_objects[2],
            day=(now + timedelta(days=2)).date(),
        )
        proposal2 = AvailabilityProposal(
            change_request=req1,
            user=teacher,
            time_slot=time_slot_objects[2],
            day=(now + timedelta(days=2)).date(),
        )
        proposal3 = AvailabilityProposal(
            change_request=req1,
            user=teacher,
            time_slot=time_slot_objects[3],
            day=(now + timedelta(days=3)).date(),
        )

        session.add_all([proposal1, proposal2, proposal3])
        session.flush()  # Get IDs for availability proposals

        # --- Add Change recommendation ---
        # Use relationships for change_request, recommended_interval, and recommended_room
        # Reference time_slot_objects - recommending slot 3 (index 2) and room2
        recommendation1 = ChangeRecomendation(
            change_request=req1,
            recommended_day=(now + timedelta(days=2)).date(),
            recommended_interval=time_slot_objects[2],
            recommended_room=room2,
            source_proposal=proposal1,
        )

        session.add_all([recommendation1])
        # No need to flush here if this is the last set of adds before commit
        # session.flush()

        # --- Commit Transaction ---
        session.commit()
        print("DB has been populated with mock data.")

    except Exception as e:
        session.rollback()  # Rollback the transaction on error
        print(f"An error occurred during data population: {e}")
    finally:
        # --- Close Session ---
        session.close()
