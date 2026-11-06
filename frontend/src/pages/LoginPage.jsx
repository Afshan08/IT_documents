import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login(identifier, password);
      // Strictly navigate to IT Admin Dashboard only if the user is the authorized IT Manager
      if (res.user?.is_admin) {
        navigate('/dashboard/queue');
      } else {
        navigate('/report');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="card-title">Welcome Back</h2>
      <p className="card-subtitle">Log in with your credentials to access your account</p>

      <Alert type="error" message={error} />

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-identifier">Username or Email</label>
          <input
            id="login-identifier"
            type="text"
            required
            placeholder="e.g. Ehsan Afridi or you@company.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
          <Link to="/forgot-password" className="text-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Sign In'}
        </button>
      </form>

      <div className="card-footer">
        <span>Don't have an account? </span>
        <Link to="/signup" className="text-link-accent">
          Create one now
        </Link>
      </div>
    </div>
  );
}
