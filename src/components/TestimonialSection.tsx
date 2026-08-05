import React from 'react';
import TestimonialCarousel from './TestimonialCarousel';

export const TestimonialSection: React.FC = () => {
  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '600px' }}>
          <p className="d-inline-block border rounded-pill py-1 px-4">Testimonial</p>
          <h1>What Say Our Patients!</h1>
        </div>
        <TestimonialCarousel />
      </div>
    </div>
  );
};

export default TestimonialSection;
