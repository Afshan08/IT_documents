import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function LoginPage({ setCurrentView }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      setCurrentView('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="card-title">Welcome Back</h2>
      <p className="card-subtitle">Log in to access your account</p>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="text-link"
            onClick={() => setCurrentView('forgot-password')}
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <div className="card-footer">
        <span>Don't have an account? </span>
        <button
          type="button"
          className="text-link-accent"
          onClick={() => setCurrentView('signup')}
        >
          Create one now
        </button>
      </div>
    </div>
  );
}
