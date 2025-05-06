from datetime import datetime

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from model import UserRole

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


class DateInterval(BaseModel):
    start_month: int
    end_month: int
    start_day: int
    end_day: int


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

# Proposal
class AvailabilityInterval(BaseModel):
    available_start_datetime: datetime
    available_end_datetime: datetime

class ProposalCreate(BaseModel):
    change_request_id: int
    user_id: int
    intervals: List[AvailabilityInterval]

class ProposalUpdate(BaseModel):
    user_id: int
    accepted_interval: AvailabilityInterval | None