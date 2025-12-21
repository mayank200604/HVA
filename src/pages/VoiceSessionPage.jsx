import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParticleSphere from "../shared/ParticleSphere";

export default function VoiceSessionPage() {
  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Tap the mic to start speaking.");
  const [error, setError] = useState("");

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const stopRecording = () => {
    if (!isRecording) return;

    setIsRecording(false);
    setStatus("Voice stopped.");

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleSpeak = async () => {
    // if already recording -> stop on second click
    if (isRecording) {
      stopRecording();
      return;
    }

    setError("");
    setStatus("Listening… your mic is live.");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      setIsRecording(true);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        console.log("Recorded audio blob:", blob);

        // 🔥 TODO: send blob to Flask backend + Whisper
        // const form = new FormData();
        // form.append("audio", blob, "recording.webm");
        // await fetch("http://localhost:5000/api/voice", { method: "POST", body: form });
      };

      recorder.start();
    } catch (err) {
      console.error(err);
      setError("Could not access microphone. Check permissions.");
      setIsRecording(false);
      setStatus("Mic access failed.");
    }
  };

  const handleCancel = () => {
    stopRecording();
    navigate("/app");
  };

  useEffect(() => {
    return () => {
      // cleanup if page is left
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-slate-950 text-slate-50 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee33,_transparent_55%),radial-gradient(circle_at_bottom,_#a855f733,_transparent_55%)]" />

      <header className="relative z-10 flex w-full items-center justify-between px-5 py-4 text-xs text-slate-300">
        <div>
          Voice session · {isRecording ? "Recording…" : "Idle"}
        </div>
        <button
          onClick={handleCancel}
          className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-900"
        >
          Back to chat
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <ParticleSphere size={360} />
        <p className="mt-4 text-sm text-slate-300">
          {status}
        </p>
        {error && (
          <p className="text-xs text-rose-400">
            {error}
          </p>
        )}
      </main>

      {/* Speak / Cancel buttons */}
      <div className="relative z-10 mb-10 flex items-center gap-6">
        {/* Mic button */}
        <button
          onClick={handleSpeak}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition
            ${
              isRecording
                ? "bg-rose-500 text-black shadow-rose-500/40"
                : "bg-cyan-400 text-black shadow-cyan-400/40 hover:bg-cyan-300"
            }`}
        >
          🎙
        </button>

        {/* X / Cancel button */}
        <button
          onClick={handleCancel}
          className="flex h-14 w-14 items-center justify-center rounded-full 
                     border border-slate-700 bg-slate-900/80 text-slate-200 
                     text-2xl font-semibold hover:bg-slate-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}
