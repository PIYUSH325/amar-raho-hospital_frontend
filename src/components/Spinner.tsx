import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';

export const Spinner: React.FC = () => {
  // Initial full-screen preloader state
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  // Top progress bar state on route changes
  const [navProgress, setNavProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  const fullText = "AMAR RAHO HOSPITAL.....";

  // 1. Blinking block cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 400);
    return () => clearInterval(cursorInterval);
  }, []);

  // 2. Initial page load full-screen typewriter animation (runs ONCE on site open / refresh)
  useEffect(() => {
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 8;
      if (currentProgress > 100) currentProgress = 100;

      setProgress(currentProgress);

      const targetLength = Math.floor((currentProgress / 100) * fullText.length);
      setTypedText(fullText.substring(0, targetLength));

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setInitialLoading(false);
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []); // Runs once on initial load

  // 3. Smooth top progress bar on route changes (YouTube / GitHub style)
  useEffect(() => {
    if (initialLoading) return;

    setIsNavigating(true);
    setNavProgress(35);

    const t1 = setTimeout(() => setNavProgress(75), 100);
    const t2 = setTimeout(() => setNavProgress(100), 220);
    const t3 = setTimeout(() => {
      setIsNavigating(false);
      setNavProgress(0);
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname]);

  return (
    <>
      {/* Top Navigation Progress Bar on route changes */}
      {isNavigating && !initialLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '3px',
            width: `${navProgress}%`,
            background: 'linear-gradient(90deg, #13c5dd 0%, #0d6efd 50%, #198754 100%)',
            boxShadow: '0 0 10px #13c5dd, 0 0 5px #0d6efd',
            zIndex: 99999999,
            transition: 'width 0.15s ease-out, opacity 0.25s ease-in-out',
            opacity: navProgress === 100 ? 0 : 1,
          }}
        />
      )}

      {/* Full-screen Typewriter Preloader on initial site load / refresh */}
      {initialLoading &&
        ReactDOM.createPortal(
          <div
            id="cinematic-hospital-loader"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Roboto', 'Segoe UI', system-ui, -apple-system, sans-serif",
              userSelect: 'none',
              transition: 'opacity 0.3s ease-out',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Full-bleed background layer extending 300% across viewport */}
            <div
              style={{
                position: 'absolute',
                top: '-100vh',
                left: '-100vw',
                width: '300vw',
                height: '300vh',
                backgroundColor: '#ffffff',
                zIndex: -1,
              }}
            />

            {/* Dead-center content container */}
            <div
              style={{
                position: 'relative',
                width: '92%',
                maxWidth: '560px',
                margin: '0 auto',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Animated Typewriter Title with Blue Cursor Block */}
              <div
                style={{
                  fontSize: 'clamp(1.1rem, 3.8vw, 1.6rem)',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  marginBottom: '2rem',
                  color: '#0463FA',
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                <span>{typedText}</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '1.5rem',
                    backgroundColor: cursorVisible ? '#0463FA' : 'transparent',
                    marginLeft: '4px',
                    borderRadius: '1px',
                    flexShrink: 0,
                  }}
                />
              </div>

              {/* Horizontal Progress Bar Track */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#EFF5FF',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: '#0463FA',
                    boxShadow: '0 0 10px rgba(4, 99, 250, 0.5)',
                    transition: 'width 0.08s ease-out',
                    borderRadius: '10px',
                  }}
                />
              </div>

              {/* Dynamic Percentage Counter */}
              <div
                style={{
                  width: '100%',
                  textAlign: 'right',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#0463FA',
                  fontFamily: "'Courier New', Courier, monospace",
                }}
              >
                {progress}%
              </div>
            </div>
          </div>,
          document.documentElement
        )}
    </>
  );
};

export default Spinner;
