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

        # Find or create IT Manager 'Ehsan Afridi'
        manager = (
            db.query(User)
            .filter(
                (User.username == "Ehsan Afridi")
                | (User.email == "ehsan.afridi@company.com")
            )
            .first()
        )

        if manager:
            manager.username = "Ehsan Afridi"
            manager.email = manager.email or "ehsan.afridi@company.com"
            manager.hashed_password = hash_password("ek@afridi")
            manager.is_admin = True
            manager.is_active = True
            logger.info("Updated IT Manager (Ehsan Afridi) credentials and admin role.")
        else:
            manager = User(
                username="Ehsan Afridi",
                email="ehsan.afridi@company.com",
                hashed_password=hash_password("ek@afridi"),
                is_admin=True,
                is_active=True,
            )
            db.add(manager)
            logger.info("Created IT Manager (Ehsan Afridi) user.")

        db.commit()

        # Ensure any non-Ehsan Afridi users do not have admin access
        db.query(User).filter(User.username != "Ehsan Afridi").update(
            {"is_admin": False}, synchronize_session=False
        )
        db.commit()
    except Exception as e:
        logger.error(f"Error initializing or migrating database: {e}")
        db.rollback()
    finally:
        db.close()
