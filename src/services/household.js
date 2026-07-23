// src/services/household.js
// Manages the shared household concept — you + your wife share one household

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateUserProfile, getUserProfile } from './auth';

// Generate a random invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new household for the current user
export async function createHousehold(userId) {
  const inviteCode = generateInviteCode();
  const householdRef = doc(collection(db, 'households'));

  await setDoc(householdRef, {
    members: [userId],
    inviteCode,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  // Link household to user
  await updateUserProfile(userId, { householdId: householdRef.id });

  return { id: householdRef.id, inviteCode };
}

// Join an existing household using an invite code
export async function joinHousehold(userId, inviteCode) {
  const code = inviteCode.trim().toUpperCase();

  // Find household with this invite code
  const q = query(collection(db, 'households'), where('inviteCode', '==', code));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('Invalid invite code. Please check and try again.');

  const householdDoc = snap.docs[0];
  const householdId = householdDoc.id;
  const data = householdDoc.data();

  if (data.members.length >= 2) throw new Error('This household already has 2 members.');
  if (data.members.includes(userId)) throw new Error('You are already in this household.');

  // Add user to household
  await updateDoc(doc(db, 'households', householdId), {
    members: arrayUnion(userId),
  });

  // Link household to user
  await updateUserProfile(userId, { householdId });

  return householdId;
}

// Get household data
export async function getHousehold(householdId) {
  const snap = await getDoc(doc(db, 'households', householdId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get all members of a household with their profiles
export async function getHouseholdMembers(householdId) {
  const household = await getHousehold(householdId);
  if (!household) return [];

  const profiles = await Promise.all(
    household.members.map(uid => getUserProfile(uid))
  );
  return profiles.filter(Boolean);
}

// Regenerate invite code
export async function regenerateInviteCode(householdId) {
  const newCode = generateInviteCode();
  await updateDoc(doc(db, 'households', householdId), { inviteCode: newCode });
  return newCode;
}
