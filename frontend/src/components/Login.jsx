import { useState } from 'react';
import { Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { login, setToken } from '../utils/api';
import brand from '../brand';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true); setError('');
    try {
      const data = await login(username, password);
      setToken(data.token);
      onLogin(data.username);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background glow orbs */}
      <div className="login-glow-orb-top" />
      <div className="login-glow-orb-bottom" />

      {/* Rotating Accent Border Wrapper */}
      <div className="login-card-wrapper">
        {/* Full 360-degree rotating accent beam */}
        <div className="login-accent-line" />

        {/* Login Card Inner */}
        <div className="login-card">
          {/* Brand */}
          <div className="login-brand-header">
            <div className="login-brand-icon">
              <Zap size={24} color="white" />
            </div>
            <h1 className="login-brand-title">
              {brand.name}
            </h1>
            <p className="login-brand-subtitle">
              Sign in to access your billing dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error login-alert">
              <Lock size={14} /> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="login-input-wrapper">
                <User size={14} className="login-input-icon" />
                <input
                  id="login-username"
                  className="form-input login-input-username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  autoFocus
                  autoComplete="username"
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="login-input-wrapper">
                <Lock size={14} className="login-input-icon" />
                <input
                  id="login-password"
                  className="form-input login-input-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  autoComplete="current-password"
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="login-password-toggle"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading
                ? <><div className="spinner login-spinner" /> Signing in…</>
                : <>Sign In</>
              }
            </button>
          </form>

          {/* Footer hint */}
          <p className="login-footer-hint">
            Default credentials: <code className="login-code-highlight">admin</code> / <code className="login-code-highlight">admin123</code><br />
            Change these in <code className="login-code-warning">backend/.env</code> before sharing with clients.
          </p>
        </div>
      </div>
    </div>
  );
}
