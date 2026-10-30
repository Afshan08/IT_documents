# IT Support & Value Center (Full-Stack Starter)

A production-ready full-stack platform built with **FastAPI**, **React (Vite)**, and **PostgreSQL**, fully orchestrated via **Docker Compose**.

This application provides a formal **Incident Reporting System** and an **IT Business Value & ROI Metrics Engine** designed to track, document, and quantify daily IT contributions, proving operational downtime prevented and financial savings to company leadership.

---

## 🎯 Purpose & Core Value

In many organizations, IT professionals resolve critical bottlenecks behind the scenes without formal tracking, leading management to undervalue their contributions. This platform solves that problem by:

1. **Requiring Formal Reporting**: Employees and departments report problems through an official incident form.
2. **Measuring Business Impact**: Every ticket captures the department, urgency level, people affected, and whether work was completely halted.
3. **Quantifying ROI & Savings**: When IT resolves an issue and logs time spent, an automated algorithm calculates the exact financial value and employee downtime saved.
4. **Providing Executive Metrics**: Leadership can inspect real-time reports detailing total hours invested, downtime prevented, critical outages averted, and department-by-department reliance.

---

## 📁 Directory Structure

```text
c:\IT_documentation\
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py                  # Dependencies (JWT auth, optional user, admin guard)
│   │   │   └── v1/
│   │   │       ├── api.py               # API v1 router aggregator
│   │   │       └── endpoints/
│   │   │           ├── auth.py          # Signup, Login, Forgot & Update Password
│   │   │           └── incidents.py     # Public Report, Track, Admin Queue, Resolve & ROI Metrics
│   │   ├── core/
│   │   │   └── security.py              # Bcrypt password hashing & JWT token generation
│   │   ├── models/
│   │   │   ├── user.py                  # SQLAlchemy User model (is_admin, password hash)
│   │   │   └── incident.py              # SQLAlchemy Incident model with impact & ROI fields
│   │   ├── schemas/
│   │   │   ├── user.py                  # Pydantic auth schemas (UserCreate, Token, etc.)
│   │   │   └── incident.py              # Pydantic incident & metrics schemas
│   │   ├── database.py                  # Database engine & sessionmaker (SQLAlchemy)
│   │   └── main.py                      # FastAPI entrypoint, CORS & automatic table creation
│   ├── .env.example                     # Backend environment variables
│   ├── Dockerfile                       # Python 3.11-slim container
│   └── requirements.txt                 # Backend dependencies (fastapi, bcrypt, pyjwt, sqlalchemy)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.js                  # Auth API client
│   │   │   └── incidents.js             # Incident reporting, tracking, and metrics API client
│   │   ├── components/
│   │   │   ├── Alert.jsx                # Reusable status banners
│   │   │   └── Navbar.jsx               # Navigation bar with dynamic guest/admin controls
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Auth state provider with localStorage token management
│   │   ├── pages/
│   │   │   ├── ReportIncidentPage.jsx   # Public incident reporting form (guest & signed-in)
│   │   │   ├── TrackIncidentPage.jsx    # Public ticket status tracker
│   │   │   ├── DashboardPage.jsx        # Admin Queue, Resolve Modal, ROI Metrics, & Password Settings
│   │   │   ├── LoginPage.jsx            # Staff sign-in page
│   │   │   ├── SignupPage.jsx           # Staff registration page
│   │   │   └── ForgotPasswordPage.jsx   # 2-step password reset with generated token
│   │   ├── App.jsx                      # View switcher and layout manager
│   │   ├── index.css                    # Modern dark-mode responsive design
│   │   └── main.jsx                     # React entrypoint
│   ├── .env.example                     # Frontend environment variables
│   ├── Dockerfile                       # Multi-stage container (Node build + Nginx serve)
│   ├── index.html                       # Vite HTML root
│   ├── nginx.conf                       # Production Nginx reverse routing
│   ├── package.json                     # Frontend dependencies (React 18 + Vite)
│   └── vite.config.js                   # Vite configuration
├── .env.example                         # Root environment variables for Docker Compose
├── .gitignore                           # Standard Git ignore rules
├── docker-compose.yml                   # Orchestrates backend, frontend, and db services
└── README.md                            # Comprehensive documentation
```

