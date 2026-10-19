import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from '../api/auth';
import Alert from '../components/Alert';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await updatePassword(currentPassword, newPassword, token);
      setSuccess(data.message || 'Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password. Verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-card">
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* User Information Card */}
      <div className="auth-card">
        <h2 className="card-title">User Profile</h2>
        <p className="card-subtitle">Your authenticated account information</p>

        <div className="profile-details">
          <div className="profile-row">
            <span className="profile-label">User ID:</span>
            <span className="profile-value">#{user.id}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Status:</span>
            <span className="profile-value status-badge">
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Joined:</span>
            <span className="profile-value">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Update Password Card */}
      <div className="auth-card">
        <h2 className="card-title">Update Password</h2>
        <p className="card-subtitle">Change your account password securely</p>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <form onSubmit={handleUpdatePassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="current-pw">Current Password</label>
            <input
              id="current-pw"
              type="password"
              required
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-pw">New Password (min 6 characters)</label>
            <input
              id="new-pw"
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-new-pw">Confirm New Password</label>
            <input
              id="confirm-new-pw"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
