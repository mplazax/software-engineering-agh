from datetime import date, datetime, time, timedelta

from database import SessionLocal
from model import (
    AvailabilityProposal,
    ChangeRequest,
    Course,
    CourseEvent,
    Equipment,
    Group,
    Room,
    RoomType,
    TimeSlots,
    User,
    UserRole,
)
from routers.auth import get_password_hash


def populate_db():
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already contains data. Aborting population.")
            return

        # --- 1. Time Slots ---
        print("Creating time slots...")
        time_slots_data = [
            ("08:00", "09:30"), ("09:45", "11:15"), ("11:30", "13:00"),
            ("13:15", "14:45"), ("15:00", "16:30"), ("16:45", "18:15"),
            ("18:30", "20:00")
        ]
        time_slots = []
        for start_t, end_t in time_slots_data:
            ts = TimeSlots(start_time=time.fromisoformat(start_t), end_time=time.fromisoformat(end_t))
            db.add(ts)
            time_slots.append(ts)
        db.commit()

        # --- 2. Users ---
        print("Creating users...")
        users = {
            'admin': User(email="admin@example.com", password=get_password_hash("admin123"), name="Admin", surname="Systemu", role=UserRole.ADMIN),
            'koordynator': User(email="koord@example.com", password=get_password_hash("koord123"), name="Barbara", surname="Koordynator", role=UserRole.KOORDYNATOR),
            'teacher1': User(email="j.kowalski@example.com", password=get_password_hash("teach123"), name="Jan", surname="Kowalski", role=UserRole.PROWADZACY),
            'teacher2': User(email="p.zielinski@example.com", password=get_password_hash("teach123"), name="Piotr", surname="Zieliński", role=UserRole.PROWADZACY),
            'starosta1': User(email="a.nowak@example.com", password=get_password_hash("stud123"), name="Anna", surname="Nowak", role=UserRole.STAROSTA),
            'starosta2': User(email="k.wojcik@example.com", password=get_password_hash("stud123"), name="Kamil", surname="Wójcik", role=UserRole.STAROSTA),
        }
        db.add_all(users.values())
        db.commit()

        # --- 3. Groups ---
        print("Creating groups...")
        groups = {
            'g1': Group(name="Zarządzanie, Rok 1, Grupa A", year=1, leader_id=users['starosta1'].id),
            'g2': Group(name="Zarządzanie, Rok 2, Grupa C", year=2, leader_id=users['starosta2'].id),
        }
        db.add_all(groups.values())
        db.commit()
        
        # --- 4. Equipment ---
        print("Creating equipment...")
        equipments = {
            'proj': Equipment(name="Rzutnik"),
            'whiteboard': Equipment(name="Tablica interaktywna"),
            'pc_lab': Equipment(name="Pracownia komputerowa"),
        }
        db.add_all(equipments.values())
        db.commit()
        
        # --- 5. Rooms ---
        print("Creating rooms...")
        rooms = {
            'r101': Room(name="Sala 101", capacity=30, type=RoomType.LABORATORY, equipment=[equipments['proj'], equipments['pc_lab']]),
            'r205': Room(name="Sala 205", capacity=25, type=RoomType.SEMINAR_ROOM, equipment=[equipments['proj'], equipments['whiteboard']]),
            'aula_a': Room(name="Aula A", capacity=120, type=RoomType.LECTURE_HALL, equipment=[equipments['proj']]),
        }
        db.add_all(rooms.values())
        db.commit()

        # --- 6. Courses ---
        print("Creating courses...")
        courses = {
            'c1': Course(name="Podstawy Zarządzania", teacher_id=users['teacher1'].id, group_id=groups['g1'].id),
            'c2': Course(name="Marketing", teacher_id=users['teacher2'].id, group_id=groups['g2'].id),
        }
        db.add_all(courses.values())
        db.commit()
        
        # --- 7. Course Events ---
        print("Creating course events...")
        today = date.today()
        events = {
            'e1': CourseEvent(course_id=courses['c1'].id, room_id=rooms['r205'].id, day=today + timedelta(days=1), time_slot_id=time_slots[1].id),
            'e2': CourseEvent(course_id=courses['c2'].id, room_id=rooms['r101'].id, day=today + timedelta(days=2), time_slot_id=time_slots[3].id),
        }
        db.add_all(events.values())
        db.commit()

        # --- 8. Change Request Scenario ---
        print("Creating change request scenario...")
        change_req = ChangeRequest(
            course_event_id=events['e1'].id,
            initiator_id=users['starosta1'].id,
            reason="Konflikt z innym wydarzeniem uczelnianym",
            minimum_capacity=20,
            room_requirements="Rzutnik",
            created_at=datetime.utcnow()
        )
        db.add(change_req)
        db.commit()
        
        # --- 9. Availability Proposals ---
        print("Creating availability proposals...")
        prop1 = AvailabilityProposal(change_request_id=change_req.id, user_id=users['starosta1'].id, day=today + timedelta(days=8), time_slot_id=time_slots[2].id)
        prop2 = AvailabilityProposal(change_request_id=change_req.id, user_id=users['starosta1'].id, day=today + timedelta(days=8), time_slot_id=time_slots[3].id)
        prop3 = AvailabilityProposal(change_request_id=change_req.id, user_id=users['teacher1'].id, day=today + timedelta(days=8), time_slot_id=time_slots[3].id)
        prop4 = AvailabilityProposal(change_request_id=change_req.id, user_id=users['teacher1'].id, day=today + timedelta(days=9), time_slot_id=time_slots[4].id)
        db.add_all([prop1, prop2, prop3, prop4])
        db.commit()

        print("Database populated successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()