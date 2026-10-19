# Full-Stack Starter Template (FastAPI + React Vite + PostgreSQL)

A clean, modular starting point configured with **FastAPI**, **React (Vite)**, and **PostgreSQL**, fully orchestrated with **Docker Compose**. Includes complete authentication (Signup, Login, Forgot Password, Reset Password, and Update Password) following security best practices.

---

## Directory Structure

```text
c:\IT_documentation\
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Dependency injection (get_current_user, get_db)
│   │   │   └── v1/
│   │   │       ├── api.py            # API v1 aggregator
│   │   │       └── endpoints/
│   │   │           └── auth.py       # Signup, Login, Forgot & Update Password
│   │   ├── core/
│   │   │   └── security.py           # Bcrypt password hashing & JWT token creation
│   │   ├── models/
│   │   │   └── user.py               # SQLAlchemy User database model
│   │   ├── schemas/
│   │   │   └── user.py               # Pydantic schemas (UserCreate, Token, etc.)
│   │   ├── database.py               # Database engine & sessionmaker
│   │   └── main.py                   # FastAPI app with CORS & lifespan DB init
│   ├── .env.example                  # Backend environment variables
│   ├── Dockerfile                    # Python 3.11-slim container
│   └── requirements.txt              # Backend dependencies (fastapi, bcrypt, pyjwt, sqlalchemy)
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── auth.js               # API service functions
│   │   ├── components/
│   │   │   ├── Alert.jsx             # Status alert messages
│   │   │   └── Navbar.jsx            # Dynamic navigation bar
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth state & user session provider
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx     # User profile & Update Password form
│   │   │   ├── ForgotPasswordPage.jsx# Token request & Reset Password forms
│   │   │   ├── LoginPage.jsx         # Sign in form
│   │   │   └── SignupPage.jsx        # Registration form
│   │   ├── App.jsx                   # Main view router
│   │   ├── index.css                 # Dark-mode styling
│   │   └── main.jsx                  # React DOM entrypoint
│   ├── .env.example                  # Frontend environment variables
│   ├── Dockerfile                    # Multi-stage build (Node build + Nginx serve)
│   ├── index.html                    # Vite HTML template
│   ├── nginx.conf                    # Nginx routing configuration
│   ├── package.json                  # Dependencies (React 18 + Vite)
│   └── vite.config.js                # Vite configuration
├── .env.example                      # Root environment variables
├── .gitignore                        # Git ignore rules
├── docker-compose.yml                # Multi-container orchestration (backend, frontend, db)
└── README.md
```

---

## Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Registers new user and returns JWT token | No |
| `POST` | `/api/v1/auth/login` | Authenticates email/password and returns JWT token | No |
| `GET` | `/api/v1/auth/me` | Returns current user profile | **Yes (Bearer JWT)** |
| `POST` | `/api/v1/auth/forgot-password` | Generates a 15-minute secure password reset token | No |
| `POST` | `/api/v1/auth/reset-password` | Resets password using valid reset token | No |
| `POST` | `/api/v1/auth/update-password` | Updates password for authenticated user | **Yes (Bearer JWT)** |

---

## Running with Docker Compose

1. **Start all services**:
   ```bash
   docker compose up --build
   ```

2. **Access services**:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database**: `localhost:5432` (`postgres:postgres@localhost:5432/app_db`)

---

## Running Locally Without Docker

### 1. Database (PostgreSQL)
Start a local PostgreSQL database or run via Docker:
```bash
docker run --name local_postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app_db -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # On Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).
