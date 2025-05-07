from datetime import datetime

from pydantic import BaseModel, EmailStr
from typing import Optional
from model import UserRole
from model import ChangeRequestStatus


class DateInterval(BaseModel):
    start_date: datetime
    end_date: datetime

# User
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    group_id: Optional[int] = None

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Room
class RoomCreate(BaseModel):
    name: str
    group_id: int
    year: int | None

class RoomAddUnavailability(BaseModel):
    room_id: int
    start_datetime: datetime
    end_datetime: datetime

class CourseEventOut(BaseModel):
    id: int
    course_id: int
    room_id: int
    start_datetime: datetime
    end_datetime: datetime
    canceled: bool

# Group
class GroupCreate(BaseModel):
    name: str
    year: int | None
    leader_id: int

class GroupUpdate(BaseModel):
    name: str | None
    year: int | None
    leader_id: int | None

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
    created_at: datetime | None

# Proposal
class ProposalCreate(BaseModel):
    change_request_id: int
    user_id: int
    interval: DateInterval

class ProposalUpdate(BaseModel):
    user_id: int
    interval: DateInterval