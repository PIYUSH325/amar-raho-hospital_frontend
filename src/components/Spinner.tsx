import React, { useEffect, useState } from 'react';

export const Spinner: React.FC = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      id="spinner" 
      className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
      style={{ zIndex: 99999 }}
    >
      <div className="spinner-grow text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;
