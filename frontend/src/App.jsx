import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ReportIncidentPage from './pages/ReportIncidentPage';
import TrackIncidentPage from './pages/TrackIncidentPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('report-incident');
  const [ticketToTrack, setTicketToTrack] = useState('');

  // Route to dashboard only if authenticated as IT Manager; otherwise route to report-incident
  useEffect(() => {
    if (!loading && user && (currentView === 'login' || currentView === 'signup')) {
      if (user.is_admin) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('report-incident');
      }
    }
  }, [user, loading]);

  const handleTrackTicket = (ticketNumber) => {
    setTicketToTrack(ticketNumber);
    setCurrentView('track-incident');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading IT Center...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="content-container">
        {currentView === 'report-incident' && (
          <ReportIncidentPage onTrackTicket={handleTrackTicket} />
        )}
        {currentView === 'track-incident' && (
          <TrackIncidentPage
            initialTicket={ticketToTrack}
            onReportNew={() => setCurrentView('report-incident')}
          />
        )}
        {currentView === 'dashboard' && (
          user ? (
            user.is_admin ? (
              <DashboardPage />
            ) : (
              <div className="auth-card text-center" style={{ textAlign: 'center' }}>
                <div style={{ margin: '0 auto 1rem', display: 'flex', justifyContent: 'center' }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h2 className="card-title">Restricted Access</h2>
                <p className="card-subtitle">
                  The IT Admin Dashboard is strictly reserved for the IT Manager (Ehsan Afridi). Standard user accounts cannot view this page.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentView('report-incident')}
                >
                  Return to Incident Portal
                </button>
              </div>
            )
          ) : (
            <LoginPage setCurrentView={setCurrentView} />
          )
        )}
        {currentView === 'login' && <LoginPage setCurrentView={setCurrentView} />}
        {currentView === 'signup' && <SignupPage setCurrentView={setCurrentView} />}
        {currentView === 'forgot-password' && (
          <ForgotPasswordPage setCurrentView={setCurrentView} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
