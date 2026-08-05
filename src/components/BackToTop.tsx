import React, { useEffect, useState } from 'react';

export const BackToTop: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <a
      href="#"
      onClick={scrollToTop}
      className={`btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top`}
      style={{ display: show ? 'flex' : 'none', transition: 'fade 0.5s' }}
    >
      <i className="bi bi-arrow-up"></i>
    </a>
  );
};

export default BackToTop;
