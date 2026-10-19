import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div
          className="brand"
          onClick={() => setCurrentView(user ? 'dashboard' : 'login')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-logo">⚡</span>
          <span className="brand-name">FullStack Auth</span>
        </div>

        <nav className="nav-links">
          {user ? (
            <>
              <span className="user-badge">{user.email}</span>
              <button
                className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button
                className="nav-btn btn-danger"
                onClick={() => {
                  logout();
                  setCurrentView('login');
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
                Log In
              </button>
              <button
                className={`nav-btn ${currentView === 'signup' ? 'active' : ''}`}
                onClick={() => setCurrentView('signup')}
              >
                Sign Up
              </button>
              <button
                className={`nav-btn ${currentView === 'forgot-password' ? 'active' : ''}`}
                onClick={() => setCurrentView('forgot-password')}
              >
                Forgot Password
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
