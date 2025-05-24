from datetime import datetime

from pydantic import BaseModel, EmailStr
from typing import Optional
from model import UserRole
from model import ChangeRequestStatus
from model import RoomType
from pydantic.v1 import validator, root_validator


class DateInterval(BaseModel):
    start_date: datetime
    end_date: datetime

    @root_validator
    def check_date_order(cls, values):
        start = values.get("start_date")
        end = values.get("end_date")
        if start and end and end <= start:
            raise ValueError("Start date must be before end date")
        return values

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
    group_id: Optional[int] = None

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
    email: Optional[str] = None

# Room
class RoomCreate(BaseModel):
    name: str
    capacity: int
    type: RoomType
    equipment: Optional[str]

    @validator("capacity")
    def capacity_must_be_positive(cls, value):
        if value <= 0:
            raise ValueError("Capacity must be greater than zero")
        return value

class RoomUpdate(BaseModel):
    capacity: Optional[int]
    type: Optional[RoomType]
    equipment: Optional[str]

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

class RoomAddUnavailability(BaseModel):
    room_id: int
    interval: DateInterval

class CourseEventOut(BaseModel):
    id: int
    course_id: int
    room_id: int
    interval: DateInterval
    canceled: bool

# Group
class GroupCreate(BaseModel):
    name: str
    year: int | None
    leader_id: int

    @validator("year")
    def valid_study_year(cls, value):
        if value is None: return value
        if 0 <= value <= 6: return value
        raise ValueError("Year must be between 1 and 6")

class GroupUpdate(BaseModel):
    name: str | None
    year: int | None
    leader_id: int | None

    @validator("year")
    def valid_study_year(cls, value):
        if value is None: return value
        if 0 <= value <= 6: return value
        raise ValueError("Year must be between 1 and 6")

# Change requests
class ChangeRequestCreate(BaseModel):
    course_event_id: int
    initiator_id: int # should be assigned automatically
    status: ChangeRequestStatus
    reason: str
    room_requirements: str
    created_at: datetime

class ChangeRequestUpdate(BaseModel):
    course_event_id: int | None
    initiator_id: int | None
    status: ChangeRequestStatus | None
    reason: str | None
    room_requirements: str | None
    created_at: datetime

# Proposal
class ProposalCreate(BaseModel):
    change_request_id: int
    user_id: int
    interval: DateInterval

class ProposalUpdate(BaseModel):
    user_id: int
    interval: DateInterval

class CourseCreate(BaseModel):
    name: str
    teacher_id: int
    group_id: int

class CourseResponse(CourseCreate):
    id: int

    class Config:
        orm_mode = True

class CourseEventCreate(BaseModel):
    room_id: Optional[int]
    interval: DateInterval
    canceled: Optional[bool] = False

class CourseEventResponse(CourseEventCreate):
    id: int
    course_id: int

    class Config:
        orm_mode = True

class ChangeRecomendationResponse(BaseModel):
    id: int
    change_request_id: int
    interval: DateInterval
    recommended_room_id: int

    class Config:
        orm_mode = True

class RoomUnavailabilityCreate(BaseModel):
    room_id: int
    interval: DateInterval

class RoomUnavailabilityResponse(BaseModel):
    id: int
    room_id: int
    interval: DateInterval

    class Config:
        orm_mode = True