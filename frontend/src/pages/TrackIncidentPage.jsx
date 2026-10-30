import React, { useState, useEffect } from 'react';
import { trackIncident } from '../api/incidents';
import Alert from '../components/Alert';

export default function TrackIncidentPage({ initialTicket = '', onReportNew }) {
  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTicket) {
      handleSearch(initialTicket);
    }
  }, [initialTicket]);

  const handleSearch = async (ticketToSearch) => {
    const query = (ticketToSearch || ticketInput).trim();
    if (!query) {
      setError('Please enter a ticket number.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await trackIncident(query);
      setTicketData(data);
    } catch (err) {
      setError(err.message || 'Ticket not found. Please verify the ticket number.');
      setTicketData(null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="auth-card" style={{ maxWidth: '650px' }}>
      <h2 className="card-title">Track Ticket Status</h2>
      <p className="card-subtitle">Check the progress or resolution of your reported issue</p>

      <form onSubmit={onSubmit} className="search-form">
        <input
          type="text"
          placeholder="e.g. INC-202610-58392"
          value={ticketInput}
          onChange={(e) => setTicketInput(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Track'}
        </button>
      </form>

      <Alert type="error" message={error} />

      {ticketData && (
        <div className="ticket-result-card">
          <div className="ticket-header-row">
            <div>
              <span className="ticket-number-badge">{ticketData.ticket_number}</span>
              <h3 className="ticket-result-title">{ticketData.title}</h3>
            </div>
            <span
              className={`status-pill status-${ticketData.status.toLowerCase().replace(' ', '-')}`}
            >
              {ticketData.status}
            </span>
          </div>

          <div className="ticket-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Department</span>
              <span className="meta-val">{ticketData.department}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Category</span>
              <span className="meta-val">{ticketData.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Urgency</span>
              <span className={`urgency-tag urgency-${ticketData.urgency.toLowerCase()}`}>
                {ticketData.urgency}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Reported On</span>
              <span className="meta-val">
                {new Date(ticketData.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {ticketData.description && ticketData.description !== ticketData.title && (
            <div className="ticket-desc-box">
              <strong>Description:</strong>
              <p>{ticketData.description}</p>
            </div>
          )}

          {ticketData.status === 'In Progress' && (
            <div className="in-progress-notice-box">
              <div className="in-progress-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong>Under Active Investigation</strong>
              </div>
              <p>IT Support has acknowledged your ticket and is actively working on resolving the issue.</p>
            </div>
          )}

          {ticketData.status === 'Resolved' && (
            <div className="resolution-box">
              <div className="resolution-header">
                <span className="badge-resolved">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: '-1px', marginRight: '4px' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Resolved by IT
                </span>
                {ticketData.resolved_at && (
                  <span className="resolved-time">
                    {new Date(ticketData.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="resolution-text">
                <strong>Resolution Details: </strong>
                {ticketData.resolution_notes || 'Issue resolved.'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="card-footer" style={{ marginTop: '1.5rem' }}>
        <span>Have a new issue to log? </span>
        <button type="button" className="text-link-accent" onClick={onReportNew}>
          Report an Incident
        </button>
      </div>
    </div>
  );
}
