// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase configuration - you'll need to add your config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log configuration status (without exposing sensitive data)
console.log('🔧 Firebase Config Status:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing'
});

// Initialize Firebase
let app, auth, googleProvider;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
}

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initError, setInitError] = useState(null);

    // Check if Firebase is properly configured
    useEffect(() => {
        const missingVars = [];
        if (!import.meta.env.VITE_FIREBASE_API_KEY) missingVars.push('VITE_FIREBASE_API_KEY');
        if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
        if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missingVars.push('VITE_FIREBASE_PROJECT_ID');
        if (!import.meta.env.VITE_FIREBASE_APP_ID) missingVars.push('VITE_FIREBASE_APP_ID');

        if (missingVars.length > 0) {
            setInitError(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
            setLoading(false);
            return;
        }
    }, []);

    // Sign up with email and password
    const signup = async (email, password, displayName = null) => {
        try {
            setError(null);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Optionally update display name
            if (displayName && userCredential.user) {
                await userCredential.user.updateProfile({ displayName });
            }

            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign in with email and password
    const login = async (email, password) => {
        try {
            setError(null);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign in with Google
    const loginWithGoogle = async () => {
        try {
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign out
    const logout = async () => {
        try {
            setError(null);
            // Clear user-specific localStorage data
            const keysToRemove = ['chatHistory', 'currentChatId', 'generated_images'];
            keysToRemove.forEach(key => localStorage.removeItem(key));

            await signOut(auth);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Listen for auth state changes
    useEffect(() => {
        if (initError) return; // Don't set up listener if there's an init error

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);

            // When user changes, clear the previous user's data
            if (!user) {
                const keysToRemove = ['chatHistory', 'currentChatId', 'generated_images'];
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
        });

        return unsubscribe;
    }, [initError]);

    const value = {
        currentUser,
        loading,
        error,
        signup,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated: !!currentUser
    };

    // Show error UI if Firebase is not configured
    if (initError) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{
                    maxWidth: '600px',
                    padding: '2rem',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    border: '2px solid #ff4444'
                }}>
                    <h1 style={{ color: '#ff4444', marginBottom: '1rem' }}>⚠️ Configuration Error</h1>
                    <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                        Firebase is not properly configured. Please follow these steps:
                    </p>
                    <ol style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                        <li>Create a <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>.env</code> file in the project root</li>
                        <li>Copy the contents from <code style={{ backgroundColor: '#1a1a1a', padding: '2px 6px', borderRadius: '4px' }}>.env.example</code></li>
                        <li>Fill in your Firebase credentials from the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4a9eff' }}>Firebase Console</a></li>
                        <li>Restart the development server</li>
                    </ol>
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#ff8888'
                    }}>
                        <strong>Error:</strong> {initError}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export { auth };
