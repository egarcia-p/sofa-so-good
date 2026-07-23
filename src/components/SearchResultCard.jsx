// src/components/SearchResultCard.jsx
// Card shown in search results (before adding to collection)
import { posterUrl } from '../services/tmdb';
import './SearchResultCard.css';

export default function SearchResultCard({ item, onAdd, isAdded, isAdding }) {
  const isTV = item.media_type === 'tv';
  const title = isTV ? (item.name || item.original_name) : (item.title || item.original_title);
  const year = isTV
    ? (item.first_air_date ? new Date(item.first_air_date).getFullYear() : null)
    : (item.release_date ? new Date(item.release_date).getFullYear() : null);
  const poster = posterUrl(item.poster_path, 'w185');

  return (
    <div className="search-result-card" id={`search-result-${item.id}`}>
      <div className="search-result-card__poster">
        {poster ? (
          <img src={poster} alt={title} className="poster" loading="lazy" />
        ) : (
          <div className="search-result-card__no-poster">
            {isTV ? '📺' : '🎬'}
          </div>
        )}
      </div>
      <div className="search-result-card__info">
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge badge-${isTV ? 'tv' : 'movie'}`}>
            {isTV ? 'TV' : 'Movie'}
          </span>
          {item.vote_average > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 600 }}>
              ⭐ {Math.round(item.vote_average * 10) / 10}
            </span>
          )}
        </div>
        <h3 className="search-result-card__title">{title}</h3>
        {year && <p className="search-result-card__year">{year}</p>}
        {item.overview && (
          <p className="search-result-card__overview">{item.overview}</p>
        )}
      </div>
      <div className="search-result-card__action">
        <button
          id={`add-btn-${item.id}`}
          className={`btn btn-sm ${isAdded ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => !isAdded && !isAdding && onAdd(item)}
          disabled={isAdded || isAdding}
          aria-label={isAdded ? `${title} already in collection` : `Add ${title} to collection`}
        >
          {isAdding ? (
            <span className="spinner" style={{ width: 16, height: 16 }} />
          ) : isAdded ? (
            '✅ Added'
          ) : (
            '+ Add'
          )}
        </button>
      </div>
    </div>
  );
}
