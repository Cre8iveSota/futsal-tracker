import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const CONFIG_KEY = 'futsalTrackerFirebaseConfig';

export function getStoredConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeConfig(configObj) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configObj));
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

let dbInstance = null;
let authInstance = null;

export function initFirebase(config) {
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
  return { db: dbInstance, auth: authInstance };
}

export function watchMatches(callback, onError) {
  const q = query(collection(dbInstance, 'matches'), orderBy('date', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(matches);
    },
    onError,
  );
}

export async function addMatch(match) {
  await addDoc(collection(dbInstance, 'matches'), match);
}

export async function updateMatch(id, match) {
  await updateDoc(doc(dbInstance, 'matches', id), match);
}

export async function deleteMatch(id) {
  await deleteDoc(doc(dbInstance, 'matches', id));
}

// 初回のみ: コレクションが空なら過去データを一括投入する。
export async function seedIfEmpty(seedMatches) {
  const snap = await getDocs(collection(dbInstance, 'matches'));
  if (!snap.empty) return false;
  const batch = writeBatch(dbInstance);
  seedMatches.forEach((m) => {
    const ref = doc(collection(dbInstance, 'matches'));
    batch.set(ref, m);
  });
  await batch.commit();
  return true;
}

export function watchAuth(callback) {
  return onAuthStateChanged(authInstance, callback);
}

export async function signIn() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(authInstance, provider);
}

export async function signOutUser() {
  await signOut(authInstance);
}
