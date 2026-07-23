// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useApp } from '../context/AppContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      await loginUser(email, password);
      toast.success('Welcome back! 🛋️');
      navigate('/');
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-no-nav">
      <div className="auth-container">
        <div className="auth-logo">
          <span className="auth-logo-icon">🛋️</span>
          <h1 className="auth-title gradient-text">Sofa So Good</h1>
          <p className="auth-subtitle">Your cozy TV & movie tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-heading">Sign In</h2>

          {error && (
            <div className="auth-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !email || !password}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" id="go-to-register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Sign in failed. Please try again.';
  }
}
