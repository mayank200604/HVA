import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import LandingPage from "./pages/Landingpage";
import AuthPage from "./pages/AuthPage";
import ChatAppPage from "./pages/ChatAppPage";
import VoiceSessionPage from "./pages/VoiceSessionPage";
import ImageCreator from "./pages/ImageCreator";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<ChatAppPage />} />
        <Route path="/voice" element={<VoiceSessionPage />} />
        <Route path="/images" element={<ImageCreator />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
