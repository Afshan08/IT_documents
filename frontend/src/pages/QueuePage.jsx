import React, { useContext, useEffect } from 'react';
import { DashboardContext } from './DashboardContext';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

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

export default function QueuePage() {
  const {
    incidents,
    statusFilter,
    setStatusFilter,
    loading,
    actionError,
    actionSuccess,
    fetchData,
    startResolve,
    handleMarkInProgress,
    handleToggleTechnique,
    handleResolveSubmit,
    selectedTechniques,
    resolutionNotes,
    setResolutionNotes,
    timeSpent,
    setTimeSpent,
    savingResolution,
    resolvingTicket,
    setResolvingTicket,
    sortTicketsByPriority,
  } = useContext(DashboardContext);

  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchData(token);
  }, [token, statusFilter]);

  return (
    <>
      <Alert type="error" message={actionError} />
      <Alert type="success" message={actionSuccess} />
      <div className="queue-section">
        <div className="queue-controls-row">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="Open">Open Only</option>
              <option value="">All Incidents</option>
              <option value="In Progress">In Progress Only</option>
              <option value="Resolved">Resolved Only</option>
            </select>
          </div>
          <button className="nav-btn" onClick={() => fetchData(token)}>
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
                  <th>Reporter &amp; Dept</th>
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
                      <div className="table-timestamp">{new Date(inc.created_at).toLocaleDateString()}</div>
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
                      <span className={`urgency-tag urgency-${inc.urgency.toLowerCase()}`}>{inc.urgency}</span>
                      <div className="table-scope">{inc.impact_scope}</div>
                      {inc.work_stopped && <span className="stopped-pill">Work Halted</span>}
                    </td>
                    <td>
                      <span className={`status-pill status-${inc.status.toLowerCase().replace(' ', '-')}`}>{inc.status}</span>
                      {inc.time_spent_minutes && (
                        <div className="table-spent">{inc.time_spent_minutes}m logged</div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {inc.status === 'Open' && (
                          <button type="button" className="btn-in-progress" onClick={() => handleMarkInProgress(inc.id, token)}>
                            Start Working
                          </button>
                        )}
                        {inc.status !== 'Resolved' ? (
                          <button type="button" className="btn-resolve" onClick={() => startResolve(inc)}>
                            Resolve Issue
                          </button>
                        ) : (
                          <div className="resolved-cell">
                            <span className="saved-val">+${inc.estimated_cost_saved?.toLocaleString()} saved</span>
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

      {/* RESOLUTION MODAL */}
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

            <form onSubmit={(e) => handleResolveSubmit(e, token)} className="auth-form">
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
    </>
  );
}
