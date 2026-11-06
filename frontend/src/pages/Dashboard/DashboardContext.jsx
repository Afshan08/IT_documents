import React, { createContext, useContext, useState, useEffect } from 'react';
import { getIncidents, getIncidentMetrics, resolveIncident, markIncidentInProgress } from '../../api/incidents';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const [metrics, setMetrics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Open'); // default to Open
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [selectedTechniques, setSelectedTechniques] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [timeSpent, setTimeSpent] = useState(30);
  const [savingResolution, setSavingResolution] = useState(false);

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

  // sorting helper (same as original)
  const sortTicketsByPriority = (tickets) => {
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
  };

  const handleMarkInProgress = async (incidentId, token) => {
    setActionError('');
    setActionSuccess('');
    try {
      await markIncidentInProgress(incidentId, token);
      setActionSuccess('Incident status updated to "In Progress".');
    } catch (err) {
      setActionError(err.message || 'Failed to update ticket status to In Progress.');
    }
  };

  const startResolve = (incident) => {
    setResolvingTicket(incident);
    setSelectedTechniques([]);
    setResolutionNotes('');
    setTimeSpent(30);
    setActionError('');
    setActionSuccess('');
  };

  const handleResolveSubmit = async (e, token) => {
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
        { resolution_notes: finalNotes, time_spent_minutes: Number(timeSpent) },
        token
      );
      setActionSuccess(`Ticket ${updated.ticket_number} resolved! Algorithmic savings calculated: $${updated.estimated_cost_saved.toLocaleString()}`);
      setResolvingTicket(null);
    } catch (err) {
      setActionError(err.message || 'Failed to resolve incident.');
    } finally {
      setSavingResolution(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        metrics,
        setMetrics,
        incidents,
        setIncidents,
        statusFilter,
        setStatusFilter,
        loading,
        setLoading,
        actionError,
        setActionError,
        actionSuccess,
        setActionSuccess,
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
        fetchData,
        sortTicketsByPriority,
        handleMarkInProgress,
        startResolve,
        handleResolveSubmit,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
