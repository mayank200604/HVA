import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { signup, login, loginWithGoogle } = useAuth();

  const toggle = () => {
    setIsLogin((v) => !v);
    setError("");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        await login(formData.email, formData.password);
      } else {
        // Signup
        if (!formData.name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        await signup(formData.email, formData.password, formData.name);
      }

      // Success - navigate to app
      navigate("/app");
    } catch (err) {
      console.error("Auth error:", err);

      // User-friendly error messages
      let errorMessage = "An error occurred. Please try again.";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials or create a new account.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage = "Email/Password authentication is not enabled. Please contact support.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate("/app");
    } catch (err) {
      console.error("Google sign-in error:", err);

      let errorMessage = "Google sign-in failed. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee22,_transparent_55%),radial-gradient(circle_at_bottom,_#a855f722,_transparent_55%)]" />
      <div className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur">
        <div className="hidden flex-1 flex-col justify-between border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-950 p-8 md:flex">
          <div>
            <h2 className="text-2xl font-semibold text-slate-50">
              Welcome to Hybrid Voice Assistant
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Secure authentication powered by Firebase. Each user gets their own private chat history.
            </p>
          </div>
          <div className="mt-auto text-xs text-slate-400">
            <p>🔒 Secure · 💬 Private chats · 🎨 Image generation</p>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-50">
              {isLogin ? "Log in" : "Create your account"}
            </h3>
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Back to home
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {!isLogin && (
              <div>
                <label className="mb-1 block text-slate-300">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="••••••••"
                disabled={loading}
              />
              {!isLogin && (
                <p className="mt-1 text-xs text-slate-400">
                  At least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-cyan-400 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-400/40 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? "Logging in..." : "Creating account..."}</span>
                </>
              ) : (
                <span>{isLogin ? "Continue" : "Create account"}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="text-xs text-slate-400">OR</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={toggle}
            disabled={loading}
            className="mt-4 w-full rounded-xl border border-slate-700 py-2 text-xs text-slate-200 hover:bg-slate-900 disabled:opacity-50"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}