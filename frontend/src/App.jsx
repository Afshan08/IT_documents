import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ReportIncidentPage from './pages/ReportIncidentPage';
import TrackIncidentPage from './pages/TrackIncidentPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading IT Center...</p>
      </div>
    );
  }

  const requireAdmin = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    if (!user.is_admin) return <Navigate to="/report" replace />;
    return element;
  };

  const defaultHome = user?.is_admin ? "/dashboard/queue" : "/report";

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to={defaultHome} replace />} />
            <Route path="/report" element={<ReportIncidentPage />} />
            <Route path="/track" element={<TrackIncidentPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dashboard/*" element={requireAdmin(<Dashboard />)} />
            <Route path="*" element={<Navigate to={defaultHome} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
