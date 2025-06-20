import enum
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    Table,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    KOORDYNATOR = "KOORDYNATOR"
    PROWADZACY = "PROWADZACY"
    STAROSTA = "STAROSTA"

class ChangeRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class RoomType(str, enum.Enum):
    LECTURE_HALL = "LECTURE_HALL"
    LABORATORY = "LABORATORY"
    SEMINAR_ROOM = "SEMINAR_ROOM"
    CONFERENCE_ROOM = "CONFERENCE_ROOM"
    OTHER = "OTHER"

room_equipment_association = Table(
    "room_equipment_association",
    Base.metadata,
    Column("room_id", Integer, ForeignKey("rooms.id", ondelete="CASCADE"), primary_key=True),
    Column("equipment_id", Integer, ForeignKey("equipment.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    active = Column(Boolean, default=True)
    led_group = relationship("Group", back_populates="leader", uselist=False)
    taught_courses = relationship("Course", back_populates="teacher")
    initiated_requests = relationship("ChangeRequest", back_populates="initiator")
    availability_proposals = relationship("AvailabilityProposal", back_populates="user")

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    year = Column(Integer, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leader = relationship("User", back_populates="led_group")
    courses = relationship("Course", back_populates="group")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    rooms = relationship("Room", secondary=room_equipment_association, back_populates="equipment", cascade="save-update, merge")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    capacity = Column(Integer, nullable=False)
    type = Column(Enum(RoomType), nullable=False)
    equipment = relationship("Equipment", secondary=room_equipment_association, back_populates="rooms")
    course_events = relationship("CourseEvent", back_populates="room")
    unavailability = relationship("RoomUnavailability", back_populates="room", cascade="all, delete-orphan")
    change_recommendations = relationship("ChangeRecomendation", back_populates="recommended_room")

class RoomUnavailability(Base):
    __tablename__ = "room_unavailability"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    reason = Column(Text, nullable=True)
    room = relationship("Room", back_populates="unavailability")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    teacher = relationship("User", back_populates="taught_courses")
    group = relationship("Group", back_populates="courses")
    events = relationship("CourseEvent", back_populates="course", cascade="all, delete-orphan")

class TimeSlots(Base):
    __tablename__ = "time_slots"
    id = Column(Integer, primary_key=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

class CourseEvent(Base):
    __tablename__ = "course_events"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    day = Column(Date, nullable=False)
    canceled = Column(Boolean, default=False)
    was_rescheduled = Column(Boolean, default=False)
    course = relationship("Course", back_populates="events", lazy="joined")
    room = relationship("Room", back_populates="course_events")
    change_requests = relationship("ChangeRequest", back_populates="course_event", cascade="all, delete-orphan")

class ChangeRequest(Base):
    __tablename__ = "change_requests"
    id = Column(Integer, primary_key=True, index=True)
    course_event_id = Column(Integer, ForeignKey("course_events.id"), nullable=False)
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ChangeRequestStatus), nullable=False, default=ChangeRequestStatus.PENDING)
    reason = Column(Text, nullable=False)
    room_requirements = Column(Text, nullable=True)
    minimum_capacity = Column(Integer, default=0)
    cyclical = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    course_event = relationship("CourseEvent", back_populates="change_requests", lazy="joined")
    initiator = relationship("User", back_populates="initiated_requests")
    availability_proposals = relationship("AvailabilityProposal", back_populates="change_request", cascade="all, delete-orphan")
    change_recommendations = relationship("ChangeRecomendation", back_populates="change_request", cascade="all, delete-orphan")

class AvailabilityProposal(Base):
    __tablename__ = "availability_proposals"
    id = Column(Integer, primary_key=True, index=True)
    change_request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    # PONIŻSZE KOLUMNY ZOSTAŁY USUNIĘTE, PONIEWAŻ SĄ JUŻ ZBĘDNE
    # accepted_by_leader = Column(Boolean, default=False)
    # accepted_by_representative = Column(Boolean, default=False)
    change_request = relationship("ChangeRequest", back_populates="availability_proposals")
    user = relationship("User", back_populates="availability_proposals")

class ChangeRecomendation(Base):
    __tablename__ = "change_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    change_request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    recommended_day = Column(Date, nullable=False)
    recommended_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    recommended_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    source_proposal_id = Column(Integer, ForeignKey("availability_proposals.id", ondelete="SET NULL"), nullable=True)
    accepted_by_teacher = Column(Boolean, default=False)
    accepted_by_leader = Column(Boolean, default=False)
    rejected_by_teacher = Column(Boolean, default=False)
    rejected_by_leader = Column(Boolean, default=False)
    recommended_room = relationship("Room", back_populates="change_recommendations", lazy="joined")
    change_request = relationship("ChangeRequest", back_populates="change_recommendations")
    source_proposal = relationship("AvailabilityProposal", lazy="joined")