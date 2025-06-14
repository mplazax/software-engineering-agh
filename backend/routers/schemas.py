from datetime import date, datetime

from model import ChangeRequestStatus, RoomType, UserRole
from pydantic import BaseModel, EmailStr
from pydantic.v1 import validator


# User
class UserResponse(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    role: UserRole

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    name: str
    surname: str
    email: EmailStr
    password: str
    role: UserRole

    @validator("password")
    def check_password(cls, value):
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None


# Room
class RoomCreate(BaseModel):
    name: str
    capacity: int
    type: RoomType
    equipment: str | None

    @validator("capacity")
    def capacity_must_be_positive(cls, value):
        if value <= 0:
            raise ValueError("Capacity must be greater than zero")
        return value


class RoomUpdate(BaseModel):
    capacity: int | None
    type: RoomType | None
    equipment: str | None

    @validator("capacity")
    def check_capacity(cls, value):
        if value <= 0:
            raise ValueError("Capacity must be greater than zero")


class RoomResponse(BaseModel):
    id: int
    name: str
    capacity: int
    type: RoomType
    equipment: str | None = None

    class Config:
        orm_mode = True


# Group
class GroupCreate(BaseModel):
    name: str
    year: int | None
    leader_id: int

    @validator("year")
    def valid_study_year(cls, value):
        if value is None:
            return value
        if 0 <= value <= 6:
            return value
        raise ValueError("Year must be between 1 and 6")


class GroupResponse(BaseModel):
    id: int
    name: str
    year: int
    leader_id: int

    class Config:
        orm_mode = True


class GroupUpdate(BaseModel):
    name: str | None
    year: int | None
    leader_id: int | None

    @validator("year")
    def valid_study_year(cls, value):
        if value is None:
            return value
        if 0 <= value <= 6:
            return value
        raise ValueError("Year must be between 1 and 6")


# Change requests
class ChangeRequestCreate(BaseModel):
    course_event_id: int
    initiator_id: int  # should be assigned automatically
    status: ChangeRequestStatus
    reason: str
    room_requirements: str
    room_capacity: int
    created_at: datetime


class ChangeRequestUpdate(BaseModel):
    change_request_id: int
    course_event_id: int
    initiator_id: int
    status: ChangeRequestStatus | None
    reason: str | None
    room_requirements: str | None
    room_capacity: int
    created_at: datetime


class ChangeRequestResponse(BaseModel):
    id: int
    course_event_id: int
    initiator_id: int
    status: ChangeRequestStatus
    reason: str
    room_requirements: str
    room_capacity: int
    created_at: datetime

    class Config:
        orm_mode = True


# Proposal
class ProposalCreate(BaseModel):
    change_request_id: int
    user_id: int
    day: date
    time_slot_id: int


class ProposalUpdate(BaseModel):
    user_id: int
    day: date
    time_slot_id: int


class ProposalResponse(BaseModel):
    id: int
    change_request_id: int
    accepted_by_leader: bool
    accepted_by_representative: bool
    user_id: int
    day: date
    time_slot_id: int

    class Config:
        orm_mode = True


class CourseCreate(BaseModel):
    name: str
    teacher_id: int
    group_id: int


class CourseResponse(CourseCreate):
    id: int

    class Config:
        orm_mode = True


class CourseEventCreate(BaseModel):
    course_id: int
    room_id: int
    day: date
    time_slot_id: int
    canceled: bool = False


class CourseEventUpdate(BaseModel):
    room_id: int
    day: date
    time_slot_id: int
    canceled: bool = False


class CourseEventResponse(CourseEventCreate):
    id: int

    class Config:
        orm_mode = True

class AvailabilityProposalResponse(BaseModel):
    id: int
    user_id: int
    day: date
    time_slot_id: int

    class Config:
        orm_mode = True

class ChangeRecomendationResponse(BaseModel):
    id: int
    change_request_id: int
    recommended_day: date
    recommended_slot_id: int
    recommended_room_id: int
    source_proposal: AvailabilityProposalResponse | None = None

    class Config:
        orm_mode = True


class RoomUnavailabilityCreate(BaseModel):
    room_id: int
    start_datetime: date
    end_datetime: date


class RoomUnavailabilityUpdate(BaseModel):
    start_datetime: date
    end_datetime: date


class RoomUnavailabilityResponse(BaseModel):
    id: int
    room_id: int
    start_datetime: date
    end_datetime: date

    class Config:
        orm_mode = True

class EquipmentBase(BaseModel):
    name: str

class EquipmentCreate(EquipmentBase):
    name: str

class EquipmentResponse(EquipmentBase):
    id: int
    name: str

    class Config:
        orm_mode = True