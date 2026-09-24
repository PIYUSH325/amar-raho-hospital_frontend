import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Dynamic Password Strength Assessment
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: '#dc3545' };
    if (score === 2) return { score: 50, label: 'Fair', color: '#ffc107' };
    if (score === 3) return { score: 75, label: 'Good', color: '#0dcaf0' };
    return { score: 100, label: 'Strong', color: '#198754' };
  };

  const strength = getPasswordStrength();
  const isMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-check.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl py-5">
      <style>{`
        .register-card-input {
          background-color: #f8fafc;
          border: 1.5px solid #e2e8f0;
          transition: all 0.2s ease-in-out;
          font-size: 14px;
        }
        .register-card-input:focus {
          background-color: #ffffff;
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.12);
        }
        .portal-feature-item {
          background: rgba(255, 255, 255, 0.14) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-radius: 12px;
          padding: 14px 16px;
          transition: all 0.25s ease-in-out;
          backdrop-filter: blur(8px);
        }
        .portal-feature-item:hover {
          background: rgba(255, 255, 255, 0.24) !important;
          border-color: rgba(255, 255, 255, 0.45) !important;
          transform: translateX(6px);
        }
        .portal-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
          font-size: 15px;
        }
        .portal-badge-glass {
          background: rgba(255, 255, 255, 0.16) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: #ffffff !important;
          backdrop-filter: blur(6px);
        }
        .portal-badge-patient {
          background-color: #eff6ff !important;
          color: #0d6efd !important;
          border: 1px solid #bfdbfe !important;
        }
      `}</style>

      <div className="container">
        <div className="row justify-content-center">
          <ScrollReveal animation="fadeInUp" delay="0.1s" className="col-xl-10 col-lg-11">
            <div className="card border-0 curved-card hover-3d-card shadow-lg rounded-5 overflow-hidden">
              <div className="row g-0">
                {/* Left Visual & Feature Panel */}
                <div 
                  className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative"
                  style={{ 
                    background: 'linear-gradient(145deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
                  }}
                >
                  <div>
                    {/* Hospital Branding Badge */}
                    <div className="d-inline-flex align-items-center portal-badge-glass rounded-pill px-3 py-1 mb-4">
                      <i className="fa fa-hospital me-2 text-warning"></i>
                      <span className="small fw-semibold text-white">Amar Raho Hospital Portal</span>
                    </div>

                    <h2 className="display-6 text-white fw-bold mb-3">
                      Your Health, <br />
                      <span className="text-warning">Connected</span> in One Place.
                    </h2>
                    <p className="small mb-5" style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                      Create your free patient account to instantly book appointments, access digital prescriptions, and consult our AI medical guide.
                    </p>

                    {/* Interactive Benefits List */}
                    <div className="d-flex flex-column gap-3">
                      <div className="portal-feature-item d-flex align-items-center">
                        <div className="portal-feature-icon me-3">
                          <i className="fa fa-calendar-check"></i>
                        </div>
                        <div>
                          <h6 className="text-white m-0 fw-bold" style={{ fontSize: '15px' }}>Instant Doctor Bookings</h6>
                          <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                            Select specialty, pick verified slots, and confirm.
                          </small>
                        </div>
                      </div>

                      <div className="portal-feature-item d-flex align-items-center">
                        <div className="portal-feature-icon me-3">
                          <i className="fa fa-file-medical"></i>
                        </div>
                        <div>
                          <h6 className="text-white m-0 fw-bold" style={{ fontSize: '15px' }}>Smart Lab Reports & OCR</h6>
                          <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                            Automated AI scanning and secure digital archives.
                          </small>
                        </div>
                      </div>

                      <div className="portal-feature-item d-flex align-items-center">
                        <div className="portal-feature-icon me-3">
                          <i className="fa fa-robot"></i>
                        </div>
                        <div>
                          <h6 className="text-white m-0 fw-bold" style={{ fontSize: '15px' }}>24/7 AI Health Assistant</h6>
                          <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                            Real-time guidance on symptoms, triage, and care.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="pt-4 d-flex align-items-center justify-content-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <div className="d-flex align-items-center">
                      <div className="text-warning me-2 small">
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                        <i className="fa fa-star"></i>
                      </div>
                      <span className="small fw-semibold" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>12,000+ Patients</span>
                    </div>
                    <span className="badge rounded-pill px-3 py-2 fw-bold" style={{ backgroundColor: '#ffffff', color: '#0d6efd' }}>256-bit SSL</span>
                  </div>
                </div>

                {/* Right Interactive Form Panel */}
                <div className="col-lg-7 p-4 p-md-5 bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h3 className="fw-bold text-dark m-0">Create an Account</h3>
                      <p className="text-muted small m-0">Join Amar Raho Hospital as a verified patient</p>
                    </div>
                    <span className="badge portal-badge-patient px-3 py-2 rounded-pill fw-semibold">
                      <i className="fa fa-user-shield me-1"></i> Patient Portal
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-4 rounded-3 small" role="alert">
                      <i className="fa fa-exclamation-circle me-2 fs-5"></i>
                      <div>{errorMsg}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      {/* Full Name */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary mb-1">Full Name</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="fa fa-user"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control register-card-input border-start-0 py-2"
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary mb-1">Email Address</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="fa fa-envelope"></i>
                          </span>
                          <input
                            type="email"
                            className="form-control register-card-input border-start-0 py-2"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {/* Password with Eye Toggle */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary mb-1">Password</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="fa fa-lock"></i>
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control register-card-input border-start-0 border-end-0 py-2"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="input-group-text bg-light border-start-0 text-muted"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        {/* Interactive Password Strength Indicator */}
                        {password && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted" style={{ fontSize: '11px' }}>Strength:</small>
                              <small className="fw-semibold" style={{ fontSize: '11px', color: strength.color }}>
                                {strength.label}
                              </small>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${strength.score}%`, backgroundColor: strength.color, transition: 'width 0.3s ease' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password with Eye Toggle */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-secondary mb-1">Confirm Password</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 text-muted">
                            <i className="fa fa-shield-alt"></i>
                          </span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`form-control register-card-input border-start-0 border-end-0 py-2 ${confirmPassword && (isMatch ? 'is-valid' : 'is-invalid')}`}
                            placeholder="Retype your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="input-group-text bg-light border-start-0 text-muted"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            <i className={`fa ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </button>
                        </div>
                        {confirmPassword && (
                          <div className="mt-1">
                            {isMatch ? (
                              <small className="text-success d-flex align-items-center" style={{ fontSize: '11px' }}>
                                <i className="fa fa-check-circle me-1"></i> Passwords match
                              </small>
                            ) : (
                              <small className="text-danger d-flex align-items-center" style={{ fontSize: '11px' }}>
                                <i className="fa fa-times-circle me-1"></i> Passwords do not match
                              </small>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="col-12 mt-4">
                        <button
                          type="submit"
                          className="btn btn-primary w-100 py-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                          style={{ fontWeight: 600, transition: 'all 0.2s' }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Creating Your Account...
                            </>
                          ) : (
                            <>
                              <span>Complete Registration</span>
                              <i className="fa fa-arrow-right ms-2"></i>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Sign In Navigation */}
                  <div className="text-center mt-4 pt-3 border-top">
                    <p className="mb-0 text-muted small">
                      Already registered at Amar Raho Hospital?{' '}
                      <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                        Sign In here <i className="fa fa-chevron-right ms-1 small"></i>
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default Register;