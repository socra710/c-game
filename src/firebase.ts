import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, type User } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Object.values(firebaseConfig).every(Boolean);

export const app = firebaseEnabled ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function loginGuest(): Promise<User | null> {
  if (!auth) return null;

  if (!auth.currentUser) {
    const result = await signInAnonymously(auth);
    return result.user;
  }

  return auth.currentUser;
}

export async function logoutGuest(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function saveLeaderboardEntry(uid: string, name: string, totalLines: number): Promise<void> {
  if (!db) return;

  await setDoc(
    doc(db, 'leaderboard', uid),
    {
      uid,
      name,
      totalLines,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
