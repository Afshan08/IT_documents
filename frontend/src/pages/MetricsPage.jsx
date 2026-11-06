import React, { useContext, useEffect } from 'react';
import { DashboardContext } from './DashboardContext';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function MetricsPage() {
  const { metrics, loading, actionError, fetchData } = useContext(DashboardContext);
  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchData(token);
  }, [token]);

  if (loading) {
    return <div className="empty-state">Loading metrics...</div>;
  }

  return (
    <>
      <Alert type="error" message={actionError} />

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
            <span className="metric-box-sub">Downtime &amp; vendor costs averted</span>
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

      {/* ROI & BUSINESS METRICS FOR MANAGEMENT */}
      {metrics && (
        <div className="metrics-management-view">
          <div className="metrics-card">
            <h2 className="card-title" style={{ textAlign: 'left' }}>
              Department Dependency &amp; Value Generated
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
    </>
  );
}
