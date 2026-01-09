import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import LandingPage from "./pages/Landingpage";
import AuthPage from "./pages/Authpage";
import ChatAppPage from "./pages/ChatAppPage";
import VoiceSessionPage from "./pages/VoiceSessionPage";
import ImageCreator from "./pages/ImageCreator";
import ChatFAB from "./components/ChatFAB";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ChatAppPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voice"
            element={
              <ProtectedRoute>
                <VoiceSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/images"
            element={
              <ProtectedRoute>
                <ImageCreator />
              </ProtectedRoute>
            }
          />
        </Routes>
        <ChatFAB />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);