---

## 🧮 ROI & Value Calculation Algorithm

When an incident is resolved in the Admin Dashboard, the backend executes an algorithmic formula to determine the financial value saved:

$$\text{Value Saved} = (\text{Employees Affected} \times \text{Hourly Wage} \times \text{Stoppage Factor} \times \text{Downtime Hours}) + (\text{Time Spent} \times \text{Vendor Rate})$$

### Variables & Multipliers:
1. **Employees Affected Multiplier**:
   - `1 Person`: $1.0\times$
   - `2–5 People`: $3.5\times$
   - `Department (5–20)`: $12.0\times$
   - `Entire Company`: $40.0\times$
2. **Work Stoppage Factor**:
   - `1.0` (100% loss) if work was completely halted.
   - `0.35` (35% slowdown) if work was partially degraded.
3. **Downtime Hours Prevented**:
   - Calculated as $1.5\times$ the resolution duration (including diagnostic time and ramp-up).
4. **Baseline Labor Cost**:
   - Average corporate employee wage rate: **$35/hour**.
5. **Outsourced Emergency IT Contractor Avoidance**:
   - Market rate avoided: **$125/hour**.

---

## 🚀 API Endpoints Overview

### Public Incident & Tracking Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/incidents` | Submit a new IT incident (generates ticket number e.g. `INC-202610-84920`) | **Public** (Guest or Signed-in) |
| `GET` | `/api/v1/incidents/track/{ticket_number}` | Check status and resolution notes of a specific ticket | **Public** |

### Protected IT Admin & Metrics Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/incidents` | Retrieve full incident backlog with status/urgency filters | **Admin Only** |
| `PATCH` | `/api/v1/incidents/{id}/resolve` | Log resolution notes and time spent, triggers ROI algorithm | **Admin Only** |
| `GET` | `/api/v1/incidents/stats/metrics` | Aggregated ROI data (hours, financial savings, department breakdown) | **Admin Only** |

### Authentication & Account Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Register an IT staff / admin user | Public |
| `POST` | `/api/v1/auth/login` | Authenticate with email/password and obtain JWT token | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Authenticated |
| `POST` | `/api/v1/auth/forgot-password` | Generate a 15-minute secure password reset token | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password using a valid reset token | Public |
| `POST` | `/api/v1/auth/update-password` | Update password for current logged-in user | Authenticated |

---

## 💻 Running with Docker Compose (Recommended)

1. **Copy the Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Start All Services**:
   ```bash
   docker compose up --build
   ```

3. **Access Services**:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5432` (`postgres:postgres@localhost:5432/app_db`)

4. **Stop Services**:
   ```bash
   docker compose down
   ```

---

## 🛠️ Running Locally (Zero-Docker / SQLite3)

No Docker or PostgreSQL server required! The application defaults to **SQLite3** for local development.

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*(The backend automatically creates the SQLite `app.db` file and all tables on startup).*

### 2. Start the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📋 End-to-End User Flow

1. **Step 1: Reporting an Incident**:
   - Any employee clicks **"Report an Issue"** on the frontend navigation.
   - They fill in their name, work email, department, issue category, urgency, and whether work has stopped.
   - Upon submission, an official ticket number (e.g. `INC-202610-48291`) is issued.

2. **Step 2: Tracking Status**:
   - The employee clicks **"Track Ticket"** and enters their ticket number to view live progress.

3. **Step 3: IT Resolution & Value Credit**:
   - IT staff logs in via **"Staff Login"** and opens the **IT Admin Dashboard**.
   - Under the **Incident Queue**, they review open tickets and click **"Resolve Issue"**.
   - They input the time invested (e.g. 45 minutes) and resolution details.
   - The system executes the ROI algorithm, saves the estimated financial savings, and marks the ticket resolved.

4. **Step 4: Presenting Value to Management**:
   - The **ROI & Business Metrics** tab displays real-time statistics:
     - Total Hours Invested
     - Total Financial Value Saved ($)
     - Critical Outages Rescued
     - Breakdown of hours and savings across every department (Accounting, Sales, Warehouse, etc.)
