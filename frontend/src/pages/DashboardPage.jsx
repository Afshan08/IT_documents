import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getIncidents,
  getIncidentMetrics,
  resolveIncident,
  markIncidentInProgress,
} from '../api/incidents';
import { updatePassword } from '../api/auth';
import Alert from '../components/Alert';

const SCOPE_PRIORITY = {
  'Entire Company': 4,
  'Department (5-20)': 3,
  '2-5 People': 2,
  '1 Person': 1,
};

const URGENCY_PRIORITY = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
  Normal: 1,
};

const COMMON_RESOLUTION_TECHNIQUES = [
  'Instructed user to reboot / restart system',
  'Cleared browser cache, cookies & temp system files',
  'Reset user account password / unlocked domain access',
  'Reconnected network cable / renewed DHCP IP configuration',
  'Restarted local print spooler service & cleared queue',
  'Updated / reinstalled necessary drivers or software',
  'Reconnected VPN gateway / verified network credentials',
  'Resolved physical cabling / peripheral disconnection',
];

function sortTicketsByPriority(tickets) {
  return [...tickets].sort((a, b) => {
    // 1. Work halted is highest priority (comes first)
    if (Boolean(a.work_stopped) !== Boolean(b.work_stopped)) {
      return a.work_stopped ? -1 : 1;
    }

    // 2. Number of people affected (Entire Company > Department > 2-5 People > 1 Person)
    const scopeA = SCOPE_PRIORITY[a.impact_scope] || 0;
    const scopeB = SCOPE_PRIORITY[b.impact_scope] || 0;
    if (scopeA !== scopeB) {
      return scopeB - scopeA;
    }

    // 3. Urgency / priority level (Critical > High > Medium > Low)
    const urgA = URGENCY_PRIORITY[a.urgency] || 0;
    const urgB = URGENCY_PRIORITY[b.urgency] || 0;
    if (urgA !== urgB) {
      return urgB - urgA;
    }

    // 4. Tiebreaker: Most recent timestamp first
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

export default function DashboardPage() {
  const { user, token } = useAuth();

  // Metrics & Incidents state
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'metrics', 'formula', 'profile'
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Resolving modal state
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [selectedTechniques, setSelectedTechniques] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(30);
  const [savingResolution, setSavingResolution] = useState(false);

  // Live Formula Simulator state
  const [calcScope, setCalcScope] = useState('Department (5-20)');
  const [calcStopped, setCalcStopped] = useState(true);
  const [calcMinutes, setCalcMinutes] = useState(45);

  const calculatePreview = () => {
    const scopeMultipliers = {
      '1 Person': 1.0,
      '2-5 People': 3.5,
      'Department (5-20)': 12.0,
      'Entire Company': 40.0,
    };
    const affected = scopeMultipliers[calcScope] || 1.0;
    const stoppageFactor = calcStopped ? 1.0 : 0.35;
    const hours = Math.max(calcMinutes, 10) / 60.0;
    const downtimeHours = hours * 1.5;
    const laborSaved = affected * 35.0 * stoppageFactor * downtimeHours;
    const vendorSaved = hours * 125.0;
    return {
      laborSaved: Math.round(laborSaved * 100) / 100,
      vendorSaved: Math.round(vendorSaved * 100) / 100,
      total: Math.round((laborSaved + vendorSaved) * 100) / 100,
    };
  };

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
      setIncidents(sortTicketsByPriority(incidentsData));
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
    setSelectedTechniques([]);
    setResolutionNotes('');
    setTimeSpent(30);
    setActionError('');
    setActionSuccess('');
  };

  // Toggle common resolution technique checkbox
  const handleToggleTechnique = (tech) => {
    setSelectedTechniques((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Mark incident as In Progress
  const handleMarkInProgress = async (incidentId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await markIncidentInProgress(incidentId, token);
      setActionSuccess('Incident status updated to "In Progress". The reporting employee now sees it is being addressed.');
      await fetchData();
    } catch (err) {
      setActionError(err.message || 'Failed to update ticket status to In Progress.');
    }
  };

  // Submit resolution
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    const parts = [
      ...selectedTechniques.map((t) => `• ${t}`),
      resolutionNotes.trim(),
    ].filter(Boolean);

    if (parts.length === 0) {
      setActionError('Please select at least one resolution technique or provide notes explaining the fix.');
      return;
    }

    const finalNotes = parts.join('\n\n');

    setSavingResolution(true);
    setActionError('');
    try {
      const updated = await resolveIncident(
        resolvingTicket.id,
        {
          resolution_notes: finalNotes,
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
            Incident Queue ({incidents.filter((i) => i.status === 'Open' || i.status === 'In Progress').length} Active)
          </button>
          <button
            className={`dash-tab ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            ROI & Business Metrics
          </button>
          <button
            className={`dash-tab ${activeTab === 'formula' ? 'active' : ''}`}
            onClick={() => setActiveTab('formula')}
          >
            ROI Formula & Methodology
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
                <option value="In Progress">In Progress Only</option>
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
                  {sortTicketsByPriority(incidents).map((inc) => (
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
                        {inc.description && inc.description !== inc.title && (
                          <div className="table-desc">{inc.description}</div>
                        )}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {inc.status === 'Open' && (
                            <button
                              type="button"
                              className="btn-in-progress"
                              onClick={() => handleMarkInProgress(inc.id)}
                            >
                              Start Working
                            </button>
                          )}
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
                        </div>
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
              Shows leadership exactly how many hours the IT Manager invested per department and the
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

      {/* TAB 3: ROI FORMULA & VALUE CALCULATION EXPLANATION (EXCLUSIVE TO IT MANAGER) */}
      {activeTab === 'formula' && (
        <div className="metrics-management-view">
          <div className="metrics-card">
            <h2 className="card-title" style={{ textAlign: 'left' }}>
              ROI Value Calculation Formula & Methodology
            </h2>
            <p className="card-subtitle" style={{ textAlign: 'left' }}>
              Confidential to IT Management. This breakdown details the algorithmic methodology quantifying downtime prevented, productivity preserved, and emergency vendor avoidance.
            </p>

            <div className="formula-explanation-grid">
              <div className="formula-box">
                <h3 className="formula-box-title">The Algorithmic Formula</h3>
                <div className="formula-code-display">
                  Total Financial Value Saved = Labor Productivity Preserved + Emergency Contractor Rate Avoided
                </div>

                <div className="formula-step-box">
                  <strong>1. Labor Productivity Preserved:</strong>
                  <p>
                    <code>Employees Affected Multiplier &times; Corporate Wage ($35.00/hr) &times; Work Stoppage Factor &times; Downtime Hours Prevented</code>
                  </p>
                  <span className="formula-note">
                    Downtime prevented is calculated at 1.5&times; the resolution duration to account for diagnostic triage, workflow context switching, and systemic ramp-up.
                  </span>
                </div>

                <div className="formula-step-box">
                  <strong>2. Emergency Contractor Cost Avoidance:</strong>
                  <p>
                    <code>Hours Invested &times; Emergency Dispatch Contractor Rate ($125.00/hr)</code>
                  </p>
                  <span className="formula-note">
                    Represents the market billing rate avoided by having an in-house IT manager resolve the incident without hiring outsourced emergency technicians.
                  </span>
                </div>
              </div>

              <div className="formula-box">
                <h3 className="formula-box-title">Multipliers & Benchmark Variables</h3>
                <table className="incidents-table" style={{ marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Factor</th>
                      <th>Level / Condition</th>
                      <th>Multiplier / Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowSpan="4">Impact Scope</td>
                      <td>1 Person</td>
                      <td>1.0&times; (1 employee)</td>
                    </tr>
                    <tr>
                      <td>2–5 People</td>
                      <td>3.5&times; (small team)</td>
                    </tr>
                    <tr>
                      <td>Department (5–20)</td>
                      <td>12.0&times; (entire department)</td>
                    </tr>
                    <tr>
                      <td>Entire Company</td>
                      <td>40.0&times; (organization)</td>
                    </tr>
                    <tr>
                      <td rowSpan="2">Work Stoppage</td>
                      <td>Complete Halt</td>
                      <td>1.0&times; (100% productivity loss)</td>
                    </tr>
                    <tr>
                      <td>Degraded / Workaround</td>
                      <td>0.35&times; (35% partial slowdown)</td>
                    </tr>
                    <tr>
                      <td>Staff Wage</td>
                      <td>Corporate Benchmark</td>
                      <td>$35.00 / hour</td>
                    </tr>
                    <tr>
                      <td>Outsourced IT</td>
                      <td>Emergency Dispatch Rate</td>
                      <td>$125.00 / hour</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Time Tracking Explanation */}
            <div className="time-tracking-card" style={{ marginTop: '1.5rem' }}>
              <h3 className="formula-box-title">How Resolution Time is Tracked & Calculated</h3>
              <div className="time-tracking-grid">
                <div className="time-item">
                  <span className="time-label">Active Labor Time</span>
                  <p>The exact time (in minutes) you log when completing a ticket. Directly drives both productivity preserved and the contractor avoidance calculations.</p>
                </div>
                <div className="time-item">
                  <span className="time-label">Elapsed Turnaround (Lifespan)</span>
                  <p>Calculated automatically between ticket submission (<code>created_at</code>) and final fix (<code>resolved_at</code>). Measures end-to-end turnaround time.</p>
                </div>
                <div className="time-item">
                  <span className="time-label">Mean Time to Resolution (MTTR)</span>
                  <p>Aggregated across all resolved tickets and displayed in the ROI banner, demonstrating executive operational responsiveness.</p>
                </div>
              </div>
            </div>

            {/* Live Interactive Simulator */}
            <div className="simulator-card" style={{ marginTop: '1.5rem' }}>
              <h3 className="formula-box-title">Interactive Value Simulator</h3>
              <p className="card-subtitle" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                Adjust the variables below to test real-time algorithmic calculations:
              </p>
              <div className="simulator-controls-grid">
                <div className="form-group">
                  <label>Impact Scope</label>
                  <select
                    className="form-select"
                    value={calcScope}
                    onChange={(e) => setCalcScope(e.target.value)}
                  >
                    <option value="1 Person">1 Person (1.0x)</option>
                    <option value="2-5 People">2-5 People (3.5x)</option>
                    <option value="Department (5-20)">Department (12.0x)</option>
                    <option value="Entire Company">Entire Company (40.0x)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Work Stoppage</label>
                  <select
                    className="form-select"
                    value={calcStopped ? 'yes' : 'no'}
                    onChange={(e) => setCalcStopped(e.target.value === 'yes')}
                  >
                    <option value="yes">Work Halted (1.0x)</option>
                    <option value="no">Partial Slowdown (0.35x)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time Spent: {calcMinutes} min ({Math.round((calcMinutes / 60) * 10) / 10}h)</label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={calcMinutes}
                    onChange={(e) => setCalcMinutes(Number(e.target.value))}
                    style={{ marginTop: '0.4rem', accentColor: '#2563eb' }}
                  />
                </div>
              </div>

              {(() => {
                const preview = calculatePreview();
                return (
                  <div className="simulator-results-banner">
                    <div className="sim-result-box">
                      <span className="sim-label">Productivity Preserved</span>
                      <strong className="sim-val">${preview.laborSaved.toLocaleString()}</strong>
                    </div>
                    <div className="sim-result-box">
                      <span className="sim-label">Contractor Avoided</span>
                      <strong className="sim-val">${preview.vendorSaved.toLocaleString()}</strong>
                    </div>
                    <div className="sim-result-box sim-result-total">
                      <span className="sim-label">Total Value Saved</span>
                      <strong className="sim-val" style={{ color: '#16a34a' }}>
                        ${preview.total.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT & PASSWORD SETTINGS */}
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

      {/* RESOLUTION MODAL FOR IT MANAGER */}
      {resolvingTicket && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Resolve Incident: {resolvingTicket.ticket_number}</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setResolvingTicket(null)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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

              {/* Common Resolution Techniques Checkboxes */}
              <div className="form-group">
                <label>Common Resolution Techniques (Multiple Choice)</label>
                <span className="label-hint">Check any applied solutions to record them automatically without writing:</span>
                <div className="techniques-grid">
                  {COMMON_RESOLUTION_TECHNIQUES.map((tech) => (
                    <label key={tech} className="technique-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedTechniques.includes(tech)}
                        onChange={() => handleToggleTechnique(tech)}
                      />
                      <span>{tech}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="resolutionNotes">Additional Remarks / Custom Details</label>
                <textarea
                  id="resolutionNotes"
                  rows={3}
                  className="form-textarea"
                  placeholder="Optional if checkboxes above are selected, or type custom findings..."
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
