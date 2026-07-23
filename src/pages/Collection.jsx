// src/pages/Collection.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { removeFromCollection } from '../services/collection';
import MediaCard from '../components/MediaCard';
import './Collection.css';

const FILTERS = ['All', 'TV Shows', 'Movies'];

export default function Collection() {
  const { auth: { profile, user }, collection: { items, shows, movies, loading }, toast } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [removingId, setRemovingId] = useState(null);

  const householdId = profile?.householdId;

  const filteredItems = filter === 'TV Shows' ? shows
    : filter === 'Movies' ? movies
    : items;

  const handleRemove = async (item, e) => {
    e.stopPropagation();
    if (!confirm(`Remove "${item.title}" from your collection?`)) return;

    setRemovingId(item.id);
    try {
      await removeFromCollection(householdId, item.id);
      toast.success(`"${item.title}" removed.`);
    } catch {
      toast.error('Failed to remove. Try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <CollectionLoading />;

  return (
    <div className="page collection-page">
      <div className="collection-header">
        <h1 className="collection-title">Library</h1>
        <span className="collection-count">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" role="tablist" aria-label="Filter collection">
        {FILTERS.map(f => (
          <button
            key={f}
            id={`filter-${f.toLowerCase().replace(' ', '-')}`}
            role="tab"
            aria-selected={filter === f}
            className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'All' ? `All (${items.length})` : f === 'TV Shows' ? `📺 ${shows.length}` : `🎬 ${movies.length}`}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">{filter === 'Movies' ? '🎬' : filter === 'TV Shows' ? '📺' : '📚'}</span>
          <h2 className="empty-state-title">
            {filter === 'All' ? 'Your library is empty' : `No ${filter} yet`}
          </h2>
          <p className="empty-state-text">
            {filter === 'All'
              ? 'Search for shows and movies to build your collection.'
              : `Add some ${filter.toLowerCase()} from the Search tab.`
            }
          </p>
          <button
            id="collection-go-search"
            className="btn btn-primary"
            onClick={() => navigate('/search')}
          >
            🔍 Search
          </button>
        </div>
      )}

      {/* Collection List */}
      <div className="collection-list">
        {filteredItems.map(item => (
          <div key={item.id} className="collection-item-wrapper">
            <MediaCard item={item} />
            <button
              id={`remove-${item.id}`}
              className="remove-btn"
              onClick={(e) => handleRemove(item, e)}
              disabled={removingId === item.id}
              aria-label={`Remove ${item.title}`}
            >
              {removingId === item.id
                ? <span className="spinner" style={{ width: 14, height: 14 }} />
                : '✕'
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollectionLoading() {
  return (
    <div className="page collection-page">
      <div style={{ height: 48, borderRadius: 24, marginBottom: 16 }} className="skeleton" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ height: 100, borderRadius: 16, marginBottom: 12 }} className="skeleton" />
      ))}
    </div>
  );
}
