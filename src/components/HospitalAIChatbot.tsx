import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export const HospitalAIChatbot: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { 
      sender: 'bot', 
      text: 'Welcome to Amar Raho Hospital! I am your AI Support & Navigational Guide. How can I help you today? You can ask me about our doctors, specializations, departments, timings, or online appointment booking!' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Hide the chatbot on admin or doctor pages to avoid UI overlaps
  const isExcludedRoute = 
    location.pathname.startsWith('/doctor-portal') || 
    location.pathname.startsWith('/admin');

  if (isExcludedRoute) return null;

  // Guided Shortcut Helper Chips (Using FontAwesome classes)
  const guideChips = [
    { iconClass: 'fa fa-calendar-alt', label: 'How to Book Appointment', query: 'Guide me: How do I register and book a doctor appointment on this website?' },
    { iconClass: 'fa fa-user-md', label: 'Doctors & Specializations', query: 'What doctors, departments, and specializations does your hospital have?' },
    { iconClass: 'fa fa-clock', label: 'Timings & General Policies', query: 'What are your hospital operating hours, contact numbers, and policies?' },
    { iconClass: 'fa fa-upload', label: 'Uploading Lab Reports', query: 'How do patients upload and scan lab reports for the doctor?' }
  ];

  const sendQuery = async (queryText: string) => {
    // Add user message to log
    setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const res = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/public/hospital-chat`, {
        message: queryText
      });

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

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center pulse-ai-btn"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '65px',
          height: '65px',
          boxShadow: '0 4px 20px rgba(13, 110, 253, 0.4)',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
        }}
      >
        <i className={`fa ${isOpen ? 'fa-times fs-4' : 'fa-comments fs-3'} text-white`}></i>
      </button>

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className="card border-0 shadow-lg text-start animate__animated animate__fadeInUp"
          style={{
            position: 'fixed',
            bottom: '110px',
            right: '30px',
            width: '400px',
            height: '540px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="bg-primary p-3 text-white d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-white p-1 me-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                <i className="fa fa-robot text-primary"></i>
              </div>
              <div>
                <h6 className="m-0 fw-bold">Klinik AI Support Guide</h6>
                <span className="small text-white-50" style={{ fontSize: '10px' }}>Ask me about doctors & policies</span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
          </div>

          {/* Messages Area */}
          <div className="p-3 bg-light flex-grow-1" style={{ overflowY: 'auto' }}>
            {messages.map((msg, index) => (
              <div key={index} className={`mb-3 d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                <span className="text-muted" style={{ fontSize: '11px', marginBottom: '2px', fontWeight: 'bold' }}>
                  {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <div
                  className={`p-2 rounded-3 text-dark small ${
                    msg.sender === 'user' ? 'bg-primary-subtle border border-primary-subtle' : 'bg-white border'
                  }`}
                  style={{ maxWidth: '85%', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Guided Shortcut Chips List */}
            {messages.length === 1 && !loading && (
              <div className="mb-3 mt-2">
                <span className="small text-muted fw-bold d-block mb-2"><i className="fa fa-directions me-1 text-primary"></i>Guided Quick Shortcuts:</span>
                <div className="d-flex flex-column gap-2">
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
                <div className="p-2 rounded-3 bg-white border text-muted small d-inline-block">
                  <span className="spinner-border spinner-border-sm me-2"></span> Generating Answer...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area Form */}
          <form onSubmit={handleSendMessage} className="p-2 border-top bg-white d-flex">
            <input
              type="text"
              className="form-control form-control-sm border-0 me-2"
              placeholder="Ask AI how to navigate or book..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ outline: 'none', boxShadow: 'none' }}
              required
            />
            <button className="btn btn-primary btn-sm px-3 rounded-3" type="submit" disabled={loading}>
              <i className="fa fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default HospitalAIChatbot;
