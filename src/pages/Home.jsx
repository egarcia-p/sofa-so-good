// src/pages/Home.jsx
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { posterUrl } from '../services/tmdb';
import './Home.css';

export default function Home() {
  const { auth: { profile }, collection: { shows, movies, watchedMovies, loading } } = useApp();
  const navigate = useNavigate();

  const firstName = profile?.displayName?.split(' ')[0] || 'there';

  // Shows with a next episode to watch
  const nextToWatch = shows.filter(s => s.nextEpisode);

  // Shows with upcoming air dates or returning series status
  const upcoming = shows.filter(s => {
    if (s.nextAirDate) {
      const airDate = s.nextAirDate?.toDate?.() || new Date(s.nextAirDate);
      return airDate > new Date();
    }
    return s.status === 'Returning Series' || s.status === 'In Production' || s.status === 'Planned';
  }).sort((a, b) => {
    const da = a.nextAirDate?.toDate?.() || (a.nextAirDate ? new Date(a.nextAirDate) : new Date('2099-01-01'));
    const db = b.nextAirDate?.toDate?.() || (b.nextAirDate ? new Date(b.nextAirDate) : new Date('2099-01-01'));
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
              <NextWatchCard key={show.id} show={show} onClick={() => navigate(`/show/${show.id}`)} />
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

function NextWatchCard({ show, onClick }) {
  const poster = posterUrl(show.posterPath, 'w185');
  const { season, episode } = show.nextEpisode;
  const airDate = show.nextAirDate?.toDate?.() || (show.nextAirDate ? new Date(show.nextAirDate) : null);
  const formattedNextAir = airDate
    ? airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const statusBadgeClass = show.status === 'Ended' || show.status === 'Canceled'
    ? 'badge-movie'
    : show.status === 'Returning Series'
    ? 'badge-returning'
    : 'badge-tv';

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
      </div>
      <span className="next-watch-play">▶</span>
    </button>
  );
}

function UpcomingCard({ show, onClick }) {
  const poster = posterUrl(show.posterPath, 'w185');
  const airDate = show.nextAirDate?.toDate?.() || (show.nextAirDate ? new Date(show.nextAirDate) : null);
  const formattedDate = airDate ? airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
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
