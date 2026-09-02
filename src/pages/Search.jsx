// src/pages/Search.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useSearch } from '../hooks/useSearch';
import { addToCollection } from '../services/collection';
import { formatMediaItem, getTVShow, getMovie } from '../services/tmdb';
import SearchResultCard from '../components/SearchResultCard';
import './Search.css';

export default function Search() {
  const { auth: { user, profile }, collection: { items }, toast } = useApp();
  const { query, setQuery, results, loading, clearSearch } = useSearch();
  const [addingIds, setAddingIds] = useState(new Set());

  const householdId = profile?.householdId;

  // Check if an item is already in the collection
  const isAdded = (item) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    const id = `${type}_${item.id}`;
    return items.some(i => i.id === id);
  };

  const handleAdd = async (tmdbItem) => {
    if (!householdId) return;
    const itemId = tmdbItem.id;
    setAddingIds(prev => new Set(prev).add(itemId));

    try {
      const isTV = tmdbItem.media_type === 'tv';
      let enriched = formatMediaItem(tmdbItem);

      // Fetch additional metadata for TV shows
      if (isTV) {
        const showDetail = await getTVShow(tmdbItem.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const airedSeasons = showDetail.seasons?.filter(s =>
          s.season_number > 0 && s.air_date && new Date(s.air_date) <= today
        ) || [];
        enriched = {
          ...enriched,
          totalSeasons: showDetail.number_of_seasons,
          status: showDetail.status,
          nextAirDate: showDetail.next_episode_to_air?.air_date || null,
          totalEpisodesPerSeason: airedSeasons
            .reduce((acc, s) => ({ ...acc, [`s${s.season_number}`]: s.episode_count }), {}),
          seasonAirDates: (showDetail.seasons || [])
            .filter(s => s.season_number > 0 && s.air_date)
            .reduce((acc, s) => ({ ...acc, [`s${s.season_number}`]: s.air_date }), {}),
        };
      }

      await addToCollection(householdId, user.uid, enriched);
      toast.success(`"${enriched.title}" added to your collection! 🎉`);
    } catch (err) {
      if (err.message === 'Already in your collection!') {
        toast.info('Already in your collection!');
      } else {
        toast.error('Failed to add. Please try again.');
        console.error(err);
      }
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <div className="page search-page">
      <h1 className="search-heading">Search</h1>

      {/* Search Input */}
      <div className="search-bar-wrapper">
        <span className="search-bar-icon">🔍</span>
        <input
          id="search-input"
          type="search"
          className="form-input search-bar-input"
          placeholder="Search shows or movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="Search for TV shows or movies"
        />
        {query && (
          <button
            id="search-clear"
            className="search-clear-btn"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* States */}
      {!query && !results.length && (
        <div className="empty-state">
          <span className="empty-state-icon">🔭</span>
          <h2 className="empty-state-title">Find something to watch</h2>
          <p className="empty-state-text">
            Search for any TV show or movie to add it to your shared collection.
          </p>
        </div>
      )}

      {loading && (
        <div className="search-results">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">😕</span>
          <h2 className="empty-state-title">No results found</h2>
          <p className="empty-state-text">Try a different search term.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          <p className="search-count">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(item => (
            <SearchResultCard
              key={item.id}
              item={item}
              onAdd={handleAdd}
              isAdded={isAdded(item)}
              isAdding={addingIds.has(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
