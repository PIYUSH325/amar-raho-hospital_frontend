import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [partnerNameTyping, setPartnerNameTyping] = useState('');

  // Attachment & Media states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
  };

  // Audio / Voice Recording states
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  // Refs for hidden file inputs
  const documentInputRef = useRef<HTMLInputElement>(null);
  const photoVideoInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Call-related States
  const [callActive, setCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false); // Am I the caller?
  const [isRinging, setIsRinging] = useState(false);   // Am I receiving a call?
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [callerName, setCallerName] = useState('');
  const [incomingOffer, setIncomingOffer] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<any[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

  // Determine the unique room ID based on user roles
  const getRoomId = useCallback(() => {
    if (!user?.id || !chatPartnerId) return '';
    return currentUserRole === 'patient'
      ? `chat_${user.id}_${chatPartnerId}`
      : `chat_${chatPartnerId}_${user.id}`;
  }, [user?.id, chatPartnerId, currentUserRole]);

  // Scroll to bottom of message list container locally without scrolling browser page
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  const handleCleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    iceCandidatesQueue.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
    setIsCalling(false);
    setIsRinging(false);
    setIncomingOffer(null);
    setAudioMuted(false);
    setVideoMuted(false);
  }, []);

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
    sessionStorage.setItem('active_chat_room', roomId);

    // Helper to safely join the room
    const joinRoom = () => {
      console.log("👉 Client emitting 'join_room' for Room ID:", roomId);
      socket.emit('join_room', { roomId });
    };

    // 1. Join immediately if already connected, otherwise wait for connect event
    if (socket.connected) {
      joinRoom();
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
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchChatHistory();

    // 3. Listen for incoming messages
    socket.on('receive_message', (msg) => {
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
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate:", e);
        }
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    });

    socket.on('call_ended', () => {
      handleCleanupCall();
    });

    // Cleanup listeners when switching partner
    return () => {
      sessionStorage.removeItem('active_chat_room');
      socket.off('connect', joinRoom);
      socket.off('receive_message');
      socket.off('typing_status');
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('ice_candidate');
      socket.off('call_ended');
      handleCleanupCall();
    };
  }, [socket, chatPartnerId, user?.id, getRoomId, API_BASE_URL, handleCleanupCall]);

  // Bind video and audio streams when refs or streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callActive]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callActive]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callActive]);

  const createPeerConnection = (stream: MediaStream, roomId: string, iceServers: any[]) => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        // Fallback if event.streams is empty (common in audio-only calling)
        setRemoteStream((prevStream) => {
          const stream = prevStream || new MediaStream();
          stream.addTrack(event.track);
          return stream;
        });
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice_candidate', { roomId, candidate: event.candidate });
      }
    };

    return pc;
  };

  // WebRTC Calling logic
  const startCall = async (type: 'audio' | 'video') => {
    if (!socket || !user?.name) return;
    setCallType(type);
    setIsCalling(true);
    setCallActive(true);
    
    console.log("Starting call...");

    const roomId = getRoomId();

    try {
      // 1. Fetch dynamic ICE servers from backend
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const token = localStorage.getItem('hospital_token');
        const headers = { Authorization: `Bearer ${token}` };
        const iceServersRes = await axios.get(`${API_BASE_URL}/chats/token/ice-servers`, { headers });
        if (iceServersRes.data && iceServersRes.data.iceServers) {
          iceServers = iceServersRes.data.iceServers;
        }
      } catch (iceErr) {
        console.warn("Failed to fetch Twilio ICE servers, using Google STUN fallback.", iceErr);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(stream, roomId, iceServers);
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
      // 1. Fetch dynamic ICE servers from backend
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
      try {
        const token = localStorage.getItem('hospital_token');
        const headers = { Authorization: `Bearer ${token}` };
        const iceServersRes = await axios.get(`${API_BASE_URL}/chats/token/ice-servers`, { headers });
        if (iceServersRes.data && iceServersRes.data.iceServers) {
          iceServers = iceServersRes.data.iceServers;
        }
      } catch (iceErr) {
        console.warn("Failed to fetch Twilio ICE servers, using Google STUN fallback.", iceErr);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(stream, roomId, iceServers);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));

      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

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

  const toggleMuteAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleMuteVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. Please enable microphone permissions in your browser.");
    }
  };

  // Cancel / Discard Voice Recording
  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(t => t.stop());
      recordingStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  // Stop & Send Voice Recording
  const sendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !socket || !user?.id || !chatPartnerId) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const duration = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(t => t.stop());
        recordingStreamRef.current = null;
      }

      if (audioChunksRef.current.length === 0) {
        setIsRecordingAudio(false);
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      setIsRecordingAudio(false);
      setRecordingSeconds(0);

      try {
        setIsUploadingMedia(true);
        setUploadProgressText('Uploading voice note...');
        const token = localStorage.getItem('hospital_token');
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-note-${Date.now()}.webm`);

        const res = await axios.post(`${API_BASE_URL}/chats/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data && res.data.success) {
          const { fileUrl, fileName, fileSize } = res.data.data;
          const roomId = getRoomId();
          const patientId = currentUserRole === 'patient' ? user.id : chatPartnerId;
          const doctorId = currentUserRole === 'doctor' ? user.id : chatPartnerId;

          socket.emit('send_message', {
            roomId,
            senderId: user.id,
            recipientId: chatPartnerId,
            patientId,
            doctorId,
            text: '',
            messageType: 'audio',
            fileUrl,
            fileName,
            fileSize,
            duration,
            senderName: user.name
          });
        }
      } catch (err: any) {
        console.error("Failed to upload voice note:", err);
        alert("Failed to send voice note. Please try again.");
      } finally {
        setIsUploadingMedia(false);
        setUploadProgressText('');
      }
    };

    mediaRecorderRef.current.stop();
  };

  // Handle generic file upload (documents, photos, videos, audio)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, intendedType: 'document' | 'image' | 'audio' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !socket || !user?.id || !chatPartnerId) return;

    e.target.value = '';
    setShowAttachmentMenu(false);

    try {
      setIsUploadingMedia(true);
      setUploadProgressText(`Uploading ${intendedType}...`);

      const token = localStorage.getItem('hospital_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API_BASE_URL}/chats/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data && res.data.success) {
        const { fileUrl, fileName, fileType, fileSize } = res.data.data;
        const roomId = getRoomId();
        const patientId = currentUserRole === 'patient' ? user.id : chatPartnerId;
        const doctorId = currentUserRole === 'doctor' ? user.id : chatPartnerId;

        socket.emit('send_message', {
          roomId,
          senderId: user.id,
          recipientId: chatPartnerId,
          patientId,
          doctorId,
          text: '',
          messageType: fileType || intendedType,
          fileUrl,
          fileName,
          fileSize,
          senderName: user.name
        });
      }
    } catch (err: any) {
      console.error("File upload failed:", err);
      alert("Failed to upload attachment. Please try again.");
    } finally {
      setIsUploadingMedia(false);
      setUploadProgressText('');
    }
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
      text: messageText.trim(),
      messageType: 'text',
      senderName: user.name
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

          {/* Hidden audio player for remote user sound */}
          <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

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
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={documentInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx" 
          onChange={(e) => handleFileUpload(e, 'document')} 
        />
        <input 
          type="file" 
          ref={photoVideoInputRef} 
          style={{ display: 'none' }} 
          accept="image/*,video/*" 
          onChange={(e) => handleFileUpload(e, 'image')} 
        />
        <input 
          type="file" 
          ref={audioFileInputRef} 
          style={{ display: 'none' }} 
          accept="audio/*" 
          onChange={(e) => handleFileUpload(e, 'audio')} 
        />

        {/* Uploading Media Indicator Banner */}
        {isUploadingMedia && (
          <div className="position-absolute top-0 start-0 w-100 bg-primary text-white py-2 px-3 d-flex align-items-center justify-content-center gap-2 shadow-sm animate__animated animate__fadeInDown" style={{ zIndex: 1100 }}>
            <div className="spinner-border spinner-border-sm text-white" role="status"></div>
            <span className="small fw-semibold">{uploadProgressText || 'Uploading attachment...'}</span>
          </div>
        )}

        {/* Attachment Menu Popup (WhatsApp Style) */}
        {showAttachmentMenu && (
          <div 
            className="position-absolute bg-dark text-white rounded-4 shadow-lg p-2 animate__animated animate__fadeInUp"
            style={{
              bottom: '75px',
              left: '15px',
              zIndex: 1050,
              width: '210px',
              background: '#1e293b',
              border: '1px solid #334155'
            }}
          >
            <div className="d-flex flex-column gap-1">
              <button 
                type="button" 
                className="btn btn-dark text-start d-flex align-items-center gap-3 py-2 px-3 border-0 rounded-3 text-white" 
                style={{ background: 'transparent' }}
                onClick={() => { setShowAttachmentMenu(false); documentInputRef.current?.click(); }}
              >
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#6366f1' }}>
                  <i className="fa fa-file-alt text-white small"></i>
                </div>
                <span className="small fw-semibold">Document</span>
              </button>

              <button 
                type="button" 
                className="btn btn-dark text-start d-flex align-items-center gap-3 py-2 px-3 border-0 rounded-3 text-white" 
                style={{ background: 'transparent' }}
                onClick={() => { setShowAttachmentMenu(false); photoVideoInputRef.current?.click(); }}
              >
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#0284c7' }}>
                  <i className="fa fa-image text-white small"></i>
                </div>
                <span className="small fw-semibold">Photos & videos</span>
              </button>

              <button 
                type="button" 
                className="btn btn-dark text-start d-flex align-items-center gap-3 py-2 px-3 border-0 rounded-3 text-white" 
                style={{ background: 'transparent' }}
                onClick={() => { setShowAttachmentMenu(false); audioFileInputRef.current?.click(); }}
              >
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', background: '#ec4899' }}>
                  <i className="fa fa-headphones text-white small"></i>
                </div>
                <span className="small fw-semibold">Audio</span>
              </button>
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center my-auto text-muted">
            <i className="fa fa-comments fa-2x mb-2 text-muted opacity-50"></i>
            <p className="small mb-0">No messages yet. Say hello to start the chat!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === user?.id;
            const rawFileUrl = msg.fileUrl 
              ? (msg.fileUrl.startsWith('http') ? msg.fileUrl : `${API_BASE_URL.replace('/api', '')}${msg.fileUrl}`) 
              : '';

            return (
              <div key={msg._id || idx} className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                <div 
                  className="py-2 px-3 rounded-4 text-dark shadow-sm"
                  style={{
                    background: isMe ? '#dbeafe' : '#ffffff',
                    borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                    maxWidth: '85%'
                  }}
                >
                  {/* 📷 IMAGE MESSAGE */}
                  {msg.messageType === 'image' && rawFileUrl && (
                    <div className="mb-1">
                      <img 
                        src={rawFileUrl} 
                        alt={msg.fileName || 'Photo'} 
                        className="rounded-3 shadow-sm img-fluid"
                        style={{ maxHeight: '200px', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                        onClick={() => setPreviewImageModal(rawFileUrl)}
                      />
                    </div>
                  )}

                  {/* 🎥 VIDEO MESSAGE */}
                  {msg.messageType === 'video' && rawFileUrl && (
                    <div className="mb-1" style={{ maxWidth: '280px' }}>
                      <video 
                        src={rawFileUrl} 
                        controls 
                        className="rounded-3 shadow-sm w-100" 
                        style={{ maxHeight: '220px' }}
                      />
                    </div>
                  )}

                  {/* 📄 DOCUMENT MESSAGE */}
                  {msg.messageType === 'document' && rawFileUrl && (
                    <a 
                      href={rawFileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-decoration-none d-flex align-items-center gap-3 p-2 bg-white rounded-3 border mb-1 shadow-sm text-dark hover-bg-light"
                      style={{ minWidth: '220px' }}
                    >
                      <div className="d-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded p-2" style={{ width: '38px', height: '38px' }}>
                        <i className={`fa ${msg.fileName?.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-alt'} fs-5`}></i>
                      </div>
                      <div className="flex-grow-1 text-truncate text-start">
                        <div className="fw-bold small text-truncate" style={{ maxWidth: '140px' }}>{msg.fileName || 'Document'}</div>
                        <span className="text-muted" style={{ fontSize: '10px' }}>{msg.fileSize || 'Document File'}</span>
                      </div>
                      <i className="fa fa-arrow-down text-muted small me-1"></i>
                    </a>
                  )}

                  {/* 🎤 AUDIO / VOICE NOTE MESSAGE */}
                  {msg.messageType === 'audio' && rawFileUrl && (
                    <div className="d-flex flex-column gap-1 mb-1" style={{ minWidth: '240px' }}>
                      <div className="d-flex align-items-center gap-2 text-start">
                        <i className="fa fa-microphone text-primary"></i>
                        <span className="small fw-semibold text-dark">
                          {msg.duration ? `${formatSeconds(msg.duration)} Voice Note` : 'Voice Note'}
                        </span>
                      </div>
                      <audio 
                        src={rawFileUrl} 
                        controls 
                        className="w-100 mt-1" 
                        style={{ height: '36px', outline: 'none' }}
                      />
                    </div>
                  )}

                  {/* 💬 TEXT CAPTION / TEXT MESSAGE */}
                  {msg.text && (
                    <p className="m-0 small text-start" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  )}
                </div>
                <span className="text-muted" style={{ fontSize: '8px', marginTop: '2px', paddingLeft: '4px', paddingRight: '4px' }}>
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
      <div className="card-footer bg-white border-top p-3 position-relative">
        {/* 😊 Emoji Picker Popover */}
        {showEmojiPicker && (
          <div 
            className="position-absolute shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeInUp"
            style={{
              bottom: '75px',
              left: '15px',
              zIndex: 1060
            }}
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
              width={320}
              height={380}
              searchPlaceHolder="Search emojis & flags..."
            />
          </div>
        )}

        {isRecordingAudio ? (
          /* 🎙️ Voice Recording Active Bar */
          <div className="d-flex align-items-center justify-content-between w-100 py-1 animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="spinner-grow spinner-grow-sm text-danger" style={{ width: '12px', height: '12px' }}></span>
                <span className="fw-bold text-danger small">{formatSeconds(recordingSeconds)}</span>
              </div>
              <span className="text-muted small d-none d-sm-inline">Recording voice note...</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="btn btn-outline-danger btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '38px', height: '38px' }}
                onClick={cancelVoiceRecording}
                title="Discard Recording"
              >
                <i className="fa fa-trash"></i>
              </button>
              <button 
                type="button" 
                className="btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                style={{ width: '38px', height: '38px' }}
                onClick={sendVoiceRecording}
                title="Send Voice Note"
              >
                <i className="fa fa-paper-plane"></i>
              </button>
            </div>
          </div>
        ) : (
          /* 💬 Standard Message Input Bar with Attachments, Emoji and Mic Toggle */
          <div className="d-flex gap-2 align-items-center w-100">
            {/* Attachment Plus Button */}
            <button 
              type="button" 
              className={`btn ${showAttachmentMenu ? 'btn-secondary' : 'btn-light'} rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm`} 
              style={{ width: '40px', height: '40px', flexShrink: 0 }}
              onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); }}
              title="Add Attachment"
            >
              <i className={`fa ${showAttachmentMenu ? 'fa-times' : 'fa-plus'} text-muted`} style={{ fontSize: '14px' }}></i>
            </button>

            {/* Emoji Button */}
            <button 
              type="button" 
              className={`btn ${showEmojiPicker ? 'btn-primary text-white' : 'btn-light text-muted'} rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm`} 
              style={{ width: '40px', height: '40px', flexShrink: 0 }}
              onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); }}
              title="Choose Emoji"
            >
              <i className="fa fa-smile" style={{ fontSize: '17px' }}></i>
            </button>

            <input 
              type="text" 
              className="form-control rounded-pill px-4" 
              placeholder="Type your message..." 
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowEmojiPicker(false);
                  setShowAttachmentMenu(false);
                  handleSendMessage();
                }
              }}
              onClick={() => { setShowEmojiPicker(false); setShowAttachmentMenu(false); }}
            />

            {messageText.trim() ? (
              <button 
                type="button" 
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm" 
                style={{ width: '40px', height: '40px', flexShrink: 0 }}
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowAttachmentMenu(false);
                  handleSendMessage();
                }}
                title="Send Message"
              >
                <i className="fa fa-paper-plane" style={{ fontSize: '14px' }}></i>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-0 shadow-sm text-primary" 
                style={{ width: '40px', height: '40px', flexShrink: 0 }}
                onClick={startVoiceRecording}
                title="Record Voice Note"
              >
                <i className="fa fa-microphone fs-5"></i>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 🔍 Image Lightbox Preview Modal */}
      {previewImageModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate__animated animate__fadeIn"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999 }}
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="position-relative text-center" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={previewImageModal} 
              alt="Preview" 
              className="img-fluid rounded-4 shadow-lg" 
              style={{ maxHeight: '85vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              type="button" 
              className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow"
              style={{ width: '40px', height: '40px' }}
              onClick={() => setPreviewImageModal(null)}
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
