// src/pages/HouseholdSetup.jsx
// After registration, user either creates a new household or joins their partner's
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createHousehold, joinHousehold } from '../services/household';
import './HouseholdSetup.css';

export default function HouseholdSetup() {
  const { auth: { user, refreshProfile }, toast } = useApp();
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { inviteCode: code } = await createHousehold(user.uid);
      toast.success('Household created! Share your invite code with your partner.');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to create household.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    try {
      await joinHousehold(user.uid, inviteCode);
      toast.success('Joined household! Welcome to your shared collection 🎉');
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to join household.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-page page-no-nav">
      <div className="setup-container">
        <div className="setup-header">
          <span className="setup-icon">🏠</span>
          <h1 className="setup-title">Set Up Your Household</h1>
          <p className="setup-subtitle">
            Create a household to track shows & movies, or join your partner's existing one.
          </p>
        </div>

        {!mode && (
          <div className="setup-options">
            <button
              id="create-household-btn"
              className="setup-option-btn"
              onClick={() => setMode('create')}
            >
              <span className="setup-option-icon">✨</span>
              <div>
                <div className="setup-option-title">Create New Household</div>
                <div className="setup-option-desc">Start fresh and invite your partner</div>
              </div>
              <span className="setup-option-arrow">›</span>
            </button>

            <button
              id="join-household-btn"
              className="setup-option-btn"
              onClick={() => setMode('join')}
            >
              <span className="setup-option-icon">🔗</span>
              <div>
                <div className="setup-option-title">Join Existing Household</div>
                <div className="setup-option-desc">Enter the invite code from your partner</div>
              </div>
              <span className="setup-option-arrow">›</span>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="setup-form card">
            <h2 className="setup-form-title">Create Household</h2>
            <p className="text-secondary text-sm mb-4">
              You'll get an invite code to share with your partner so they can join your collection.
            </p>
            <div className="flex gap-3">
              <button
                id="back-btn"
                className="btn btn-ghost"
                onClick={() => setMode(null)}
                disabled={loading}
              >
                ‹ Back
              </button>
              <button
                id="confirm-create-btn"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Create Household ✨'}
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <form className="setup-form card" onSubmit={handleJoin}>
            <h2 className="setup-form-title">Join Household</h2>
            <p className="text-secondary text-sm mb-4">
              Enter the 6-character invite code from your partner.
            </p>
            <div className="form-group">
              <label className="form-label" htmlFor="invite-code-input">Invite Code</label>
              <input
                id="invite-code-input"
                type="text"
                className="form-input setup-code-input"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                id="back-btn-join"
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode(null)}
                disabled={loading}
              >
                ‹ Back
              </button>
              <button
                id="confirm-join-btn"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading || inviteCode.length < 6}
              >
                {loading ? <span className="spinner" /> : 'Join 🔗'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
