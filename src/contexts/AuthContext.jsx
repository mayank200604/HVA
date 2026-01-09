// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase'; // Import from the robust firebase.js

const googleProvider = new GoogleAuthProvider();

// Initialize auth context
const AuthContext = createContext({
    currentUser: null,
    signup: () => Promise.reject("Not initialized"),
    login: () => Promise.reject("Not initialized"),
    loginWithGoogle: () => Promise.reject("Not initialized"),
    logout: () => Promise.reject("Not initialized"),
});

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

    // Initial check for auth instance
    useEffect(() => {
        if (!auth) {
            setInitError("Firebase is not initialized. Check your environment variables and console logs.");
            setLoading(false);
        }
    }, []);

    // Sign up with email and password
    const signup = async (email, password, displayName = null) => {
        if (!auth) throw new Error("Firebase not initialized");
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
        if (!auth) throw new Error("Firebase not initialized");
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
        if (!auth) throw new Error("Firebase not initialized");
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
        if (!auth) throw new Error("Firebase not initialized");
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
        if (!auth) return;

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
    }, []);

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
                        Firebase is not properly configured. Check console for details.
                    </p>
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
