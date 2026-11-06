import React, { useContext, useEffect } from 'react';
import { DashboardContext } from './DashboardContext';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function HistoryPage() {
  const {
    incidents,
    loading,
    actionError,
    fetchData,
    sortTicketsByPriority,
  } = useContext(DashboardContext);
  const { token } = useAuth();

  // Fetch all incidents and filter to resolved ones
  useEffect(() => {
    if (token) fetchData(token);
  }, [token]);

  const resolvedIncidents = sortTicketsByPriority(
    incidents.filter((inc) => inc.status === 'Resolved')
  );

  return (
    <>
      <Alert type="error" message={actionError} />

      <div className="queue-section">
        <div className="queue-controls-row">
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0' }}>
            Resolved Incident History
          </h2>
          <button className="nav-btn" onClick={() => fetchData(token)}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading history...</div>
        ) : resolvedIncidents.length === 0 ? (
          <div className="empty-state">No resolved incidents found.</div>
        ) : (
          <div className="incidents-table-wrapper">
            <table className="incidents-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Reporter &amp; Dept</th>
                  <th>Issue Summary</th>
                  <th>Urgency / Impact</th>
                  <th>Time Spent</th>
                  <th>Value Saved</th>
                </tr>
              </thead>
              <tbody>
                {resolvedIncidents.map((inc) => (
                  <tr key={inc.id}>
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
                      {inc.resolution_notes && (
                        <div className="table-desc" style={{ whiteSpace: 'pre-line' }}>
                          {inc.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`urgency-tag urgency-${inc.urgency.toLowerCase()}`}>
                        {inc.urgency}
                      </span>
                      <div className="table-scope">{inc.impact_scope}</div>
                      {inc.work_stopped && <span className="stopped-pill">Work Halted</span>}
                    </td>
                    <td>
                      {inc.time_spent_minutes ? `${inc.time_spent_minutes}m` : '—'}
                    </td>
                    <td>
                      <span className="saved-val">
                        +${inc.estimated_cost_saved?.toLocaleString() || '0'} saved
                      </span>
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
