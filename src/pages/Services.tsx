import React from 'react';
import PageHeader from '../components/PageHeader';
import ServiceSection from '../components/ServiceSection';
import AppointmentForm from '../components/AppointmentForm';
import TestimonialSection from '../components/TestimonialSection';

export const Services: React.FC = () => {
  return (
    <>
      <PageHeader title="Services" currentPage="Services" />
      <ServiceSection />
      <AppointmentForm />
      <TestimonialSection />
    </>
  );
};

export default Services;
