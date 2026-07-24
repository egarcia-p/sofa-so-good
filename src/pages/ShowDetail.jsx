// src/pages/ShowDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { subscribeToItem, toggleEpisodeWatched, markSeasonWatched, updateShowMetadata, calculateNextEpisode } from '../services/collection';
import { getTVShow, getTVSeason, posterUrl, backdropUrl } from '../services/tmdb';
import './ShowDetail.css';

export default function ShowDetail() {
  const { id } = useParams(); // collection item id like "tv_12345"
  const navigate = useNavigate();
  const { auth: { user, profile }, toast } = useApp();

  const [item, setItem] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [seasons, setSeasons] = useState({});
  const [activeSeason, setActiveSeason] = useState(1);
  const [loadingEpisode, setLoadingEpisode] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  const householdId = profile?.householdId;

  // Subscribe to real-time item updates
  useEffect(() => {
    if (!householdId) return;
    return subscribeToItem(householdId, id, (data) => {
      setItem(data);
      if (!data) navigate('/collection');
    });
  }, [householdId, id, navigate]);

  // Fetch TMDB show details
  useEffect(() => {
    if (!item) return;
    const tmdbId = item.tmdbId;

    getTVShow(tmdbId).then(detail => {
      setShowDetail(detail);
      setLoadingDetail(false);

      const totalEpisodesPerSeason = detail.seasons
        ?.filter(s => s.season_number > 0)
        .reduce((acc, s) => ({ ...acc, [`s${s.season_number}`]: s.episode_count }), {});

      const updatedTotalEp = totalEpisodesPerSeason || item.totalEpisodesPerSeason || {};
      const newNextEp = calculateNextEpisode(item.watchProgress || {}, detail.number_of_seasons, updatedTotalEp);

      if (householdId) {
        updateShowMetadata(householdId, id, {
          nextAirDate: detail.next_episode_to_air?.air_date || null,
          status: detail.status,
          totalSeasons: detail.number_of_seasons,
          totalEpisodesPerSeason: updatedTotalEp,
          nextEpisode: newNextEp,
        }).catch(() => {});
      }
    }).catch(() => setLoadingDetail(false));
  }, [item?.tmdbId]);

  // Fetch season episodes when season changes
  useEffect(() => {
    if (!showDetail || seasons[activeSeason]) return;
    const tmdbId = item?.tmdbId;
    if (!tmdbId) return;

    getTVSeason(tmdbId, activeSeason).then(data => {
      setSeasons(prev => ({ ...prev, [activeSeason]: data }));
    }).catch(console.error);
  }, [activeSeason, showDetail, item?.tmdbId]);

  const handleToggleEpisode = async (seasonNum, episodeNum, currentlyWatched) => {
    const key = `${seasonNum}-${episodeNum}`;
    setLoadingEpisode(key);
    try {
      await toggleEpisodeWatched(householdId, id, seasonNum, episodeNum, !currentlyWatched, user.uid);
    } catch (err) {
      toast.error('Failed to update episode.');
    } finally {
      setLoadingEpisode(null);
    }
  };

  const handleMarkSeasonWatched = async (seasonNum, watched) => {
    const season = seasons[seasonNum];
    const count = season?.episodes?.length || item?.totalEpisodesPerSeason?.[`s${seasonNum}`] || 0;
    if (!count) return;

    try {
      await markSeasonWatched(householdId, id, seasonNum, count, watched, user.uid);
      toast.success(watched ? `Season ${seasonNum} marked as watched! ✅` : `Season ${seasonNum} unmarked.`);
    } catch (err) {
      toast.error('Failed to update season.');
    }
  };

  if (!item) return <div className="page"><div className="spinner" /></div>;

  const poster = posterUrl(item.posterPath);
  const backdrop = backdropUrl(item.backdropPath);

  const totalSeasonsCount = showDetail?.number_of_seasons || item.totalSeasons || 1;
  const seasonNumbers = Array.from({ length: totalSeasonsCount }, (_, i) => i + 1);

  const watchProgress = item.watchProgress || {};
  const currentSeasonData = seasons[activeSeason];

  const isSeasonFullyWatched = (seasonNum) => {
    const progress = watchProgress[`s${seasonNum}`] || {};
    const epCount = showDetail?.seasons?.find(s => s.season_number === seasonNum)?.episode_count
      || item?.totalEpisodesPerSeason?.[`s${seasonNum}`];

    if (epCount && epCount > 0) {
      for (let ep = 1; ep <= epCount; ep++) {
        if (!progress[`e${ep}`]) return false;
      }
      return true;
    }

    const season = seasons[seasonNum];
    if (!season || !season.episodes?.length) return false;
    return season.episodes.every(ep => progress[`e${ep.episode_number}`]);
  };

  const watchedCountInSeason = (seasonNum) => {
    const progress = watchProgress[`s${seasonNum}`] || {};
    return Object.values(progress).filter(Boolean).length;
  };

  return (
    <div className="show-detail-page">
      {/* Backdrop Hero */}
      <div className="show-backdrop" style={{ backgroundImage: backdrop ? `url(${backdrop})` : 'none' }}>
        <div className="show-backdrop-overlay" />
        <button id="show-back-btn" className="back-btn" onClick={() => navigate(-1)}>‹</button>
      </div>

      <div className="show-content">
        {/* Show Header */}
        <div className="show-header">
          <div className="show-poster-wrap">
            {poster
              ? <img src={poster} alt={item.title} className="show-poster" />
              : <div className="show-poster-placeholder">📺</div>
            }
          </div>
          <div className="show-meta">
            <h1 className="show-title">{item.title}</h1>
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
              <span className="badge badge-tv">TV Show</span>
              {item.status && (
                <span className={`badge ${item.status === 'Ended' || item.status === 'Canceled' ? 'badge-movie' : 'badge-watched'}`}>
                  {item.status}
                </span>
              )}
              {item.rating && <span className="show-rating">⭐ {item.rating}</span>}
            </div>
            {item.releaseYear && <p className="show-year">{item.releaseYear}</p>}

            {/* Next episode */}
            {item.nextEpisode ? (
              <div className="show-next-ep">
                <span>▶ Next: S{item.nextEpisode.season} E{item.nextEpisode.episode}</span>
              </div>
            ) : (
              <div className="show-next-ep show-next-ep--done">✅ All caught up!</div>
            )}
          </div>
        </div>

        {/* Overview */}
        {item.overview && (
          <div className="show-overview-section">
            <p className="show-overview">{item.overview}</p>
          </div>
        )}

        {/* Next Air Date */}
        {showDetail?.next_episode_to_air && (
          <div className="show-next-air card">
            <span className="show-next-air-label">📅 Next Episode</span>
            <div className="show-next-air-info">
              <strong>
                S{showDetail.next_episode_to_air.season_number} E{showDetail.next_episode_to_air.episode_number}:
                {' '}{showDetail.next_episode_to_air.name}
              </strong>
              <span className="text-muted text-sm">
                {new Date(showDetail.next_episode_to_air.air_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        )}

        {/* Season Tabs */}
        <div className="season-tabs-section">
          <div className="season-tabs-scroll">
            {seasonNumbers.map(n => (
              <button
                key={n}
                id={`season-tab-${n}`}
                className={`season-tab ${activeSeason === n ? 'season-tab--active' : ''}`}
                onClick={() => setActiveSeason(n)}
              >
                S{n}
                {isSeasonFullyWatched(n) && <span className="season-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Episode List */}
        <div className="episodes-section">
          <div className="episodes-header">
            <h2 className="section-title">Season {activeSeason}</h2>
            {currentSeasonData && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted">
                  {watchedCountInSeason(activeSeason)}/{currentSeasonData.episodes?.length || 0}
                </span>
                <button
                  id={`mark-season-${activeSeason}`}
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleMarkSeasonWatched(activeSeason, !isSeasonFullyWatched(activeSeason))}
                >
                  {isSeasonFullyWatched(activeSeason) ? 'Unwatch All' : 'Watch All'}
                </button>
              </div>
            )}
          </div>

          {!currentSeasonData && (
            <div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />
              ))}
            </div>
          )}

          {currentSeasonData?.episodes?.map(episode => {
            const isWatched = watchProgress[`s${activeSeason}`]?.[`e${episode.episode_number}`];
            const isLoading = loadingEpisode === `${activeSeason}-${episode.episode_number}`;

            return (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                isWatched={isWatched}
                isLoading={isLoading}
                onToggle={() => handleToggleEpisode(activeSeason, episode.episode_number, isWatched)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EpisodeRow({ episode, isWatched, isLoading, onToggle }) {
  const airDate = episode.air_date
    ? new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <button
      id={`episode-${episode.episode_number}`}
      className={`episode-row ${isWatched ? 'episode-row--watched' : ''}`}
      onClick={onToggle}
      disabled={isLoading}
      aria-label={`${isWatched ? 'Unmark' : 'Mark'} episode ${episode.episode_number} as watched`}
    >
      <div className={`episode-checkbox ${isWatched ? 'episode-checkbox--checked' : ''}`}>
        {isLoading
          ? <span className="spinner" style={{ width: 14, height: 14 }} />
          : isWatched ? '✓' : ''
        }
      </div>
      <div className="episode-info">
        <div className="episode-title-row">
          <span className="episode-number">E{episode.episode_number}</span>
          <span className="episode-name">{episode.name || `Episode ${episode.episode_number}`}</span>
        </div>
        {airDate && <span className="episode-date">{airDate}</span>}
      </div>
    </button>
  );
}
