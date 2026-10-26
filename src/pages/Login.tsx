import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl py-5">
      <style>{`
        .login-card-input {
          background-color: #f8fafc;
          border: 1.5px solid #e2e8f0;
          transition: all 0.2s ease-in-out;
          font-size: 14px;
        }
        .login-card-input:focus {
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
            <div className="card border-0 shadow-lg rounded-5 overflow-hidden">
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
                      Welcome Back, <br />
                      <span className="text-warning">Stay Connected</span> with Your Care.
                    </h2>
                    <p className="small mb-5" style={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6 }}>
                      Sign in to access your digital prescriptions, upcoming appointments, and personalized AI medical guidance.
                    </p>

                    {/* Interactive Benefits List */}
                    <div className="d-flex flex-column gap-3">
                      <div className="portal-feature-item d-flex align-items-center">
                        <div className="portal-feature-icon me-3">
                          <i className="fa fa-calendar-check"></i>
                        </div>
                        <div>
                          <h6 className="text-white m-0 fw-bold" style={{ fontSize: '15px' }}>Manage Appointments</h6>
                          <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                            View schedules, reschedule visits, or check queue status.
                          </small>
                        </div>
                      </div>

                      <div className="portal-feature-item d-flex align-items-center">
                        <div className="portal-feature-icon me-3">
                          <i className="fa fa-file-medical-alt"></i>
                        </div>
                        <div>
                          <h6 className="text-white m-0 fw-bold" style={{ fontSize: '15px' }}>Prescriptions & Reports</h6>
                          <small style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                            Download PDF records, lab results, and diagnostic notes.
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
                            Always available for triage, queries, and doctor matching.
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
                <div className="col-lg-7 p-4 p-md-5 bg-white d-flex flex-column justify-content-center">
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                      <h3 className="fw-bold text-dark m-0">Sign In</h3>
                      <p className="text-muted small m-0">Access your Amar Raho Hospital profile</p>
                    </div>
                    <span className="badge portal-badge-patient px-3 py-2 rounded-pill fw-semibold">
                      <i className="fa fa-user-shield me-1"></i> Patient & Staff
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="alert alert-danger d-flex align-items-center py-2 px-3 mb-4 rounded-3 small" role="alert">
                      <i className="fa fa-exclamation-circle me-2 fs-5"></i>
                      <div>{errorMsg}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Email Address */}
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-secondary mb-1">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="fa fa-envelope"></i>
                        </span>
                        <input
                          type="email"
                          className="form-control login-card-input border-start-0 py-2"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Password with Eye Toggle */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-semibold text-secondary mb-0">Password</label>
                        <Link to="/forgot-password" className="text-primary small fw-semibold text-decoration-none">
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted">
                          <i className="fa fa-lock"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control login-card-input border-start-0 border-end-0 py-2"
                          placeholder="Enter your password"
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
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-primary w-100 py-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                      style={{ fontWeight: 600, transition: 'all 0.2s' }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        <>
                          <span>Sign In to Your Account</span>
                          <i className="fa fa-arrow-right ms-2"></i>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sign Up Navigation */}
                  <div className="text-center mt-4 pt-3 border-top">
                    <p className="mb-0 text-muted small">
                      Don't have an account?{' '}
                      <Link to="/signup" className="text-primary fw-semibold text-decoration-none">
                        Create an Account <i className="fa fa-chevron-right ms-1 small"></i>
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

export default Login;
