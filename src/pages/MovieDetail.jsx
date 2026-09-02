// src/pages/MovieDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { subscribeToItem, markMovieWatched } from '../services/collection';
import { getMovie, posterUrl, backdropUrl } from '../services/tmdb';
import { formatDate } from '../utils/date';
import './MovieDetail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth: { user, profile }, toast } = useApp();

  const [item, setItem] = useState(null);
  const [movieDetail, setMovieDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const householdId = profile?.householdId;

  useEffect(() => {
    if (!householdId) return;
    return subscribeToItem(householdId, id, (data) => {
      setItem(data);
      if (!data) navigate('/collection');
    });
  }, [householdId, id, navigate]);

  useEffect(() => {
    if (!item?.tmdbId) return;
    getMovie(item.tmdbId)
      .then(setMovieDetail)
      .catch(console.error);
  }, [item?.tmdbId]);

  const handleToggleWatched = async () => {
    setLoading(true);
    try {
      await markMovieWatched(householdId, id, user.uid, !item.watched);
      toast.success(item.watched ? 'Marked as unwatched.' : '🎬 Marked as watched!');
    } catch {
      toast.error('Failed to update. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const poster = posterUrl(item.posterPath, 'w342');
  const backdrop = backdropUrl(item.backdropPath);

  const runtime = movieDetail?.runtime;
  const runtimeText = runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : null;

  const genres = movieDetail?.genres?.slice(0, 3).map(g => g.name).join(' · ');

  return (
    <div className="movie-detail-page">
      {/* Backdrop */}
      <div className="movie-backdrop" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}>
        <div className="movie-backdrop-overlay" />
        <button id="movie-back-btn" className="back-btn" onClick={() => navigate(-1)}>‹</button>
      </div>

      <div className="movie-content">
        {/* Header */}
        <div className="movie-header">
          <div className="movie-poster-wrap">
            {poster
              ? <img src={poster} alt={item.title} className="movie-poster" />
              : <div className="movie-poster-placeholder">🎬</div>
            }
          </div>
          <div className="movie-meta">
            <h1 className="movie-title">{item.title}</h1>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
              <span className="badge badge-movie">Movie</span>
              {item.watched && <span className="badge badge-watched">Watched</span>}
            </div>
            <div className="movie-meta-row" style={{ marginTop: 8 }}>
              {item.releaseYear && <span className="movie-year">{item.releaseYear}</span>}
              {runtimeText && <span className="movie-runtime">⏱ {runtimeText}</span>}
              {item.rating && <span className="movie-rating">⭐ {item.rating}</span>}
            </div>
            {genres && <p className="movie-genres">{genres}</p>}
          </div>
        </div>

        {/* Overview */}
        {item.overview && (
          <div className="movie-overview-section card">
            <p className="movie-overview">{item.overview}</p>
          </div>
        )}

        {/* Watch Status Card */}
        <div className="movie-watch-card card">
          {item.watched ? (
            <div className="movie-watched-state">
              <div className="movie-watched-check">✅</div>
              <div>
                <p className="movie-watched-label">You watched this!</p>
                {item.watchedAt && (
                  <p className="movie-watched-date">
                    {formatDate(item.watchedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="movie-unwatched-state">
              <span className="movie-unwatched-icon">🍿</span>
              <p className="movie-unwatched-label">Haven't watched this yet</p>
            </div>
          )}

          <button
            id="toggle-watched-btn"
            className={`btn btn-full ${item.watched ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggleWatched}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" />
              : item.watched ? '↩ Mark as Unwatched' : '✅ Mark as Watched'
            }
          </button>
        </div>

        {/* Additional Info */}
        {movieDetail && (
          <div className="movie-info-grid">
            {movieDetail.vote_count > 0 && (
              <div className="movie-info-item card">
                <span className="movie-info-label">Rating</span>
                <span className="movie-info-value">⭐ {Math.round(movieDetail.vote_average * 10) / 10}/10</span>
                <span className="movie-info-sub">{movieDetail.vote_count.toLocaleString()} votes</span>
              </div>
            )}
            {movieDetail.budget > 0 && (
              <div className="movie-info-item card">
                <span className="movie-info-label">Budget</span>
                <span className="movie-info-value">${(movieDetail.budget / 1_000_000).toFixed(0)}M</span>
              </div>
            )}
            {movieDetail.revenue > 0 && (
              <div className="movie-info-item card">
                <span className="movie-info-label">Revenue</span>
                <span className="movie-info-value">${(movieDetail.revenue / 1_000_000).toFixed(0)}M</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
