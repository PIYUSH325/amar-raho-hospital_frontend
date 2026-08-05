import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    try {
      await forgotPassword(email);
      setStatusMsg({
        type: 'success',
        text: 'A password reset link has been dispatched to your email address.',
      });
      setEmail('');
    } catch (err: any) {
      setStatusMsg({
        type: 'danger',
        text: err.message || 'Failed to request password reset. Please verify your email.',
      });
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
                <h2 className="mt-2">Recover Password</h2>
                <p className="text-muted">Enter your registered email to receive a recovery link</p>
              </div>

              {statusMsg && (
                <div className={`alert alert-${statusMsg.type} mb-4`} role="alert">
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
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
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded"
                  style={{ fontWeight: 600 }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Recovery Link'}
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="mb-0 text-muted">Back to <Link to="/login" className="text-primary fw-medium text-decoration-none">Sign In</Link></p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
