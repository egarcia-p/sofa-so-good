// src/components/MediaCard.jsx
// Reusable card for displaying a show or movie in the collection list
import { useNavigate } from 'react-router-dom';
import { posterUrl } from '../services/tmdb';
import './MediaCard.css';

export default function MediaCard({ item, showProgress = true }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.type === 'tv') navigate(`/show/${item.id}`);
    else navigate(`/movie/${item.id}`);
  };

  const progressText = () => {
    if (item.type === 'movie') {
      return item.watched ? '✅ Watched' : '🎬 Not watched yet';
    }
    if (item.nextEpisode) {
      return `▶ S${item.nextEpisode.season} E${item.nextEpisode.episode}`;
    }
    return '✅ All watched';
  };

  const poster = posterUrl(item.posterPath, 'w185');

  return (
    <button className="media-card" onClick={handleClick} id={`media-card-${item.id}`} aria-label={item.title}>
      <div className="media-card__poster">
        {poster ? (
          <img src={poster} alt={item.title} className="poster" loading="lazy" />
        ) : (
          <div className="media-card__no-poster">
            {item.type === 'tv' ? '📺' : '🎬'}
          </div>
        )}
      </div>
      <div className="media-card__info">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`badge badge-${item.type === 'tv' ? 'tv' : 'movie'}`}>
            {item.type === 'tv' ? 'TV' : 'Movie'}
          </span>
          {item.rating && (
            <span className="media-card__rating">⭐ {item.rating}</span>
          )}
        </div>
        <h3 className="media-card__title truncate">{item.title}</h3>
        {item.releaseYear && (
          <p className="media-card__year">{item.releaseYear}</p>
        )}
        {showProgress && (
          <p className={`media-card__progress ${item.type === 'movie' && item.watched ? 'progress--watched' : ''}`}>
            {progressText()}
          </p>
        )}
      </div>
    </button>
  );
}
