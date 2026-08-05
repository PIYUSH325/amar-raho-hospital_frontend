import React, { useState } from 'react';
import testimonial1 from '../assets/img/testimonial-1.jpg';
import testimonial2 from '../assets/img/testimonial-2.jpg';
import testimonial3 from '../assets/img/testimonial-3.jpg';

export const TestimonialCarousel: React.FC = () => {
  const testimonials = [
    {
      image: testimonial1,
      text: 'Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.',
      name: 'Patient Name',
      profession: 'Profession',
    },
    {
      image: testimonial2,
      text: 'Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.',
      name: 'Patient Name',
      profession: 'Profession',
    },
    {
      image: testimonial3,
      text: 'Clita clita tempor justo dolor ipsum amet kasd amet duo justo duo duo labore sed sed. Magna ut diam sit et amet stet eos sed clita erat magna elitr erat sit sit erat at rebum justo sea clita.',
      name: 'Patient Name',
      profession: 'Profession',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (activeIndex + 1) % testimonials.length;

  return (
    <div className="owl-carousel testimonial-carousel position-relative" style={{ display: 'block', width: '100%', overflow: 'hidden' }}>
      <div className="owl-stage-outer" style={{ width: '100%' }}>
        <div className="row justify-content-center align-items-center g-0">
          {/* Left item (desktop only) */}
          <div className="col-md-4 d-none d-md-block owl-item" style={{ transition: 'all 0.5s ease-in-out' }}>
            <div className="testimonial-item text-center">
              <img 
                className="img-fluid bg-light rounded-circle p-2 mx-auto mb-4" 
                src={testimonials[prevIndex].image} 
                style={{ width: '100px', height: '100px' }} 
                alt="" 
              />
              <div className="testimonial-text rounded text-center p-4">
                <p>{testimonials[prevIndex].text}</p>
                <h5 className="mb-1">{testimonials[prevIndex].name}</h5>
                <span className="fst-italic">{testimonials[prevIndex].profession}</span>
              </div>
            </div>
          </div>

          {/* Active Center item */}
          <div className="col-12 col-md-4 owl-item center" style={{ transition: 'all 0.5s ease-in-out' }}>
            <div className="testimonial-item text-center">
              <img 
                className="img-fluid bg-light rounded-circle p-2 mx-auto mb-4" 
                src={testimonials[activeIndex].image} 
                style={{ width: '100px', height: '100px' }} 
                alt="" 
              />
              <div className="testimonial-text rounded text-center p-4">
                <p>{testimonials[activeIndex].text}</p>
                <h5 className="mb-1">{testimonials[activeIndex].name}</h5>
                <span className="fst-italic">{testimonials[activeIndex].profession}</span>
              </div>
            </div>
          </div>

          {/* Right item (desktop only) */}
          <div className="col-md-4 d-none d-md-block owl-item" style={{ transition: 'all 0.5s ease-in-out' }}>
            <div className="testimonial-item text-center">
              <img 
                className="img-fluid bg-light rounded-circle p-2 mx-auto mb-4" 
                src={testimonials[nextIndex].image} 
                style={{ width: '100px', height: '100px' }} 
                alt="" 
              />
              <div className="testimonial-text rounded text-center p-4">
                <p>{testimonials[nextIndex].text}</p>
                <h5 className="mb-1">{testimonials[nextIndex].name}</h5>
                <span className="fst-italic">{testimonials[nextIndex].profession}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="owl-nav">
        <button type="button" className="owl-prev" onClick={handlePrev}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <button type="button" className="owl-next" onClick={handleNext}>
          <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default TestimonialCarousel;
