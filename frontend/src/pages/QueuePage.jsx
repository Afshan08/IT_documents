import React, { useContext, useEffect } from 'react';
import { DashboardContext } from './DashboardContext';
import Alert from '../components/Alert';
import { COMMON_RESOLUTION_TECHNIQUES } from '../pages/DashboardPage'; // placeholder import if needed

export default function QueuePage() {
  const {
    incidents,
    statusFilter,
    setStatusFilter,
    loading,
    actionError,
    actionSuccess,
    fetchData,
    token,
    startResolve,
    handleMarkInProgress,
    handleToggleTechnique,
    selectedTechniques,
    resolutionNotes,
    setResolutionNotes,
    timeSpent,
    setTimeSpent,
    savingResolution,
    setSavingResolution,
    resolvingTicket,
    setResolvingTicket,
    sortTicketsByPriority,
  } = useContext(DashboardContext);

  // Fetch data when token or filter changes (DashboardContext handles fetchData)
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
                            <span className="saved-val">+{inc.estimated_cost_saved?.toLocaleString()} saved</span>
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
    </>
  );
}
