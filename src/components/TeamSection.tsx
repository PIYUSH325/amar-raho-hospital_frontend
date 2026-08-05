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
          <p className="d-inline-block border rounded-pill py-1 px-4">Doctors</p>
          <h1>Our Experience Doctors</h1>
        </div>
        <div className="row g-4">
          {doctors.map((doc, idx) => (
            <ScrollReveal 
              key={idx} 
              animation="fadeInUp" 
              delay={doc.delay} 
              className="col-lg-3 col-md-6"
            >
              <div className="team-item position-relative rounded overflow-hidden">
                <div className="overflow-hidden">
                  <img className="img-fluid" src={doc.image} alt={doc.name} />
                </div>
                <div className="team-text bg-light text-center p-4">
                  <h5>{doc.name}</h5>
                  <p className="text-primary">{doc.department}</p>
                  <div className="team-social text-center">
                    <a className="btn btn-square" href=""><i className="fab fa-facebook-f"></i></a>
                    <a className="btn btn-square" href=""><i className="fab fa-twitter"></i></a>
                    <a className="btn btn-square" href=""><i className="fab fa-instagram"></i></a>
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
