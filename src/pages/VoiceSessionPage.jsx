import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleSphere from '../shared/ParticleSphere';

export default function VoiceSessionPage() {
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 relative overflow-hidden">
            {/* Background glows */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee22,_transparent_60%),radial-gradient(circle_at_bottom,_#a855f722,_transparent_60%)]" />
            <div className="pointer-events-none absolute -left-32 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12 border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 border border-cyan-400/60 shadow-[0_0_30px_rgba(45,212,191,0.5)]">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-500" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight md:text-base">
                        Voice Preview
                    </span>
                </div>
                <button
                    onClick={() => navigate('/app')}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                    ← Back to Chat
                </button>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center px-6 py-12 md:px-12 min-h-[calc(100vh-80px)]">
                {/* Live Rotating Sphere */}
                <div className="mb-12">
                    <div
                        className="relative flex h-[400px] w-[400px] items-center justify-center transition-all duration-500"
                    >
                        <div className="pointer-events-none absolute inset-8 rounded-full bg-[radial-gradient(circle,_#06b6d422,_transparent_70%)] blur-2xl animate-pulse" />
                        <ParticleSphere
                            size={400}
                            isActive={true}
                            isListening={isListening}
                            showBorder={false}
                        />

                        {/* Listening indicator ring */}
                        {isListening && (
                            <div className="absolute inset-0 rounded-full border-4 border-violet-400/40 animate-ping" />
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => setIsListening(!isListening)}
                        className={`group relative flex items-center gap-3 rounded-full px-8 py-4 text-sm font-medium transition-all duration-300 ${isListening
                            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/50 hover:shadow-xl hover:shadow-violet-500/60'
                            : 'bg-gradient-to-r from-cyan-400 to-violet-400 text-black shadow-lg shadow-cyan-400/40 hover:shadow-xl hover:scale-105'
                            }`}
                    >
                        {isListening ? (
                            <>
                                <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                                <span>Listening...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <span>Speak</span>
                            </>
                        )}
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="group relative flex items-center gap-3 rounded-full border-2 border-slate-700 bg-slate-900/50 px-8 py-4 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/70 hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 rounded-full bg-slate-700/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    </button>
                </div >

                {/* Phase 2 Notice */}
                < div className="max-w-md text-center" >
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-xs text-amber-300 mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Available at Phase 2</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Voice interaction capabilities including speech-to-text, text-to-speech, and NLP-based understanding will be available in Phase 2. This is a preview of the voice interface design.
                    </p>
                </div >

                {/* Feature Preview Cards */}
                < div className="mt-12 grid gap-3 md:grid-cols-3 max-w-3xl" >
                    {
                        [
                            {
                                icon: '🎤',
                                title: 'Speech-to-Text',
                                desc: 'Whisper-powered voice recognition'
                            },
                            {
                                icon: '🔊',
                                title: 'Text-to-Speech',
                                desc: 'Natural voice synthesis with Coqui TTS'
                            },
                            {
                                icon: '🧠',
                                title: 'NLP Understanding',
                                desc: 'Semantic and emotional analysis'
                            }
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 backdrop-blur-sm"
                            >
                                <div className="text-2xl mb-2">{feature.icon}</div>
                                <h3 className="text-xs font-semibold text-slate-200 mb-1">
                                    {feature.title}
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    {feature.desc}
                                </p>
                            </div>
                        ))
                    }
                </div >
            </main >
        </div >
    );
}
