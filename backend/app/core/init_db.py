import logging
from sqlalchemy import inspect, text
from app.database import Base, SessionLocal, engine
from app.models.user import User
from app.core.security import hash_password

logger = logging.getLogger(__name__)


def init_db():
    """Initializes tables, migrates schema if needed, and seeds the IT Manager."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if 'username' column exists on 'users' table
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "username" not in columns:
            logger.info("Adding 'username' column to 'users' table...")
            db.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR"))
            db.commit()

        # Check if 'reporter_username' column exists on 'incidents' table
        incident_columns = [col["name"] for col in inspector.get_columns("incidents")]
        if "reporter_username" not in incident_columns:
            logger.info("Adding 'reporter_username' column to 'incidents' table...")
            db.execute(text("ALTER TABLE incidents ADD COLUMN reporter_username VARCHAR"))
            db.commit()

        # Seed / Update default IT Managers (Admin users)
        admin_users = [
            {
                "username": "Ehsan Afridi",
                "email": "ehsan.afridi@company.com",
                "password": "ek@afridi",
            },
            {
                "username": "Farhan",
                "email": "farhan@company.com",
                "password": "farhan@pgc",
            },
        ]

        admin_usernames = [u["username"] for u in admin_users]

        for admin_info in admin_users:
            admin = (
                db.query(User)
                .filter(
                    (User.username == admin_info["username"])
                    | (User.email == admin_info["email"])
                )
                .first()
            )

            if admin:
                admin.username = admin_info["username"]
                admin.email = admin.email or admin_info["email"]
                admin.hashed_password = hash_password(admin_info["password"])
                admin.is_admin = True
                admin.is_active = True
                logger.info(f"Updated IT Manager ({admin_info['username']}) credentials and admin role.")
            else:
                admin = User(
                    username=admin_info["username"],
                    email=admin_info["email"],
                    hashed_password=hash_password(admin_info["password"]),
                    is_admin=True,
                    is_active=True,
                )
                db.add(admin)
                logger.info(f"Created IT Manager ({admin_info['username']}) user.")

        db.commit()

        # Ensure any users not in admin list do not have admin access
        db.query(User).filter(~User.username.in_(admin_usernames)).update(
            {"is_admin": False}, synchronize_session=False
        )
        db.commit()
    except Exception as e:
        logger.error(f"Error initializing or migrating database: {e}")
        db.rollback()
    finally:
        db.close()
