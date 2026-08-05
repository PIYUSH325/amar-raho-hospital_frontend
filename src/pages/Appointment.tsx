import React from 'react';
import PageHeader from '../components/PageHeader';
import AppointmentForm from '../components/AppointmentForm';

export const Appointment: React.FC = () => {
  return (
    <>
      <PageHeader title="Appointment" currentPage="Appointment" />
      <AppointmentForm />
    </>
  );
};

export default Appointment;
