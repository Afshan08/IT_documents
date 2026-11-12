import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin gets routed to dashboard from the brand logo; others to report page
  const brandDestination = user?.is_admin ? '/dashboard/queue' : '/report';

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to={brandDestination} className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="brand-name">
            {user?.is_admin ? 'IT Management Center' : 'IT Support & Value Center'}
          </span>
        </Link>

        <nav className="nav-links">
          {user?.is_admin ? (
            /* ADMIN NAVBAR: Only admin management tools, strictly no general reporting/tracking links */
            <>
              <Link
                to="/dashboard/queue"
                className={`nav-btn ${isActive('/dashboard/queue') ? 'active' : ''}`}
              >
                Ticket Queue
              </Link>
              <Link
                to="/dashboard/metrics"
                className={`nav-btn ${isActive('/dashboard/metrics') ? 'active' : ''}`}
              >
                ROI Metrics
              </Link>
              <Link
                to="/dashboard/formula"
                className={`nav-btn ${isActive('/dashboard/formula') ? 'active' : ''}`}
              >
                ROI Formula
              </Link>
              <Link
                to="/dashboard/history"
                className={`nav-btn ${isActive('/dashboard/history') ? 'active' : ''}`}
              >
                History
              </Link>
              <Link
                to="/dashboard/profile"
                className={`nav-btn ${isActive('/dashboard/profile') ? 'active' : ''}`}
              >
                Account
              </Link>

              <span className="user-badge admin-badge">
                <span className="badge-dot" />
                {user.username || user.email} (Manager)
              </span>

              <button className="nav-btn btn-danger" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : user ? (
            /* REGULAR EMPLOYEE NAVBAR */
            <>
              <Link to="/report" className={`nav-btn ${isActive('/report') ? 'active' : ''}`}>
                Report an Issue
              </Link>
              <Link to="/track" className={`nav-btn ${isActive('/track') ? 'active' : ''}`}>
                Track Ticket
              </Link>

              <span className="user-badge">
                {user.username || user.email}
              </span>

              <button className="nav-btn btn-danger" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            /* GUEST / PUBLIC NAVBAR */
            <>
              <Link to="/report" className={`nav-btn ${isActive('/report') ? 'active' : ''}`}>
                Report an Issue
              </Link>
              <Link to="/track" className={`nav-btn ${isActive('/track') ? 'active' : ''}`}>
                Track Ticket
              </Link>
              <Link to="/login" className={`nav-btn ${isActive('/login') ? 'active' : ''}`}>
                Staff Login
              </Link>
              <Link to="/signup" className={`nav-btn btn-highlight ${isActive('/signup') ? 'active' : ''}`}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
