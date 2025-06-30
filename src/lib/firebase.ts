import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

// Check for missing env vars
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    throw new Error(`Missing Firebase config environment variable: ${key}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export interface HighscoreEntry {
  id?: string;
  name: string;
  score: number;
  episode: number;
  config: any;
  mode: 'easy' | 'complex' | 'localMinima';
  timestamp: number;
  userId?: string;
}

// Authentication functions
export async function signInAsGuest(): Promise<{ success: boolean; error?: string }> {
  try {
    await signInAnonymously(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing in as guest:', error);
    return { success: false, error: 'Failed to sign in as guest' };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    return { success: true };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return { success: false, error: 'Failed to sign in with Google' };
  }
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Add a new highscore
export async function addHighscore(entry: Omit<HighscoreEntry, 'id'>): Promise<{ success: boolean; position?: number; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const docRef = await addDoc(collection(db, 'highscores'), {
      ...entry,
      userId: user.uid,
      timestamp: Timestamp.fromMillis(entry.timestamp)
    });
    
    // Get position by fetching all scores and finding position
    const q = query(collection(db, 'highscores'), orderBy('score', 'desc'));
    const querySnapshot = await getDocs(q);
    const scores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const position = scores.findIndex(score => score.id === docRef.id) + 1;
    
    return { success: true, position };
  } catch (error) {
    console.error('Error adding highscore:', error);
    return { success: false, error: 'Failed to save highscore' };
  }
}

// Get all highscores
export async function getHighscores(): Promise<HighscoreEntry[]> {
  try {
    const q = query(collection(db, 'highscores'), orderBy('score', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis() || Date.now()
    })) as HighscoreEntry[];
  } catch (error) {
    console.error('Error getting highscores:', error);
    return [];
  }
}

// Subscribe to highscores changes (real-time updates)
export function subscribeToHighscores(callback: (highscores: HighscoreEntry[]) => void) {
  const q = query(collection(db, 'highscores'), orderBy('score', 'desc'), limit(100));
  
  return onSnapshot(q, (querySnapshot) => {
    const highscores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toMillis() || Date.now()
    })) as HighscoreEntry[];
    
    callback(highscores);
  });
}

export { db, auth }; 