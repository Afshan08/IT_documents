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

  // If dad logs in, navigate directly to dashboard
  useEffect(() => {
    if (!loading && user && (currentView === 'login' || currentView === 'signup')) {
      setCurrentView('dashboard');
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
          user ? <DashboardPage /> : <LoginPage setCurrentView={setCurrentView} />
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
