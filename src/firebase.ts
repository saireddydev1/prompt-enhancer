import { initializeApp } from 'firebase/app';
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithRedirect,
	signOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
	googleProvider.setCustomParameters({ prompt: 'select_account' });

	try {
		await signInWithPopup(auth, googleProvider);
	} catch (error) {
		const code = (error as { code?: string } | null)?.code || '';
		const shouldUseRedirect =
			code.includes('auth/popup-blocked') ||
			code.includes('auth/cancelled-popup-request') ||
			code.includes('auth/operation-not-supported-in-this-environment');

		if (shouldUseRedirect) {
			await signInWithRedirect(auth, googleProvider);
			return;
		}

		throw error;
	}
};
export const signUpWithEmailPassword = (email: string, password: string) =>
	createUserWithEmailAndPassword(auth, email, password);
export const loginWithEmailPassword = (email: string, password: string) =>
	signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
