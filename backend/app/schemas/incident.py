from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class IncidentCreate(BaseModel):
    reporter_name: str = Field(..., min_length=2, max_length=100, description="Full name of the reporting person")
    reporter_email: EmailStr = Field(..., description="Email address for notifications and tracking")
    department: str = Field(..., min_length=2, max_length=50, description="Department (e.g. Sales, Accounting, Ops)")
    title: str = Field(..., min_length=5, max_length=150, description="Brief summary of the issue")
    category: str = Field(..., description="Category (Hardware, Software, Network, Printers, Email, Security, Other)")
    urgency: str = Field(default="Medium", description="Low, Medium, High, or Critical")
    impact_scope: str = Field(default="1 Person", description="1 Person, 2-5 People, Department (5-20), Entire Company")
    work_stopped: bool = Field(default=False, description="Whether business operations are completely blocked")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed explanation of the issue")


class IncidentResolve(BaseModel):
    resolution_notes: str = Field(..., min_length=5, description="Explanation of what was fixed or investigated")
    time_spent_minutes: int = Field(..., gt=0, le=1440, description="Time spent by IT in minutes")
    custom_cost_saved: Optional[float] = Field(None, ge=0, description="Optional manual override for financial savings")


class IncidentResponse(BaseModel):
    id: int
    ticket_number: str
    user_id: Optional[int] = None
    reporter_name: str
    reporter_email: str
    department: str
    title: str
    category: str
    urgency: str
    impact_scope: str
    work_stopped: bool
    description: str
    status: str
    time_spent_minutes: Optional[int] = None
    estimated_cost_saved: Optional[float] = None
    resolution_notes: Optional[str] = None
    resolved_by_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DepartmentMetric(BaseModel):
    department: str
    ticket_count: int
    hours_invested: float
    estimated_savings: float


class IncidentMetricsResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    resolved_incidents: int
    critical_averted: int
    total_hours_invested: float
    total_financial_value_saved: float
    avg_resolution_time_minutes: float
    department_breakdown: List[DepartmentMetric]
    category_breakdown: Dict[str, int]
