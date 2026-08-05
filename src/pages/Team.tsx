import React from 'react';
import PageHeader from '../components/PageHeader';
import TeamSection from '../components/TeamSection';

export const Team: React.FC = () => {
  return (
    <>
      <PageHeader title="Our Doctors" currentPage="Doctors" />
      <TeamSection />
    </>
  );
};

export default Team;
