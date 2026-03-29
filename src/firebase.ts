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
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId?.trim();
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
