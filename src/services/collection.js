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

  const nextEpisode = calculateNextEpisode(updatedProgress, data.totalSeasons, data.totalEpisodesPerSeason || {});

  await updateDoc(ref, {
    watchProgress: updatedProgress,
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
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (error) => {
    console.error('Collection listener error:', error);
  });
}

// --- Real-time listener for a single item ---
export function subscribeToItem(householdId, itemId, callback) {
  return onSnapshot(itemRef(householdId, itemId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    else callback(null);
  });
}

// --- Helper: calculate next unwatched episode ---
function calculateNextEpisode(watchProgress, totalSeasons, totalEpisodesPerSeason) {
  for (let s = 1; s <= (totalSeasons || 20); s++) {
    const seasonData = watchProgress[`s${s}`] || {};
    const epCount = totalEpisodesPerSeason[`s${s}`] || 30; // fallback

    for (let ep = 1; ep <= epCount; ep++) {
      if (!seasonData[`e${ep}`]) {
        return { season: s, episode: ep };
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
