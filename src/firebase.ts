import { initializeApp } from 'firebase/app';
import {
	getAuth,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	GoogleAuthProvider,
	signInWithPopup,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firestoreDatabaseId = (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '').trim();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firestoreDatabaseId
	? getFirestore(app, firestoreDatabaseId)
	: getFirestore(app);
export const signUpWithEmailPassword = (email: string, password: string) =>
	createUserWithEmailAndPassword(auth, email, password);
export const loginWithEmailPassword = (email: string, password: string) =>
	signInWithEmailAndPassword(auth, email, password);
export const signInWithGoogle = () =>
	signInWithPopup(auth, new GoogleAuthProvider());
export const logout = () => signOut(auth);
