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
  // HOW SECTION DATA
  const howSteps = [
    {
      title: "Capture",
      badge: "Input",
      tag: "React PWA",
      description:
        "Your voice or text is captured instantly through the React PWA and wrapped into a signed request.",
    },
    {
      title: "Context & Auth",
      badge: "Brain",
      tag: "Flask + ChromaDB",
      description:
        "Flask authenticates the Supabase session and enriches the request using long-term memory from ChromaDB.",
    },
    {
      title: "Intelligent Routing",
      badge: "Router",
      tag: "Groq · DeepSeek · OpenRouter",
      description:
        "The router analyzes your query and dynamically selects Groq, DeepSeek, or a specialized model via OpenRouter.",
    },
    {
      title: "Answer & Speech",
      badge: "Output",
      tag: "LLM + Coqui",
      description:
        "The response streams back in real time as text, optionally spoken using Coqui TTS.",
    },
  ];

  const [activeStep, setActiveStep] = useState(0);

  // Auto-change every 3s (snappy but not too fast)
  useEffect(() => {
    const timer = setInterval(
      () => setActiveStep((prev) => (prev + 1) % howSteps.length),
      3000
    );
    return () => clearInterval(timer);
  }, []);

  // Mouse-follow glow
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Scroll-triggered sections
  const [featuresRef, featuresInView] = useInView();
  const [howRef, howInView] = useInView();
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
            transform: `translate3d(${mousePos.x - 130}px, ${
              mousePos.y - 130
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
          <a href="#how" className="hover:text-slate-50">
            How it works
          </a>
          <a href="#stack" className="hover:text-slate-50">
            Stack
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
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1 text-[10px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Groq · DeepSeek · Whisper · Coqui · ChromaDB</span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              A{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                voice-first AI console
              </span>{" "}
              built for developers.
            </h1>

            <p className="mt-4 max-w-xl text-sm text-slate-300 md:text-base">
              Speak or type. The intelligent router automatically picks the
              perfect model for speed, depth, or media, while your memory stays
              local in your own stack.
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
          </div>

          {/* RIGHT HERO — ORB (rotates with slider) */}
          <div className="relative flex items-center justify-center">
            <div
              className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full border border-slate-800/80 bg-slate-950/80 shadow-[0_0_90px_rgba(15,23,42,1)] backdrop-blur orb-rotate"
              style={{ transform: `rotate(${activeStep * 10}deg)` }}
            >
              <div className="pointer-events-none absolute inset-10 rounded-full bg-[radial-gradient(circle,_#22d3ee22,_transparent_70%)] blur-xl" />
              <ParticleSphere size={260} />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section
          id="features"
          ref={featuresRef}
          className={`mt-20 grid gap-4 md:grid-cols-3 ${
            featuresInView ? "section-visible" : "section-hidden"
          }`}
        >
          {[
            {
              title: "Hybrid routing",
              body: "Groq for speed, DeepSeek for depth, OpenRouter for media models.",
            },
            {
              title: "Self-hosted memory",
              body: "ChromaDB + Flask remember context long-term without vendor lock-in.",
            },
            {
              title: "PWA ready",
              body: "Install it and use it as a native AI console on desktop or mobile.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-400/70 hover:bg-slate-900/90"
            >
              <div className="mb-3 h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400/60 to-violet-500/60 opacity-80 group-hover:opacity-100" />
              <h3 className="text-sm font-semibold text-slate-50">
                {card.title}
              </h3>
              <p className="mt-2 text-xs text-slate-300">{card.body}</p>
            </div>
          ))}
        </section>

        {/* HOW IT WORKS — PIPELINE SLIDER */}
        <section
          id="how"
          ref={howRef}
          className={`mt-16 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 md:p-8 ${
            howInView ? "section-visible" : "section-hidden"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                From voice to LLM in four hops
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                A live pipeline from mic to model to spoken reply.
              </p>
            </div>

            {/* SLIDER BUTTONS */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <button
                onClick={() =>
                  setActiveStep((prev) =>
                    prev === 0 ? howSteps.length - 1 : prev - 1
                  )
                }
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                ←
              </button>
              <button
                onClick={() =>
                  setActiveStep((prev) => (prev + 1) % howSteps.length)
                }
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                →
              </button>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="mt-5">
            <div className="relative h-1 w-full rounded-full bg-slate-800">
              <div
                className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 transition-all"
                style={{
                  width: `${((activeStep + 1) / howSteps.length) * 100}%`,
                }}
              />
            </div>

            {/* STEP DOTS */}
            <div className="mt-3 flex justify-between text-[10px] text-slate-400">
              {howSteps.map((step, i) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className="flex flex-col items-center gap-1 focus:outline-none"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition ${
                      activeStep === i
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.6)]"
                        : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={
                      activeStep === i ? "text-cyan-200" : "text-slate-500"
                    }
                  >
                    {step.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CARD + RIGHT LIST */}
          <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr,0.8fr] md:items-center">
            {/* ACTIVE CARD */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee22,_transparent_60%)] opacity-40" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    {howSteps[activeStep].badge}
                    <span className="text-slate-500 ml-1">
                      {activeStep + 1}/{howSteps.length}
                    </span>
                  </div>
                  <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-[10px] text-cyan-300">
                    {howSteps[activeStep].tag}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-50">
                  {howSteps[activeStep].title}
                </h3>
                <p className="text-xs text-slate-300">
                  {howSteps[activeStep].description}
                </p>
              </div>
            </div>

            {/* RIGHT LIST (with glow for active) */}
            <div className="flex flex-col gap-3">
              {howSteps.map((step, i) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[11px] transition ${
                    activeStep === i
                      ? "border-cyan-400 bg-slate-900/80 text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,0.4)]"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                  }`}
                >
                  <span>{step.title}</span>
                  <span className="text-[9px] opacity-70">{step.tag}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* STACK STRIP */}
        <section
          id="stack"
          ref={stackRef}
          className={`mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 px-5 py-4 text-xs text-slate-300 ${
            stackInView ? "section-visible" : "section-hidden"
          }`}
        >
          <span className="text-slate-200">Your AI stack. Your rules.</span>
          <div className="flex flex-wrap items-center gap-3">
            {[
              "React",
              "Vite",
              "Flask",
              "Whisper",
              "Groq",
              "DeepSeek",
              "Supabase",
              "ChromaDB",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-700/80 bg-slate-950/80 px-3 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 px-6 py-4 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Hybrid Voice Assistant · Local-first AI interface.</span>
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
