import React from 'react';
import ScrollReveal from './ScrollReveal';
import team1 from '../assets/img/team-1.jpg';
import team2 from '../assets/img/team-2.jpg';
import team3 from '../assets/img/team-3.jpg';
import team4 from '../assets/img/team-4.jpg';

interface Doctor {
  image: string;
  name: string;
  department: string;
  delay: string;
}

export const TeamSection: React.FC = () => {
  const doctors: Doctor[] = [
    {
      image: team1,
      name: 'Dr. (Miss) Kanta Laga',
      department: 'Department of Life Extensions (Anti-Death Surgery)',
      delay: '0.1s',
    },
    {
      image: team2,
      name: 'Dr. Amar Rahe',
      department: 'Department of Shocking Recovery (Cardiology)',
      delay: '0.3s',
    },
    {
      image: team3,
      name: 'Dr. (Mrs.) Rahat Milega',
      department: 'Department of Instant Relief (General Medicine)Department',
      delay: '0.5s',
    },
    {
      image: team4,
      name: 'Dr. Jhatka Singh,',
      department: 'The "No-Google" Psychiatric Wing',
      delay: '0.7s',
    },
  ];

  return (
    <div className="container-xxl py-5">
      <div className="container">
        <div className="text-center mx-auto mb-5 wow fadeInUp" data-wow-delay="0.1s" style={{ maxWidth: '600px' }}>
          <span className="badge bg-light text-primary border border-primary-subtle rounded-pill py-2 px-4 mb-3 fw-semibold">
            <i className="fa fa-user-md me-2"></i>Doctors
          </span>
          <h1 className="fw-bold">Our Experienced Doctors</h1>
        </div>
        <div className="row g-4">
          {doctors.map((doc, idx) => (
            <ScrollReveal 
              key={idx} 
              animation="fadeInUp" 
              delay={doc.delay} 
              className="col-lg-3 col-md-6"
            >
              <div className="curved-card team-item position-relative bg-white h-100">
                <div className="overflow-hidden rounded-top-4">
                  <img className="img-fluid w-100" src={doc.image} alt={doc.name} style={{ height: '280px', objectFit: 'cover' }} />
                </div>
                <div className="team-text bg-white text-center p-4">
                  <h5 className="fw-bold mb-2">{doc.name}</h5>
                  <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mb-3 small">{doc.department}</span>
                  <div className="team-social text-center mt-2">
                    <a className="btn btn-square me-1 rounded-circle" href=""><i className="fab fa-facebook-f"></i></a>
                    <a className="btn btn-square me-1 rounded-circle" href=""><i className="fab fa-twitter"></i></a>
                    <a className="btn btn-square rounded-circle" href=""><i className="fab fa-instagram"></i></a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSection;
