import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // 1. Password confirmation check
    if (password !== confirmPassword) {
      setStatusMsg({ type: 'danger', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    if (!token) {
      setStatusMsg({ type: 'danger', text: 'Security token is missing.' });
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setStatusMsg({
        type: 'success',
        text: 'Your password has been reset successfully. Redirecting you to login...',
      });
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setStatusMsg({
        type: 'danger',
        text: err.message || 'Failed to reset password. The link may have expired or is invalid.',
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
                <h2 className="mt-2">Set New Password</h2>
                <p className="text-muted">Enter a secure new password for your account</p>
              </div>

              {statusMsg && (
                <div className={`alert alert-${statusMsg.type} mb-4`} role="alert">
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-medium">New Password</label>
                  <input
                    type="password"
                    className="form-control border-0 py-3"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control border-0 py-3"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded"
                  style={{ fontWeight: 600 }}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
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

export default ResetPassword;
