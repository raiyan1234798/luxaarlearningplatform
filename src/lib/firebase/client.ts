
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDgdSeApfy-CFiOCaQPnWdha50MJmARFFY",
    authDomain: "luxaarlearning.firebaseapp.com",
    projectId: "luxaarlearning",
    storageBucket: "luxaarlearning.firebasestorage.app",
    messagingSenderId: "961293373315",
    appId: "1:961293373315:web:c35162fdd80cdcad6fb0b6",
    measurementId: "G-0FLYPXNK9Y"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Initialize analytics only on client side
let analytics = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, storage, googleProvider, githubProvider, analytics };
