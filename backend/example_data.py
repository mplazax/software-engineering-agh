# example_data.py

from datetime import datetime, time, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# POPRAWKA 1: Upewnij się, że wszystkie potrzebne modele są importowane
from model import (
    Equipment,  # Upewnij się, że ten import istnieje
    User, Group, Room, Course, CourseEvent, ChangeRequest, AvailabilityProposal,
    UserRole, RoomType, ChangeRequestStatus, TimeSlots
)
from routers.auth import get_password_hash

def add_data(DATABASE_URL):
    """Adds a comprehensive set of example data to the database."""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    now = datetime.now()

    try:
        # --- 1. Time Slots (fundamental, create first) ---
        time_slots_data = [
            ("08:00", "09:30"), ("09:45", "11:15"), ("11:30", "13:00"),
            ("13:15", "14:45"), ("15:00", "16:30"), ("16:45", "18:15"),
            ("18:30", "20:00")
        ]
        time_slot_objects = []
        for start_t, end_t in time_slots_data:
            ts = TimeSlots(start_time=time.fromisoformat(start_t), end_time=time.fromisoformat(end_t))
            session.add(ts)
            time_slot_objects.append(ts)
        session.flush()

        # --- 2. Users (more of them) ---
        admin = User(email="admin@example.com", password=get_password_hash("admin123"), name="Admin", surname="Systemu", role=UserRole.ADMIN)
        teacher1 = User(email="teacher@example.com", password=get_password_hash("teach123"), name="Jan", surname="Kowalski", role=UserRole.PROWADZACY)
        student1 = User(email="student@example.com", password=get_password_hash("stud123"), name="Anna", surname="Nowak", role=UserRole.STAROSTA)
        coordinator = User(email="koord@example.com", password=get_password_hash("koord123"), name="Barbara", surname="Koordynator", role=UserRole.KOORDYNATOR)
        teacher2 = User(email="p.zielinski@example.com", password=get_password_hash("pass123"), name="Piotr", surname="Zieliński", role=UserRole.PROWADZACY)
        teacher3 = User(email="m.wisniewska@example.com", password=get_password_hash("pass123"), name="Maria", surname="Wiśniewska", role=UserRole.PROWADZACY)
        student2 = User(email="k.wojcik@example.com", password=get_password_hash("pass123"), name="Kamil", surname="Wójcik", role=UserRole.STAROSTA)
        student3 = User(email="a.lewandowska@example.com", password=get_password_hash("pass123"), name="Alicja", surname="Lewandowska", role=UserRole.STAROSTA)
        student4 = User(email="t.mazur@example.com", password=get_password_hash("pass123"), name="Tomasz", surname="Mazur", role=UserRole.STAROSTA)
        
        users_list = [admin, teacher1, student1, coordinator, teacher2, teacher3, student2, student3, student4]
        session.add_all(users_list)
        session.flush()

        # --- 3. Groups ---
        group1 = Group(name="Zarządzanie, Rok 1, Grupa A", year=1, leader=student1)
        group2 = Group(name="Zarządzanie, Rok 1, Grupa B", year=1, leader=student2)
        group3 = Group(name="Marketing, Rok 2, Grupa C", year=2, leader=student3)
        group4 = Group(name="Finanse i Rachunkowość, Rok 3", year=3, leader=student4)

        groups_list = [group1, group2, group3, group4]
        session.add_all(groups_list)
        
        student1.led_group = group1
        student2.led_group = group2
        student3.led_group = group3
        student4.led_group = group4
        session.flush()

        # --- 4. Rooms and Equipment ---
        # First, create equipment items
        eq_komputery = Equipment(name="Komputery")
        eq_rzutnik = Equipment(name="Rzutnik")
        eq_mikrofon = Equipment(name="Mikrofon")
        eq_stol_konferencyjny = Equipment(name="Stół konferencyjny")
        eq_wideokonferencja = Equipment(name="Wideokonferencja")
        session.add_all([eq_komputery, eq_rzutnik, eq_mikrofon, eq_stol_konferencyjny, eq_wideokonferencja])
        session.flush()

        # POPRAWKA 2: Przypisz obiekty 'Equipment' do listy, a nie string.
        # Now, create rooms and associate equipment
        room1 = Room(name="Lab 101", capacity=30, equipment=[eq_komputery, eq_rzutnik], type=RoomType.LABORATORY)
        room2 = Room(name="Sala Wykładowa A", capacity=150, equipment=[eq_rzutnik, eq_mikrofon], type=RoomType.LECTURE_HALL)
        room3 = Room(name="Sala seminaryjna 203", capacity=25, equipment=[eq_rzutnik], type=RoomType.SEMINAR_ROOM)
        room4 = Room(name="Laboratorium B", capacity=40, equipment=[eq_komputery], type=RoomType.LABORATORY)
        room5 = Room(name="Sala konferencyjna Dziekana", capacity=15, equipment=[eq_stol_konferencyjny, eq_rzutnik, eq_wideokonferencja], type=RoomType.CONFERENCE_ROOM)
        
        rooms_list = [room1, room2, room3, room4, room5]
        session.add_all(rooms_list)
        session.flush()

        # --- 5. Courses ---
        course1 = Course(name="Podstawy Zarządzania", teacher=teacher1, group=group1)
        course2 = Course(name="Wprowadzenie do Marketingu", teacher=teacher2, group=group3)
        course3 = Course(name="Analiza Finansowa", teacher=teacher3, group=group4)
        course4 = Course(name="Podstawy Zarządzania (gr B)", teacher=teacher1, group=group2)
        course5 = Course(name="Ekonometria", teacher=teacher3, group=group4)
        
        courses_list = [course1, course2, course3, course4, course5]
        session.add_all(courses_list)
        session.flush()
        
        # --- 6. Course Events ---
        event1 = CourseEvent(course=course1, room=room1, slot=time_slot_objects[0], day=(now + timedelta(days=1)).date())
        event2 = CourseEvent(course=course2, room=room4, slot=time_slot_objects[2], day=(now + timedelta(days=2)).date())
        event3 = CourseEvent(course=course3, room=room2, slot=time_slot_objects[4], day=(now + timedelta(days=3)).date())
        event4 = CourseEvent(course=course4, room=room3, slot=time_slot_objects[1], day=(now + timedelta(days=1)).date())
        event5 = CourseEvent(course=course5, room=room4, slot=time_slot_objects[3], day=(now + timedelta(days=4)).date())

        events_list = [event1, event2, event3, event4, event5]
        session.add_all(events_list)
        session.flush()

        # --- 7. Change Requests and Proposals ---
        req1 = ChangeRequest(course_event=event2, initiator=teacher2, status=ChangeRequestStatus.PENDING, reason="Wyjazd służbowy", created_at=now)
        session.add(req1)
        
        req2 = ChangeRequest(course_event=event1, initiator=student1, status=ChangeRequestStatus.PENDING, reason="Kolizja z innym ważnym wydarzeniem", created_at=now)
        session.add(req2)
        session.flush()
        prop2_stud = AvailabilityProposal(change_request=req2, user=student1, day=(now + timedelta(days=10)).date(), time_slot=time_slot_objects[0])
        session.add(prop2_stud)

        req3 = ChangeRequest(course_event=event3, initiator=teacher3, status=ChangeRequestStatus.PENDING, reason="Ważne spotkanie naukowe", created_at=now)
        session.add(req3)
        session.flush()
        prop3_teach = AvailabilityProposal(change_request=req3, user=teacher3, day=(now + timedelta(days=12)).date(), time_slot=time_slot_objects[2])
        prop3_stud = AvailabilityProposal(change_request=req3, user=student3, day=(now + timedelta(days=12)).date(), time_slot=time_slot_objects[2])
        prop3_stud2 = AvailabilityProposal(change_request=req3, user=student3, day=(now + timedelta(days=13)).date(), time_slot=time_slot_objects[3])
        session.add_all([prop3_teach, prop3_stud, prop3_stud2])

        req4 = ChangeRequest(course_event=event4, initiator=teacher1, status=ChangeRequestStatus.ACCEPTED, reason="Poprzednio zaakceptowane", created_at=now - timedelta(days=5))
        session.add(req4)

        session.commit()
        print("DB has been populated with a rich set of mock data.")

    except Exception as e:
        session.rollback()
        print(f"An error occurred during data population: {e}")
        raise
    finally:
        session.close()