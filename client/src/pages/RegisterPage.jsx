import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Valid email is required.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!/\d/.test(form.password)) errs.password = 'Password must contain at least one number.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrs = {};
        data.errors.forEach(({ field, message }) => { fieldErrs[field] = message; });
        setErrors(fieldErrs);
      } else {
        setServerError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({
    value: form[name],
    onChange: (e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setErrors((e) => ({ ...e, [name]: '' })); },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent rounded-button flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-background" strokeWidth={2} />
          </div>
          <span className="text-text-primary font-semibold text-xl">ServiceBook</span>
        </div>

        <div className="card p-8">
          <h2 className="text-text-primary text-xl font-semibold mb-1">Create your account</h2>
          <p className="text-text-secondary text-sm mb-6">Start tracking your vehicles for free</p>

          {serverError && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-input px-4 py-3 text-sm mb-5" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="label">Full name</label>
              <input id="reg-name" type="text" autoComplete="name" className={`input ${errors.name ? 'border-danger focus:border-danger focus:ring-danger' : ''}`} placeholder="Alice Patel" {...field('name')} required />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="reg-email" className="label">Email address</label>
              <input id="reg-email" type="email" autoComplete="email" className={`input ${errors.email ? 'border-danger focus:border-danger focus:ring-danger' : ''}`} placeholder="you@example.com" {...field('email')} required />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} autoComplete="new-password" className={`input pr-10 ${errors.password ? 'border-danger focus:border-danger focus:ring-danger' : ''}`} placeholder="Min. 8 chars with a number" {...field('password')} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
