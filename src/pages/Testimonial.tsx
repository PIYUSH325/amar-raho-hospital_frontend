import React from 'react';
import PageHeader from '../components/PageHeader';
import TestimonialSection from '../components/TestimonialSection';

export const Testimonial: React.FC = () => {
  return (
    <>
      <PageHeader title="Testimonial" currentPage="Testimonial" />
      <TestimonialSection />
    </>
  );
};

export default Testimonial;
