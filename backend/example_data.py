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

def create_users():
    admin_psw = get_password_hash("admin123")
    koord_psw = get_password_hash("koord123")
    teach_psw = get_password_hash("teach123")
    stud_psw = get_password_hash("stud123")

    users = {
        'admin': User(email="admin@example.com", password=admin_psw, name="Admin", surname="Systemu", role=UserRole.ADMIN),
        'koordynator': User(email="koord@example.com", password=koord_psw, name="Barbara", surname="Koordynator", role=UserRole.KOORDYNATOR),
        'teacher1': User(email="j.kowalski@example.com", password=teach_psw, name="Jan", surname="Kowalski", role=UserRole.PROWADZACY),
        'teacher2': User(email="p.zielinski@example.com", password=teach_psw, name="Piotr", surname="Zieliński", role=UserRole.PROWADZACY),
        'teacher3': User(email="c.sanders@example.com", password=teach_psw, name="Colonel", surname="Sanders", role=UserRole.PROWADZACY),
        'teacher4': User(email="m.sklodowksa@example.com", password=teach_psw, name="Maria", surname="Curie-Skłodowska", role=UserRole.PROWADZACY),
        'starosta1': User(email="a.nowak@example.com", password=stud_psw, name="Anna", surname="Nowak", role=UserRole.STAROSTA),
        'starosta2': User(email="k.wojcik@example.com", password=stud_psw, name="Kamil", surname="Wójcik", role=UserRole.STAROSTA),
        'starosta3': User(email="j.zalno@example.com", password=stud_psw, name="Jakub", surname="Żalno", role=UserRole.STAROSTA),
        'starosta4': User(email="m.pudzianowski@example.com", password= stud_psw, name="Mariusz", surname="Pudzianowski", role=UserRole.STAROSTA),
        'starosta5': User(email="p.pascal@example.com", password=stud_psw, name="Pedro", surname="Pascal", role=UserRole.STAROSTA),
        'starosta6': User(email="r.lewandowski@example.com", password=stud_psw, name="Robert", surname="Lewandowski", role=UserRole.STAROSTA),
        'starosta7': User(email="r.kubica@example.com", password=stud_psw, name="Robert", surname="Kubica", role=UserRole.STAROSTA),
        'starosta8': User(email="s.wonder@example.com", password=stud_psw, name="Stevie", surname="Wonder", role=UserRole.STAROSTA),
        'starosta9': User(email="p.luszcz@example.com", password=stud_psw, name="Piotr", surname="Łuszcz", role=UserRole.STAROSTA),
        'starosta10': User(email="speed@example.com", password=stud_psw, name="Darren", surname="Watkins", role=UserRole.STAROSTA),
    }
    return users

def create_groups(users):
    groups = {
        'g1': Group(name="Zarządzanie, Rok 1, Grupa A", year=1, leader_id=users['starosta1'].id),
        'g2': Group(name="Zarządzanie, Rok 2, Grupa C", year=2, leader_id=users['starosta2'].id),
    }
    return groups

def create_equipment():
    equipments = {
        'proj': Equipment(name="Rzutnik"),
        'whiteboard': Equipment(name="Tablica interaktywna"),
        'pc_lab': Equipment(name="Pracownia komputerowa"),
        'audio': Equipment(name="Sprzęt audio"),
        'vr' : Equipment(name="Zestaw VR"),
        '3d_printer': Equipment(name="Drukarka 3D"),
        'clickers': Equipment(name="Klikery do głosowania"),
    }
    return equipments

def create_rooms(equipments):
    rooms = {
        'r101': Room(name="Sala 101", capacity=30, type=RoomType.LABORATORY, equipment=[equipments['proj'], equipments['pc_lab']]),
        'r102': Room(name="Sala 102", capacity=30, type=RoomType.SEMINAR_ROOM, equipment=[equipments['proj']]),
        'r103': Room(name="Sala 103", capacity=44, type=RoomType.LABORATORY, equipment=[]),
        'r104': Room(name="Sala 104", capacity=22, type=RoomType.CONFERENCE_ROOM, equipment=[equipments['proj'], equipments['audio']]),
        'r105': Room(name="Sala 105", capacity=90, type=RoomType.LECTURE_HALL, equipment=[]),
        'r201': Room(name="Sala 201", capacity=20, type=RoomType.LABORATORY, equipment=[equipments['vr'], equipments['proj']]),
        'r202': Room(name="Sala 202", capacity=20, type=RoomType.SEMINAR_ROOM, equipment=[equipments['audio'], equipments['proj'], equipments['pc_lab']]),
        'r203': Room(name="Sala 203", capacity=18, type=RoomType.LABORATORY, equipment=[equipments['3d_printer'], equipments['pc_lab']]),
        'r204': Room(name="Sala 204", capacity=20, type=RoomType.CONFERENCE_ROOM, equipment=[equipments['proj'], equipments['whiteboard']]),
        'r205': Room(name="Sala 205", capacity=25, type=RoomType.SEMINAR_ROOM, equipment=[equipments['proj'], equipments['whiteboard']]),
        'aula_a': Room(name="Aula A", capacity=120, type=RoomType.LECTURE_HALL, equipment=[equipments['proj']]),
        'aula_b': Room(name="Aula B", capacity=150, type=RoomType.LECTURE_HALL, equipment=[equipments['proj'], equipments['clickers']]),
    }
    return rooms

def create_courses(users, groups):
    courses = {
        'c1': Course(name="Podstawy Zarządzania", teacher_id=users['teacher1'].id, group_id=groups['g1'].id),
        'c2': Course(name="Marketing", teacher_id=users['teacher2'].id, group_id=groups['g2'].id),
    }
    return courses

def create_course_events(courses, rooms, time_slots):
    today = date.today()
    events = {
        'e1': CourseEvent(course_id=courses['c1'].id, room_id=rooms['r205'].id, day=today + timedelta(days=1), time_slot_id=time_slots[1].id),
        'e2': CourseEvent(course_id=courses['c2'].id, room_id=rooms['r101'].id, day=today + timedelta(days=2), time_slot_id=time_slots[3].id),
    }
    return events


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
        users = create_users()
        db.add_all(users.values())
        db.commit()

        # --- 3. Groups ---
        print("Creating groups...")
        groups = create_groups(users)
        db.add_all(groups.values())
        db.commit()
        
        # --- 4. Equipment ---
        print("Creating equipment...")
        equipments = create_equipment()
        db.add_all(equipments.values())
        db.commit()
        
        # --- 5. Rooms ---
        print("Creating rooms...")
        rooms = create_rooms(equipments)
        db.add_all(rooms.values())
        db.commit()

        # --- 6. Courses ---
        print("Creating courses...")
        courses = create_courses(users, groups)
        db.add_all(courses.values())
        db.commit()
        
        # --- 7. Course Events ---
        print("Creating course events...")
        today = date.today()
        events = create_course_events(courses, rooms, time_slots)
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