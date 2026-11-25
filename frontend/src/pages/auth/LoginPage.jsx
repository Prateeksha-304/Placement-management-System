import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import './LoginPage.css';

const LoginPage = () => {
  const { login, currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('pms_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('pms_remembered_email')));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  useEffect(() => {
    if (isAuthenticated && currentUser) navigate(`/${currentUser.role}`);
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = async event => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Enter your university email and password to continue.');
      return;
    }

    if (remember) localStorage.setItem('pms_remembered_email', email.trim());
    else localStorage.removeItem('pms_remembered_email');

    setSubmitting(true);
    try {
      const user = await login(email.trim().toLowerCase(), password, role);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || 'We could not sign you in. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className={`login-page${dark ? ' login-page-dark' : ''}`}>
    <section className="login-visual" aria-label="KLE Technological University campus">
      <div className="login-visual-shade" />
      <div className="login-image-caption"><span className="login-caption-mark" />KLE Technological University · Hubballi</div>
      <p className="login-campus-message">Building bright futures through learning, innovation, and meaningful careers.</p>
    </section>

    <section className="login-panel">
      <button type="button" onClick={toggleTheme} className="login-theme-toggle" aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} title={`Switch to ${dark ? 'light' : 'dark'} mode`}>
        {dark ? <Sun size={18} /> : <Moon size={18} />}<span>{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>

      <div className="login-content">
        <div className="login-brand">
          <img src="/icons/kle-tech-logo.png" alt="KLE Tech logo" />
          <div><span className="login-brand-kle">KLE Tech</span><span className="login-brand-subtitle">Technological University</span></div>
        </div>

        <div className="login-heading">
          <span className="login-eyebrow">PLACEMENT PORTAL</span>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your placement workspace.</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <label className="login-label">Sign in as
            <select value={role} onChange={event => setRole(event.target.value)} className="login-input login-select" disabled={submitting}>
              <option value="student">Student</option>
              <option value="officer">Placement Officer</option>
              <option value="coordinator">Placement Coordinator</option>
            </select>
          </label>

          <label className="login-label">University email
            <span className="login-input-wrap"><UserRound size={18} /><input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} className="login-input" placeholder="name@kletech.ac.in" disabled={submitting} /></span>
          </label>

          <label className="login-label">Password
            <span className="login-input-wrap"><LockKeyhole size={18} /><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="login-input" placeholder="Enter your password" disabled={submitting} /></span>
          </label>

          <label className="login-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} disabled={submitting} />Remember my email</label>
          {error && <p role="alert" className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}
          </button>
        </form>

        <p className="login-help">Use the email address associated with your student or staff account.</p>
      </div>

      <footer className="login-footer">© {new Date().getFullYear()} KLE Technological University</footer>
    </section>
  </main>;
};

export default LoginPage;
