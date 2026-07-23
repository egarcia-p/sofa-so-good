// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { logoutUser } from '../services/auth';
import { getHouseholdMembers, regenerateInviteCode } from '../services/household';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './Profile.css';

export default function Profile() {
  const { auth: { user, profile, refreshProfile }, collection: { items, shows, movies, watchedMovies }, toast } = useApp();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const householdId = profile?.householdId;

  useEffect(() => {
    if (!householdId) { setLoadingHousehold(false); return; }

    Promise.all([
      getDoc(doc(db, 'households', householdId)),
      getHouseholdMembers(householdId),
    ]).then(([snap, memberList]) => {
      if (snap.exists()) setHousehold({ id: snap.id, ...snap.data() });
      setMembers(memberList);
      setLoadingHousehold(false);
    }).catch(() => setLoadingHousehold(false));
  }, [householdId]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logoutUser();
    } catch {
      toast.error('Sign out failed.');
      setSigningOut(false);
    }
  };

  const handleCopyCode = () => {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode).then(() => {
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRegenerateCode = async () => {
    if (!householdId) return;
    try {
      const newCode = await regenerateInviteCode(householdId);
      setHousehold(prev => ({ ...prev, inviteCode: newCode }));
      toast.success('New invite code generated!');
    } catch {
      toast.error('Failed to regenerate code.');
    }
  };

  const totalWatched = watchedMovies.length;
  const totalShows = shows.length;

  return (
    <div className="page profile-page">
      <h1 className="profile-heading">Profile</h1>

      {/* User Card */}
      <div className="profile-card card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {profile?.displayName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="profile-name">{profile?.displayName || 'Unknown'}</h2>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{items.length}</span>
            <span className="profile-stat-label">In Library</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{totalShows}</span>
            <span className="profile-stat-label">TV Shows</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{totalWatched}</span>
            <span className="profile-stat-label">Movies Watched</span>
          </div>
        </div>
      </div>

      {/* Household */}
      <section className="profile-section">
        <h3 className="profile-section-title">🏠 Household</h3>

        {loadingHousehold && <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />}

        {!loadingHousehold && household && (
          <>
            {/* Members */}
            <div className="card profile-members">
              <p className="profile-label">Members ({members.length}/2)</p>
              <div className="profile-member-list">
                {members.map(m => (
                  <div key={m.id} className="profile-member">
                    <div className="avatar">{m.displayName?.[0]?.toUpperCase()}</div>
                    <div>
                      <p className="profile-member-name">{m.displayName}</p>
                      <p className="profile-member-email">{m.email}</p>
                    </div>
                    {m.id === user?.uid && (
                      <span className="badge badge-tv" style={{ marginLeft: 'auto' }}>You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Code — only show if less than 2 members */}
            {members.length < 2 && (
              <div className="card profile-invite">
                <p className="profile-label">Invite Code</p>
                <p className="text-secondary text-sm" style={{ marginBottom: 12 }}>
                  Share this code with your partner so they can join.
                </p>
                <div className="invite-code-display">
                  <span className="invite-code-text">{household.inviteCode}</span>
                  <button
                    id="copy-invite-code"
                    className="btn btn-sm btn-primary"
                    onClick={handleCopyCode}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <button
                  id="regen-invite-code"
                  className="btn btn-ghost btn-sm"
                  onClick={handleRegenerateCode}
                  style={{ marginTop: 8 }}
                >
                  🔄 Regenerate Code
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* About */}
      <section className="profile-section">
        <h3 className="profile-section-title">ℹ️ About</h3>
        <div className="card">
          <p className="text-secondary text-sm" style={{ lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Sofa So Good</strong> — TV & Movie Tracker
            <br />
            Movie & TV data provided by{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
              TMDB
            </a>
            . This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <div className="tmdb-logo-wrap">
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB Logo"
              style={{ height: 20, opacity: 0.7 }}
            />
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <button
        id="sign-out-btn"
        className="btn btn-danger btn-full"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? <span className="spinner" /> : '👋 Sign Out'}
      </button>
    </div>
  );
}
