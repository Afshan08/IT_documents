from datetime import datetime, timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    MessageResponse,
    ResetPasswordRequest,
    Token,
    UpdatePasswordRequest,
    UserCreate,
    UserLogin,
    UserOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with secure password hashing."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently logged-in user."""
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token for the given email (valid for 15 minutes)."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    reset_token = None

    if user:
        reset_token = generate_reset_token()
        user.reset_token = reset_token
        user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        logger.info(f"Password reset requested for {user.email}. Token: {reset_token}")

    # Return reset_token so UI / local testing can use it directly without an SMTP server
    return ForgotPasswordResponse(
        message="If this email is registered, a password reset token has been generated.",
        reset_token=reset_token,
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset a user's password using the generated reset token."""
    user = db.query(User).filter(User.email == req.email.lower()).first()

    if (
        not user
        or not user.reset_token
        or user.reset_token != req.token
        or not user.reset_token_expires_at
        or user.reset_token_expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user.hashed_password = hash_password(req.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return MessageResponse(message="Password has been reset successfully. You can now log in.")


@router.post("/update-password", response_model=MessageResponse)
def update_password(
    req: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update password for an authenticated user."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()

    return MessageResponse(message="Password updated successfully.")
