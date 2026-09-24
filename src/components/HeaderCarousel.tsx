import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import carousel1 from '../assets/img/carousel-1.jpg';
import carousel2 from '../assets/img/carousel-2.jpg';
import carousel3 from '../assets/img/carousel-3.jpg';

export const HeaderCarousel: React.FC = () => {
  const slides = [
    { 
      image: carousel1, 
      subtitle: 'World-Class Cardiology Care', 
      title: 'Advanced Heart & Vascular Center', 
      description: 'Experience precision cardiac surgeries, 24/7 ICU monitoring, and compassionate doctor care.' 
    },
    { 
      image: carousel2, 
      subtitle: 'Expert Neurological Diagnostics', 
      title: 'Brain & Spine Excellence Wing', 
      description: 'Comprehensive treatment for neurological conditions with state-of-the-art MRI and neuro-surgery labs.' 
    },
    { 
      image: carousel3, 
      subtitle: 'Comprehensive Respiratory Health', 
      title: 'Pulmonary & Emergency Care', 
      description: 'Dedicated lung disease management, non-invasive ventilation, and critical care units.' 
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play slide transition every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="owl-carousel header-carousel position-relative" style={{ display: 'block', width: '100%', overflow: 'hidden' }}>
      <div className="owl-stage-outer" style={{ position: 'relative', overflow: 'hidden', width: '100%' }}>
        <div 
          className="owl-stage" 
          style={{ 
            display: 'flex',
            width: `${slides.length * 100}%`,
            transform: `translate3d(-${currentIndex * (100 / slides.length)}%, 0px, 0px)`, 
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' 
          }}
        >
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`owl-item ${index === currentIndex ? 'active' : ''}`} 
              style={{ width: `${100 / slides.length}%`, position: 'relative' }}
            >
              <div className="owl-carousel-item position-relative">
                <img className="img-fluid w-100" src={slide.image} alt={slide.title} style={{ minHeight: '550px', objectFit: 'cover' }} />
                <div className="owl-carousel-text">
                  <div className="container" style={{ maxWidth: '850px' }}>
                    <div className="text-center px-3">
                      <span className="badge bg-primary text-white rounded-pill px-4 py-2 mb-3 shadow-lg animate-pulse-glow" style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                        <i className="fa fa-heartbeat me-2"></i>{slide.subtitle}
                      </span>
                      <h1 className="display-3 text-white mb-3 fw-bold animate-float" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        {slide.title}
                      </h1>
                      <p className="fs-5 text-white-50 mb-4 d-none d-md-block" style={{ maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
                        {slide.description}
                      </p>
                      <div className="d-flex justify-content-center gap-3 mt-4">
                        <Link to="/appointment" className="btn btn-pill-primary py-3 px-4 px-md-5 shadow-lg">
                          Book Appointment <i className="fa fa-calendar-check ms-2"></i>
                        </Link>
                        <Link to="/services" className="btn btn-pill-outline text-white border-white py-3 px-4 px-md-5 d-none d-sm-inline-block">
                          Explore Services <i className="fa fa-arrow-right ms-2"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="owl-nav">
        <button type="button" className="owl-prev rounded-circle shadow" onClick={handlePrev} title="Previous Slide">
          <i className="bi bi-chevron-left"></i>
        </button>
        <button type="button" className="owl-next rounded-circle shadow" onClick={handleNext} title="Next Slide">
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="owl-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`owl-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            title={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
export default HeaderCarousel;
