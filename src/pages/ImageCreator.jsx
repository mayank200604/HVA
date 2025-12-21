// src/pages/ImageCreator.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ImageCreator() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("photorealistic");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const currentChatId = location.state?.currentChatId || null;

  async function generateImage() {
    setError("");
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setPreviewUrl(null);

    try {
      const resp = await fetch("http://localhost:8001/generate_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size,
          style,
        }),
      });

      if (!resp.ok) {
        let errorMessage = "Image generation failed";
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error?.detail || errorData.detail || errorData.error || errorMessage;
        } catch {
          const text = await resp.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      // expected: { url: "/generated_images/..." } from backend
      let url = data.url || data.image_url || data.image_data || null;
      
      // If url is relative, convert to full URL with base64 if needed
      if (url && url.startsWith("/generated_images/")) {
        url = `http://localhost:8001${url}`;
      }
      
      if (!url) throw new Error("No image returned from server");

      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  }

  function addToChat() {
    if (!previewUrl) return;
    try {
      const existing = JSON.parse(localStorage.getItem("generated_images") || "[]");
      const entry = {
        id: Date.now().toString(),
        url: previewUrl,
        prompt,
        created_at: new Date().toISOString(),
      };
      existing.unshift(entry);
      localStorage.setItem("generated_images", JSON.stringify(existing.slice(0, 30))); // keep last 30
      // Navigate back to chat with current chat ID to preserve chat context
      navigate("/app", { state: { newImage: entry, currentChatId: currentChatId } });
    } catch (err) {
      console.error("save image", err);
      setError("Failed to save image to chat");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Create an image</h1>
          <button
            onClick={() => navigate("/app")}
            className="rounded-full border px-3 py-1 text-sm hover:bg-slate-900"
          >
            Back to chat
          </button>
        </header>

        <div className="rounded-lg border p-4 bg-slate-900/60">
          <label className="block text-sm text-slate-300 mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-md bg-slate-800 p-2 text-sm text-slate-100"
            placeholder="Describe the image you want (e.g. 'A cinematic sunset over a mountain lake, ultra-detailed')"
          />

          <div className="mt-3 flex gap-3">
            <div>
              <label className="text-xs text-slate-300">Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)} className="ml-2 rounded-md bg-slate-800 p-1 text-sm">
                <option value="128x128">128x128</option>
                <option value="256x256">256x256</option>
                <option value="512x512">512x512</option>
                
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300">Style</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="ml-2 rounded-md bg-slate-800 p-1 text-sm">
                <option value="photorealistic">Photorealistic</option>
                <option value="digital-painting">Digital painting</option>
                <option value="anime">Anime</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={generateImage}
              disabled={isLoading}
              className="rounded-md bg-cyan-400 px-4 py-2 text-black font-medium hover:bg-cyan-300"
            >
              {isLoading ? "Generating…" : "Generate image"}
            </button>

            {previewUrl && (
              <button
                onClick={addToChat}
                className="rounded-md border px-3 py-2 text-sm hover:bg-slate-900"
              >
                Add to chat
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

          <div className="mt-6">
            {isLoading && <p className="text-sm text-slate-400">Generating — this can take a few seconds.</p>}
            {previewUrl && (
              <div>
                <p className="text-xs text-slate-300 mb-2">Preview:</p>
                <div className="rounded-md border bg-black p-2">
                  <img src={previewUrl} alt="preview" className="w-full rounded" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Tip: click “Add to chat” to send this image into your chat history.</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-xs text-slate-400">Images are generated via your backend `/generate_image` endpoint.</footer>
      </div>
    </div>
  );
}
