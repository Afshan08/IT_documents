import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from './DashboardContext';
import Navbar from '../components/Navbar';
import QueuePage from './QueuePage';
import MetricsPage from './MetricsPage';
import FormulaPage from './FormulaPage';
import ProfilePage from './ProfilePage';
import HistoryPage from './HistoryPage';

export default function Dashboard() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <div className="admin-dashboard-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/queue" replace />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/formula" element={<FormulaPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </DashboardProvider>
  );
}
