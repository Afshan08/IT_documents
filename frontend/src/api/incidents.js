const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || data.message || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }
  return data;
}

export async function createIncident(incidentData, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/incidents`, {
    method: 'POST',
    headers,
    body: JSON.stringify(incidentData),
  });
  return handleResponse(response);
}

export async function trackIncident(ticketNumber) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/track/${ticketNumber}`);
  return handleResponse(response);
}

export async function getIncidents(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.department) params.append('department', filters.department);
  if (filters.urgency) params.append('urgency', filters.urgency);

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}

export async function resolveIncident(incidentId, resolutionData, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resolutionData),
  });
  return handleResponse(response);
}

export async function markIncidentInProgress(incidentId, token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/in-progress`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function getIncidentMetrics(token) {
  const response = await fetch(`${API_BASE_URL}/api/v1/incidents/stats/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}
