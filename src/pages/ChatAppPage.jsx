import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Simple markdown to JSX converter for basic rendering
const renderMarkdown = (text) => {
  if (!text) return "";

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, idx) => {
    // Handle code blocks
    if (part.startsWith("```")) {
      const codeContent = part.replace(/```/g, "").trim();
      const language = codeContent.split("\n")[0] || "text";
      const code = codeContent.replace(/^[^\n]*\n/, "");
      return (
        <pre key={idx} className="bg-slate-900 border border-slate-700 rounded-lg p-3 my-2 overflow-x-auto text-xs">
          <code className="text-slate-300">{code}</code>
        </pre>
      );
    }

    // Handle inline code and markdown
    let content = part;
    const elements = [];
    let lastIndex = 0;

    // Replace inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    let match;
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      elements.push(content.slice(lastIndex, match.index));
      elements.push(
        <code key={`code-${match.index}`} className="bg-slate-800 px-1.5 py-0.5 rounded text-xs text-cyan-300">
          {match[1]}
        </code>
      );
      lastIndex = inlineCodeRegex.lastIndex;
    }
    elements.push(content.slice(lastIndex));

    return (
      <React.Fragment key={idx}>
        {elements.map((el, i) => (typeof el === "string" ? el : el))}
      </React.Fragment>
    );
  });
};

// Helper to test if a message has meaningful content
const isMeaningfulMessage = (m) => {
  if (!m || typeof m !== "object") return false;
  const txt = ((m.text || m.content) || "").toString().trim();
  return !!txt || !!m.imageUrl;
};

// Helper to test if a chat has at least one meaningful message
const chatHasMeaningfulMessages = (chat) => {
  if (!chat || !Array.isArray(chat.messages)) return false;
  return chat.messages.some(isMeaningfulMessage);
};

export default function ChatAppPage() {
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [isFocused, setIsFocused] = useState(false);
  const [debugError, setDebugError] = useState(null);

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [storedImages, setStoredImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // State for image modal
  const [isHydrated, setIsHydrated] = useState(false); // Hydration flag to prevent race condition
  const navigate = useNavigate();
  const location = useLocation();

  // --- Load saved chat history on mount ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("chatHistory");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const chats = Array.isArray(parsed) ? parsed : [];
        setChatHistory(chats);

        // Restore current chat if it exists
        const savedChatId = localStorage.getItem("currentChatId");
        if (savedChatId) {
          const chatId = parseInt(savedChatId);
          const chat = chats.find(c => c.id === chatId);
          if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages || []);
          } else {
            localStorage.removeItem("currentChatId");
          }
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setIsHydrated(true); // Mark hydration complete after load
    }
  }, []);

  // Persist chat history to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Guard: don't save until load completes
    try {
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    } catch (err) {
      console.error("Error persisting chat history:", err);
    }
  }, [chatHistory, isHydrated]);

  // Persist currentChatId to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return; // Guard: don't save until load completes
    if (currentChatId) {
      localStorage.setItem("currentChatId", currentChatId.toString());
    } else {
      localStorage.removeItem("currentChatId");
    }
  }, [currentChatId, isHydrated]);

  // ref to keep AbortController if we need to cancel streaming
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastImageIdRef = useRef(null);

  // Load stored images from localStorage
  const loadStoredImages = () => {
    try {
      const savedImages = JSON.parse(localStorage.getItem("generated_images") || "[]");
      setStoredImages(savedImages);
    } catch (err) {
      console.error("Error loading images from localStorage:", err);
      setStoredImages([]);
    }
  };

  // Function to add image to chat (keeps behavior but avoids creating empty chats)
  const addImageToChat = (imageData, targetChatId = null) => {
    const imageMessage = {
      id: imageData.id || Date.now(),
      role: "user",
      text: `Generated image: ${imageData.prompt || "Image"}`,
      imageUrl: imageData.url,
    };
    
    // Use targetChatId if provided (from navigation state), otherwise use currentChatId
    let chatIdToUse = targetChatId || currentChatId;
    
    if (!chatIdToUse) {
      // No chat exists, create a new one
      chatIdToUse = Date.now();
      const newChat = {
        id: chatIdToUse,
        title: `Image: ${(imageData.prompt || "Generated Image").slice(0, 30)}`,
        messages: [imageMessage],
      };
      // Add new chat at the beginning (most recent first)
      setChatHistory((prev) => [newChat, ...prev]);
      setCurrentChatId(chatIdToUse);
      setMessages([imageMessage]);
    } else {
      // Add to existing chat and move it to the top (most recent activity first)
      setChatHistory((prev) => {
        const updated = prev.map((chat) =>
          chat.id === chatIdToUse
            ? { ...chat, messages: [...chat.messages, imageMessage] }
            : chat
        );
        // Move updated chat to top
        const chatIndex = updated.findIndex(c => c.id === chatIdToUse);
        if (chatIndex > 0) {
          const [updatedChat] = updated.splice(chatIndex, 1);
          return [updatedChat, ...updated];
        }
        return updated;
      });
      
      // Update current messages if this is the active chat
      if (chatIdToUse === currentChatId) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === imageMessage.id);
          return exists ? prev : [...prev, imageMessage];
        });
      } else {
        // If adding to a different chat, switch to it
        setCurrentChatId(chatIdToUse);
        const targetChat = chatHistory.find(c => c.id === chatIdToUse);
        if (targetChat) {
          setMessages([...targetChat.messages, imageMessage]);
        } else {
          setMessages([imageMessage]);
        }
      }
    }
  };

  // Load images on mount and when window gains focus
  useEffect(() => {
    loadStoredImages();
    const handleFocus = () => loadStoredImages();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Handle navigation state when coming back from image creator
  useEffect(() => {
    if (location.state?.newImage) {
      const newImage = location.state.newImage;
      const targetChatId = location.state.currentChatId || null;
      addImageToChat(newImage, targetChatId);
      loadStoredImages();
      // Clear the state to avoid re-adding
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, chatHistory]);

  // Load stored images when component mounts or when window gains focus
  useEffect(() => {
    loadStoredImages();
    const handleFocus = () => loadStoredImages();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const generateTitle = (text) => {
    if (!text) return "New Chat";
    return text.split(" ").slice(0, 6).join(" ") + "...";
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 160);
    setTextareaHeight(newHeight);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✉️ Send message to backend with robust streaming parser
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Cancel any previous unfinished stream
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }

    const newMsg = { id: Date.now(), role: "user", text: input.trim() };

    // Determine chat id & update history
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      // If no chat selected, create new chat
      chatIdToUse = Date.now();
      const newChat = {
        id: chatIdToUse,
        title: generateTitle(input.trim()),
        messages: [newMsg],
      };
      // Add new chat at the beginning (most recent first)
      setChatHistory((prev) => [newChat, ...prev]);
      setCurrentChatId(chatIdToUse);
    } else {
      // Update existing chat and move it to the top (most recent activity first)
      setChatHistory((prev) => {
        const updated = prev.map((chat) =>
          chat.id === chatIdToUse
            ? { ...chat, messages: [...chat.messages, newMsg] }
            : chat
        );
        // Move updated chat to top
        const chatIndex = updated.findIndex(c => c.id === chatIdToUse);
        if (chatIndex > 0) {
          const [updatedChat] = updated.splice(chatIndex, 1);
          return [updatedChat, ...updated];
        }
        return updated;
      });
    }

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);
    setDebugError(null);

    // Prepare request body for backend
    const formattedHistory = updatedMessages.map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));

    const requestBody = {
      message: newMsg.text,
      session_id: chatIdToUse?.toString(),
      history: formattedHistory.length > 0 ? formattedHistory : null,
      max_tokens: 800,
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    try {
      const resp = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!resp.ok) {
        let errText = resp.statusText;
        try {
          const jsonError = await resp.json();
          errText = jsonError.detail || JSON.stringify(jsonError);
        } catch (_err) {
          try {
            errText = await resp.text();
          } catch { /* ignore */ }
        }
        const errMsg = `Backend error: ${resp.status} - ${errText}`;
        setDebugError(errMsg);
        setMessages((prev) => [...prev, { id: Date.now() + 1, role: "assistant", text: `[Error] ${errMsg}` }]);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      const assistantMsgId = Date.now() + 1;
      let assistantMsgAdded = false;

      // helper to parse one SSE block -> JSON payload
      const parseSSEBlock = (block) => {
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const dataLines = lines.filter((l) => l.startsWith("data:"));
        if (dataLines.length === 0) return null;
        const payloadText = dataLines.map((l) => l.replace(/^data:\s?/, "")).join("\n");
        try {
          return JSON.parse(payloadText);
        } catch (err) {
          return null;
        }
      };

      const handlePayload = (event) => {
        if (!event || typeof event !== "object") return;

        // Unified accessor for possible fields
        const contentCandidate = (event.accumulated || event.content || "").toString();

        if (event.type === "chunk") {
          assistantText = contentCandidate || assistantText;
          const trimmed = assistantText.trim();

          // Only create/persist assistant message after we have non-empty text
          if (!assistantMsgAdded) {
            if (trimmed) {
              const assistantMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
              setMessages((prev) => [...prev, assistantMsg]);
              setChatHistory((prev) =>
                prev.map((chat) =>
                  chat.id === chatIdToUse ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat
                )
              );
              assistantMsgAdded = true;
            } else {
              // no-op: don't persist empty placeholder
            }
          } else {
            const updatedMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
            setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? updatedMsg : m)));
            setChatHistory((prev) =>
              prev.map((chat) =>
                chat.id === chatIdToUse
                  ? { ...chat, messages: chat.messages.map((m) => (m.id === assistantMsgId ? updatedMsg : m)) }
                  : chat
              )
            );
          }
        } else if (event.type === "image") {
          const imageMsg = {
            id: Date.now(),
            role: "assistant",
            text: "[IMAGE]",
            imageUrl: event.data_url || event.url,
          };
          setMessages((prev) => [...prev, imageMsg]);
          setChatHistory((prev) =>
            prev.map((chat) =>
              chat.id === chatIdToUse ? { ...chat, messages: [...chat.messages, imageMsg] } : chat
            )
          );
        } else if (event.type === "done") {
          assistantText = event.content || assistantText;
          const trimmed = (assistantText || "").toString().trim();

          if (!assistantMsgAdded && trimmed) {
            const assistantMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
            setMessages((prev) => [...prev, assistantMsg]);
            // Move chat to top when stream completes (most recent activity)
            setChatHistory((prev) => {
              const updated = prev.map((chat) =>
                chat.id === chatIdToUse ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat
              );
              const chatIndex = updated.findIndex(c => c.id === chatIdToUse);
              if (chatIndex > 0) {
                const [updatedChat] = updated.splice(chatIndex, 1);
                return [updatedChat, ...updated];
              }
              return updated;
            });
            assistantMsgAdded = true;
          }
        } else if (event.type === "error") {
          const errMsg = { id: Date.now(), role: "assistant", text: `Error: ${event.detail || JSON.stringify(event)}` };
          setMessages((prev) => [...prev, errMsg]);
        } else {
          // Generic fallback for payloads with content
          if (event.content) {
            assistantText = (event.accumulated || event.content || assistantText);
            const trimmed = (assistantText || "").toString().trim();
            if (!assistantMsgAdded) {
              if (trimmed) {
                const m = { id: assistantMsgId, role: "assistant", text: assistantText };
                setMessages((prev) => [...prev, m]);
                setChatHistory((prev) =>
                  prev.map((chat) =>
                    chat.id === chatIdToUse ? { ...chat, messages: [...chat.messages, m] } : chat
                  )
                );
                assistantMsgAdded = true;
              }
            } else {
              const updatedMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
              setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? updatedMsg : m)));
              setChatHistory((prev) =>
                prev.map((chat) =>
                  chat.id === chatIdToUse
                    ? { ...chat, messages: chat.messages.map((m) => (m.id === assistantMsgId ? updatedMsg : m)) }
                    : chat
                )
              );
            }
          }
        }
      };

      // read loop with robust buffer parsing on '\n\n' SSE boundary
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // process complete SSE events delimited by '\r\n\r\n' or '\n\n'
        let sepIndex;
        while ((sepIndex = buffer.indexOf("\r\n\r\n")) !== -1 || (sepIndex = buffer.indexOf("\n\n")) !== -1) {
          const sep = buffer.indexOf("\r\n\r\n") !== -1 ? "\r\n\r\n" : "\n\n";
          const block = buffer.slice(0, buffer.indexOf(sep));
          buffer = buffer.slice(buffer.indexOf(sep) + sep.length);
          const payload = parseSSEBlock(block);
          if (payload) {
            handlePayload(payload);
          } else {
            const dataLine = block.split(/\r?\n/).find((l) => l.startsWith("data:"));
            if (dataLine) {
              const plain = dataLine.replace(/^data:\s?/, "");
              handlePayload({ type: "chunk", accumulated: plain, content: plain });
            }
          }
        }

        // safety: if buffer becomes huge without separators, attempt to find JSON inside
        if (buffer.length > 20000) {
          const match = buffer.match(/data:\s*(\{[\s\S]*\})/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              handlePayload(parsed);
              buffer = "";
            } catch { /* noop */ }
          }
        }
      }

      // leftover buffer after stream end
      if (buffer.trim()) {
        const payload = parseSSEBlock(buffer);
        if (payload) handlePayload(payload);
        else {
          const dataLine = buffer.split(/\r?\n/).find((l) => l.startsWith("data:"));
          if (dataLine) {
            const plain = dataLine.replace(/^data:\s?/, "");
            handlePayload({ type: "chunk", accumulated: plain, content: plain });
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((prev) => [...prev, { id: Date.now(), role: "assistant", text: "[stream aborted]" }]);
      } else {
        setDebugError(`ERROR: ${err.message}`);
        setMessages((prev) => [...prev, { id: Date.now(), role: "assistant", text: `Error: ${err.message}` }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // 🆕 NEW CHAT → Save old chat & reset interface
  const handleNewChat = () => {
    // abort any active stream
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    setIsTyping(false);
  };

  // Load an old chat
  const loadChat = (chat) => {
    // abort any active stream
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
      abortControllerRef.current = null;
    }
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Debug Error Display */}
      {debugError && (
        <div className="fixed top-0 left-0 right-0 bg-red-900 text-red-100 p-3 z-50">
          {debugError}
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-950/90">
        
        {/* NEW CHAT BUTTON */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 rounded-lg bg-transparent border border-slate-700 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800/50 hover:border-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New chat</span>
          </button>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Recent
          </div>
          
          {/* Render saved chat history */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {(() => {
              // Display all chats, don't filter
              return chatHistory.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">
                  No chat history
                </div>
              ) : (
                chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors group ${
                    chat.id === currentChatId 
                      ? "bg-slate-800 text-slate-100" 
                      : "text-slate-300 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="truncate flex-1">{chat.title}</span>
                  </div>
                </button>
              ))
              );
            })()}
          </div>
        </div>

        {/* IMAGES STORED SECTION */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={() => {
              setShowImages(!showImages);
              loadStoredImages();
            }}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Images stored</span>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
              {storedImages.length}
            </span>
          </button>

          {showImages && (
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto px-1">
              {storedImages.length === 0 ? (
                <div className="text-xs text-slate-500 px-3 py-4 text-center">
                  No images stored yet
                </div>
              ) : (
                storedImages.map((img) => (
                  <div
                    key={img.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/90 p-2 hover:bg-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img
                      src={img.url}
                      alt={img.prompt || "Generated image"}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <p className="text-xs text-slate-300 truncate" title={img.prompt}>
                      {img.prompt || "Generated image"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(img.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="mt-4 border-t border-slate-800 pt-3 text-xs">
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-900"
          >
            <span>Profile</span>
            <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500" />
          </button>

          {showProfile && (
            <div className="mt-2 space-y-1 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-300">
              <div className="font-medium">mayan@demo.com</div>
              <button className="w-full rounded-lg px-2 py-1 text-left text-slate-300 hover:bg-slate-800">
                Account settings
              </button>
              <button className="w-full rounded-lg px-2 py-1 text-left text-rose-300 hover:bg-slate-900/80">
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex flex-1 flex-col">

        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              {currentChatId ? "Chat" : "New Chat"}
            </p>
            <p className="text-xs text-slate-400">
              Hybrid Voice Assistant · Groq · DeepSeek
            </p>
          </div>
        </header>

        {/* Messages */}
        <section className={`flex-1 space-y-4 overflow-y-auto px-3 py-4 md:px-10 md:py-8 ${debugError ? "pt-16" : ""}`}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm shadow-md transition-all duration-300 ${
                  m.role === "user"
                    ? "bg-cyan-500 text-black shadow-cyan-500/20 hover:shadow-lg"
                    : "bg-slate-900 text-slate-100 border border-slate-800 whitespace-pre-wrap break-words shadow-slate-950/50 hover:shadow-lg hover:border-slate-700"
                }`}
              >
                {m.imageUrl ? (
                  <div>
                    <img src={m.imageUrl} alt="Generated content" className="max-w-xs rounded-lg mb-2" />
                    {m.role === "user" && m.text && (
                      <p className="text-xs text-slate-300 mt-2">{m.text}</p>
                    )}
                  </div>
                ) : m.role === "user" ? (
                  m.text
                ) : (
                  renderMarkdown(m.text)
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 text-xs text-slate-400 px-1 py-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce" />
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.1s]" />
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              </div>
              <span className="animate-pulse">Assistant is thinking…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Input bar */}
        <form
          onSubmit={sendMessage}
          className="border-t border-slate-800 bg-gradient-to-t from-slate-950 to-slate-950/90 px-3 py-3 md:px-10 transition-all duration-200"
        >
          <div className={`mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border-2 transition-all duration-200 px-4 py-3 ${
            isFocused
              ? "border-cyan-400 bg-slate-900 shadow-lg shadow-cyan-400/20"
              : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
          }`}>
            <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Type your message... (Shift+Enter for new line)"
                style={{ height: `${textareaHeight}px` }}
                className="max-h-40 flex-1 overflow-y-auto resize-none bg-transparent px-1 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none transition-colors"
            />

            <div className="flex items-center gap-2">
              {input.length > 0 && (
                <span className="text-xs text-slate-400 whitespace-nowrap">{input.length}</span>
              )}
              <button
                type="button"
                onClick={() => navigate("/images", { state: { currentChatId: currentChatId } })}
                className={`flex h-9 items-center justify-center rounded-full border-2 transition-all duration-200 px-3 text-xs font-medium ${
                  isFocused
                    ? "border-cyan-400 bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/40"
                    : "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                }`}
                title="Create image"
              >
                Image
              </button>
              <button
                type="button"
                onClick={() => navigate("/voice")}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isFocused
                    ? "border-cyan-400 bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/40"
                    : "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                }`}
                title="Start voice chat"
              >
                🎙
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex h-9 items-center rounded-full px-5 text-xs font-medium transition-all duration-200 ${
                  input.trim()
                    ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-lg shadow-cyan-400/30 hover:shadow-xl"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                }`}
              >
                {isTyping ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
          <div className="mx-auto max-w-3xl mt-2 text-xs text-slate-500 px-2">
            {input.length > 0 && (
              <span className="transition-opacity duration-200">
                {input.length < 50 && "Keep going..."}
                {input.length >= 50 && input.length < 200 && "Nice message!"}
                {input.length >= 200 && "That's detailed!"}
              </span>
            )}
          </div>
        </form>

      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 p-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Image Preview</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image Display */}
              <div className="mb-4 rounded-lg border border-slate-700 bg-black p-2 overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt || "Generated image"}
                  className="w-full h-auto rounded"
                />
              </div>

              {/* Image Details */}
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Prompt:</p>
                  <p className="text-sm text-slate-200 bg-slate-800/50 rounded p-2">
                    {selectedImage.prompt || "No prompt available"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Created:</p>
                  <p className="text-sm text-slate-400">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  onClick={() => {
                    addImageToChat(selectedImage);
                    setSelectedImage(null);
                  }}
                  className="flex-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-medium py-2 px-3 text-sm transition-colors"
                >
                  Add to Chat
                </button>
                <button
                  onClick={() => {
                    // Download image
                    const link = document.createElement("a");
                    link.href = selectedImage.url;
                    link.download = `image-${selectedImage.id}.png`;
                    link.click();
                  }}
                  className="flex-1 rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-medium py-2 px-3 text-sm transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(selectedImage.url);
                    alert("Image URL copied to clipboard!");
                  }}
                  className="flex-1 rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-medium py-2 px-3 text-sm transition-colors"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => {
                    // Delete image
                    const updated = storedImages.filter(img => img.id !== selectedImage.id);
                    localStorage.setItem("generated_images", JSON.stringify(updated));
                    setStoredImages(updated);
                    setSelectedImage(null);
                  }}
                  className="flex-1 rounded-lg border border-rose-600/50 hover:border-rose-500 hover:bg-rose-900/20 text-rose-300 font-medium py-2 px-3 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
