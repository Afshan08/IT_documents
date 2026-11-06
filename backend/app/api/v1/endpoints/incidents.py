from datetime import datetime
import secrets
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks, status
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_optional_current_user
from app.database import get_db
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import (
    DepartmentMetric,
    IncidentCreate,
    IncidentMetricsResponse,
    IncidentResolve,
    IncidentResponse,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


def generate_ticket_number() -> str:
    """Generates an official formatted ticket number (e.g. INC-202610-58392)."""
    date_code = datetime.utcnow().strftime("%Y%m")
    unique_num = secrets.randbelow(90000) + 10000
    return f"INC-{date_code}-{unique_num}"


def calculate_estimated_savings(
    impact_scope: str,
    work_stopped: bool,
    time_spent_minutes: int,
    custom_cost_saved: Optional[float] = None,
) -> float:
    """
    Algorithmic calculation of business value and operational downtime prevented:
    
    1. Labor Productivity Preserved:
       - 1 Person: 1 employee
       - 2-5 People: 3.5 employees
       - Department (5-20): 12 employees
       - Entire Company: 40 employees
       - Baseline average hourly wage: $35/hr
       - Work stoppage multiplier: 1.0 (complete halt) vs 0.35 (slowed down)
    
    2. Emergency Third-Party IT Contractor Cost Avoided:
       - Standard outsourced on-site emergency rate: $125/hr
    """
    if custom_cost_saved is not None and custom_cost_saved >= 0:
        return round(custom_cost_saved, 2)

    scope_multipliers = {
        "1 Person": 1.0,
        "2-5 People": 3.5,
        "Department (5-20)": 12.0,
        "Entire Company": 40.0,
    }
    employees_affected = scope_multipliers.get(impact_scope, 1.0)
    stoppage_factor = 1.0 if work_stopped else 0.35
    hourly_wage = 35.0
    external_vendor_rate = 125.0

    hours_invested = max(time_spent_minutes, 10) / 60.0
    # Business downtime prevented is typically at least 1.5x resolution duration plus recovery
    downtime_hours_prevented = hours_invested * 1.5

    productivity_saved = employees_affected * hourly_wage * stoppage_factor * downtime_hours_prevented
    vendor_cost_avoided = hours_invested * external_vendor_rate

    total_value = productivity_saved + vendor_cost_avoided
    return round(total_value, 2)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def report_incident(
    data: IncidentCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Public endpoint: Allows signed-in and non-signed-in (guest) employees to submit an IT incident.
    Generates an official tracking ticket number.
    """
    # Ensure ticket number uniqueness
    ticket_number = generate_ticket_number()
    while db.query(Incident).filter(Incident.ticket_number == ticket_number).first():
        ticket_number = generate_ticket_number()

    incident = Incident(
        ticket_number=ticket_number,
        user_id=current_user.id if current_user else None,
        reporter_name=data.reporter_name.strip(),
        reporter_email=data.reporter_email.strip().lower(),
        department=data.department.strip(),
        title=data.title.strip(),
        category=data.category,
        urgency=data.urgency,
        impact_scope=data.impact_scope,
        work_stopped=data.work_stopped,
        description=(data.description or data.title).strip(),
        status="Open",
        # Capture client IP and duplicate username for audit
        reporter_ip=request.client.host if request.client else None,
        reporter_username=data.reporter_name.strip(),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    return incident


@router.get("/track/{ticket_number}", response_model=IncidentResponse)
def track_incident(ticket_number: str, db: Session = Depends(get_db)):
    """Public lookup: Allows any employee to inspect the status of their reported ticket."""
    incident = db.query(Incident).filter(Incident.ticket_number == ticket_number.strip().upper()).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_number}' not found",
        )
    return incident


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    department_filter: Optional[str] = Query(None, alias="department"),
    urgency_filter: Optional[str] = Query(None, alias="urgency"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: Retrieve all logged incidents with optional status/urgency filtering."""
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if department_filter:
        query = query.filter(Incident.department == department_filter)
    if urgency_filter:
        query = query.filter(Incident.urgency == urgency_filter)

    # Priority hierarchy:
    # 1. Work halted (work_stopped = True first)
    # 2. Number of people affected (Entire Company > Department > 2-5 People > 1 Person)
    # 3. Urgency / priority (Critical > High > Medium > Low)
    # 4. Tiebreaker: Created timestamp (newest first)
    scope_priority = case(
        (Incident.impact_scope == "Entire Company", 4),
        (Incident.impact_scope == "Department (5-20)", 3),
        (Incident.impact_scope == "2-5 People", 2),
        (Incident.impact_scope == "1 Person", 1),
        else_=0,
    )

    urgency_priority = case(
        (Incident.urgency == "Critical", 4),
        (Incident.urgency == "High", 3),
        (Incident.urgency == "Medium", 2),
        (Incident.urgency == "Low", 1),
        else_=0,
    )

    return query.order_by(
        desc(Incident.work_stopped),
        desc(scope_priority),
        desc(urgency_priority),
        desc(Incident.created_at),
    ).all()


@router.patch("/{incident_id}/resolve", response_model=IncidentResponse)
def resolve_incident(
    incident_id: int,
    resolution_data: IncidentResolve,
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin-only: Dad fills out the resolution notes and time spent.
    Runs the algorithmic formula to calculate business value and dollars saved.
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    # Calculate estimated value/savings through our algorithm
    savings = calculate_estimated_savings(
        impact_scope=incident.impact_scope,
        work_stopped=incident.work_stopped,
        time_spent_minutes=resolution_data.time_spent_minutes,
        custom_cost_saved=resolution_data.custom_cost_saved,
    )

    incident.status = "Resolved"
    incident.resolution_notes = resolution_data.resolution_notes.strip()
    incident.time_spent_minutes = resolution_data.time_spent_minutes
    incident.estimated_cost_saved = savings
    incident.resolved_by_id = current_admin.id
    incident.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(incident)
    return incident


@router.patch("/{incident_id}/in-progress", response_model=IncidentResponse)
def mark_in_progress(
    incident_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: Mark an incident as In Progress so the reporting employee knows it is being addressed."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    incident.status = "In Progress"
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/stats/metrics", response_model=IncidentMetricsResponse)
def get_incident_metrics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Admin-only: Algorithmic aggregation of business value, total hours saved,
    financial impact, and department breakdowns for presentation to executive leadership.
    """
    incidents = db.query(Incident).all()

    total_incidents = len(incidents)
    open_incidents = sum(1 for i in incidents if i.status in ("Open", "In Progress"))
    resolved_incidents = sum(1 for i in incidents if i.status in ("Resolved", "Closed"))
    critical_averted = sum(1 for i in incidents if i.urgency == "Critical" or i.work_stopped)

    total_minutes = sum(i.time_spent_minutes or 0 for i in incidents if i.status == "Resolved")
    total_hours_invested = round(total_minutes / 60.0, 1)

    total_savings = sum(i.estimated_cost_saved or 0.0 for i in incidents if i.status == "Resolved")

    resolved_items_with_time = [i for i in incidents if i.time_spent_minutes and i.status == "Resolved"]
    avg_resolution = (
        round(total_minutes / len(resolved_items_with_time), 1)
        if resolved_items_with_time
        else 0.0
    )

    # Department breakdown
    dept_map: Dict[str, Dict[str, float]] = {}
    cat_map: Dict[str, int] = {}

    for inc in incidents:
        # Categories
        cat_map[inc.category] = cat_map.get(inc.category, 0) + 1

        # Departments
        dept = inc.department
        if dept not in dept_map:
            dept_map[dept] = {"count": 0, "hours": 0.0, "savings": 0.0}
        dept_map[dept]["count"] += 1
        if inc.time_spent_minutes:
            dept_map[dept]["hours"] += inc.time_spent_minutes / 60.0
        if inc.estimated_cost_saved:
            dept_map[dept]["savings"] += inc.estimated_cost_saved

    department_breakdown = [
        DepartmentMetric(
            department=dept,
            ticket_count=int(data["count"]),
            hours_invested=round(data["hours"], 1),
            estimated_savings=round(data["savings"], 2),
        )
        for dept, data in sorted(dept_map.items(), key=lambda x: x[1]["count"], reverse=True)
    ]

    return IncidentMetricsResponse(
        total_incidents=total_incidents,
        open_incidents=open_incidents,
        resolved_incidents=resolved_incidents,
        critical_averted=critical_averted,
        total_hours_invested=total_hours_invested,
        total_financial_value_saved=round(total_savings, 2),
        avg_resolution_time_minutes=avg_resolution,
        department_breakdown=department_breakdown,
        category_breakdown=cat_map,
    )
