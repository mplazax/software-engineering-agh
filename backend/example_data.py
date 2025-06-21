from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from model import (
    AvailabilityProposal, ChangeRequest, Course, CourseEvent, Equipment, Group,
    Room, RoomType, TimeSlots, User, UserRole
)
from routers.auth import get_password_hash

def create_users():
    admin_psw, koord_psw, teach_psw, stud_psw = (
        get_password_hash("admin123"), get_password_hash("koord123"),
        get_password_hash("teach123"), get_password_hash("stud123")
    )
    return {
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

def create_groups(users):
    return {
        'g1': Group(name="Zarządzanie St. I, gr. A", year=1, leader_id=users['starosta1'].id),
        'g2': Group(name="Zarządzanie St. I, gr. B", year=1, leader_id=users['starosta2'].id),
        'g3': Group(name="Zarządzanie St. I, gr. C", year=1, leader_id=users['starosta3'].id),
        'g4': Group(name="Marketing St. II, gr. A", year=2, leader_id=users['starosta4'].id),
        'g5': Group(name="Marketing St. II, gr. B", year=2, leader_id=users['starosta5'].id),
        'g6': Group(name="Marketing St. II, gr. C", year=2, leader_id=users['starosta10'].id),
        'g7': Group(name="Podbijanie Planet, gr. A", year=3, leader_id=users['starosta6'].id),
        'g8': Group(name="Podbijanie Planet, gr. B", year=3, leader_id=users['starosta7'].id),
        'g9': Group(name="Podbijanie Planet, gr. C", year=3, leader_id=users['starosta8'].id),
        'g10': Group(name="Podbijanie Planet, gr. D", year=3, leader_id=users['starosta9'].id),
        'g11': Group(name="Zarządzanie Projektami, gr. A", year=1, leader_id=users['starosta3'].id),
        'g12': Group(name="Zarządzanie Projektami, gr. B", year=1, leader_id=users['starosta1'].id),
        'g13': Group(name="Zarządzanie Projektami, gr. C", year=1, leader_id=users['starosta2'].id),
    }

def create_equipment():
    return {
        'proj': Equipment(name="Rzutnik"),
        'whiteboard': Equipment(name="Tablica interaktywna"),
        'pc_lab': Equipment(name="Pracownia komputerowa"),
        'audio': Equipment(name="Sprzęt audio"),
        'vr': Equipment(name="Zestaw VR"),
        '3d_printer': Equipment(name="Drukarka 3D"),
        'clickers': Equipment(name="Klikery do głosowania"),
    }

def create_rooms(equipments):
    return {
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

def create_courses(users, groups):
    return {
        'c1': Course(name="Podstawy Zarządzania", teacher_id=users['teacher1'].id, group_id=groups['g1'].id),
        'c2': Course(name="Podstawy Zarządzania", teacher_id=users['teacher1'].id, group_id=groups['g2'].id),
        'c3': Course(name="Podstawy Zarządzania", teacher_id=users['teacher1'].id, group_id=groups['g3'].id),
        'c4': Course(name="Marketing", teacher_id=users['teacher1'].id, group_id=groups['g4'].id),
        'c5': Course(name="Marketing", teacher_id=users['teacher2'].id, group_id=groups['g5'].id),
        'c6': Course(name="Marketing", teacher_id=users['teacher2'].id, group_id=groups['g6'].id),
        'c7': Course(name="Zarządzanie Projektami", teacher_id=users['teacher1'].id, group_id=groups['g11'].id),
        'c8': Course(name="Zarządzanie Projektami", teacher_id=users['teacher1'].id, group_id=groups['g12'].id),
        'c9': Course(name="Zarządzanie Projektami", teacher_id=users['teacher1'].id, group_id=groups['g13'].id),
        'c10': Course(name="Podbijanie Planet", teacher_id=users['teacher3'].id, group_id=groups['g7'].id),
        'c11': Course(name="Podbijanie Planet", teacher_id=users['teacher3'].id, group_id=groups['g8'].id),
        'c12': Course(name="Podbijanie Planet", teacher_id=users['teacher3'].id, group_id=groups['g9'].id),
        'c13': Course(name="Podbijanie Planet", teacher_id=users['teacher3'].id, group_id=groups['g10'].id),
    }

def create_course_events(courses, rooms, time_slots):
    events_to_add = []

    def add_weekly_course(course_id, room_id, start_day, time_slot_id):
        reference_date = date.today() - timedelta(weeks=4)
        for week in range(10):
            event_day = reference_date + timedelta(days=start_day - reference_date.weekday(), weeks=week)
            events_to_add.append(CourseEvent(course_id=course_id, room_id=room_id, day=event_day, time_slot_id=time_slot_id))

    def add_biweekly_course(course_id, room_id, start_day, time_slot_id):
        reference_date = date.today() - timedelta(weeks=4)
        for week in range(0, 12, 2):
            event_day = reference_date + timedelta(days=start_day - reference_date.weekday(), weeks=week)
            events_to_add.append(CourseEvent(course_id=course_id, room_id=room_id, day=event_day, time_slot_id=time_slot_id))

    add_weekly_course(courses['c1'].id, rooms['r205'].id, 0, time_slots[1].id)
    add_weekly_course(courses['c2'].id, rooms['r205'].id, 1, time_slots[3].id)
    add_weekly_course(courses['c3'].id, rooms['r203'].id, 0, time_slots[1].id)
    add_weekly_course(courses['c7'].id, rooms['r101'].id, 2, time_slots[0].id)
    add_weekly_course(courses['c8'].id, rooms['r101'].id, 2, time_slots[2].id)
    add_weekly_course(courses['c9'].id, rooms['r204'].id, 3, time_slots[0].id)
    add_weekly_course(courses['c10'].id, rooms['r104'].id, 3, time_slots[1].id)
    add_weekly_course(courses['c11'].id, rooms['r104'].id, 3, time_slots[3].id)
    add_weekly_course(courses['c12'].id, rooms['r102'].id, 4, time_slots[1].id)
    add_weekly_course(courses['c13'].id, rooms['r104'].id, 4, time_slots[0].id)

    add_biweekly_course(courses['c4'].id, rooms['r202'].id, 3, time_slots[2].id)

    return events_to_add

def create_change_requests(db, users, courses):
    event_for_request = db.query(CourseEvent).filter(CourseEvent.course_id == courses['c1'].id).order_by(CourseEvent.day).first()
    if not event_for_request:
        return []

    return [
        ChangeRequest(
            course_event_id=event_for_request.id,
            initiator_id=users['starosta1'].id,
            reason="Konflikt z innym wydarzeniem uczelnianym",
            minimum_capacity=20,
            room_requirements="Rzutnik",
            created_at=datetime.utcnow()
        )
    ]

def create_proposals(change_requests, users, time_slots):
    return {
        'prop1': AvailabilityProposal(
            change_request_id=change_requests[0].id,
            user_id=users['starosta1'].id,
            day=date.today() + timedelta(days=8),
            time_slot_id=time_slots[2].id
        ),
        'prop2': AvailabilityProposal(
            change_request_id=change_requests[0].id,
            user_id=users['starosta1'].id,
            day=date.today() + timedelta(days=8),
            time_slot_id=time_slots[3].id
        ),
        'prop3': AvailabilityProposal(
            change_request_id=change_requests[0].id,
            user_id=users['teacher1'].id,
            day=date.today() + timedelta(days=8),
            time_slot_id=time_slots[3].id
        ),
        'prop4': AvailabilityProposal(
            change_request_id=change_requests[0].id,
            user_id=users['teacher1'].id,
            day=date.today() + timedelta(days=9),
            time_slot_id=time_slots[4].id
        )
    }

def populate_db():
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Database already contains data. Aborting population.")
            return

        print("Creating time slots...")
        time_slots = [("08:00", "09:30"), ("09:45", "11:15"), ("11:30", "13:00"),
                           ("13:15", "14:45"), ("15:00", "16:30"), ("16:45", "18:15"), ("18:30", "20:00")]
        time_slots = [TimeSlots(start_time=time.fromisoformat(s), end_time=time.fromisoformat(e)) for s, e in time_slots]
        db.add_all(time_slots)
        db.commit()
        for ts in time_slots:
            db.refresh(ts)

        print("Creating users...")
        users = create_users()
        db.add_all(users.values())
        db.commit()
        for u in users.values():
            db.refresh(u)

        print("Creating groups...")
        groups = create_groups(users)
        db.add_all(groups.values())
        db.commit()
        for g in groups.values():
            db.refresh(g)

        print("Creating equipment...")
        equipments = create_equipment()
        db.add_all(equipments.values())
        db.commit()
        for eq in equipments.values():
            db.refresh(eq)

        print("Creating rooms...")
        rooms = create_rooms(equipments)
        db.add_all(rooms.values())
        db.commit()
        for r in rooms.values():
            db.refresh(r)

        print("Creating courses...")
        courses = create_courses(users, groups)
        db.add_all(courses.values())
        db.commit()
        for c in courses.values():
            db.refresh(c)

        print("Creating course events...")
        events = create_course_events(courses, rooms, time_slots)
        db.add_all(events)
        db.commit()

        print("Creating change requests...")
        change_requests = create_change_requests(db, users, courses)
        db.add_all(change_requests)
        db.commit()

        print("Creating availability proposals...")
        proposals = create_proposals(change_requests, users, time_slots)
        db.add_all(proposals.values())
        db.commit()

        print("Database populated successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()
