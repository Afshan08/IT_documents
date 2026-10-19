import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView('dashboard');
      } else if (currentView === 'dashboard') {
        setCurrentView('login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="content-container">
        {currentView === 'login' && <LoginPage setCurrentView={setCurrentView} />}
        {currentView === 'signup' && <SignupPage setCurrentView={setCurrentView} />}
        {currentView === 'forgot-password' && (
          <ForgotPasswordPage setCurrentView={setCurrentView} />
        )}
        {currentView === 'dashboard' && <DashboardPage />}
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
