import React, { useContext } from 'react';
import { DashboardContext } from './DashboardContext';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    pwError,
    pwSuccess,
    updatingPw,
    handleUpdatePassword,
  } = useContext(DashboardContext);

  return (
    <div className="profile-tab-grid">
      <div className="auth-card">
        <h2 className="card-title">Account Details</h2>
        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user?.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role:</span>
            <span className="status-badge">System Administrator / IT Lead</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <h2 className="card-title">Update Password</h2>
        <Alert type="error" message={pwError} />
        <Alert type="success" message={pwSuccess} />

        <form onSubmit={(e) => handleUpdatePassword(e, token)} className="auth-form">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>New Password (min 6 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={updatingPw}>
            {updatingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
