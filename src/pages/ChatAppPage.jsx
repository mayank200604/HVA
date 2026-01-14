import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ParticleSphere from "../shared/ParticleSphere";
import { useAuth } from "../contexts/AuthContext";

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
  const { currentUser, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(40);
  const [isFocused, setIsFocused] = useState(false);
  const [debugError, setDebugError] = useState(null);

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [showProfile, setShowProfile] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [storedImages, setStoredImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // State for image modal
  const [isHydrated, setIsHydrated] = useState(false); // Hydration flag to prevent race condition
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
  const [copyFeedback, setCopyFeedback] = useState({ visible: false, message: "" });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile sidebar toggle
  const navigate = useNavigate();
  const location = useLocation();

  // User-specific localStorage keys
  const getUserStorageKey = (key) => `${key}_${currentUser?.uid || 'anonymous'}`;

  // --- Load saved chat history on mount ---
  useEffect(() => {
    if (!currentUser) return;

    try {
      const savedHistory = localStorage.getItem(getUserStorageKey("chatHistory"));
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        let chats = Array.isArray(parsed) ? parsed : [];

        // Filter out RAG chats that might have been synced previously
        chats = chats.filter(c => !c.conversationId || !c.conversationId.toString().startsWith('rag-'));

        setChatHistory(chats);

        // Restore current chat if it exists
        const savedChatId = localStorage.getItem(getUserStorageKey("currentChatId"));
        if (savedChatId) {
          const chatId = parseInt(savedChatId);
          const chat = chats.find(c => c.id === chatId);
          if (chat) {
            setCurrentChatId(chatId);
            setMessages(chat.messages || []);
            currentBackendIdRef.current = chat.conversationId || null;
          } else {
            localStorage.removeItem(getUserStorageKey("currentChatId"));
          }
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    } finally {
      setIsHydrated(true); // Mark hydration complete after load
    }
  }, [currentUser]);

  // --- 🔄 Sync with Backend History ---
  useEffect(() => {
    if (!isHydrated || !currentUser) return;

    const syncHistory = async () => {
      try {
        // Send user_id to filter conversations by user
        const resp = await fetch(`${API_BASE_URL}/conversations?user_id=${encodeURIComponent(currentUser.uid)}`);
        if (!resp.ok) return;
        const backendConversations = await resp.json();

        setChatHistory(prev => {
          const updated = [...prev];
          let changed = false;

          backendConversations.forEach(bc => {
            // Check if this backend conversation is already in our history
            const exists = updated.find(c => c.conversationId === bc.id);
            if (!exists) {
              // Add a new "ghost" chat that will be loaded on demand
              updated.push({
                id: `bk-${bc.id}`, // Unique local ID for backend chats
                title: `Chat ${bc.created_at.split('T')[0]}`,
                messages: [], // Will load on click
                conversationId: bc.id,
                created_at: bc.created_at
              });
              changed = true;
            }
          });

          return changed ? updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : prev;
        });
      } catch (err) {
        console.error("Failed to sync backend history:", err);
      }
    };

    syncHistory();
  }, [isHydrated, currentUser]);

  // Persist chat history to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated || !currentUser) return; // Guard: don't save until load completes
    try {
      localStorage.setItem(getUserStorageKey("chatHistory"), JSON.stringify(chatHistory));
    } catch (err) {
      console.error("Error persisting chat history:", err);
    }
  }, [chatHistory, isHydrated, currentUser]);

  // Persist currentChatId to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated || !currentUser) return; // Guard: don't save until load completes
    if (currentChatId) {
      localStorage.setItem(getUserStorageKey("currentChatId"), currentChatId.toString());
    } else {
      localStorage.removeItem(getUserStorageKey("currentChatId"));
    }
  }, [currentChatId, isHydrated, currentUser]);

  // ref to keep AbortController if we need to cancel streaming
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastImageIdRef = useRef(null);
  const currentBackendIdRef = useRef(null);

  // Load stored images from localStorage
  const loadStoredImages = () => {
    if (!currentUser) return;
    try {
      const userKey = getUserStorageKey("generated_images");
      const savedImages = JSON.parse(localStorage.getItem(userKey) || "[]");

      // MIGRATION: If no images in user-specific key, check old global key
      if (savedImages.length === 0) {
        const oldImages = JSON.parse(localStorage.getItem("generated_images") || "[]");
        if (oldImages.length > 0) {
          console.log(`Migrating ${oldImages.length} images from old storage to user-specific storage`);
          localStorage.setItem(userKey, JSON.stringify(oldImages));
          // Optionally remove old key after migration
          localStorage.removeItem("generated_images");
          setStoredImages(oldImages);
          return;
        }
      }

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
        conversationId: null  // Backend conversation ID
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
          currentBackendIdRef.current = targetChat.conversationId || null;
        } else {
          setMessages([imageMessage]);
          currentBackendIdRef.current = null;
        }
      }
    }
  };

  // Load images on mount and when window gains focus
  useEffect(() => {
    loadStoredImages();
    const handleFocus = () => loadStoredImages();
    window.addEventListener("focus", handleFocus);

    // Global click listener to close context menu
    const handleGlobalClick = () => setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    window.addEventListener("click", handleGlobalClick);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      chat: chat
    });
  };

  const deleteChat = async (chatToDelete) => {
    if (!chatToDelete) return;

    const conversationId = chatToDelete.conversationId || (chatToDelete.id.toString().startsWith('bk-') ? chatToDelete.id.replace('bk-', '') : null);

    if (conversationId) {
      try {
        const resp = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
          method: 'DELETE'
        });
        if (!resp.ok) console.error("Backend delete failed");
      } catch (err) {
        console.error("Error deleting from backend:", err);
      }
    }

    // Update local state
    setChatHistory(prev => prev.filter(c => c.id !== chatToDelete.id));

    // If deleted chat was current, reset
    if (currentChatId === chatToDelete.id) {
      handleNewChat();
    }

    setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    showFeedback("Chat deleted");
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showFeedback("Copied to clipboard");
    });
  };

  const showFeedback = (msg) => {
    setCopyFeedback({ visible: true, message: msg });
    setTimeout(() => setCopyFeedback({ visible: false, message: "" }), 2000);
  };

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
      try { abortControllerRef.current.abort(); } catch { }
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
        conversationId: null  // Backend conversation ID will be set after first response
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

    const backendConversationId = currentBackendIdRef.current;

    const requestBody = {
      message: newMsg.text,
      conversation_id: backendConversationId,
      user_id: currentUser?.uid,  // Include user ID
      max_tokens: 800,
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    try {
      const resp = await fetch(`${API_BASE_URL}/chat`, {
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
        const contentCandidate = (event.accumulated || event.content || "").toString();

        // --- Update backend conversation ID if received ---
        if (event.conversation_id) {
          currentBackendIdRef.current = event.conversation_id;
          setChatHistory((prev) =>
            prev.map((chat) =>
              chat.id === chatIdToUse ? { ...chat, conversationId: event.conversation_id } : chat
            )
          );
        }

        if (event.type === "chunk") {
          assistantText = contentCandidate || assistantText;
          const trimmed = assistantText.trim();

          if (!assistantMsgAdded && trimmed) {
            const assistantMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
            setMessages((prev) => [...prev, assistantMsg]);
            setChatHistory((prev) =>
              prev.map((chat) =>
                chat.id === chatIdToUse ? { ...chat, messages: [...chat.messages, assistantMsg] } : chat
              )
            );
            assistantMsgAdded = true;
          } else if (assistantMsgAdded) {
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
        } else if (event.type === "done") {
          assistantText = event.content || assistantText;
          const trimmed = (assistantText || "").toString().trim();

          if (!assistantMsgAdded && trimmed) {
            const assistantMsg = { id: assistantMsgId, role: "assistant", text: assistantText };
            setMessages((prev) => [...prev, assistantMsg]);
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
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

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
      try { abortControllerRef.current.abort(); } catch { }
      abortControllerRef.current = null;
    }
    setCurrentChatId(null);
    currentBackendIdRef.current = null;
    setMessages([]);
    setInput("");
    setIsTyping(false);
  };

  // Load an old chat
  const loadChat = async (chat) => {
    // abort any active stream
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch { }
      abortControllerRef.current = null;
    }

    setCurrentChatId(chat.id);
    currentBackendIdRef.current = chat.conversationId || null;

    // If chat has no messages but has a backend ID, fetch them
    if ((!chat.messages || chat.messages.length === 0) && chat.conversationId) {
      setIsTyping(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/conversation/${chat.conversationId}`);
        if (resp.ok) {
          const history = await resp.json();
          // Map backend messages {role, content} to frontend messages {role, text}
          const mappedMessages = history.map((m, idx) => ({
            id: `bk-msg-${idx}-${Date.now()}`,
            role: m.role,
            text: m.content,
            created_at: m.created_at
          }));

          setMessages(mappedMessages);

          // Update chat history state with these messages
          setChatHistory(prev => prev.map(c =>
            c.id === chat.id ? { ...c, messages: mappedMessages, title: mappedMessages[0]?.text?.slice(0, 30) || c.title } : c
          ));
        }
      } catch (err) {
        console.error("Failed to fetch conversation messages:", err);
      } finally {
        setIsTyping(false);
      }
    } else {
      setMessages(chat.messages || []);
    }
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

      {/* Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        flex w-64 flex-col border-r border-slate-800 bg-slate-950/90
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* NEW CHAT BUTTON */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={() => {
              handleNewChat();
              setIsMobileSidebarOpen(false); // Close sidebar on mobile after action
            }}
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
                    onClick={() => {
                      loadChat(chat);
                      setIsMobileSidebarOpen(false); // Close sidebar on mobile after selecting chat
                    }}
                    onContextMenu={(e) => handleContextMenu(e, chat)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors group relative ${chat.id === currentChatId
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
              <div className="font-medium truncate" title={currentUser?.email}>
                {currentUser?.email || currentUser?.displayName || 'User'}
              </div>
              <button className="w-full rounded-lg px-2 py-1 text-left text-slate-300 hover:bg-slate-800">
                Account settings
              </button>
              <button
                onClick={async () => {
                  try {
                    await logout();
                    navigate('/auth');
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                }}
                className="w-full rounded-lg px-2 py-1 text-left text-rose-300 hover:bg-slate-900/80"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex flex-1 flex-col">

        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 lg:flex-none">
            <p className="text-sm font-medium">
              {currentChatId ? "Chat" : "New Chat"}
            </p>
            <p className="text-xs text-slate-400 hidden sm:block">
              Hybrid Voice Assistant (Phase 1)
            </p>
          </div>
        </header>

        {/* Messages */}
        <section className={`flex-1 space-y-3 sm:space-y-4 overflow-y-auto px-3 py-4 sm:px-6 md:px-10 md:py-8 ${debugError ? "pt-16" : ""}`}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="relative flex items-center justify-center transition-all duration-700 hover:scale-[1.02]">
                <div className="pointer-events-none absolute inset-8 rounded-full bg-[radial-gradient(circle,_#06b6d422,_transparent_70%)] blur-2xl animate-pulse" />
                <ParticleSphere size={window.innerWidth < 640 ? 280 : window.innerWidth < 1024 ? 320 : 380} showBorder={false} />
              </div>
              <div className="mt-6 sm:mt-8 text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-medium bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent px-4">How can I assist you today?</h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto px-4">Start a conversation with your Hybrid Voice Assistant</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xl md:max-w-2xl rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm shadow-md transition-all duration-300 relative group ${m.role === "user"
                  ? "bg-cyan-500 text-black shadow-cyan-500/20 hover:shadow-lg"
                  : "bg-slate-900 text-slate-100 border border-slate-800 whitespace-pre-wrap break-words shadow-slate-950/50 hover:shadow-lg hover:border-slate-700"
                  }`}
              >
                {/* Copy Action Icon */}
                <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <button
                    onClick={() => copyToClipboard(m.imageUrl || m.text)}
                    className={`p-1.5 rounded-lg border backdrop-blur-sm transition-colors ${m.role === 'user'
                      ? 'bg-cyan-400/20 border-cyan-400/40 hover:bg-cyan-400/40 text-black'
                      : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    title="Copy"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>

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
          className="border-t border-slate-800 bg-gradient-to-t from-slate-950 to-slate-950/90 px-2 py-2 sm:px-3 sm:py-3 md:px-10 transition-all duration-200"
        >
          <div className={`mx-auto flex flex-wrap sm:flex-nowrap max-w-3xl items-end gap-2 sm:gap-3 rounded-2xl border-2 transition-all duration-200 px-3 sm:px-4 py-2 sm:py-3 ${isFocused
            ? "border-cyan-400 bg-slate-900 shadow-lg shadow-cyan-400/20"
            : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
            }`}>
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message..."
              style={{ height: `${textareaHeight}px` }}
              className="max-h-40 flex-1 w-full sm:w-auto overflow-y-auto resize-none bg-transparent px-1 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none transition-colors"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {input.length > 0 && (
                <span className="text-xs text-slate-400 whitespace-nowrap">{input.length}</span>
              )}
              <button
                type="button"
                onClick={() => navigate("/voice")}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 transition-all duration-200 ${isFocused
                  ? "border-violet-400 bg-violet-500/30 text-violet-200 hover:bg-violet-500/40"
                  : "border-violet-400/60 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                  }`}
                title="Voice preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => navigate("/images", { state: { currentChatId: currentChatId } })}
                className={`flex h-8 sm:h-9 items-center justify-center rounded-full border-2 transition-all duration-200 px-2 sm:px-3 text-xs font-medium ${isFocused
                  ? "border-cyan-400 bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/40"
                  : "border-cyan-400/60 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                  }`}
                title="Create image"
              >
                Image
              </button>
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex h-8 sm:h-9 items-center rounded-full px-4 sm:px-5 text-xs font-medium transition-all duration-200 ${input.trim()
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

      {/* Context Menu for Chat History */}
      {contextMenu.visible && (
        <div
          className="fixed z-[999] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 w-40 backdrop-blur-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => deleteChat(contextMenu.chat)}
            className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete Chat</span>
          </button>
        </div>
      )}

      {/* Action Feedback (Copy/Delete toast) */}
      {copyFeedback.visible && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-full shadow-2xl z-[1000] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-medium">{copyFeedback.message}</span>
        </div>
      )}

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
                    localStorage.setItem(getUserStorageKey("generated_images"), JSON.stringify(updated));
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