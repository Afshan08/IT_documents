import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from './DashboardContext';
import QueuePage from './QueuePage';
import MetricsPage from './MetricsPage';
import FormulaPage from './FormulaPage';
import ProfilePage from './ProfilePage';
import HistoryPage from './HistoryPage';
import IncidentDetailPage from './IncidentDetailPage';

export default function Dashboard() {
  return (
    <DashboardProvider>
      <div className="admin-dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">IT Management &amp; Value Center</h1>
            <p className="dashboard-subtitle">
              Incident queue, resolution logs, and algorithmic ROI metrics for executive leadership.
            </p>
          </div>
        </div>

        <Routes>
          <Route index element={<Navigate to="queue" replace />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="queue/:id" element={<IncidentDetailPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="formula" element={<FormulaPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<HistoryPage />} />
        </Routes>
      </div>
    </DashboardProvider>
  );
}
