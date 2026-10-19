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
          <span className="brand-logo">🛡️</span>
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
              <button
                className={`nav-btn btn-highlight ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                IT Admin Dashboard
              </button>
              <span className="user-badge">{user.email}</span>
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
