import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIncidents, getIncidentMetrics, resolveIncident } from '../api/incidents';
import { updatePassword } from '../api/auth';
import Alert from '../components/Alert';

export default function DashboardPage() {
  const { user, token } = useAuth();

  // Metrics & Incidents state
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'metrics', 'profile'
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Resolving modal state
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(30);
  const [savingResolution, setSavingResolution] = useState(false);

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setActionError('');
    try {
      const [metricsData, incidentsData] = await Promise.all([
        getIncidentMetrics(token),
        getIncidents(token, { status: statusFilter }),
      ]);
      setMetrics(metricsData);
      setIncidents(incidentsData);
    } catch (err) {
      setActionError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, statusFilter]);

  // Open resolve modal
  const startResolve = (incident) => {
    setResolvingTicket(incident);
    setResolutionNotes('');
    setTimeSpent(30);
    setActionError('');
    setActionSuccess('');
  };

  // Submit resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    if (!resolutionNotes.trim()) {
      setActionError('Please provide notes explaining how the issue was resolved.');
      return;
    }

    setSavingResolution(true);
    setActionError('');
    try {
      const updated = await resolveIncident(
        resolvingTicket.id,
        {
          resolution_notes: resolutionNotes,
          time_spent_minutes: Number(timeSpent),
        },
        token
      );
      setActionSuccess(
        `Ticket ${updated.ticket_number} resolved! Algorithmic savings calculated: $${updated.estimated_cost_saved.toLocaleString()}`
      );
      setResolvingTicket(null);
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to resolve incident.');
    } finally {
      setSavingResolution(false);
    }
  };

  // Submit password update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setUpdatingPw(true);
    try {
      const res = await updatePassword(currentPassword, newPassword, token);
      setPwSuccess(res.message || 'Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPw(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">IT Management & Value Center</h1>
          <p className="dashboard-subtitle">
            Incident queue, resolution logs, and algorithmic ROI metrics for executive leadership.
          </p>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="dashboard-tab-nav">
          <button
            className={`dash-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Incident Queue ({incidents.filter((i) => i.status === 'Open').length} Open)
          </button>
          <button
            className={`dash-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            ROI & Business Metrics
          </button>
          <button
            className={`dash-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Account Settings
          </button>
        </div>
      </div>

      <Alert type="error" message={actionError} />
      <Alert type="success" message={actionSuccess} />

      {/* METRICS SUMMARY STATS BAR */}
      {metrics && (
        <div className="metrics-banner-grid">
          <div className="metric-box">
            <span className="metric-box-title">Total Hours Invested</span>
            <span className="metric-box-value">{metrics.total_hours_invested}h</span>
            <span className="metric-box-sub">{metrics.resolved_incidents} issues resolved</span>
          </div>

          <div className="metric-box metric-accent">
            <span className="metric-box-title">Est. Business Value Saved</span>
            <span className="metric-box-value">
              ${metrics.total_financial_value_saved.toLocaleString()}
            </span>
            <span className="metric-box-sub">Downtime & vendor costs averted</span>
          </div>

          <div className="metric-box">
            <span className="metric-box-title">Critical Outages Averted</span>
            <span className="metric-box-value highlight-red">{metrics.critical_averted}</span>
            <span className="metric-box-sub">Severe halts resolved</span>
          </div>

          <div className="metric-box">
            <span className="metric-box-title">Avg. Resolution Time</span>
            <span className="metric-box-value">{metrics.avg_resolution_time_minutes} min</span>
            <span className="metric-box-sub">Mean Time to Resolution (MTTR)</span>
          </div>
        </div>
      )}

      {/* TAB 1: INCIDENT QUEUE */}
      {activeTab === 'queue' && (
        <div className="queue-section">
          <div className="queue-controls-row">
            <div className="filter-group">
              <label>Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Incidents</option>
                <option value="Open">Open Only</option>
                <option value="Resolved">Resolved Only</option>
              </select>
            </div>
            <button className="nav-btn" onClick={fetchData}>
              Refresh Queue
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading incident logs...</div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">No incidents found in this filter view.</div>
          ) : (
            <div className="incidents-table-wrapper">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Reporter & Dept</th>
                    <th>Issue Summary</th>
                    <th>Urgency / Impact</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className={inc.work_stopped ? 'row-work-stopped' : ''}>
                      <td>
                        <strong>{inc.ticket_number}</strong>
                        <div className="table-timestamp">
                          {new Date(inc.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="table-reporter">{inc.reporter_name}</div>
                        <span className="table-dept">{inc.department}</span>
                      </td>
                      <td>
                        <div className="table-title">{inc.title}</div>
                        <div className="table-desc">{inc.description}</div>
                      </td>
                      <td>
                        <span className={`urgency-tag urgency-${inc.urgency.toLowerCase()}`}>
                          {inc.urgency}
                        </span>
                        <div className="table-scope">{inc.impact_scope}</div>
                        {inc.work_stopped && (
                          <span className="stopped-pill">Work Halted</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-pill status-${inc.status.toLowerCase().replace(' ', '-')}`}
                        >
                          {inc.status}
                        </span>
                        {inc.time_spent_minutes && (
                          <div className="table-spent">{inc.time_spent_minutes}m logged</div>
                        )}
                      </td>
                      <td>
                        {inc.status !== 'Resolved' ? (
                          <button
                            type="button"
                            className="btn-resolve"
                            onClick={() => startResolve(inc)}
                          >
                            Resolve Issue
                          </button>
                        ) : (
                          <div className="resolved-cell">
                            <span className="saved-val">
                              +${inc.estimated_cost_saved?.toLocaleString()} saved
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROI & BUSINESS METRICS FOR MANAGEMENT */}
      {activeTab === 'metrics' && metrics && (
        <div className="metrics-management-view">
          <div className="metrics-card">
            <h2 className="card-title" style={{ textAlign: 'left' }}>
              Department Dependency & Value Generated
            </h2>
            <p className="card-subtitle" style={{ textAlign: 'left' }}>
              Shows leadership exactly how many hours your father invested per department and the
              operational financial loss prevented.
            </p>

            <div className="incidents-table-wrapper">
              <table className="incidents-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Tickets Handled</th>
                    <th>Hours Invested</th>
                    <th>Calculated Value Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.department_breakdown.map((d) => (
                    <tr key={d.department}>
                      <td>
                        <strong>{d.department}</strong>
                      </td>
                      <td>{d.ticket_count}</td>
                      <td>{d.hours_invested} hrs</td>
                      <td style={{ color: '#4ade80', fontWeight: '600' }}>
                        ${d.estimated_savings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="metrics-card">
            <h2 className="card-title" style={{ textAlign: 'left' }}>
              Issue Categories Breakdown
            </h2>
            <div className="category-tags-grid">
              {Object.entries(metrics.category_breakdown).map(([cat, count]) => (
                <div key={cat} className="category-box">
                  <span className="category-name">{cat}</span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNT & PASSWORD SETTINGS */}
      {activeTab === 'profile' && (
        <div className="profile-tab-grid">
          <div className="auth-card">
            <h2 className="card-title">Account Details</h2>
            <div className="profile-details">
              <div className="profile-row">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{user?.email}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Role:</span>
                <span className="status-badge">System Administrator / IT Lead</span>
              </div>
            </div>
          </div>

          <div className="auth-card">
            <h2 className="card-title">Update Password</h2>
            <Alert type="error" message={pwError} />
            <Alert type="success" message={pwSuccess} />

            <form onSubmit={handleUpdatePassword} className="auth-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={updatingPw}>
                {updatingPw ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL FOR DAD */}
      {resolvingTicket && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Resolve Incident: {resolvingTicket.ticket_number}</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setResolvingTicket(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-info-box">
              <div>
                <strong>Issue:</strong> {resolvingTicket.title}
              </div>
              <div>
                <strong>Department:</strong> {resolvingTicket.department}
              </div>
              <div>
                <strong>Scope:</strong> {resolvingTicket.impact_scope}
                {resolvingTicket.work_stopped ? ' (Work was halted)' : ''}
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="timeSpent">Time Spent (Minutes) *</label>
                <input
                  id="timeSpent"
                  type="number"
                  min="5"
                  max="1440"
                  required
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                />
                <span className="label-hint">
                  How long did it take you to troubleshoot and fix?
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="resolutionNotes">Resolution Actions Taken *</label>
                <textarea
                  id="resolutionNotes"
                  rows={4}
                  required
                  className="form-textarea"
                  placeholder="e.g. Cleared network switch ARP cache, replaced degraded CAT6 patch cable, and verified connectivity on workstations."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => setResolvingTicket(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingResolution}
                >
                  {savingResolution ? 'Computing Value & Saving...' : 'Complete & Calculate Value'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
