import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, UserRound, X } from 'lucide-react';
import './AccountAccess.css';

export default function AccountAccess({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Keep the page and Lenis from consuming wheel/touch input while this
    // dialog is open. The overlay itself remains a native scroll container.
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

  const title = mode === 'signup' ? 'Create an e-Milap account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to e-Milap';
  const subtitle = mode === 'signup'
    ? 'Join your campus lost-and-found community.'
    : mode === 'forgot'
      ? 'Enter your email to request password reset instructions.'
      : 'Welcome back. Enter your details to continue.';

  const submit = (event) => {
    event.preventDefault();
    setMessage(mode === 'forgot'
      ? 'Password reset will be available when the backend is connected.'
      : mode === 'signup'
        ? 'Account creation is ready to connect to the backend.'
        : 'Sign-in is ready to connect to the backend. No credentials were sent.');
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
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'is-active' : ''} onClick={() => { setMode('signup'); setMessage(''); }}>Sign up</button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Sign in</button>
          </div>
        )}

        <form className="account-access-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              Name
              <span className="account-access-input-wrap"><UserRound size={17} /><input name="name" autoComplete="name" placeholder="Your name" required /></span>
            </label>
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
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  pattern={mode === 'signup' ? '(?=.*[^A-Za-z0-9]).{8,}' : undefined}
                  title={mode === 'signup' ? 'Use at least 8 characters and include one special character.' : undefined}
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
              <label className="account-access-remember"><input type="checkbox" name="remember" /> Remember me</label>
              <button type="button" className="account-access-link" onClick={() => { setMode('forgot'); setMessage(''); }}>Forgot password?</button>
            </div>
          )}
          {mode === 'signup' && <p className="account-access-hint">Use at least 8 characters and include one special character. Authentication will be connected by the backend.</p>}
          <button type="submit" className="account-access-submit">{mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Request reset' : 'Sign in'}</button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="account-access-divider"><span>or</span></div>
            <button type="button" className="account-access-google" onClick={() => setMessage('Google sign-in will be available after an authentication provider is configured.')}>
              <span className="account-access-google-mark" aria-hidden="true">G</span>
              Continue with Google
            </button>
          </>
        )}

        {message && <p className="account-access-message" role="status">{message}</p>}
        {mode === 'forgot' ? (
          <button type="button" className="account-access-back" onClick={() => { setMode('login'); setMessage(''); }}><ArrowLeft size={16} /> Back to sign in</button>
        ) : (
          <p className="account-access-switch">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="account-access-link" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Sign in' : 'Sign up'}</button>
          </p>
        )}
        <p className="account-access-note">Preview only · Form data is not sent or saved</p>
      </section>
    </div>
  );
}
