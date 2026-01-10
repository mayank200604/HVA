import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const ChatFAB = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I am your **Career Guidance Assistant**. \n\nHow can I help you today? Ask me about career paths, frameworks, or industry trends.'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const messagesEndRef = useRef(null);

    // User-specific localStorage key for RAG chat
    const getRAGStorageKey = () => `rag_chat_${currentUser?.uid || 'anonymous'}`;
    const getRAGConvIdKey = () => `rag_conv_id_${currentUser?.uid || 'anonymous'}`;

    // Load RAG chat history from localStorage on mount
    useEffect(() => {
        if (!currentUser) return;

        try {
            const savedMessages = localStorage.getItem(getRAGStorageKey());
            const savedConvId = localStorage.getItem(getRAGConvIdKey());

            if (savedMessages) {
                const parsed = JSON.parse(savedMessages);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            }

            if (savedConvId) {
                setConversationId(savedConvId);
            }
        } catch (err) {
            console.error('Error loading RAG chat history:', err);
        }
    }, [currentUser]);

    // Save RAG chat history to localStorage whenever messages change
    useEffect(() => {
        if (!currentUser) return;

        try {
            localStorage.setItem(getRAGStorageKey(), JSON.stringify(messages));
        } catch (err) {
            console.error('Error saving RAG chat history:', err);
        }
    }, [messages, currentUser]);

    // Save conversation ID to localStorage
    useEffect(() => {
        if (!currentUser || !conversationId) return;

        try {
            localStorage.setItem(getRAGConvIdKey(), conversationId);
        } catch (err) {
            console.error('Error saving RAG conversation ID:', err);
        }
    }, [conversationId, currentUser]);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = { role: 'user', content: inputValue };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/rag/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMsg.content,
                    conversation_id: conversationId,
                    user_id: currentUser?.uid  // Send user_id to backend
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Save conversation ID from backend
            if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
            }

            const assistantMsg = {
                role: 'assistant',
                content: data.reply
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Error fetching chat response:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '**Error**: I encountered an issue connecting to the knowledge base. Please try again.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear your RAG chat history?')) {
            const initialMessage = {
                role: 'assistant',
                content: 'Hi! I am your **Career Guidance Assistant**. \n\nHow can I help you today? Ask me about career paths, frameworks, or industry trends.'
            };
            setMessages([initialMessage]);
            setConversationId(null);

            // Clear from localStorage
            try {
                localStorage.removeItem(getRAGStorageKey());
                localStorage.removeItem(getRAGConvIdKey());
            } catch (err) {
                console.error('Error clearing RAG chat:', err);
            }
        }
    };

    const location = useLocation();

    // RAG only on Main Chat Page ("/app")
    if (location.pathname !== "/app") {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="pointer-events-auto w-[380px] h-[600px] mb-4 flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 10 10 0 0 0-10-10z"></path>
                                        <path d="M8.5 8.5a2.5 2.5 0 0 1 0 5"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight tracking-tight">Career Assistant</h3>
                                    <p className="text-[11px] font-medium text-blue-100/90">AI-Powered Guidance</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClearChat}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95 duration-200"
                                    title="Clear chat history"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={toggleChat}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95 duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 dark:bg-gray-950/50 scroll-smooth">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[88%] text-sm shadow-sm p-4 ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                                            : 'bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        ) : (
                                            <div className="markdown-content">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-2" {...props} />,
                                                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                                                        strong: ({ node, ...props }) => <span className="font-bold text-blue-700 dark:text-blue-400" {...props} />,
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
                                                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                        code: ({ node, inline, ...props }) =>
                                                            inline
                                                                ? <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs font-mono text-red-600 dark:text-red-400" {...props} />
                                                                : <pre className="bg-gray-800 text-gray-100 p-2 rounded-lg text-xs overflow-x-auto my-2"><code {...props} /></pre>,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start w-full"
                                >
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex space-x-1.5 items-center">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                className="w-2 h-2 bg-blue-500 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                className="w-2 h-2 bg-blue-500 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                className="w-2 h-2 bg-blue-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-gray-800 transition-all duration-300 shadow-sm">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !inputValue.trim()}
                                    className={`p-2 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 ${!inputValue.trim() || isLoading
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg'
                                        }`}
                                    aria-label="Send"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <button
                onClick={toggleChat}
                className={`pointer-events-auto p-4 rounded-full shadow-xl shadow-blue-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center backdrop-blur-sm z-50 ${isOpen
                    ? 'bg-gray-800 dark:bg-gray-700 text-white rotate-90'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-600/40'
                    }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            <path d="M12 7v.01"></path>
                            <path d="M8 7v.01"></path>
                            <path d="M16 7v.01"></path>
                        </svg>
                    </motion.div>
                )}
            </button>
        </div>
    );
};

export default ChatFAB;
