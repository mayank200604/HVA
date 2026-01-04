import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VoiceSessionPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
                    <span className="text-4xl">🎙️</span>
                </div>
                <h1 className="text-2xl font-semibold mb-2">Voice Session</h1>
                <p className="text-slate-400 mb-8">
                    Voice interactions will be available in Phase 2.
                </p>
                <button
                    onClick={() => navigate('/app')}
                    className="rounded-full bg-cyan-400 px-6 py-2 text-black font-medium hover:bg-cyan-300 transition-colors"
                >
                    Back to Chat
                </button>
            </div>
        </div>
    );
}
