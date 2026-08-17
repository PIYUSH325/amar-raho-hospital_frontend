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

  // Call-related States
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false); // Am I the caller?
  const [isRinging, setIsRinging] = useState(false);   // Am I receiving a call?
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [callerName, setCallerName] = useState('');
  const [incomingOffer, setIncomingOffer] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

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
        // console.log("📜 Scrolling chat to bottom...");
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
// console.log("✅ Scroll complete. Current scrollTop:", chatBodyRef.current.scrollTop, "ScrollHeight:", chatBodyRef.current.scrollHeight);
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
          // console.log("Loaded history messages count:", res.data.data.length);
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchChatHistory();

    // 3. Listen for incoming messages
    socket.on('receive_message', (msg) => {
      // // console.log("📥 RECEIVED MESSAGE VIA SOCKET:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // 4. Listen for typing status
    socket.on('typing_status', ({ isTyping, senderName }) => {
      setIsPartnerTyping(isTyping);
      setPartnerNameTyping(senderName || 'Someone');
    });

    // 5. Listen for incoming WebRTC Calls
    socket.on('incoming_call', ({ offer, callerName, type }) => {
      setIsRinging(true);
      setIncomingOffer(offer);
      setCallerName(callerName);
      setCallType(type);
      console.log(`📞 Incoming ${type} call from ${callerName}`);
    });

    socket.on('call_accepted', async ({ answer }) => {
      setIsCalling(false);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      }
    });

    socket.on('call_ended', () => {
      handleCleanupCall();
    });

    // Cleanup listeners when switching partner
    return () => {
      // console.log("🧹 Cleaning up socket listeners for partner:", chatPartnerId);
      socket.off('connect', joinRoom);
      socket.off('receive_message');
      socket.off('typing_status');
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [socket, chatPartnerId, user?.id]);

  // WebRTC Calling logic
  const startCall = async (type: 'audio' | 'video') => {
    if (!socket || !user?.name) return;
    setCallType(type);
    setIsCalling(true);
    setCallActive(true);
    
    console.log("Starting call...");

    const roomId = getRoomId();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { roomId, candidate: event.candidate });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', { roomId, offer, callerName: user.name, type });
    } catch (err) {
      console.error("Failed to start media stream:", err);
      handleCleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!socket || !incomingOffer) return;
    setIsRinging(false);
    setCallActive(true);
    
    console.log("Accepting call...");

    const roomId = getRoomId();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { roomId, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('accept_call', { roomId, answer });
    } catch (err) {
      console.error("Failed to accept call:", err);
      handleCleanupCall();
    }
  };

  const declineCall = () => {
    setIsRinging(false);
    setIncomingOffer(null);
    socket?.emit('end_call', { roomId: getRoomId() });
  };

  const hangUpCall = () => {
    console.log("Hanging up call...");
    setCallActive(false);
    socket?.emit('end_call', { roomId: getRoomId() });
    handleCleanupCall();
  };

  const handleCleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    pcRef.current = null;
    setLocalStream(null);
    setCallActive(false);
    setIsCalling(false);
    setIsRinging(false);
    setIncomingOffer(null);
    setAudioMuted(false);
    setVideoMuted(false);
  };

  const toggleMuteAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleMuteVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoMuted(!videoTrack.enabled);
      }
    }
  };

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
    <div className="card border rounded-4 shadow-sm overflow-hidden d-flex flex-column position-relative" style={{ height: '480px', maxHeight: '480px' }}>
      
      {/* 📞 INCOMING CALL VIEW */}
      {isRinging && (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark text-white d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 2000 }}>
          <div className="text-center p-4">
            <div className="avatar bg-primary rounded-circle mb-3 mx-auto d-flex align-items-center justify-content-center animate__animated animate__pulse animate__infinite" style={{ width: '80px', height: '80px' }}>
              <i className="fa fa-user-md fa-2x"></i>
            </div>
            <h4 className="fw-bold">{callerName}</h4>
            <p className="text-muted small">Incoming {callType} call...</p>
            <div className="d-flex gap-3 justify-content-center mt-4">
              <button onClick={acceptCall} className="btn btn-success rounded-pill px-4 py-2"><i className="fa fa-phone me-2"></i>Accept</button>
              <button onClick={declineCall} className="btn btn-danger rounded-pill px-4 py-2"><i className="fa fa-phone-slash me-2"></i>Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* 📹 ACTIVE CALL OVERLAY */}
      {callActive && (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark text-white d-flex flex-column justify-content-between p-3" style={{ zIndex: 1999 }}>
          
          {/* Video Frames Container */}
          <div className="flex-grow-1 d-flex gap-2 position-relative rounded overflow-hidden" style={{ background: '#111' }}>
            {/* Remote Screen */}
            {callType === 'video' ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-100 h-100" style={{ objectFit: 'cover' }}></video>
            ) : (
              <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary">
                <i className="fa fa-volume-up fa-3x"></i>
              </div>
            )}
            
            {/* Local Miniature Screen (PIP) */}
            {callType === 'video' && (
              <div className="position-absolute bottom-2 end-2 rounded border border-light overflow-hidden shadow-lg" style={{ width: '100px', height: '120px', bottom: '10px', right: '10px', zIndex: 10 }}>
                <video ref={localVideoRef} autoPlay playsInline muted className="w-100 h-100" style={{ objectFit: 'cover' }}></video>
              </div>
            )}
          </div>

          {/* Call Status and Controls */}
          <div className="d-flex flex-column align-items-center mt-3 gap-2">
            {isCalling && <p className="small text-warning m-0">Ringing {chatPartnerName}...</p>}
            <div className="d-flex gap-3 justify-content-center align-items-center">
              <button onClick={toggleMuteAudio} className={`btn btn-circle rounded-circle border-0 ${audioMuted ? 'btn-danger' : 'btn-secondary'}`} style={{ width: '45px', height: '45px' }}>
                <i className={`fa ${audioMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>
              {callType === 'video' && (
                <button onClick={toggleMuteVideo} className={`btn btn-circle rounded-circle border-0 ${videoMuted ? 'btn-danger' : 'btn-secondary'}`} style={{ width: '45px', height: '45px' }}>
                  <i className={`fa ${videoMuted ? 'fa-video-slash' : 'fa-video'}`}></i>
                </button>
              )}
              <button onClick={hangUpCall} className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="fa fa-phone-slash"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-header bg-primary text-white py-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <i className="fa fa-circle text-success fs-6" style={{ fontSize: '10px' }}></i>
          <span className="fw-bold">{chatPartnerName}</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => startCall('audio')} className="btn btn-link text-white p-0 border-0 bg-transparent" title="Voice Call">
            <i className="fa fa-phone fs-5 text-white"></i>
          </button>
          <button onClick={() => startCall('video')} className="btn btn-link text-white p-0 border-0 bg-transparent" title="Video Call">
            <i className="fa fa-video fs-5 text-white"></i>
          </button>
          <span className="badge bg-light text-primary small">Private Channel</span>
        </div>
      </div>

      <div ref={chatBodyRef} className="card-body p-3 overflow-y-auto bg-light" style={{ height: '350px' , overflowY: 'scroll'}}>
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
