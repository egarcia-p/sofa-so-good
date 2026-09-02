// src/services/tmdb.js
// TMDB API client — wraps all API calls with caching and error handling
import { getReleaseYear } from '../utils/date';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const getHeaders = () => ({
  Authorization: `Bearer ${import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
});

async function tmdbFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { headers: getHeaders() });
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  return res.json();
}

// --- Image URLs ---
export const posterUrl = (path, size = 'w342') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

export const backdropUrl = (path, size = 'w780') =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

// --- Search ---
export async function searchMulti(query, page = 1) {
  if (!query.trim()) return { results: [], total_results: 0, total_pages: 0 };
  const data = await tmdbFetch('/search/multi', { query, page, include_adult: false });
  // Filter to only movies and TV shows
  return {
    ...data,
    results: data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv'),
  };
}

// --- TV Shows ---
export async function getTVShow(id) {
  return tmdbFetch(`/tv/${id}`, {
    append_to_response: 'next_episode_to_air,last_episode_to_air,seasons',
  });
}

export async function getTVSeason(showId, seasonNumber) {
  return tmdbFetch(`/tv/${showId}/season/${seasonNumber}`);
}

export async function getTVShowChanges(showId) {
  return tmdbFetch(`/tv/${showId}/changes`);
}

// --- Movies ---
export async function getMovie(id) {
  return tmdbFetch(`/movie/${id}`, {
    append_to_response: 'release_dates',
  });
}

// --- Trending (for discovery on home screen) ---
export async function getTrending(type = 'all', timeWindow = 'week') {
  return tmdbFetch(`/trending/${type}/${timeWindow}`);
}

// --- Format Helpers ---
export function formatMediaItem(tmdbItem) {
  const isTV = tmdbItem.media_type === 'tv' || tmdbItem.first_air_date !== undefined;
  return {
    tmdbId: tmdbItem.id,
    type: isTV ? 'tv' : 'movie',
    title: isTV ? (tmdbItem.name || tmdbItem.original_name) : (tmdbItem.title || tmdbItem.original_title),
    posterPath: tmdbItem.poster_path,
    backdropPath: tmdbItem.backdrop_path,
    overview: tmdbItem.overview,
    releaseYear: getReleaseYear(isTV ? tmdbItem.first_air_date : tmdbItem.release_date),
    rating: tmdbItem.vote_average ? Math.round(tmdbItem.vote_average * 10) / 10 : null,
  };
}

// --- Episode Helpers ---
export function getNextEpisode(showDetail, watchProgress) {
  // watchProgress: { season1: [true, true, false, ...], season2: [...] }
  const seasons = (showDetail.seasons || []).filter(s => s.season_number > 0);

  for (const season of seasons) {
    const seasonNum = season.season_number;
    const watched = watchProgress?.[`s${seasonNum}`] || {};
    const episodeCount = season.episode_count;

    for (let ep = 1; ep <= episodeCount; ep++) {
      if (!watched[`e${ep}`]) {
        return { season: seasonNum, episode: ep, seasonName: season.name };
      }
    }
  }
  return null; // all watched
}

export function getWatchedEpisodeCount(watchProgress) {
  if (!watchProgress) return 0;
  return Object.values(watchProgress).reduce((total, season) => {
    return total + Object.values(season).filter(Boolean).length;
  }, 0);
}

export function getTotalEpisodeCount(showDetail) {
  if (!showDetail?.seasons) return 0;
  return showDetail.seasons
    .filter(s => s.season_number > 0)
    .reduce((sum, s) => sum + s.episode_count, 0);
}
