import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
];

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    console.error(
        `%c🔥 Firebase Init Error: Missing environment variables: ${missingKeys.join(', ')}`,
        'color: red; font-weight: bold; font-size: 14px;'
    );
    console.warn(
        'Make sure these variables are defined in your .env file locally (prefixed with VITE_) ' +
        'and in your Vercel Project Settings > Environment Variables.'
    );
}

let app;
let auth;

try {
    // Only initialize if we have the critical apiKey to avoid immediate crash
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        console.log('✅ Firebase initialized successfully');
    } else {
        throw new Error("Missing Firebase API Key");
    }
} catch (error) {
    console.error("❌ Firebase Initialization Failed:", error);
}

export { auth };
export default app;
