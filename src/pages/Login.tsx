import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <div className="container">
        <div className="row justify-content-center">
          <ScrollReveal animation="fadeInUp" delay="0.1s" className="col-lg-5 col-md-8">
            <div className="bg-light rounded p-5 shadow-sm border">
              <div className="text-center mb-4">
                <h2 className="mt-2">Sign In</h2>
                <p className="text-muted">Access your Amar Raho Hospital profile</p>
              </div>

              {errorMsg && (
                <div className="alert alert-danger mb-4" role="alert">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Email Address</label>
                  <input
                    type="email"
                    className="form-control border-0 py-3"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <label className="form-label fw-medium mb-0">Password</label>
                    <Link to="/forgot-password" className="text-primary small text-decoration-none">Forgot Password?</Link>
                  </div>
                  <input
                    type="password"
                    className="form-control border-0 py-3"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded"
                  style={{ fontWeight: 600 }}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0 text-muted">Don't have an account? <Link to="/signup" className="text-primary fw-medium text-decoration-none">Sign Up</Link></p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default Login;
