// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { useApp } from '../context/AppContext';
import './Auth.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await registerUser(email, password, name);
      toast.success('Account created! Let\'s set up your household 🏠');
      navigate('/household-setup');
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
          <h2 className="auth-heading">Create Account</h2>

          {error && (
            <div className="auth-error" role="alert">⚠️ {error}</div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Your Name</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Eugenia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !name || !email || !password}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" id="go-to-login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function getFirebaseErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email already in use. Try signing in.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Registration failed. Please try again.';
  }
}
