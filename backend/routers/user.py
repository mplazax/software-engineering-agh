
from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from model import User, UserRole
from routers.auth import get_password_hash, role_required
from routers.schemas import UserCreate, UserResponse
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse], status_code=HTTP_200_OK)
async def get_users(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> list[User]:
    """
    Retrieve a paginated list of all users.

    Args:
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 10.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Returns:
        list[User]: List of user objects.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse, status_code=HTTP_200_OK)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> User:
    """
    Retrieve a single user by ID.

    Args:
        user_id (int): ID of the user to retrieve.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If user with the specified ID is not found.

    Returns:
        User: The requested user object.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/create", response_model=UserResponse, status_code=HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> User:
    """
    Create a new user.

    Args:
        user (UserCreate): User data for creation.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If email is already registered.

    Returns:
        User: The newly created user object.
    """
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=HTTP_409_CONFLICT, detail="Email already registered"
        )

    hashed_password = get_password_hash(user.password)

    db_user = User(
        name=user.name,
        surname=user.surname,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.put("/{user_id}", response_model=UserResponse, status_code=HTTP_200_OK)
async def update_user(
    user_id: int,
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> User:
    """
    Update an existing user.

    Args:
        user_id (int): ID of the user to update.
        user (UserCreate): Updated user data.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If user is not found or email is already registered by another user.

    Returns:
        User: The updated user object.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    existing_email = (
        db.query(User).filter(User.email == user.email, User.id != user_id).first()
    )
    if existing_email is not None:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT, detail="Email already registered"
        )

    hashed_password = get_password_hash(user.password)

    db_user.email = user.email
    db_user.password = hashed_password
    db_user.name = user.name
    db_user.surname = user.surname
    db_user.role = user.role
    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/{user_id}", status_code=HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required([UserRole.ADMIN, UserRole.KOORDYNATOR])),
) -> None:
    """
    Delete a user by ID.

    Args:
        user_id (int): ID of the user to delete.
        db (Session): Database session.
        current_user (User): Current authenticated user (must be ADMIN or KOORDYNATOR).

    Raises:
        HTTPException: If user with the specified ID is not found.
    """
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(db_user)
    db.commit()
    return
