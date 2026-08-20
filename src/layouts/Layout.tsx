import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import Topbar from '../components/Topbar';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ senderName: string; text: string } | null>(null);

  useEffect(() => {
    if (!socket || !user?.id) return;

    // Register user ID in the private notification room on the server
    socket.emit('register', { userId: user.id });

    // Listen for incoming notifications
    socket.on('receive_message_notification', (data) => {
      // If user is actively viewing the chat room with this sender, skip notifications
      const activeRoom = sessionStorage.getItem('active_chat_room');
      if (activeRoom === data.msg.roomId) {
        return;
      }

      setNotification({
        senderName: data.senderName,
        text: data.msg.text
      });

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    });

    return () => {
      socket.off('receive_message_notification');
    };
  }, [socket, user?.id]);

  const handleNotificationClick = () => {
    if (!user) return;
    
    // Redirect to proper chat page based on user role
    const chatRoute = user.role === 'doctor' 
      ? '/doctor-portal?tab=chats' 
      : '/dashboard?tab=chats';
      
    navigate(chatRoute);
    setNotification(null);
  };

  return (
    <>
      <Spinner />
      <Topbar />
      <Navbar />
      {children}
      <Footer />
      <BackToTop />

      {/* Floating Global Toast Notification */}
      {notification && (
        <div 
          className="position-fixed p-3 bg-white rounded-3 shadow border text-start animate__animated animate__fadeInUp"
          onClick={handleNotificationClick}
          style={{ 
            bottom: '25px', 
            right: '25px', 
            zIndex: 9999, 
            width: '320px', 
            borderLeft: '5px solid #198754',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong className="text-success small">
              <i className="fa fa-comment me-1"></i> New Message (Click to view)
            </strong>
            <button 
              type="button" 
              className="btn-close btn-sm shadow-none" 
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering navigation
                setNotification(null);
              }}
            ></button>
          </div>
          <div className="fw-bold text-dark small mb-1">{notification.senderName}</div>
          <p className="text-muted small m-0 text-truncate">{notification.text}</p>
        </div>
      )}
    </>
  );
};

export default Layout;
