"""
Authentication router: /api/auth/register, /api/auth/login, /api/auth/me
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import User, get_db
from app.models.schemas import Token, UserLogin, UserOut, UserRegister
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_email,
    get_user_by_username,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> Token:
    # Check username uniqueness
    if await get_user_by_username(db, payload.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    # Check email uniqueness
    if await get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = await create_user(db, payload.username, payload.email, payload.password)
    access_token = create_access_token(user_id=user.id)

    return Token(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Login with email and password",
)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Token:
    user = await authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user_id=user.id)

    return Token(
        access_token=access_token,
        user=UserOut.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserOut:
    return UserOut.model_validate(current_user)


@router.post(
    "/logout",
    response_model=dict,
    summary="Logout (client-side token invalidation)",
)
async def logout(
    _: User = Depends(get_current_user),
) -> dict:
    # JWT is stateless; client must discard the token.
    return {"message": "Logged out successfully"}