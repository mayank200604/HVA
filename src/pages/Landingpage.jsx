import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ParticleSphere from "../shared/ParticleSphere";

// Simple hook for scroll-triggered animations
function useInView(options = { threshold: 0.2 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, inView];
}

export default function LandingPage() {
  // Mouse-follow glow
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Active capability for explanation
  const [activeCapability, setActiveCapability] = useState(null);

  // Scroll-triggered sections
  const [featuresRef, featuresInView] = useInView();
  const [capabilitiesRef, capabilitiesInView] = useInView();
  const [roadmapRef, roadmapInView] = useInView();
  const [stackRef, stackInView] = useInView();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Mouse-follow glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="mouse-glow"
          style={{
            transform: `translate3d(${mousePos.x - 130}px, ${mousePos.y - 130
              }px, 0)`,
          }}
        />
      </div>

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee22,_transparent_60%),radial-gradient(circle_at_bottom,_#a855f722,_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-32 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />

      {/* NAVBAR */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 border border-cyan-400/60 shadow-[0_0_30px_rgba(45,212,191,0.5)]">
            <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-500" />
          </div>
          <span className="text-sm font-semibold tracking-tight md:text-base">
            Hybrid Voice Assistant
          </span>
        </div>

        <nav className="hidden items-center gap-6 text-xs text-slate-300 md:flex">
          <a href="#features" className="hover:text-slate-50">
            Features
          </a>
          <a href="#capabilities" className="hover:text-slate-50">
            Capabilities
          </a>
          <a href="#roadmap" className="hover:text-slate-50">
            Roadmap
          </a>
          <Link
            to="/auth"
            className="rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-1.5 text-xs hover:bg-slate-800/80"
          >
            Log in
          </Link>
        </nav>

        <Link
          to="/auth"
          className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs md:hidden"
        >
          Log in
        </Link>
      </header>

      {/* HERO */}
      <main className="relative z-10 px-6 pb-16 pt-4 md:px-12">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 section-visible">
          {/* LEFT HERO */}
          <div>
            {/* PHASE INDICATOR */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-[11px] text-emerald-300 mb-4 glow-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Phase 1 · Multi-Level AI Chat System</span>
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              A{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                voice-first AI console
              </span>{" "}
              built for developers.
            </h1>

            <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base leading-relaxed">
              An intelligent multi-level chat system with advanced reasoning, code generation,
              image creation, and RAG-powered career guidance. Built on a foundation designed
              for voice interaction.
            </p>

            {/* CTA BUTTONS */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/auth"
                className="rounded-full bg-cyan-400 px-7 py-2.5 text-sm font-medium text-black shadow-lg shadow-cyan-400/40 transition hover:translate-y-0.5 hover:bg-cyan-300"
              >
                Get started free
              </Link>

              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-2 text-sm text-slate-200 hover:bg-slate-900/70"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px]">
                  ▶
                </span>
                Live demo
              </Link>
            </div>

            {/* TECH STACK BADGES */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Powered by</span>
              {["Groq", "Gemini", "Flux", "ChromaDB"].map((tech, idx) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-0.5 text-[10px] text-slate-300 float-badge"
                  style={{ animationDelay: `${idx * 0.2}s` }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT HERO — ORB WITH ORBITING NODES */}
          <div className="relative flex items-center justify-center">
            {/* Main Sphere Container with Orbiting Nodes */}
            <div className="relative flex h-[480px] w-[480px] items-center justify-center">

              {/* Orbiting Capability Nodes */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Node 1: Chat */}
                <div className="orbit-node orbit-node-1 absolute">
                  <div className="relative group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-900/40 backdrop-blur-sm opacity-60 orbit-node">
                      <svg className="w-5 h-5 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="orbit-tooltip absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[9px] text-cyan-300 backdrop-blur-sm border border-cyan-400/20">
                      Normal Chat
                    </div>
                  </div>
                </div>

                {/* Node 2: Code */}
                <div className="orbit-node orbit-node-2 absolute">
                  <div className="relative group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/20 bg-slate-900/40 backdrop-blur-sm opacity-60 orbit-node">
                      <svg className="w-5 h-5 text-violet-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div className="orbit-tooltip absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[9px] text-violet-300 backdrop-blur-sm border border-violet-400/20">
                      Code & Reasoning
                    </div>
                  </div>
                </div>

                {/* Node 3: Image */}
                <div className="orbit-node orbit-node-3 absolute">
                  <div className="relative group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/20 bg-slate-900/40 backdrop-blur-sm opacity-60 orbit-node">
                      <svg className="w-5 h-5 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="orbit-tooltip absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[9px] text-emerald-300 backdrop-blur-sm border border-emerald-400/20">
                      Image Generation
                    </div>
                  </div>
                </div>

                {/* Node 4: Speed */}
                <div className="orbit-node orbit-node-4 absolute">
                  <div className="relative group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/20 bg-slate-900/40 backdrop-blur-sm opacity-60 orbit-node">
                      <svg className="w-5 h-5 text-sky-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="orbit-tooltip absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[9px] text-sky-300 backdrop-blur-sm border border-sky-400/20">
                      Instant Response
                    </div>
                  </div>
                </div>

                {/* Node 5: RAG */}
                <div className="orbit-node orbit-node-5 absolute">
                  <div className="relative group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/20 bg-slate-900/40 backdrop-blur-sm opacity-60 orbit-node">
                      <svg className="w-5 h-5 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="orbit-tooltip absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[9px] text-amber-300 backdrop-blur-sm border border-amber-400/20">
                      RAG Intelligence
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Sphere */}
              <div
                className="relative flex h-[480px] w-[480px] items-center justify-center transition-all duration-500"
              >
                <div className="pointer-events-none absolute inset-8 rounded-full bg-[radial-gradient(circle,_#06b6d422,_transparent_70%)] blur-2xl animate-pulse" />
                <ParticleSphere size={380} showBorder={false} />
              </div>
            </div>
          </div>
        </section>

        {/* CAPABILITY EXPLANATION SECTION */}
        <section className="mt-12 section-visible relative">
          {/* Subtle connector gradient from sphere */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-cyan-400/20 via-cyan-400/10 to-transparent" />

          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
              What Can It Do?
            </h2>
            <p className="mt-3 text-sm text-slate-300 opacity-90">
              Hover over each capability to learn more ↓
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {[
              {
                id: 'chat',
                title: 'Normal Chat',
                icon: '💬',
                color: 'cyan',
                shortDesc: 'Everyday conversation',
                explanation: 'Handle casual conversations, answer questions, and provide information just like chatting with a knowledgeable assistant. Perfect for quick queries and general discussions.'
              },
              {
                id: 'code',
                title: 'Code & Reasoning',
                icon: '⚡',
                color: 'violet',
                shortDesc: 'Technical problem-solving',
                explanation: 'Tackle complex coding challenges, debug issues, explain algorithms, and provide detailed technical analysis. Powered by advanced models optimized for deep reasoning.'
              },
              {
                id: 'image',
                title: 'Image Creation',
                icon: '🎨',
                color: 'emerald',
                shortDesc: 'Text-to-image generation',
                explanation: 'Transform your ideas into high-quality images using natural language descriptions. Powered by Flux.1 for creative visual content generation.'
              },
              {
                id: 'speed',
                title: 'Instant Response',
                icon: '⚡',
                color: 'sky',
                shortDesc: 'Low-latency streaming',
                explanation: 'Experience near-zero latency with token-by-token streaming responses. Answers appear as they\'re generated, providing a fluid, real-time interaction.'
              },
              {
                id: 'rag',
                title: 'Student Career Guidance',
                icon: '🎓',
                color: 'amber',
                shortDesc: 'RAG-powered career support',
                explanation: 'Specialized system for student career guidance. First retrieves verified, curated information from a trusted knowledge base, then generates personalized answers—making guidance more accurate and reliable than normal chat. Ideal for exploring career paths and making informed decisions.'
              }
            ].map((capability) => (
              <div
                key={capability.id}
                className="relative group"
                onMouseEnter={() => setActiveCapability(capability.id)}
                onMouseLeave={() => setActiveCapability(null)}
              >
                <div className={`rounded-xl border transition-all duration-300 cursor-pointer ${activeCapability === capability.id
                  ? `border-${capability.color}-400/60 bg-slate-900/80 shadow-[0_0_30px_rgba(var(--glow-rgb),0.3)]`
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}>
                  <div className="p-4">
                    <div className="text-2xl mb-2">{capability.icon}</div>
                    <h3 className={`text-sm font-semibold mb-1 transition-colors ${activeCapability === capability.id
                      ? `text-${capability.color}-300`
                      : 'text-slate-50'
                      }`}>
                      {capability.title}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {capability.shortDesc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Explanation Panel */}
          <div className="mt-6 min-h-[100px]">
            {activeCapability ? (
              <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 backdrop-blur-sm animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/60 flex-shrink-0">
                    <span className="text-xl">
                      {[
                        { id: 'chat', icon: '💬' },
                        { id: 'code', icon: '⚡' },
                        { id: 'image', icon: '🎨' },
                        { id: 'speed', icon: '⚡' },
                        { id: 'rag', icon: '🎓' }
                      ].find(c => c.id === activeCapability)?.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-50 mb-2">
                      {[
                        { id: 'chat', title: 'Normal Chat' },
                        { id: 'code', title: 'Code & Reasoning' },
                        { id: 'image', title: 'Image Creation' },
                        { id: 'speed', title: 'Instant Response' },
                        { id: 'rag', title: 'Student Career Guidance System' }
                      ].find(c => c.id === activeCapability)?.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {[
                        { id: 'chat', text: 'Handle casual conversations, answer questions, and provide information just like chatting with a knowledgeable assistant. Perfect for quick queries and general discussions.' },
                        { id: 'code', text: 'Tackle complex coding challenges, debug issues, explain algorithms, and provide detailed technical analysis. Powered by advanced models optimized for deep reasoning.' },
                        { id: 'image', text: 'Transform your ideas into high-quality images using natural language descriptions. Powered by Flux.1 for creative visual content generation.' },
                        { id: 'speed', text: 'Experience near-zero latency with token-by-token streaming responses. Answers appear as they\'re generated, providing a fluid, real-time interaction.' },
                        { id: 'rag', text: 'Specialized system for student career guidance. First retrieves verified, curated information from a trusted knowledge base, then generates personalized answers—making guidance more accurate and reliable than normal chat. Ideal for exploring career paths and making informed decisions.' }
                      ].find(c => c.id === activeCapability)?.text}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800/40 bg-slate-950/40 p-6 text-center">
                <p className="text-xs text-slate-400">
                  Hover over a capability above to see detailed information
                </p>
              </div>
            )}
          </div>
        </section>

        {/* PHASE 1 FEATURES */}
        <section
          id="features"
          ref={featuresRef}
          className={`mt-20 ${featuresInView ? "section-visible" : "section-hidden"
            }`}
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-50">
              Phase 1 Core Features
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Production-ready AI capabilities available now
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Multi-Level Chat",
                icon: "💬",
                body: "Intelligent conversation handling across normal chat, complex reasoning, and code generation with context awareness.",
              },
              {
                title: "Code & Reasoning",
                icon: "⚡",
                body: "Advanced problem-solving with Groq and Gemini models. Optimized for technical queries and development tasks.",
              },
              {
                title: "Image Generation",
                icon: "🎨",
                body: "Text-to-image creation using Flux.1 via Hugging Face. Generate high-quality visuals from natural language.",
              },
              {
                title: "RAG Career Guidance",
                icon: "🎓",
                body: "Document-grounded answers for student career planning. ChromaDB-powered semantic search with context retention.",
              },
              {
                title: "Instant Responses",
                icon: "⚡",
                body: "Low-latency streaming with Server-Sent Events. Token-by-token delivery for perceived zero-latency interaction.",
              },
              {
                title: "Self-Hosted Memory",
                icon: "🧠",
                body: "Local SQLite + ChromaDB storage. Your conversations and context stay in your stack, no vendor lock-in.",
              },
            ].map((card, idx) => (
              <div
                key={card.title}
                className={`group rounded-2xl border border-slate-800 bg-slate-950/70 p-6 backdrop-blur hover-lift hover:border-cyan-400/70 hover:bg-slate-900/90 card-stagger-${idx + 1}`}
              >
                <div className="text-3xl mb-3 icon-bounce">{card.icon}</div>
                <h3 className="text-base font-semibold text-slate-50 mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CAPABILITIES BREAKDOWN */}
        <section
          id="capabilities"
          ref={capabilitiesRef}
          className={`mt-16 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 ${capabilitiesInView ? "section-visible" : "section-hidden"
            }`}
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-50">
              Intelligent Model Routing
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Automatically selects the optimal model for each query type
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                badge: "Speed",
                model: "Groq · Llama-3",
                use: "General conversation",
                description: "Lightning-fast responses for everyday queries and casual interaction.",
                color: "cyan",
              },
              {
                badge: "Depth",
                model: "Gemini · Flash/Pro",
                use: "Code & reasoning",
                description: "Advanced problem-solving, code generation, and complex technical analysis.",
                color: "violet",
              },
              {
                badge: "Media",
                model: "Flux.1 · Hugging Face",
                use: "Image generation",
                description: "High-quality text-to-image synthesis for creative and visual tasks.",
                color: "emerald",
              },
            ].map((item, idx) => (
              <div
                key={item.badge}
                className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-5 hover-lift card-stagger-${idx + 1}`}
              >
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--glow-color),_transparent_60%)] opacity-20`}
                  style={{ '--glow-color': item.color === 'cyan' ? '#22d3ee' : item.color === 'violet' ? '#a855f7' : '#10b981' }}
                />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-slate-200 mb-3">
                    <span className={`h-1.5 w-1.5 rounded-full bg-${item.color}-400`} />
                    {item.badge}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50 mb-1">
                    {item.model}
                  </h3>
                  <p className="text-[11px] text-cyan-300 mb-2">{item.use}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PHASE 2 ROADMAP */}
        <section
          id="roadmap"
          ref={roadmapRef}
          className={`mt-16 rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/40 to-slate-950/40 p-6 md:p-8 ${roadmapInView ? "section-visible" : "section-hidden"
            }`}
        >
          <div className="flex items-start gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-sm">🚀</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                Coming Next · Phase 2
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Voice-first interaction layer (not yet implemented)
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Voice Assistant",
                description: "Full voice interaction with wake word detection and continuous conversation.",
              },
              {
                title: "Speech Processing",
                description: "Real-time speech-to-text and text-to-speech with Whisper and Coqui TTS integration.",
              },
              {
                title: "NLP Understanding",
                description: "Semantic and emotional analysis for context-aware voice responses.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-700/40 bg-slate-900/30 p-4"
              >
                <h3 className="text-sm font-medium text-slate-300 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 italic">
              Phase 2 features are planned for future release. Current implementation focuses on
              the multi-level chat system foundation.
            </p>
          </div>
        </section>

        {/* STACK STRIP */}
        <section
          id="stack"
          ref={stackRef}
          className={`mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 px-5 py-4 text-xs text-slate-300 ${stackInView ? "section-visible" : "section-hidden"
            }`}
        >
          <span className="text-slate-200 font-medium">Built with modern tools</span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              "React",
              "Vite",
              "FastAPI",
              "SQLite",
              "Groq",
              "Gemini",
              "ChromaDB",
              "Flux.1",
            ].map((item, idx) => (
              <span
                key={item}
                className="rounded-full border border-slate-700/80 shimmer-badge px-3 py-1 text-[10px]"
                style={{ animationDelay: `${idx * 0.3}s` }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 px-6 py-4 md:px-12 mt-16">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Hybrid Voice Assistant · Phase 1 · Developer-first AI console</span>
          <div className="flex gap-2">
            <Link
              to="/auth"
              className="rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-medium text-black hover:bg-cyan-300"
            >
              Start building
            </Link>
            <Link
              to="/app"
              className="rounded-full border border-slate-700 px-4 py-1.5 text-xs hover:bg-slate-900"
            >
              Try demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}