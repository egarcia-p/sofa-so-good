// src/hooks/useCollection.js
import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/collection';

export function useCollection(householdId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!householdId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection(householdId, (data) => {
      setItems(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [householdId]);

  const shows = items.filter(i => i.type === 'tv');
  const movies = items.filter(i => i.type === 'movie');
  const watchedMovies = movies.filter(i => i.watched);

  return { items, shows, movies, watchedMovies, loading, error };
}
