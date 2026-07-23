// src/services/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export async function registerUser(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email,
    displayName,
    householdId: null,
    createdAt: serverTimestamp(),
  });

  return user;
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  return signOut(auth);
}

export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  return setDoc(doc(db, 'users', uid), data, { merge: true });
}
