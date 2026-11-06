import React, { createContext, useState, useEffect } from 'react';
import { getIncidents, getIncidentMetrics, resolveIncident, markIncidentInProgress } from '../api/incidents';
import { updatePassword } from '../api/auth';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  // Metrics & Incidents state
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Open'); // default open only
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

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [updatingPw, setUpdatingPw] = useState(false);

  // Fetch data
  const fetchData = async (token) => {
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

  // Helpers (same as original file)
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

  function sortTicketsByPriority(tickets) {
    return [...tickets].sort((a, b) => {
      if (Boolean(a.work_stopped) !== Boolean(b.work_stopped)) {
        return a.work_stopped ? -1 : 1;
      }
      const scopeA = SCOPE_PRIORITY[a.impact_scope] || 0;
      const scopeB = SCOPE_PRIORITY[b.impact_scope] || 0;
      if (scopeA !== scopeB) return scopeB - scopeA;
      const urgA = URGENCY_PRIORITY[a.urgency] || 0;
      const urgB = URGENCY_PRIORITY[b.urgency] || 0;
      if (urgA !== urgB) return urgB - urgA;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  // Resolve helpers
  const startResolve = (incident) => {
    setResolvingTicket(incident);
    setSelectedTechniques([]);
    setResolutionNotes('');
    setTimeSpent(30);
    setActionError('');
    setActionSuccess('');
  };

  const handleToggleTechnique = (tech) => {
    setSelectedTechniques((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleMarkInProgress = async (incidentId, token) => {
    setActionError('');
    setActionSuccess('');
    try {
      await markIncidentInProgress(incidentId, token);
      setActionSuccess('Incident status updated to "In Progress".');
      // token will be passed from component that calls this
    } catch (err) {
      setActionError(err.message || 'Failed to update ticket status to In Progress.');
    }
  };

  const handleResolveSubmit = async (e, token) => {
    e.preventDefault();
    if (!resolvingTicket) return;
    const parts = [
      ...selectedTechniques.map((t) => `• ${t}`),
      resolutionNotes.trim(),
    ].filter(Boolean);
    if (parts.length === 0) {
      setActionError('Please select at least one resolution technique or provide notes.');
      return;
    }
    const finalNotes = parts.join('\n\n');
    setSavingResolution(true);
    setActionError('');
    try {
      const updated = await resolveIncident(
        resolvingTicket.id,
        { resolution_notes: finalNotes, time_spent_minutes: Number(timeSpent) },
        token
      );
      setActionSuccess(`Ticket ${updated.ticket_number} resolved!`);
      setResolvingTicket(null);
    } catch (err) {
      setActionError(err.message || 'Failed to resolve incident.');
    } finally {
      setSavingResolution(false);
    }
  };

  const handleUpdatePassword = async (e, token) => {
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
    <DashboardContext.Provider
      value={{
        metrics,
        incidents,
        statusFilter,
        setStatusFilter,
        loading,
        actionError,
        actionSuccess,
        setActionError,
        setActionSuccess,
        fetchData,
        resolvingTicket,
        setResolvingTicket,
        selectedTechniques,
        setSelectedTechniques,
        resolutionNotes,
        setResolutionNotes,
        timeSpent,
        setTimeSpent,
        savingResolution,
        setSavingResolution,
        calcScope,
        setCalcScope,
        calcStopped,
        setCalcStopped,
        calcMinutes,
        setCalcMinutes,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        pwError,
        setPwError,
        pwSuccess,
        setPwSuccess,
        updatingPw,
        setUpdatingPw,
        startResolve,
        handleToggleTechnique,
        handleMarkInProgress,
        handleResolveSubmit,
        handleUpdatePassword,
        sortTicketsByPriority,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
