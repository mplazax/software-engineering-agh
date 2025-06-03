import enum

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
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    KOORDYNATOR = "KOORDYNATOR"
    PROWADZACY = "PROWADZACY"
    STAROSTA = "STAROSTA"


class ChangeRequestStatus(enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class RoomType(enum.Enum):
    LECTURE_HALL = "LECTURE_HALL"
    LABORATORY = "LABORATORY"
    SEMINAR_ROOM = "SEMINAR_ROOM"
    CONFERENCE_ROOM = "CONFERENCE_ROOM"
    OTHER = "OTHER"


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    year = Column(Integer, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    leader = relationship("User", foreign_keys=[leader_id])
    courses = relationship(
        "Course", back_populates="group", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(150), nullable=False)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)

    group = relationship(
        "Group", foreign_keys="Group.leader_id", back_populates="leader", uselist=False
    )
    leads_group = relationship(
        "Group", foreign_keys="Group.leader_id", back_populates="leader", uselist=False
    )
    initiated_requests = relationship("ChangeRequest", back_populates="initiator")
    availability_proposals = relationship("AvailabilityProposal", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=True)
    equipment = Column(Text, nullable=True)
    type = Column(Enum(RoomType), nullable=True)

    course_events = relationship("CourseEvent", back_populates="room")
    unavailability = relationship(
        "RoomUnavailability", back_populates="room", cascade="all, delete-orphan"
    )


class RoomUnavailability(Base):
    __tablename__ = "room_unavailability"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_datetime = Column(Date, nullable=False)
    end_datetime = Column(Date, nullable=False)

    room = relationship("Room", back_populates="unavailability")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    group = relationship("Group", back_populates="courses")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="courses")
    events = relationship(
        "CourseEvent", back_populates="course", cascade="all, delete-orphan"
    )


class TimeSlots(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    course_events = relationship(
        "CourseEvent", back_populates="slot_id", cascade="all, delete-orphan"
    )
    availability_proposals = relationship(
        "AvailabilityProposal", back_populates="time_slot", cascade="all, delete-orphan"
    )
    change_recommendations = relationship(
        "ChangeRecomendation", back_populates="recommended_interval"
    )


class CourseEvent(Base):
    __tablename__ = "course_events"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    day = Column(Date, nullable=False)
    canceled = Column(Boolean, default=False)

    course = relationship("Course", back_populates="events")
    room = relationship("Room", back_populates="course_events")
    slot_id = relationship("TimeSlots", back_populates="course_events")
    change_requests = relationship(
        "ChangeRequest", back_populates="course_event", cascade="all, delete-orphan"
    )


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True)
    course_event_id = Column(Integer, ForeignKey("course_events.id"), nullable=False)
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(
        Enum(ChangeRequestStatus),
        nullable=False,
        default=ChangeRequestStatus.PENDING.value,
    )
    reason = Column(Text, nullable=False)
    room_requirements = Column(Text, default=False)
    created_at = Column(DateTime, nullable=False)

    course_event = relationship("CourseEvent", back_populates="change_requests")
    initiator = relationship("User", back_populates="initiated_requests")
    availability_proposals = relationship(
        "AvailabilityProposal",
        back_populates="change_request",
        cascade="all, delete-orphan",
    )
    change_to_recommendation = relationship(
        "ChangeRecomendation",
        back_populates="change_request",
        cascade="all, delete-orphan",
    )


class AvailabilityProposal(Base):
    __tablename__ = "availability_proposals"

    id = Column(Integer, primary_key=True)
    change_request_id = Column(
        Integer, ForeignKey("change_requests.id"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day = Column(Date, nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)

    change_request = relationship(
        "ChangeRequest", back_populates="availability_proposals"
    )
    time_slot = relationship("TimeSlots", back_populates="availability_proposals")
    user = relationship("User", back_populates="availability_proposals")


class ChangeRecomendation(Base):
    __tablename__ = "change_recommendations"

    id = Column(Integer, primary_key=True)
    change_request_id = Column(
        Integer, ForeignKey("change_requests.id"), nullable=False
    )
    recommended_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    recommended_day = Column(Date, nullable=False)
    recommended_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    recommended_room = relationship("Room")
    recommended_interval = relationship(
        "TimeSlots", back_populates="change_recommendations"
    )
    change_request = relationship(
        "ChangeRequest", back_populates="change_to_recommendation"
    )
