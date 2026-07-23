// src/hooks/useSearch.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMulti } from '../services/tmdb';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const performSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchMulti(q);
      setResults(data.results || []);
    } catch (err) {
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => performSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, performSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clearSearch };
}
