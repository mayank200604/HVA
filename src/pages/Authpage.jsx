import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const toggle = () => setIsLogin((v) => !v);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate Supabase auth here
    navigate("/app");
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
              Secure login powered by Supabase Auth (email / Google / etc.).
            </p>
          </div>
          <div className="mt-auto text-xs text-slate-400">
            <p>LLM routing · Voice chat · PWA ready</p>
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

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {!isLogin && (
              <div>
                <label className="mb-1 block text-slate-300">Name</label>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-slate-300">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-300">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-cyan-400 py-2 text-sm font-medium text-black shadow-lg shadow-cyan-400/40 hover:bg-cyan-300"
            >
              {isLogin ? "Continue" : "Create account"}
            </button>
          </form>

          <button
            onClick={toggle}
            className="mt-4 w-full rounded-xl border border-slate-700 py-2 text-xs text-slate-200 hover:bg-slate-900"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
