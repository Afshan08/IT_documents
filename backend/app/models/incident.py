from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True, nullable=False)
    
    # Optional link if reporter had an account
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Reporter details
    reporter_name = Column(String, nullable=False)
    reporter_email = Column(String, nullable=False, index=True)
    department = Column(String, nullable=False, index=True)

    # Incident categorization & impact metrics
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    urgency = Column(String, default="Medium", nullable=False)  # Low, Medium, High, Critical
    impact_scope = Column(String, default="1 Person", nullable=False)  # 1 Person, 2-5 People, Department (5-20), Entire Company
    work_stopped = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=False)
    # Auto‑captured system info (not exposed to front‑end)
    reporter_username = Column(String, nullable=True)
    reporter_ip = Column(String, nullable=True)

    # Workflow status
    status = Column(String, default="Open", nullable=False, index=True)  # Open, In Progress, Resolved, Closed

    # Dad's resolution & business value contribution tracking
    time_spent_minutes = Column(Integer, nullable=True)  # Minutes dad spent resolving the issue
    estimated_cost_saved = Column(Float, nullable=True)  # Calculated $ savings based on downtime prevented
    resolution_notes = Column(Text, nullable=True)        # Notes explaining the fix/investigation
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    reporter_user = relationship("User", foreign_keys=[user_id])
    resolver_user = relationship("User", foreign_keys=[resolved_by_id])

    @property
    def resolver_name(self):
        if self.resolver_user:
            return self.resolver_user.username or self.resolver_user.email
        return None
