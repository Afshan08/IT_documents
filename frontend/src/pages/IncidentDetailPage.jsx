import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardContext } from './DashboardContext';
import { getIncident, resolveIncident, markIncidentInProgress } from '../api/incidents';
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

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const dashboardCtx = useContext(DashboardContext);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [copied, setCopied] = useState(false);

  // Resolution modal state
  const [isResolving, setIsResolving] = useState(false);
  const [selectedTechniques, setSelectedTechniques] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(30);
  const [savingResolution, setSavingResolution] = useState(false);

  const loadIncident = async () => {
    if (!token || !id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getIncident(id, token);
      setIncident(data);
    } catch (err) {
      setError(err.message || 'Failed to load incident details from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id, token]);

  const handleCopyTicket = () => {
    if (incident?.ticket_number) {
      navigator.clipboard.writeText(incident.ticket_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartWorking = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const updated = await markIncidentInProgress(incident.id, token);
      setIncident(updated);
      setActionSuccess('Incident status updated to "In Progress".');
      if (dashboardCtx?.fetchData) dashboardCtx.fetchData(token);
    } catch (err) {
      setActionError(err.message || 'Failed to update status to In Progress.');
    }
  };

  const handleToggleTechnique = (tech) => {
    setSelectedTechniques((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setSavingResolution(true);
    try {
      const parts = [
        ...selectedTechniques.map((t) => `• ${t}`),
        resolutionNotes.trim(),
      ].filter(Boolean);
      const combinedNotes = parts.join('\n');

      const updated = await resolveIncident(
        incident.id,
        {
          resolution_notes: combinedNotes || 'Resolved by IT administrator.',
          time_spent_minutes: Number(timeSpent),
        },
        token
      );
      setIncident(updated);
      setIsResolving(false);
      setActionSuccess('Incident successfully resolved and business value calculated!');
      if (dashboardCtx?.fetchData) dashboardCtx.fetchData(token);
    } catch (err) {
      setActionError(err.message || 'Failed to resolve incident.');
    } finally {
      setSavingResolution(false);
    }
  };

  if (loading) {
    return (
      <div className="incident-detail-container">
        <div className="empty-state">Loading incident details from database...</div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="incident-detail-container">
        <Alert type="error" message={error || 'Incident record not found in database.'} />
        <button
          type="button"
          className="btn-primary"
          style={{ width: 'fit-content', marginTop: '1rem' }}
          onClick={() => navigate('/dashboard/queue')}
        >
          &larr; Return to Incident Queue
        </button>
      </div>
    );
  }

  return (
    <div className="incident-detail-container">
      {/* Top breadcrumb & back button */}
      <div className="detail-top-nav">
        <button
          type="button"
          className="nav-btn detail-back-btn"
          onClick={() => navigate('/dashboard/queue')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Queue
        </button>
        <span className="detail-breadcrumbs">
          <Link to="/dashboard/queue">Queue</Link> / <span>{incident.ticket_number}</span>
        </span>
      </div>

      <Alert type="error" message={actionError} />
      <Alert type="success" message={actionSuccess} />

      {/* Main Header Card */}
      <div className="detail-header-card">
        <div className="detail-header-left">
          <div className="detail-ticket-row">
            <span className="detail-ticket-number">{incident.ticket_number}</span>
            <button
              type="button"
              className="copy-btn detail-copy-btn"
              onClick={handleCopyTicket}
              title="Copy Ticket Number"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <span className="detail-db-id">Record #{incident.id}</span>
          </div>
          <h2 className="detail-title">{incident.title}</h2>
          <div className="detail-meta-pills">
            <span className={`status-pill status-${incident.status.toLowerCase().replace(' ', '-')}`}>
              {incident.status}
            </span>
            <span className={`urgency-tag urgency-${incident.urgency.toLowerCase()}`}>
              {incident.urgency} Priority
            </span>
            <span className="scope-badge">
              Scope: {incident.impact_scope}
            </span>
            {incident.work_stopped && (
              <span className="stopped-pill detail-halt-pill">
                &#9888; Work Completely Halted
              </span>
            )}
          </div>
        </div>

        <div className="detail-header-actions">
          {incident.status === 'Open' && (
            <button
              type="button"
              className="btn-in-progress detail-action-btn"
              onClick={handleStartWorking}
            >
              Start Working
            </button>
          )}
          {incident.status !== 'Resolved' ? (
            <button
              type="button"
              className="btn-resolve detail-action-btn"
              onClick={() => {
                setSelectedTechniques([]);
                setResolutionNotes('');
                setTimeSpent(30);
                setIsResolving(true);
              }}
            >
              Resolve Ticket
            </button>
          ) : (
            <div className="detail-value-chip">
              <span className="value-chip-label">Business Value Saved</span>
              <strong className="value-chip-amount">
                +${incident.estimated_cost_saved?.toLocaleString()}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column: Full Issue & Reporter Details */}
        <div className="detail-col-main">
          {/* Issue Description Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 className="detail-card-title">Issue Description &amp; Technical Scope</h3>
            </div>
            <div className="detail-card-body">
              <div className="detail-desc-box">
                {incident.description ? (
                  <p className="detail-desc-text">{incident.description}</p>
                ) : (
                  <p className="detail-desc-placeholder">No additional notes provided by reporter.</p>
                )}
              </div>

              <div className="detail-specs-grid">
                <div className="spec-item">
                  <span className="spec-label">Category</span>
                  <strong className="spec-value">{incident.category}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Impact Scope</span>
                  <strong className="spec-value">{incident.impact_scope}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Operational Stoppage</span>
                  <strong className="spec-value">
                    {incident.work_stopped ? 'Yes (Complete Halt)' : 'No (Standard Operation)'}
                  </strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Reported At</span>
                  <span className="spec-value">
                    {new Date(incident.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolution & Value Card */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 className="detail-card-title">Resolution &amp; Financial Impact Log</h3>
              {incident.status === 'Resolved' && (
                <span className="badge-resolved">&#10003; Formally Resolved</span>
              )}
            </div>
            <div className="detail-card-body">
              {incident.status === 'Resolved' ? (
                <div className="detail-resolution-content">
                  <div className="resolution-highlight-banner">
                    <div className="res-highlight-box">
                      <span className="res-hl-label">Calculated Cost Saved</span>
                      <strong className="res-hl-value saved-green">
                        ${incident.estimated_cost_saved?.toLocaleString()}
                      </strong>
                    </div>
                    <div className="res-highlight-box">
                      <span className="res-hl-label">IT Labor Invested</span>
                      <strong className="res-hl-value">
                        {incident.time_spent_minutes} minutes
                      </strong>
                    </div>
                    <div className="res-highlight-box">
                      <span className="res-hl-label">Resolved On</span>
                      <span className="res-hl-date">
                        {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-notes-section">
                    <span className="spec-label">Resolution Actions &amp; Techniques Applied:</span>
                    <div className="detail-notes-box">
                      <pre className="notes-pre">{incident.resolution_notes || 'No remarks logged.'}</pre>
                    </div>
                  </div>

                  {incident.resolver_name && (
                    <div className="resolver-signature">
                      <span>Verified &amp; Resolved by: </span>
                      <strong>{incident.resolver_name}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="resolution-pending-state">
                  <div className="pending-icon">&#9203;</div>
                  <h4>Ticket Under IT Care</h4>
                  <p>
                    {incident.status === 'In Progress'
                      ? 'Investigation is currently underway. Click "Resolve Ticket" when work is complete to log labor time and compute ROI savings.'
                      : 'This incident is in the Open Queue. Click "Start Working" to acknowledge or "Resolve Ticket" once fixed.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Reporter & System Audit Info */}
        <div className="detail-col-side">
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 className="detail-card-title">Reporter Information</h3>
            </div>
            <div className="detail-card-body">
              <div className="reporter-profile-header">
                <div className="reporter-avatar">
                  {incident.reporter_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="reporter-name">{incident.reporter_name}</h4>
                  <span className="reporter-dept-pill">{incident.department}</span>
                </div>
              </div>

              <div className="audit-list">
                <div className="audit-item">
                  <span className="audit-label">Work Email</span>
                  <a href={`mailto:${incident.reporter_email}`} className="audit-value text-link">
                    {incident.reporter_email}
                  </a>
                </div>
                <div className="audit-item">
                  <span className="audit-label">Department</span>
                  <span className="audit-value">{incident.department}</span>
                </div>
                <div className="audit-item">
                  <span className="audit-label">Account Link</span>
                  <span className="audit-value">
                    {incident.user_id ? `User Account #${incident.user_id}` : 'Guest / Direct Report'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System & Audit Telemetry */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 className="detail-card-title">System &amp; Audit Telemetry</h3>
            </div>
            <div className="detail-card-body">
              <div className="audit-list">
                <div className="audit-item">
                  <span className="audit-label">Captured System User</span>
                  <code className="audit-code">{incident.reporter_username || 'N/A'}</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">Client IP Address</span>
                  <code className="audit-code">{incident.reporter_ip || '127.0.0.1 (Local)'}</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">Database Primary Key</span>
                  <code className="audit-code">ID: {incident.id}</code>
                </div>
                <div className="audit-item">
                  <span className="audit-label">Submission Date</span>
                  <span className="audit-value">
                    {new Date(incident.created_at).toLocaleDateString()} at {new Date(incident.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {incident.resolved_at && (
                  <div className="audit-item">
                    <span className="audit-label">Resolution Timestamp</span>
                    <span className="audit-value">
                      {new Date(incident.resolved_at).toLocaleDateString()} at {new Date(incident.resolved_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {isResolving && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Resolve Incident: {incident.ticket_number}</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setIsResolving(false)}
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
                <strong>Issue:</strong> {incident.title}
              </div>
              <div>
                <strong>Department:</strong> {incident.department}
              </div>
              <div>
                <strong>Scope:</strong> {incident.impact_scope}
                {incident.work_stopped ? ' (Work was halted)' : ''}
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="detail-timeSpent">Time Spent (Minutes) *</label>
                <input
                  id="detail-timeSpent"
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
                <span className="label-hint">Check any applied solutions to record them automatically:</span>
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
                <label htmlFor="detail-resolutionNotes">Additional Remarks / Custom Details</label>
                <textarea
                  id="detail-resolutionNotes"
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
                  onClick={() => setIsResolving(false)}
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
