// src/pages/Home.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { posterUrl } from '../services/tmdb';
import { toggleEpisodeWatched } from '../services/collection';
import { parseDateString, formatAirDate } from '../utils/date';
import './Home.css';

export default function Home() {
  const { auth: { profile, user }, collection: { shows, movies, watchedMovies, loading }, toast } = useApp();
  const navigate = useNavigate();

  const firstName = profile?.displayName?.split(' ')[0] || 'there';

  // Shows with a next episode to watch
  const nextToWatch = shows.filter(s => s.nextEpisode);

  // Shows with upcoming air dates or returning series status
  const upcoming = shows.filter(s => {
    if (s.nextAirDate) {
      const airDate = parseDateString(s.nextAirDate);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return airDate && airDate >= startOfToday;
    }
    return s.status === 'Returning Series' || s.status === 'In Production' || s.status === 'Planned';
  }).sort((a, b) => {
    const da = parseDateString(a.nextAirDate) || new Date('2099-01-01');
    const db = parseDateString(b.nextAirDate) || new Date('2099-01-01');
    return da - db;
  });

  // Recently added (top 5)
  const recentlyAdded = [...shows, ...movies]
    .slice(0, 5);

  if (loading) return <HomeLoading />;

  return (
    <div className="page home-page">
      {/* Header */}
      <header className="home-header">
        <div>
          <h1 className="home-greeting">Hey, {firstName} 👋</h1>
          <p className="home-sub">Ready to watch something?</p>
        </div>
        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat-value">{shows.length}</span>
            <span className="home-stat-label">Shows</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">{watchedMovies.length}</span>
            <span className="home-stat-label">Movies</span>
          </div>
        </div>
      </header>

      {/* Empty state */}
      {shows.length === 0 && movies.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🍿</span>
          <h2 className="empty-state-title">Your collection is empty</h2>
          <p className="empty-state-text">
            Search for a TV show or movie to start tracking your watchlist.
          </p>
          <button
            id="home-go-search"
            className="btn btn-primary"
            onClick={() => navigate('/search')}
          >
            🔍 Search Now
          </button>
        </div>
      )}

      {/* Next to Watch */}
      {nextToWatch.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">▶ Next to Watch</h2>
            <button
              id="see-all-shows"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/collection')}
            >
              See all
            </button>
          </div>
          <div className="next-watch-list">
            {nextToWatch.map(show => (
              <NextWatchCard
                key={show.id}
                show={show}
                onClick={() => navigate(`/show/${show.id}`)}
                householdId={profile?.householdId}
                userId={user?.uid}
                toast={toast}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Episodes */}
      {upcoming.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">📅 Upcoming</h2>
          </div>
          <div className="upcoming-list">
            {upcoming.map(show => (
              <UpcomingCard key={show.id} show={show} onClick={() => navigate(`/show/${show.id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title">🆕 Recently Added</h2>
            <button
              id="see-all-collection"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/collection')}
            >
              See all
            </button>
          </div>
          <div className="recent-scroll">
            {recentlyAdded.map(item => (
              <RecentCard
                key={item.id}
                item={item}
                onClick={() => navigate(item.type === 'tv' ? `/show/${item.id}` : `/movie/${item.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NextWatchCard({ show, onClick, householdId, userId, toast }) {
  const [marking, setMarking] = useState(false);
  const poster = posterUrl(show.posterPath, 'w185');
  const { season, episode } = show.nextEpisode;
  const formattedNextAir = formatAirDate(show.nextAirDate);

  const statusBadgeClass = show.status === 'Ended' || show.status === 'Canceled'
    ? 'badge-movie'
    : show.status === 'Returning Series'
    ? 'badge-returning'
    : 'badge-tv';

  const handleMarkComplete = async (e) => {
    e.stopPropagation();
    if (!householdId || !userId || marking) return;
    setMarking(true);
    try {
      await toggleEpisodeWatched(householdId, show.id, season, episode, true, userId);
      toast?.success(`Marked S${season} E${episode} of "${show.title}" as watched! ✅`);
    } catch {
      toast?.error('Failed to mark episode. Try again.');
    } finally {
      setMarking(false);
    }
  };

  return (
    <button className="next-watch-card" onClick={onClick} id={`next-watch-${show.id}`}>
      <div className="next-watch-poster">
        {poster
          ? <img src={poster} alt={show.title} loading="lazy" />
          : <span>📺</span>
        }
      </div>
      <div className="next-watch-info">
        <p className="next-watch-show-title">{show.title}</p>
        <p className="next-watch-episode">Season {season} · Episode {episode}</p>
        <div className="next-watch-tags">
          {show.status && (
            <span className={`badge ${statusBadgeClass}`}>
              {show.status}
            </span>
          )}
          {formattedNextAir ? (
            <span className="tooltip-wrap">
              <span className="badge badge-tbc">
                📅 {formattedNextAir}
              </span>
              <span className="tooltip-text">To Be Confirmed by network schedule</span>
            </span>
          ) : show.status === 'Returning Series' ? (
            <span className="tooltip-wrap">
              <span className="badge badge-tbc">Date TBC</span>
              <span className="tooltip-text">To Be Confirmed — TMDB release date pending</span>
            </span>
          ) : null}
        </div>
        <button
          id={`mark-complete-${show.id}`}
          className="mark-complete-btn"
          onClick={handleMarkComplete}
          disabled={marking}
          aria-label={`Mark S${season} E${episode} of ${show.title} as complete`}
        >
          {marking
            ? <span className="spinner" style={{ width: 12, height: 12 }} />
            : `✓ Mark S${season} E${episode} as complete`
          }
        </button>
      </div>
      <span className="next-watch-play">▶</span>
    </button>
  );
}

function UpcomingCard({ show, onClick }) {
  const poster = posterUrl(show.posterPath, 'w185');
  const formattedDate = formatAirDate(show.nextAirDate);
  const nextEpInfo = show.nextEpisodeToAir;

  return (
    <button className="upcoming-card" onClick={onClick} id={`upcoming-${show.id}`}>
      <div className="upcoming-poster">
        {poster
          ? <img src={poster} alt={show.title} loading="lazy" />
          : <span>📺</span>
        }
      </div>
      <div className="upcoming-info">
        <p className="upcoming-title">{show.title}</p>
        <div className="upcoming-details">
          {nextEpInfo && (
            <span className="upcoming-ep-label">
              S{nextEpInfo.seasonNumber} E{nextEpInfo.episodeNumber}{nextEpInfo.name ? `: ${nextEpInfo.name}` : ''}
            </span>
          )}
          <div className="upcoming-date-row">
            <span className="upcoming-date">
              📅 {formattedDate || 'Release Date Pending'}
            </span>
            <span className="tooltip-wrap">
              <span className="badge badge-tbc">TBC</span>
              <span className="tooltip-text">To Be Confirmed — dates subject to network/studio updates</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function RecentCard({ item, onClick }) {
  const poster = posterUrl(item.posterPath, 'w185');
  return (
    <button className="recent-card" onClick={onClick} id={`recent-${item.id}`}>
      <div className="recent-poster">
        {poster
          ? <img src={poster} alt={item.title} loading="lazy" />
          : <span>{item.type === 'tv' ? '📺' : '🎬'}</span>
        }
      </div>
      <p className="recent-title">{item.title}</p>
    </button>
  );
}

function HomeLoading() {
  return (
    <div className="page home-page">
      <div style={{ height: 80, borderRadius: 16, marginBottom: 24 }} className="skeleton" />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 16, marginBottom: 12 }} className="skeleton" />
      ))}
    </div>
  );
}
