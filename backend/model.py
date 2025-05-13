from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship, declarative_base
import enum

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
    leader_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    leader = relationship("User", foreign_keys=[leader_id])
    courses = relationship("Course", back_populates="group", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(150), unique=True, nullable=False)
    password = Column(String(150), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    group = relationship("Group", foreign_keys=[group_id])
    leads_group = relationship("Group", foreign_keys='Group.leader_id', back_populates="leader", uselist=False)
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
    unavailability = relationship("RoomUnavailability", back_populates="room", cascade="all, delete-orphan")



class RoomUnavailability(Base):
    __tablename__ = "room_unavailability"

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)

    room = relationship("Room", back_populates="unavailability")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    group = relationship("Group", back_populates="courses")
    teacher = relationship("User", foreign_keys=[teacher_id], backref="courses")
    events = relationship("CourseEvent", back_populates="course", cascade="all, delete-orphan")


class CourseEvent(Base):
    __tablename__ = "course_events"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    canceled = Column(Boolean, default=False)

    course = relationship("Course", back_populates="events")
    room = relationship("Room", back_populates="course_events")
    change_requests = relationship("ChangeRequest", back_populates="course_event", cascade="all, delete-orphan")


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id = Column(Integer, primary_key=True)
    course_event_id = Column(Integer, ForeignKey("course_events.id"), nullable=False)
    initiator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ChangeRequestStatus), nullable=False, default=ChangeRequestStatus.PENDING.value)
    reason = Column(Text, nullable=False)
    room_requirements = Column(Text, default=False)
    created_at = Column(DateTime, nullable=False)

    course_event = relationship("CourseEvent", back_populates="change_requests")
    initiator = relationship("User", back_populates="initiated_requests")
    availability_proposals = relationship("AvailabilityProposal",
                                          back_populates="change_request",
                                          cascade="all, delete-orphan")
    change_to_recommendation = relationship("ChangeRecomendation",
                                            back_populates="change_request",
                                            cascade="all, delete-orphan")


class AvailabilityProposal(Base):
    __tablename__ = "availability_proposals"

    id = Column(Integer, primary_key=True)
    change_request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    available_start_datetime = Column(DateTime, nullable=False)
    available_end_datetime = Column(DateTime, nullable=False)

    change_request = relationship("ChangeRequest", back_populates="availability_proposals")
    user = relationship("User", back_populates="availability_proposals")


class ChangeRecomendation(Base):
    __tablename__ = "change_recommendations"

    id = Column(Integer, primary_key=True)
    change_request_id = Column(Integer, ForeignKey("change_requests.id"), nullable=False)
    recommended_start_datetime = Column(DateTime, nullable=False)
    recommended_end_datetime = Column(DateTime, nullable=False)
    recommended_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    recommended_room = relationship("Room")
    change_request = relationship("ChangeRequest", back_populates="change_to_recommendation")
