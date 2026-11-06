import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.startsWith(path);
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/report" className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="brand-name">IT Support &amp; Value Center</span>
        </Link>

        <nav className="nav-links">
          {/* Public links accessible to all employees */}
          <Link to="/report" className={`nav-btn ${isActive('/report') ? 'active' : ''}`}>
            Report an Issue
          </Link>
          <Link to="/track" className={`nav-btn ${isActive('/track') ? 'active' : ''}`}>
            Track Ticket
          </Link>

          {/* Admin / Authenticated controls */}
          {user ? (
            <>
              {user.is_admin && (
                <>
                  <Link
                    to="/dashboard/queue"
                    className={`nav-btn btn-highlight ${isDashboardRoute ? 'active' : ''}`}
                  >
                    IT Admin Dashboard
                  </Link>

                  {/* Dashboard sub-navigation — only show when on a dashboard route */}
                  {isDashboardRoute && (
                    <>
                      <Link
                        to="/dashboard/queue"
                        className={`nav-btn ${isActive('/dashboard/queue') ? 'active' : ''}`}
                      >
                        Queue
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
                        Formula
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
                    </>
                  )}
                </>
              )}
              <span className="user-badge">
                {user.username || user.email}
                {user.is_admin ? ' (Manager)' : ''}
              </span>
              <button
                className="nav-btn btn-danger"
                onClick={() => {
                  logout();
                  navigate('/report');
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`nav-btn ${isActive('/login') ? 'active' : ''}`}>
                Staff Login
              </Link>
              <Link to="/signup" className={`nav-btn ${isActive('/signup') ? 'active' : ''}`}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
