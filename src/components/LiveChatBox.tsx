import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface LiveChatBoxProps {
  chatPartnerId: string;
  chatPartnerName: string;
  currentUserRole: 'patient' | 'doctor';
}

export const LiveChatBox: React.FC<LiveChatBoxProps> = ({
  chatPartnerId,
  chatPartnerName,
  currentUserRole
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerNameTyping, setPartnerNameTyping] = useState('');

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Determine the unique room ID based on user roles
  const getRoomId = () => {
    if (!user?.id || !chatPartnerId) return '';
    return currentUserRole === 'patient'
      ? `chat_${user.id}_${chatPartnerId}`
      : `chat_${chatPartnerId}_${user.id}`;
  };

  // Scroll to bottom of message list container locally without scrolling browser page
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBodyRef.current) {
        console.log("📜 Scrolling chat to bottom...");
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
console.log("✅ Scroll complete. Current scrollTop:", chatBodyRef.current.scrollTop, "ScrollHeight:", chatBodyRef.current.scrollHeight);
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    console.log("=== Chat Hook Triggered ===");
    console.log("Socket connected status:", socket?.connected);
    console.log("Selected Partner ID:", chatPartnerId);
    console.log("Current User ID:", user?.id);

    if (!socket || !chatPartnerId || !user?.id) {
      console.log("⚠️ Exiting early: Socket, Partner or User ID is missing!");
      return;
    }

    const roomId = getRoomId();

    // Helper to safely join the room
    const joinRoom = () => {
      console.log("👉 Client emitting 'join_room' for Room ID:", roomId);
      socket.emit('join_room', { roomId });
    };

    // 1. Join immediately if already connected, otherwise wait for connect event
    if (socket.connected) {
      joinRoom();
    } else {
      console.log("⏳ Socket not connected yet. Waiting for 'connect' event to join room...");
    }

    // Automatically join/rejoin on connection changes
    socket.on('connect', joinRoom);

    // 2. Fetch history
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('hospital_token');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_BASE_URL}/chats/${chatPartnerId}`, { headers });
        if (res.data && res.data.success) {
          console.log("Loaded history messages count:", res.data.data.length);
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchChatHistory();

    // 3. Listen for incoming messages
    socket.on('receive_message', (msg) => {
      console.log("📥 RECEIVED MESSAGE VIA SOCKET:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // 4. Listen for typing status
    socket.on('typing_status', ({ isTyping, senderName }) => {
      setIsPartnerTyping(isTyping);
      setPartnerNameTyping(senderName || 'Someone');
    });

    // Cleanup listeners when switching partner
    return () => {
      console.log("🧹 Cleaning up socket listeners for partner:", chatPartnerId);
      socket.off('connect', joinRoom);
      socket.off('receive_message');
      socket.off('typing_status');
    };
  }, [socket, chatPartnerId, user?.id]);

  // Handle typing state emission on keypress
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (!socket || !user?.id || !chatPartnerId) return;
    const roomId = getRoomId();

    // Emit typing status
    socket.emit('typing', { roomId, isTyping: true, senderName: user.name });

    // Debounce typing status shutdown
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, isTyping: false });
    }, 1500);
  };

  // Send message
  const handleSendMessage = () => {
    if (!socket || !messageText.trim() || !user?.id || !chatPartnerId) return;

    const roomId = getRoomId();
    const patientId = currentUserRole === 'patient' ? user.id : chatPartnerId;
    const doctorId = currentUserRole === 'doctor' ? user.id : chatPartnerId;

    // Send typing off event immediately on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', { roomId, isTyping: false });

    // Emit message event
    socket.emit('send_message', {
      roomId,
      senderId: user.id,
      recipientId: chatPartnerId,
      patientId,
      doctorId,
      text: messageText.trim()
    });

    setMessageText('');
  };

  return (
    <div className="card border rounded-4 shadow-sm overflow-hidden d-flex flex-column" style={{ height: '480px', maxHeight: '480px' }}>
      {/* Header */}
      <div className="card-header bg-primary text-white py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <i className="fa fa-circle text-success fs-6" style={{ fontSize: '10px' }}></i>
          <span className="fw-bold">{chatPartnerName}</span>
        </div>
        <span className="badge bg-light text-primary small">Private Channel</span>
      </div>

      <div ref={chatBodyRef} className="card-body p-3 overflow-y-auto bg-light" style={{ height: '350px' ,overflowY: 'scroll'}}>
        <div className="d-flex flex-column gap-2" style={{ minHeight: '100%' }}>
        {messages.length === 0 ? (
          <div className="text-center my-auto text-muted">
            <i className="fa fa-comments fa-2x mb-2 text-muted opacity-50"></i>
            <p className="small mb-0">No messages yet. Say hello to start the chat!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === user?.id;
            return (
              <div key={msg._id || idx} className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                <div 
                  className="py-2 px-3 rounded-4 text-dark shadow-sm"
                  style={{
                    background: isMe ? '#dbeafe' : '#ffffff',
                    borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                    maxWidth: '80%'
                  }}
                >
                  <p className="m-0 small text-start" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                <span className="text-muted" style={{ fontSize: '8px', marginTop: '2px', paddingLeft: '4px' }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })
        )}

        {/* Typing Status Render */}
        {isPartnerTyping && (
          <div className="d-flex align-items-center gap-2 mt-1 animate__animated animate__fadeIn">
            <div className="py-2 px-3 bg-white text-muted rounded-4 shadow-sm" style={{ borderRadius: '15px 15px 15px 0' }}>
              <div className="d-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: '6px', height: '6px' }}></span>
                <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: '6px', height: '6px', animationDelay: '0.2s' }}></span>
                <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: '6px', height: '6px', animationDelay: '0.4s' }}></span>
                <span className="small ms-1" style={{ fontSize: '10px' }}>{partnerNameTyping} is typing...</span>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Input Footer */}
      <div className="card-footer bg-white border-top p-3 d-flex gap-2 align-items-center">
        <input 
          type="text" 
          className="form-control rounded-pill px-4" 
          placeholder="Type your message..." 
          value={messageText}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          type="button" 
          className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0" 
          style={{ width: '40px', height: '40px' }}
          onClick={handleSendMessage}
        >
          <i className="fa fa-paper-plane" style={{ fontSize: '14px' }}></i>
        </button>
      </div>
    </div>
  );
};
