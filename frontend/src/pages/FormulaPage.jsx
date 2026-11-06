import React, { useContext } from 'react';
import { DashboardContext } from './DashboardContext';

export default function FormulaPage() {
  const {
    calcScope,
    setCalcScope,
    calcStopped,
    setCalcStopped,
    calcMinutes,
    setCalcMinutes,
  } = useContext(DashboardContext);

  const calculatePreview = () => {
    const scopeMultipliers = {
      '1 Person': 1.0,
      '2-5 People': 3.5,
      'Department (5-20)': 12.0,
      'Entire Company': 40.0,
    };
    const affected = scopeMultipliers[calcScope] || 1.0;
    const stoppageFactor = calcStopped ? 1.0 : 0.35;
    const hours = Math.max(calcMinutes, 10) / 60.0;
    const downtimeHours = hours * 1.5;
    const laborSaved = affected * 35.0 * stoppageFactor * downtimeHours;
    const vendorSaved = hours * 125.0;
    return {
      laborSaved: Math.round(laborSaved * 100) / 100,
      vendorSaved: Math.round(vendorSaved * 100) / 100,
      total: Math.round((laborSaved + vendorSaved) * 100) / 100,
    };
  };

  return (
    <div className="metrics-management-view">
      <div className="metrics-card">
        <h2 className="card-title" style={{ textAlign: 'left' }}>
          ROI Value Calculation Formula &amp; Methodology
        </h2>
        <p className="card-subtitle" style={{ textAlign: 'left' }}>
          Confidential to IT Management. This breakdown details the algorithmic methodology
          quantifying downtime prevented, productivity preserved, and emergency vendor avoidance.
        </p>

        <div className="formula-explanation-grid">
          <div className="formula-box">
            <h3 className="formula-box-title">The Algorithmic Formula</h3>
            <div className="formula-code-display">
              Total Financial Value Saved = Labor Productivity Preserved + Emergency Contractor Rate
              Avoided
            </div>

            <div className="formula-step-box">
              <strong>1. Labor Productivity Preserved:</strong>
              <p>
                <code>
                  Employees Affected Multiplier &times; Corporate Wage ($35.00/hr) &times; Work
                  Stoppage Factor &times; Downtime Hours Prevented
                </code>
              </p>
              <span className="formula-note">
                Downtime prevented is calculated at 1.5&times; the resolution duration to account for
                diagnostic triage, workflow context switching, and systemic ramp-up.
              </span>
            </div>

            <div className="formula-step-box">
              <strong>2. Emergency Contractor Cost Avoidance:</strong>
              <p>
                <code>
                  Hours Invested &times; Emergency Dispatch Contractor Rate ($125.00/hr)
                </code>
              </p>
              <span className="formula-note">
                Represents the market billing rate avoided by having an in-house IT manager resolve
                the incident without hiring outsourced emergency technicians.
              </span>
            </div>
          </div>

          <div className="formula-box">
            <h3 className="formula-box-title">Multipliers &amp; Benchmark Variables</h3>
            <table className="incidents-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Level / Condition</th>
                  <th>Multiplier / Benchmark</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowSpan="4">Impact Scope</td>
                  <td>1 Person</td>
                  <td>1.0&times; (1 employee)</td>
                </tr>
                <tr>
                  <td>2–5 People</td>
                  <td>3.5&times; (small team)</td>
                </tr>
                <tr>
                  <td>Department (5–20)</td>
                  <td>12.0&times; (entire department)</td>
                </tr>
                <tr>
                  <td>Entire Company</td>
                  <td>40.0&times; (organization)</td>
                </tr>
                <tr>
                  <td rowSpan="2">Work Stoppage</td>
                  <td>Complete Halt</td>
                  <td>1.0&times; (100% productivity loss)</td>
                </tr>
                <tr>
                  <td>Degraded / Workaround</td>
                  <td>0.35&times; (35% partial slowdown)</td>
                </tr>
                <tr>
                  <td>Staff Wage</td>
                  <td>Corporate Benchmark</td>
                  <td>$35.00 / hour</td>
                </tr>
                <tr>
                  <td>Outsourced IT</td>
                  <td>Emergency Dispatch Rate</td>
                  <td>$125.00 / hour</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Tracking Explanation */}
        <div className="time-tracking-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="formula-box-title">How Resolution Time is Tracked &amp; Calculated</h3>
          <div className="time-tracking-grid">
            <div className="time-item">
              <span className="time-label">Active Labor Time</span>
              <p>
                The exact time (in minutes) you log when completing a ticket. Directly drives both
                productivity preserved and the contractor avoidance calculations.
              </p>
            </div>
            <div className="time-item">
              <span className="time-label">Elapsed Turnaround (Lifespan)</span>
              <p>
                Calculated automatically between ticket submission (<code>created_at</code>) and
                final fix (<code>resolved_at</code>). Measures end-to-end turnaround time.
              </p>
            </div>
            <div className="time-item">
              <span className="time-label">Mean Time to Resolution (MTTR)</span>
              <p>
                Aggregated across all resolved tickets and displayed in the ROI banner,
                demonstrating executive operational responsiveness.
              </p>
            </div>
          </div>
        </div>

        {/* Live Interactive Simulator */}
        <div className="simulator-card" style={{ marginTop: '1.5rem' }}>
          <h3 className="formula-box-title">Interactive Value Simulator</h3>
          <p className="card-subtitle" style={{ textAlign: 'left', marginBottom: '1rem' }}>
            Adjust the variables below to test real-time algorithmic calculations:
          </p>
          <div className="simulator-controls-grid">
            <div className="form-group">
              <label>Impact Scope</label>
              <select
                className="form-select"
                value={calcScope}
                onChange={(e) => setCalcScope(e.target.value)}
              >
                <option value="1 Person">1 Person (1.0x)</option>
                <option value="2-5 People">2-5 People (3.5x)</option>
                <option value="Department (5-20)">Department (12.0x)</option>
                <option value="Entire Company">Entire Company (40.0x)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Work Stoppage</label>
              <select
                className="form-select"
                value={calcStopped ? 'yes' : 'no'}
                onChange={(e) => setCalcStopped(e.target.value === 'yes')}
              >
                <option value="yes">Work Halted (1.0x)</option>
                <option value="no">Partial Slowdown (0.35x)</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Time Spent: {calcMinutes} min ({Math.round((calcMinutes / 60) * 10) / 10}h)
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={calcMinutes}
                onChange={(e) => setCalcMinutes(Number(e.target.value))}
                style={{ marginTop: '0.4rem', accentColor: '#2563eb' }}
              />
            </div>
          </div>

          {(() => {
            const preview = calculatePreview();
            return (
              <div className="simulator-results-banner">
                <div className="sim-result-box">
                  <span className="sim-label">Productivity Preserved</span>
                  <strong className="sim-val">${preview.laborSaved.toLocaleString()}</strong>
                </div>
                <div className="sim-result-box">
                  <span className="sim-label">Contractor Avoided</span>
                  <strong className="sim-val">${preview.vendorSaved.toLocaleString()}</strong>
                </div>
                <div className="sim-result-box sim-result-total">
                  <span className="sim-label">Total Value Saved</span>
                  <strong className="sim-val" style={{ color: '#16a34a' }}>
                    ${preview.total.toLocaleString()}
                  </strong>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
