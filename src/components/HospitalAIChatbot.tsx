import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const HospitalAIChatbot: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const prevUserKeyRef = useRef<string | null>(null);

  const [aiConfig, setAiConfig] = useState<{ hospitalName?: string; welcomeGreeting?: string } | null>(null);

  const getWelcomeGreeting = (currentUser: typeof user, config = aiConfig) => {
    const hospName = config?.hospitalName || 'Amar Raho Hospital';
    if (currentUser) {
      const roleBadge = currentUser.role === 'admin' ? ' (Admin)' : currentUser.role === 'doctor' ? ' (Doctor)' : '';
      return `Welcome back, ${currentUser.name || 'User'}${roleBadge}! I am your ${hospName} AI Assistant. How can I assist you with hospital operations, doctor rosters, appointments, or policies today?`;
    }
    return config?.welcomeGreeting || `Welcome to ${hospName}! I am your AI Support & Navigational Guide. How can I help you today? You can ask me about our doctors, specializations, departments, timings, or online appointment booking!`;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { 
      sender: 'bot', 
      text: 'Welcome to Amar Raho Hospital! I am your AI Support & Navigational Guide. How can I help you today? You can ask me about our doctors, specializations, departments, timings, or online appointment booking!' 
    }
  ]);

  // Fetch dynamic public AI settings (hospitalName & welcomeGreeting)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await axios.get(`${apiUrl}/ai/settings`);
        if (res.data && res.data.data) {
          setAiConfig(res.data.data);
          // If the user hasn't typed anything yet, refresh the initial greeting
          setMessages(prev => {
            if (prev.length === 1 && prev[0].sender === 'bot') {
              return [{ sender: 'bot', text: getWelcomeGreeting(user, res.data.data) }];
            }
            return prev;
          });
        }
      } catch (e) {
        // Fallback silently to hardcoded default
      }
    };
    fetchSettings();
  }, []);

  const handleResetChat = () => {
    setMessages([{ sender: 'bot', text: getWelcomeGreeting(user) }]);
    setInput('');
  };

  // Automatically reset chat session whenever user logs in, logs out, or switches accounts
  useEffect(() => {
    const currentKey = user ? `${user.id || user.email}-${user.role}` : 'guest';
    if (prevUserKeyRef.current !== null && prevUserKeyRef.current !== currentKey) {
      handleResetChat();
    }
    prevUserKeyRef.current = currentKey;
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Floating Draggable State
  const chatCardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initialRect: DOMRect | null;
  }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    initialRect: null,
  });

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 576 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 576;
      setIsMobile(mobile);
      if (mobile) {
        setPosition(null); // Reset floating coordinates on mobile
      } else if (position && chatCardRef.current) {
        // Re-clamp inside viewport or reset if screen was shrunk
        const rect = chatCardRef.current.getBoundingClientRect();
        if (
          rect.top < 10 || 
          rect.left < 10 || 
          rect.right > window.innerWidth - 10 || 
          rect.bottom > window.innerHeight - 10
        ) {
          setPosition(null);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handleStartDrag = (e: React.MouseEvent | React.TouchEvent) => {
    // Only disable dragging on mobile phones
    if (isMobile) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const cardRect = chatCardRef.current ? chatCardRef.current.getBoundingClientRect() : null;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initX: position?.x ?? 0,
      initY: position?.y ?? 0,
      initialRect: cardRect,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const zoomScale = window.innerWidth >= 992 ? 0.85 : 1;
      let rawDeltaX = (clientX - dragRef.current.startX) / zoomScale;
      let rawDeltaY = (clientY - dragRef.current.startY) / zoomScale;

      // Strict Viewport Clamping: Header and entire card MUST stay inside viewport
      const rect = dragRef.current.initialRect;
      if (rect) {
        const projectedTop = rect.top + rawDeltaY * zoomScale;
        const projectedBottom = rect.bottom + rawDeltaY * zoomScale;
        const projectedLeft = rect.left + rawDeltaX * zoomScale;
        const projectedRight = rect.right + rawDeltaX * zoomScale;

        const minMargin = 12;
        if (projectedTop < minMargin) {
          rawDeltaY = (minMargin - rect.top) / zoomScale;
        } else if (projectedBottom > window.innerHeight - minMargin) {
          rawDeltaY = (window.innerHeight - minMargin - rect.bottom) / zoomScale;
        }

        if (projectedLeft < minMargin) {
          rawDeltaX = (minMargin - rect.left) / zoomScale;
        } else if (projectedRight > window.innerWidth - minMargin) {
          rawDeltaX = (window.innerWidth - minMargin - rect.right) / zoomScale;
        }
      }

      setPosition({
        x: dragRef.current.initX + rawDeltaX,
        y: dragRef.current.initY + rawDeltaY,
      });
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Hide the chatbot on admin, doctor, or patient dashboard pages to avoid UI overlaps
  const isExcludedRoute = 
    location.pathname.startsWith('/doctor-portal') || 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dashboard');

  if (isExcludedRoute) return null;

  // Guided Shortcut Helper Chips (Using FontAwesome classes)
  const guideChips = [
    { iconClass: 'fa fa-calendar-alt', label: 'How to Book Appointment', query: 'Guide me: How do I register and book a doctor appointment on this website?' },
    { iconClass: 'fa fa-user-md', label: 'Doctors & Specializations', query: 'What doctors, departments, and specializations does your hospital have?' },
    { iconClass: 'fa fa-clock', label: 'Timings & General Policies', query: 'What are your hospital operating hours, contact numbers, and policies?' },
    { iconClass: 'fa fa-upload', label: 'Uploading Lab Reports', query: 'How do patients upload and scan lab reports for the doctor?' }
  ];

  const sendQuery = async (queryText: string) => {
    // Prepare conversation history (exclude initial welcome greeting if needed, or pass full history)
    const historyPayload = messages.map(m => ({ sender: m.sender, text: m.text }));

    // Add user message to log
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setLoading(true);

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const defaultHost = isLocal ? 'http://localhost:5001/api' : `http://${window.location.hostname}:5001/api`;
      const rawApiUrl = isLocal ? 'http://localhost:5001/api' : (import.meta.env.VITE_API_BASE_URL || defaultHost);
      const cleanBase = rawApiUrl.replace('/api', '');

      const token = localStorage.getItem('hospital_token');
      const res = await axios.post(
        `${cleanBase}/api/public/hospital-chat`, 
        {
          message: queryText,
          history: historyPayload
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (res.data?.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to the hospital servers right now. Please try again shortly!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    sendQuery(userText);
  };

  return (
    <div style={{ zIndex: 9999 }}>
      {/* Custom Styles for legibility and hover transitions */}
      <style>{`
        .guide-chip-btn {
          background: #ffffff;
          border: 1px solid #0d6efd;
          color: #0d6efd;
          transition: all 0.2s ease-in-out;
          font-weight: 500;
        }
        .guide-chip-btn i {
          color: #0d6efd;
          transition: color 0.2s ease-in-out;
        }
        .guide-chip-btn:hover {
          background: #0d6efd !important;
          color: #ffffff !important;
          border-color: #0d6efd !important;
        }
        .guide-chip-btn:hover i {
          color: #ffffff !important;
        }
      `}</style>

      {/* Floating Chat Button (Hidden when open in maximized view to keep UI pristine) */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            if (!isOpen) {
              setPosition(null);
              setIsOpen(true);
              setIsMinimized(false);
            } else if (isMinimized) {
              setIsMinimized(false);
            }
          }}
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center chatbot-bubble-trigger animate-pulse-glow shadow-lg"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isMinimized ? '356px' : '24px',
            width: '62px',
            height: '62px',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #0463FA 0%, #0241A7 100%)',
            zIndex: 99999,
            transition: 'right 0.25s ease'
          }}
          title="Open Amar Raho AI Assistant"
        >
          <i className="fa fa-comments fs-3 text-white"></i>
        </button>
      )}

      {/* Expandable, Minimizable & Maximizable Chat Window */}
      {isOpen && (
        <div
          ref={chatCardRef}
          className="card border-0 shadow-lg text-start rounded-4 overflow-hidden animate__animated animate__fadeInUp"
          style={{
            position: 'fixed',
            zIndex: 99999,
            transform: (!isMobile && position)
              ? `translate3d(${position.x}px, ${position.y}px, 0)`
              : 'none',
            transition: isDragging 
              ? 'none' 
              : 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.25s ease, right 0.25s ease',
            bottom: isMobile ? '12px' : isMinimized ? '24px' : isMaximized ? '20px' : '24px',
            right: isMobile ? '2.5vw' : isMaximized ? 'calc(50% - min(430px, 47vw))' : '24px',
            left: isMobile ? '2.5vw' : 'auto',
            width: isMobile ? '95vw' : isMinimized ? '320px' : isMaximized ? 'min(860px, 94vw)' : '420px',
            height: isMobile 
              ? (isMinimized ? '56px' : 'calc(100dvh - 24px)') 
              : isMinimized 
                ? '56px' 
                : isMaximized 
                  ? 'min(760px, calc(100vh - 48px))' 
                  : 'min(520px, calc(100vh - 48px))',
            maxHeight: isMinimized ? '56px' : 'calc(100vh - 48px)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: isMaximized 
              ? '0 20px 60px rgba(0,0,0,0.35)' 
              : '0 10px 40px rgba(13, 110, 253, 0.25)'
          }}
        >
          {/* Window Header (Draggable on desktop in all sizes) */}
          <div 
            className="bg-primary p-3 text-white d-flex align-items-center justify-content-between"
            onMouseDown={handleStartDrag}
            onTouchStart={handleStartDrag}
            onDoubleClick={() => {
              if (!isMinimized && !isMobile) {
                setIsMaximized(!isMaximized);
                setPosition(null);
              }
            }}
            style={{ 
              cursor: isMobile ? (isMinimized ? 'pointer' : 'default') : isDragging ? 'grabbing' : 'grab', 
              userSelect: 'none',
              background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)'
            }}
            onClick={() => {
              if (isMinimized) setIsMinimized(false);
            }}
          >
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-white p-1 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px' }}>
                <i className="fa fa-robot text-primary"></i>
              </div>
              <div>
                <h6 className="m-0 fw-bold">Amar Raho AI Assistant</h6>
                <span className="small text-white-50" style={{ fontSize: '10px' }}>
                  {isMinimized ? 'Click to restore chat' : 'Ask me about doctors & policies'}
                </span>
              </div>
            </div>

            {/* Window Controls (New Chat, Min, Max, Close) */}
            <div className="d-flex align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {/* New Chat / Reset History Button */}
              {!isMinimized && (
                <button 
                  type="button" 
                  className="btn btn-sm text-white text-decoration-none p-1 d-flex align-items-center justify-content-center border-0 bg-transparent"
                  style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                  title="New chat / Clear conversation"
                  onClick={handleResetChat}
                >
                  <i className="fa fa-redo" style={{ fontSize: '11px' }}></i>
                </button>
              )}

              {/* Minimize / Dock Button */}
              <button 
                type="button" 
                className="btn btn-sm text-white text-decoration-none p-1 d-flex align-items-center justify-content-center border-0 bg-transparent"
                style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                title={isMinimized ? "Restore chat" : "Minimize"}
                onClick={() => {
                  setIsMinimized(!isMinimized);
                  if (isMaximized) setIsMaximized(false);
                  setPosition(null);
                }}
              >
                <i className={`fa ${isMinimized ? 'fa-window-restore' : 'fa-minus'}`} style={{ fontSize: '12px' }}></i>
              </button>

              {/* Maximize / Standard Toggle Button */}
              {!isMinimized && (
                <button 
                  type="button" 
                  className="btn btn-sm text-white text-decoration-none p-1 d-flex align-items-center justify-content-center border-0 bg-transparent"
                  style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                  title={isMaximized ? "Restore standard size" : "Maximize view"}
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setPosition(null);
                  }}
                >
                  <i className={`fa ${isMaximized ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: '12px' }}></i>
                </button>
              )}

              {/* Close Button */}
              <button 
                type="button" 
                className="btn btn-sm text-white text-decoration-none p-1 d-flex align-items-center justify-content-center border-0 bg-transparent"
                style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                title="Close chat"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  setIsMaximized(false);
                }}
              >
                <i className="fa fa-times" style={{ fontSize: '14px' }}></i>
              </button>
            </div>
          </div>

          {/* Messages Area (Hidden when minimized) */}
          {!isMinimized && (
            <div className="p-3 bg-light flex-grow-1" style={{ overflowY: 'auto' }}>
              {messages.map((msg, index) => (
                <div key={index} className={`mb-3 d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                  <span className="text-muted" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 'bold' }}>
                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <div
                    className={`p-3 rounded-3 text-dark ${
                      msg.sender === 'user' ? 'bg-primary-subtle border border-primary-subtle' : 'bg-white border shadow-sm'
                    }`}
                    style={{ 
                      maxWidth: isMaximized ? '92%' : '88%', 
                      wordBreak: 'break-word', 
                      whiteSpace: 'pre-wrap',
                      fontSize: isMaximized ? '14.5px' : '13px',
                      lineHeight: '1.6'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Guided Shortcut Chips List */}
              {messages.length === 1 && !loading && (
                <div className="mb-3 mt-2">
                  <span className="small text-muted fw-bold d-block mb-2"><i className="fa fa-directions me-1 text-primary"></i>Guided Quick Shortcuts:</span>
                  <div className={`d-flex ${isMaximized ? 'flex-row flex-wrap' : 'flex-column'} gap-2`}>
                    {guideChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="btn btn-xs text-start px-3 py-2 small shadow-sm guide-chip-btn"
                        style={{ fontSize: '11px', borderRadius: '10px' }}
                        onClick={() => sendQuery(chip.query)}
                      >
                        <i className={`${chip.iconClass} me-2`}></i>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-start mb-3">
                  <span className="text-muted" style={{ fontSize: '11px', fontWeight: 'bold' }}>AI Assistant</span>
                  <div className="p-2 px-3 rounded-3 bg-white border text-muted small d-inline-block shadow-sm">
                    <span className="spinner-border spinner-border-sm me-2 text-primary"></span> Generating Answer...
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}

          {/* Input Area Form (Hidden when minimized) */}
          {!isMinimized && (
            <form onSubmit={handleSendMessage} className="p-3 border-top bg-white d-flex align-items-center">
              <input
                type="text"
                className="form-control border-0 me-2"
                placeholder="Ask AI how to navigate or book..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{ outline: 'none', boxShadow: 'none', fontSize: isMaximized ? '14px' : '13px' }}
                required
              />
              <button 
                className="btn btn-primary px-3 py-2 rounded-3 d-flex align-items-center justify-content-center" 
                type="submit" 
                disabled={loading}
                style={{ height: '38px', minWidth: '44px' }}
              >
                <i className="fa fa-paper-plane"></i>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalAIChatbot;
