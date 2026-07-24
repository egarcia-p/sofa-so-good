// src/services/collection.js
// Firestore CRUD operations for the media collection

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to get the collection ref for a household
const collectionRef = (householdId) =>
  collection(db, 'households', householdId, 'collection');

const itemRef = (householdId, itemId) =>
  doc(db, 'households', householdId, 'collection', itemId);

// --- Add item to collection ---
export async function addToCollection(householdId, userId, mediaItem) {
  const id = `${mediaItem.type}_${mediaItem.tmdbId}`;
  const ref = itemRef(householdId, id);

  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error('Already in your collection!');

  const data = {
    id,
    tmdbId: mediaItem.tmdbId,
    type: mediaItem.type,
    title: mediaItem.title,
    posterPath: mediaItem.posterPath || null,
    backdropPath: mediaItem.backdropPath || null,
    overview: mediaItem.overview || '',
    releaseYear: mediaItem.releaseYear || null,
    rating: mediaItem.rating || null,
    addedAt: serverTimestamp(),
    addedBy: userId,
  };

  if (mediaItem.type === 'tv') {
    data.totalSeasons = mediaItem.totalSeasons || 1;
    data.status = mediaItem.status || 'Unknown';
    data.nextEpisode = { season: 1, episode: 1 };
    data.watchProgress = {};
    data.totalEpisodesPerSeason = mediaItem.totalEpisodesPerSeason || {};
    data.nextAirDate = mediaItem.nextAirDate || null;
    data.lastWatchedAt = null;
  }

  if (mediaItem.type === 'movie') {
    data.watched = false;
    data.watchedAt = null;
    data.watchedBy = null;
  }

  await setDoc(ref, data);
  return id;
}

// --- Remove item from collection ---
export async function removeFromCollection(householdId, itemId) {
  await deleteDoc(itemRef(householdId, itemId));
}

// --- Mark movie as watched ---
export async function markMovieWatched(householdId, itemId, userId, watched = true) {
  await updateDoc(itemRef(householdId, itemId), {
    watched,
    watchedAt: watched ? serverTimestamp() : null,
    watchedBy: watched ? userId : null,
  });
}

// --- Toggle episode watched ---
export async function toggleEpisodeWatched(householdId, itemId, season, episode, watched, userId) {
  const ref = itemRef(householdId, itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Item not found in collection');

  const data = snap.data();
  const progressKey = `s${season}`;
  const episodeKey = `e${episode}`;

  const currentProgress = data.watchProgress || {};
  const currentSeason = currentProgress[progressKey] || {};

  const updatedProgress = {
    ...currentProgress,
    [progressKey]: {
      ...currentSeason,
      [episodeKey]: watched,
    },
  };

  // Recalculate next episode
  const nextEpisode = calculateNextEpisode(updatedProgress, data.totalSeasons, data.totalEpisodesPerSeason || {});

  await updateDoc(ref, {
    watchProgress: updatedProgress,
    nextEpisode,
    lastWatchedAt: serverTimestamp(),
    lastWatchedBy: userId,
  });
}

// --- Mark all episodes in a season as watched ---
export async function markSeasonWatched(householdId, itemId, season, episodeCount, watched, userId) {
  const ref = itemRef(householdId, itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const progressKey = `s${season}`;
  const currentProgress = data.watchProgress || {};

  const seasonData = {};
  for (let ep = 1; ep <= episodeCount; ep++) {
    seasonData[`e${ep}`] = watched;
  }

  const updatedProgress = {
    ...currentProgress,
    [progressKey]: seasonData,
  };

  const updatedTotalEpisodesPerSeason = {
    ...(data.totalEpisodesPerSeason || {}),
    [progressKey]: episodeCount,
  };

  const nextEpisode = calculateNextEpisode(updatedProgress, data.totalSeasons, updatedTotalEpisodesPerSeason);

  await updateDoc(ref, {
    watchProgress: updatedProgress,
    totalEpisodesPerSeason: updatedTotalEpisodesPerSeason,
    nextEpisode,
    lastWatchedAt: serverTimestamp(),
    lastWatchedBy: userId,
  });
}

// --- Update show metadata (e.g., after fetching fresh TMDB data) ---
export async function updateShowMetadata(householdId, itemId, updates) {
  await updateDoc(itemRef(householdId, itemId), updates);
}

// --- Real-time listener for the full collection ---
export function subscribeToCollection(householdId, callback) {
  const q = query(collectionRef(householdId), orderBy('addedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => {
      const data = d.data();
      const item = { id: d.id, ...data };
      if (item.type === 'tv') {
        item.nextEpisode = calculateNextEpisode(
          item.watchProgress || {},
          item.totalSeasons || 1,
          item.totalEpisodesPerSeason || {}
        );
      }
      return item;
    });
    callback(items);
  }, (error) => {
    console.error('Collection listener error:', error);
  });
}

// --- Real-time listener for a single item ---
export function subscribeToItem(householdId, itemId, callback) {
  return onSnapshot(itemRef(householdId, itemId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const item = { id: snap.id, ...data };
      if (item.type === 'tv') {
        item.nextEpisode = calculateNextEpisode(
          item.watchProgress || {},
          item.totalSeasons || 1,
          item.totalEpisodesPerSeason || {}
        );
      }
      callback(item);
    } else {
      callback(null);
    }
  });
}

// --- Helper: calculate next unwatched episode ---
export function calculateNextEpisode(watchProgress = {}, totalSeasons = 1, totalEpisodesPerSeason = {}) {
  for (let s = 1; s <= (totalSeasons || 1); s++) {
    const seasonData = watchProgress[`s${s}`] || {};
    const epCount = totalEpisodesPerSeason[`s${s}`];

    if (epCount !== undefined && epCount !== null && epCount > 0) {
      for (let ep = 1; ep <= epCount; ep++) {
        if (!seasonData[`e${ep}`]) {
          return { season: s, episode: ep };
        }
      }
    } else {
      const episodeKeys = Object.keys(seasonData).filter(k => k.startsWith('e'));
      const episodeNums = episodeKeys.map(k => parseInt(k.slice(1), 10)).filter(n => !isNaN(n));
      const maxEpInProgress = episodeNums.length > 0 ? Math.max(...episodeNums) : 0;

      for (let ep = 1; ep <= maxEpInProgress; ep++) {
        if (!seasonData[`e${ep}`]) {
          return { season: s, episode: ep };
        }
      }

      if (maxEpInProgress === 0) {
        return { season: s, episode: 1 };
      }
    }
  }
  return null; // all watched
}

// --- Get collection stats ---
export function getCollectionStats(items) {
  const shows = items.filter(i => i.type === 'tv');
  const movies = items.filter(i => i.type === 'movie');
  const watchedMovies = movies.filter(i => i.watched);

  return { shows: shows.length, movies: movies.length, watchedMovies: watchedMovies.length };
}
