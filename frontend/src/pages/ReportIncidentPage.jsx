import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createIncident } from '../api/incidents';
import Alert from '../components/Alert';

const DEPARTMENTS = [
  'Finance',
  'Marketing',
  'Sales',
  'Others',
];

const CATEGORIES = [
  'Network / Internet Outage',
  'Hardware / Computer Failure',
  'Software / ERP / System Bug',
  'Printers & Scanners',
  'Email & Login / Account Access',
  'Security & Antivirus Alert',
  'Other IT Issue',
];

const URGENCIES = [
  { value: 'Low', label: 'Low', desc: 'Minor issue / Question', color: '#64748b' },
  { value: 'Medium', label: 'Medium', desc: 'Work affected with workaround', color: '#eab308' },
  { value: 'High', label: 'High', desc: 'Critical task blocked', color: '#f97316' },
  { value: 'Critical', label: 'Critical', desc: 'Total work stoppage', color: '#ef4444' },
];

const IMPACT_SCOPES = [
  { value: '1 Person', label: 'Just Me (1)' },
  { value: '2-5 People', label: 'Small Team (2-5)' },
  { value: 'Department (5-20)', label: 'Department (5-20)' },
  { value: 'Entire Company', label: 'Entire Company' },
];

export default function ReportIncidentPage({ onTrackTicket }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    reporter_name: '',
    reporter_email: '',
    department: '',
    title: '',
    category: CATEGORIES[0],
    urgency: 'Medium',
    impact_scope: '1 Person',
    work_stopped: false,
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        reporter_name: prev.reporter_name || user.email.split('@')[0],
        reporter_email: prev.reporter_email || user.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.department) {
      setError('Please select your department.');
      return;
    }

    if (formData.title.trim().length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createIncident(formData, token);
      setSubmittedTicket(result);
    } catch (err) {
      setError(err.message || 'Failed to submit incident report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (submittedTicket?.ticket_number) {
      navigator.clipboard.writeText(submittedTicket.ticket_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setFormData({
      reporter_name: user ? user.email.split('@')[0] : '',
      reporter_email: user ? user.email : '',
      department: '',
      title: '',
      category: CATEGORIES[0],
      urgency: 'Medium',
      impact_scope: '1 Person',
      work_stopped: false,
      description: '',
    });
  };

  if (submittedTicket) {
    return (
      <div className="auth-page-container">
        <div className="auth-card success-card">
          <div className="success-badge-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="card-title">Incident Successfully Logged</h2>
          <p className="card-subtitle">
            Your request has been officially queued in the IT system.
          </p>

          <div className="ticket-box">
            <span className="ticket-label">Official Tracking Number</span>
            <div className="ticket-number-display">
              <strong>{submittedTicket.ticket_number}</strong>
              <button type="button" className="copy-btn" onClick={copyTicket}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="ticket-hint">
              Save this number to check your resolution status or reference it with IT.
            </p>
          </div>

          <div className="submission-summary">
            <div className="summary-row">
              <span>Issue:</span>
              <strong>{submittedTicket.title}</strong>
            </div>
            <div className="summary-row">
              <span>Department:</span>
              <span>{submittedTicket.department}</span>
            </div>
            <div className="summary-row">
              <span>Priority:</span>
              <span className={`urgency-tag urgency-${submittedTicket.urgency.toLowerCase()}`}>
                {submittedTicket.urgency}
              </span>
            </div>
            <div className="summary-row">
              <span>Status:</span>
              <span className="status-badge">{submittedTicket.status}</span>
            </div>
          </div>

          <div className="btn-group-row">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (onTrackTicket) {
                  onTrackTicket(submittedTicket.ticket_number);
                } else {
                  navigate('/track');
                }
              }}
            >
              Track Status
            </button>
            <button type="button" className="nav-btn" onClick={resetForm}>
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page-container">
      <div className="form-page-container">
        <div className="form-header-banner">
          <h1 className="main-title">IT Incident & Support Request</h1>
          <p className="main-subtitle">
            Report technical issues, system outages, or equipment problems. All requests are
            formally tracked and addressed by IT support.
          </p>
        </div>

      <div className="incident-form-card">
        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Reporter Information */}
          <div className="form-section-title">1. Reporter Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="reporter_name">Your Full Name *</label>
              <input
                id="reporter_name"
                name="reporter_name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={formData.reporter_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reporter_email">Work Email *</label>
              <input
                id="reporter_email"
                name="reporter_email"
                type="email"
                required
                placeholder="name@company.com"
                value={formData.reporter_email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="department">Department / Team *</label>
            <select
              id="department"
              name="department"
              required
              className="form-select"
              value={formData.department}
              onChange={handleChange}
            >
              <option value="">Select your department...</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Details */}
          <div className="form-section-title">2. Issue Details</div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="impact_scope">Who is affected? *</label>
              <select
                id="impact_scope"
                name="impact_scope"
                className="form-select"
                value={formData.impact_scope}
                onChange={handleChange}
              >
                {IMPACT_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Issue Summary *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g., Main accounting printer offline / Cannot connect to file server"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          {/* Urgency & Business Impact */}
          <div className="form-section-title">3. Business Urgency & Impact</div>

          <div className="form-group">
            <label>Urgency Level *</label>
            <div className="urgency-selector-grid">
              {URGENCIES.map((u) => (
                <label
                  key={u.value}
                  className={`urgency-card ${formData.urgency === u.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={u.value}
                    checked={formData.urgency === u.value}
                    onChange={handleChange}
                  />
                  <div className="urgency-card-content">
                    <span className="urgency-title" style={{ color: u.color }}>
                      {u.label}
                    </span>
                    <span className="urgency-desc">{u.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Work Stoppage Checkbox */}
          <div className="checkbox-container">
            <input
              id="work_stopped"
              name="work_stopped"
              type="checkbox"
              checked={formData.work_stopped}
              onChange={handleChange}
            />
            <label htmlFor="work_stopped" className="checkbox-label">
              <strong>Work is completely halted</strong>
              <span>Check this if employees cannot perform essential duties until this is resolved.</span>
            </label>
          </div>

          <button type="submit" className="btn-primary submit-btn" disabled={submitting}>
            {submitting ? 'Submitting Official Ticket...' : 'Submit Incident Report'}
          </button>
        </form>
      </div>
    </div>
  </div>
);
}
