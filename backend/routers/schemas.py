from datetime import date, datetime
from typing import Optional, List, Union

from model import ChangeRequestStatus, RoomType, UserRole
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class OrmBase(BaseModel):
    class Config:
        orm_mode = True
        from_attributes = True

# UserResponse musi być zdefiniowany przed użyciem go w innych schematach
class UserResponse(OrmBase):
    id: int
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    surname: str = Field(..., min_length=2, max_length=100)
    role: UserRole

class EquipmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentResponse(EquipmentBase, OrmBase):
    id: int


class RoomBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    capacity: int = Field(..., gt=0)
    type: RoomType

class RoomCreate(RoomBase):
    equipment_ids: List[int] = []

class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    capacity: Optional[int] = Field(None, gt=0)
    type: Optional[RoomType] = None
    equipment_ids: Optional[List[int]] = None

class RoomResponse(RoomBase, OrmBase):
    id: int
    equipment: List[EquipmentResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    surname: str = Field(..., min_length=2, max_length=100)
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    surname: Optional[str] = Field(None, min_length=2, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[UserRole] = None

class GroupBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    year: Optional[int] = Field(None, ge=1, le=5)
    leader_id: int

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    year: Optional[int] = Field(None, ge=1, le=5)
    leader_id: Optional[int] = None

class GroupResponse(GroupBase, OrmBase):
    id: int
    leader: UserResponse # Dołączamy pełne dane lidera

class CourseBase(BaseModel):
    name: str
    teacher_id: int
    group_id: int

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    teacher_id: Optional[int] = None
    group_id: Optional[int] = None

class CourseResponse(CourseBase, OrmBase):
    id: int
    teacher: UserResponse # Dołączamy pełne dane prowadzącego
    group: GroupResponse # Dołączamy pełne dane grupy (z liderem)

class CourseEventBase(BaseModel):
    course_id: int
    room_id: Optional[int] = None
    day: date
    time_slot_id: int
    canceled: bool = False

class CourseEventCreate(CourseEventBase):
    pass

class CourseEventResponse(CourseEventBase, OrmBase):
    id: int

class CourseEventUpdate(BaseModel):
    room_id: Optional[int] = Field(None, description="ID of the new room for the event")
    day: Optional[date] = Field(None, description="New date for the event")
    time_slot_id: Optional[int] = Field(None, description="ID of the new time slot")
    canceled: Optional[bool] = Field(None, description="Set to true to cancel the event")

class CourseForEventResponse(OrmBase):
    id: int
    name: str

class RoomForEventResponse(OrmBase):
    id: int
    name: str

class CourseEventWithDetailsResponse(CourseEventResponse):
    course: CourseResponse
    room: Optional[RoomForEventResponse]


class ChangeRequestBase(BaseModel):
    reason: str
    room_requirements: Optional[str] = None
    minimum_capacity: int = Field(0, ge=0)

class ChangeRequestCreate(ChangeRequestBase):
    course_event_id: int
    cyclical: bool = False

class ChangeRequestUpdate(BaseModel):
    status: Optional[ChangeRequestStatus] = None

class CourseEventForRequestResponse(OrmBase):
    id: int
    day: date
    course_id: int
    course: CourseResponse # Zagnieżdżamy pełne dane kursu

class ChangeRequestResponse(ChangeRequestBase, OrmBase):
    id: int
    course_event_id: int
    initiator_id: int
    status: ChangeRequestStatus
    created_at: datetime
    course_event: CourseEventForRequestResponse # Zagnieżdżamy dane wydarzenia
    initiator: UserResponse # Dołączamy pełne dane inicjatora

class ProposalBase(BaseModel):
    change_request_id: int
    day: date
    time_slot_id: int

class ProposalCreate(ProposalBase):
    pass

class ProposalResponse(ProposalBase, OrmBase):
    id: int
    user_id: int

class ChangeRecomendationBase(BaseModel):
    change_request_id: int
    recommended_day: date
    recommended_slot_id: int
    recommended_room_id: int
    source_proposal_id: Optional[int] = None
    accepted_by_teacher: bool
    accepted_by_leader: bool
    rejected_by_teacher: bool
    rejected_by_leader: bool


class ChangeRecomendationResponse(BaseModel):
    id: int
    change_request_id: int
    recommended_day: date
    recommended_slot_id: int
    recommended_room_id: int
    source_proposal_id: Optional[int]
    recommended_room: Optional[RoomResponse]
    accepted_by_teacher: bool
    accepted_by_leader: bool
    rejected_by_teacher: bool
    rejected_by_leader: bool

    class Config:
        orm_mode = True
        from_attributes = True

class AvailabilityProposalResponse(BaseModel):
    id: int
    user_id: int
    change_request_id: int
    day: date
    time_slot_id: int

    class Config:
        orm_mode = True
        from_attributes = True

class ProposalCreateResponse(BaseModel):
    type: str  # "proposal" lub "recommendations"
    data: Union[AvailabilityProposalResponse, List[ChangeRecomendationResponse]]


# ... reszta schematów bez zmian
class RoomUnavailabilityBase(BaseModel):
    room_id: int
    start_datetime: datetime
    end_datetime: datetime
    reason: Optional[str] = None

class RoomUnavailabilityCreate(RoomUnavailabilityBase):
    pass

class RoomUnavailabilityUpdate(BaseModel):
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    reason: Optional[str] = None

class RoomUnavailabilityResponse(RoomUnavailabilityBase, OrmBase):
    id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ProposalStatusResponse(BaseModel):
    teacher_has_proposed: bool
    leader_has_proposed: bool