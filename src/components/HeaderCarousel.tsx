import React, { useState } from 'react';
import carousel1 from '../assets/img/carousel-1.jpg';
import carousel2 from '../assets/img/carousel-2.jpg';
import carousel3 from '../assets/img/carousel-3.jpg';

export const HeaderCarousel: React.FC = () => {
  const slides = [
    { image: carousel1, title: 'Cardiology' },
    { image: carousel2, title: 'Neurology' },
    { image: carousel3, title: 'Pulmonary' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

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
            transition: 'transform 0.5s ease-in-out' 
          }}
        >
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`owl-item ${index === currentIndex ? 'active' : ''}`} 
              style={{ width: `${100 / slides.length}%`, position: 'relative' }}
            >
              <div className="owl-carousel-item position-relative">
                <img className="img-fluid" src={slide.image} alt={slide.title} />
                <div className="owl-carousel-text">
                  <h1 className="display-1 text-white mb-0">{slide.title}</h1>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="owl-nav">
        <button type="button" className="owl-prev" onClick={handlePrev}>
          <i className="bi bi-chevron-left"></i>
        </button>
        <button type="button" className="owl-next" onClick={handleNext}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      {/* Dots */}
      <div className="owl-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`owl-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};
export default HeaderCarousel;
