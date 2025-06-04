from datetime import datetime, timedelta

from database import get_db
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from model import Group, User, UserRole
from passlib.context import CryptContext
from routers.schemas import Token, TokenData, UserCreate, UserResponse
from sqlalchemy.orm import Session
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_ENTITY,
)

SECRET_KEY = "secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(prefix="/auth", tags=["authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        plain_password (str): The plain text password to verify
        hashed_password (str): The hashed password to verify against

    Returns:
        bool: True if password matches hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generate a password hash.

    Args:
        password (str): The plain text password to hash

    Returns:
        str: The hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.

    Args:
        data (dict): The data to encode in the token
        expires_delta (timedelta, optional): Token expiration time delta. Defaults to None.

    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the JWT token.

    Args:
        token (str): JWT token from Authorization header
        db (Session): Database session

    Raises:
        HTTPException: If token is invalid or user not found

    Returns:
        User: The authenticated user
    """
    credentials_exception = HTTPException(
        status_code=HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


def role_required(allowed_roles: list[UserRole]) -> callable:
    """
    Dependency to check if user has required role(s).

    Args:
        allowed_roles (list[UserRole]): List of roles that are allowed to access the endpoint

    Returns:
        callable: Dependency function that checks user's role
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> dict:
    """
    OAuth2 compatible token login, get an access token for future requests.

    Args:
        form_data (OAuth2PasswordRequestForm): Form data with username and password
        db (Session): Database session

    Raises:
        HTTPException: If authentication fails

    Returns:
        dict: Access token and token type
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)) -> dict:
    """
    Register a new user.

    Args:
        user (UserCreate): User registration data
        db (Session): Database session

    Raises:
        HTTPException: If email already exists or group is invalid

    Returns:
        dict: Success message
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT, detail="Email already registered"
        )

    hashed_password = get_password_hash(user.password)

    if user.role != UserRole.ADMIN:
        db_group = db.query(Group).filter(Group.id == user.group_id).first()
        if not db_group:
            raise HTTPException(
                status_code=HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Group ID does not exist",
            )

    db_user = User(
        email=user.email,
        password=hashed_password,
        name=user.name,
        surname=user.surname,
        role=user.role,
        group_id=user.group_id if user.role != UserRole.ADMIN else None,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created successfully"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current user information.

    Args:
        current_user (User): The currently authenticated user

    Returns:
        User: The user object of the authenticated user
    """
    return current_user
