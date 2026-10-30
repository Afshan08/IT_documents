import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div
          className="brand"
          onClick={() => setCurrentView('report-incident')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="brand-name">IT Support & Value Center</span>
        </div>

        <nav className="nav-links">
          {/* Public links accessible to all employees */}
          <button
            className={`nav-btn ${currentView === 'report-incident' ? 'active' : ''}`}
            onClick={() => setCurrentView('report-incident')}
          >
            Report an Issue
          </button>
          <button
            className={`nav-btn ${currentView === 'track-incident' ? 'active' : ''}`}
            onClick={() => setCurrentView('track-incident')}
          >
            Track Ticket
          </button>

          {/* Admin / Authenticated controls */}
          {user ? (
            <>
              {user.is_admin && (
                <button
                  className={`nav-btn btn-highlight ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  IT Admin Dashboard
                </button>
              )}
              <span className="user-badge">
                {user.username || user.email}
                {user.is_admin ? ' (Manager)' : ''}
              </span>
              <button
                className="nav-btn btn-danger"
                onClick={() => {
                  logout();
                  setCurrentView('report-incident');
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-btn ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
              >
                Staff Login
              </button>
              <button
                className={`nav-btn ${currentView === 'signup' ? 'active' : ''}`}
                onClick={() => setCurrentView('signup')}
              >
                Sign Up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
