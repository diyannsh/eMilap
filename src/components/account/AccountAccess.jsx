import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, Mail, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import './AccountAccess.css';

export default function AccountAccess({ initialMode = 'login', onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState('');

  useEffect(() => {
    // Keep page from scrolling while modal is open
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.overflow = 'hidden';
    root.style.scrollBehavior = 'auto';
    body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousRootOverflow;
      root.style.scrollBehavior = previousScrollBehavior;
      body.style.overflow = previousBodyOverflow;
    };
  }, [onClose]);

  // Load active campus communities for signup dropdown
  useEffect(() => {
    let mounted = true;
    api.communities.list()
      .then((res) => {
        if (mounted && res?.data) {
          setCommunities(res.data);
          if (res.data.length > 0) setSelectedCommunity(res.data[0].slug);
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const title = mode === 'signup' ? 'Create an e-Milap account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to e-Milap';
  const subtitle = mode === 'signup'
    ? 'Join your campus lost-and-found community.'
    : mode === 'forgot'
      ? 'Enter your email to request password reset instructions.'
      : 'Welcome back. Enter your details to continue.';

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    if (mode === 'forgot') {
      setIsError(true);
      setMessage('Password reset via email is unsupported in this environment. Please contact your campus administrator for assistance.');
      return;
    }

    const form = event.currentTarget;
    const email = form.email.value.trim();
    const passwordVal = password || form.password?.value;

    setLoading(true);
    try {
      if (mode === 'signup') {
        const name = form.name.value.trim();
        await register(name, email, passwordVal, selectedCommunity);
        setMessage('Account created successfully!');
        setTimeout(() => onClose(), 600);
      } else {
        await login(email, passwordVal);
        setMessage('Signed in successfully!');
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-access-overlay" role="presentation" data-lenis-prevent onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="account-access-dialog" role="dialog" aria-modal="true" aria-labelledby="account-access-title">
        <button type="button" className="account-access-close" aria-label="Close" onClick={onClose}><X size={19} /></button>
        {mode === 'forgot' && (
          <div className="account-access-mark"><KeyRound size={21} /></div>
        )}
        <p className="account-access-eyebrow">e-Milap · Campus Lost &amp; Found</p>
        <h2 id="account-access-title">{title}</h2>
        <p className="account-access-subtitle">{subtitle}</p>

        {mode !== 'forgot' && (
          <div className="account-access-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => { setMode('signup'); setMessage(''); setIsError(false); setPassword(''); }}>Sign up</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setMessage(''); setIsError(false); setPassword(''); }}>Sign in</button>
          </div>
        )}

        <form className="account-access-form" onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label>
                Name
                <span className="account-access-input-wrap"><UserRound size={17} /><input name="name" autoComplete="name" placeholder="Your name" required /></span>
              </label>
              {communities.length > 0 && (
                <label>
                  Campus Community
                  <span className="account-access-input-wrap">
                    <Building2 size={17} />
                    <select
                      className="w-full bg-transparent text-platinum-400 outline-none"
                      value={selectedCommunity}
                      onChange={(e) => setSelectedCommunity(e.target.value)}
                    >
                      {communities.map((c) => (
                        <option key={c.id} value={c.slug} className="bg-mocha-900 text-platinum-400">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              )}
            </>
          )}
          <label>
            Email
            <span className="account-access-input-wrap"><Mail size={17} /><input type="email" name="email" autoComplete="email" placeholder="you@campus.edu" required /></span>
          </label>
          {mode !== 'forgot' && (
            <label>
              Password
              <span className="account-access-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  required
                />
                <button type="button" className="account-access-reveal" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          )}
          {mode === 'login' && (
            <div className="account-access-options">
              <label className="account-access-remember"><input type="checkbox" name="remember" /> Remember session</label>
              <button type="button" className="account-access-link" onClick={() => { setMode('forgot'); setMessage(''); setIsError(false); }}>Forgot password?</button>
            </div>
          )}
          {mode === 'signup' && <p className="account-access-hint">Password must be at least 8 characters. Sessions use secure HTTP-only cookies.</p>}
          <button type="submit" disabled={loading} className="account-access-submit">
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Request reset' : 'Sign in'}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="account-access-divider"><span>or</span></div>
            <button type="button" className="account-access-google" onClick={() => { setIsError(true); setMessage('Google Sign-In is unsupported in this environment. Please sign in using your campus email and password.'); }}>
              <span className="account-access-google-mark" aria-hidden="true">G</span>
              Continue with Google
            </button>
          </>
        )}

        {message && (
          <p className={`account-access-message ${isError ? 'text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg p-2.5 mt-3 text-xs' : 'text-signal-300'}`} role="status">
            {message}
          </p>
        )}
        {mode === 'forgot' ? (
          <button type="button" className="account-access-back" onClick={() => { setMode('login'); setMessage(''); setIsError(false); }}><ArrowLeft size={16} /> Back to sign in</button>
        ) : (
          <p className="account-access-switch">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="account-access-link" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); setIsError(false); }}>{mode === 'signup' ? 'Sign in' : 'Sign up'}</button>
          </p>
        )}
      </section>
    </div>
  );
}
