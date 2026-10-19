import React, { useState } from 'react';
import { forgotPassword, resetPassword } from '../api/auth';
import Alert from '../components/Alert';

export default function ForgotPasswordPage({ setCurrentView }) {
  const [step, setStep] = useState(1); // 1 = Request Token, 2 = Set New Password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request reset token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setSuccess(data.message);
      if (data.reset_token) {
        // Auto-fill token for easy testing during development
        setToken(data.reset_token);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(email, token, newPassword);
      setSuccess(data.message);
      // Clean inputs
      setNewPassword('');
      setConfirmPassword('');
      setToken('');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="tab-header">
        <button
          className={`tab-btn ${step === 1 ? 'active' : ''}`}
          onClick={() => {
            setStep(1);
            setError('');
            setSuccess('');
          }}
        >
          1. Request Reset
        </button>
        <button
          className={`tab-btn ${step === 2 ? 'active' : ''}`}
          onClick={() => {
            setStep(2);
            setError('');
            setSuccess('');
          }}
        >
          2. Enter New Password
        </button>
      </div>

      <h2 className="card-title">
        {step === 1 ? 'Reset Your Password' : 'Set New Password'}
      </h2>
      <p className="card-subtitle">
        {step === 1
          ? 'Enter your registered email address to receive a reset token'
          : 'Provide your reset token and enter your new password'}
      </p>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {step === 1 ? (
        <form onSubmit={handleRequestToken} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-email">Email Address</label>
            <input
              id="reset-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Generating token...' : 'Request Reset Token'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="confirm-email">Email Address</label>
            <input
              id="confirm-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reset-token">
              Reset Token <span className="label-hint">(15-min validity)</span>
            </label>
            <input
              id="reset-token"
              type="text"
              required
              placeholder="Paste your reset token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password">New Password (min 6 characters)</label>
            <input
              id="new-password"
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      )}

      <div className="card-footer">
        <span>Remember your password? </span>
        <button
          type="button"
          className="text-link-accent"
          onClick={() => setCurrentView('login')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
