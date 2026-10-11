import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration for GoML PreQ platform
// Replace with your Firebase Project Configuration from https://console.firebase.google.com
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAkoyCx5uTq_gbJgpAGwJh_W0wRW0O8xq8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "goml-preq.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "goml-preq",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "goml-preq.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "790826964096",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:790826964096:web:eb930d91f7a18852b04265"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure Microsoft OAuth Provider
export const microsoftProvider = new OAuthProvider('microsoft.com');

// Set Microsoft 365 OAuth Parameters & Scopes
microsoftProvider.setCustomParameters({
  prompt: 'select_account',
  tenant: 'organizations' // Directs to Microsoft 365 / Azure AD corporate accounts
});

microsoftProvider.addScope('openid');
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('User.Read');

export { signInWithPopup, signOut, onAuthStateChanged };
