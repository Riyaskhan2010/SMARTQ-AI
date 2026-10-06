import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ChevronRight, User, Shield, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

// ── Role config ────────────────────────────────────────────────────
// Credentials are mapped to real demo account emails server-side.
// Nothing sensitive is shown in the UI.
const ROLES = [
  { id: 'USER',  label: 'User',  icon: User,   color: 'text-blue-400',    border: 'border-blue-500/40',    activeBg: 'bg-blue-500/12'    },
  { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'text-purple-400',  border: 'border-purple-500/40',  activeBg: 'bg-purple-500/12'  },
  { id: 'STAFF', label: 'Staff', icon: Wrench, color: 'text-emerald-400', border: 'border-emerald-500/40', activeBg: 'bg-emerald-500/12' },
];

// Credential map — never rendered in the DOM
// uiUser/uiPass = what the user types in the UI
// email/backendPass = what gets sent to the backend API
const ROLE_CREDS = {
  USER:  { uiUser: 'THIRUNESH', uiPass: 'THIRU123', email: 'demo.user@smartq.ai',  backendPass: 'THIRU123', dest: '/dashboard'   },
  ADMIN: { uiUser: 'RIYASKHAN', uiPass: 'RIYAS123', email: 'demo.admin@smartq.ai', backendPass: 'RIYAS123', dest: '/admin'       },
  STAFF: { uiUser: 'PRINITHA',  uiPass: 'PRINI123', email: 'demo.staff@smartq.ai', backendPass: 'PRINI123', dest: '/staff/setup' },
};

export default function Login() {
  const { login } = useAuth();
  const { t }     = useLanguage();
  const navigate  = useNavigate();

  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Role-based credential validation ──────────────────────────
    if (selectedRole) {
      const creds = ROLE_CREDS[selectedRole];
      const enteredUser = form.email.trim().toUpperCase();
      const enteredPass = form.password.trim();

      // Accept both username (case-insensitive) — password must match exactly (case-insensitive)
      const usernameMatch = enteredUser === creds.uiUser;
      const passwordMatch = form.password.trim().toUpperCase() === creds.uiPass;

      if (!usernameMatch || !passwordMatch) {
        toast.error('Invalid username or password.');
        return;
      }

      // Credentials match — authenticate with the real backend account
      setLoading(true);
      try {
        const data = await login(creds.email, creds.backendPass);

        // Guard: returned role must match selected role
        if (data.user.role !== selectedRole) {
          toast.error('Invalid username or password.');
          return;
        }

        toast.success(`Welcome, ${data.user.name}!`);
        navigate(creds.dest);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── Standard login (no role selected) ────────────────────────
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      const dest =
        data.user.role === 'ADMIN' ? '/admin' :
        data.user.role === 'STAFF' ? '/staff/setup' :
        '/dashboard';
      navigate(dest);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-electric rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SmartQ <span className="text-brand">AI</span></span>
          </div>
          <p className="text-slate-500 text-sm">{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-2">{t('signIn')}</h2>

          {/* Role indicator */}
          {selectedRole && (
            <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-xl border ${activeRole.border} ${activeRole.activeBg}`}>
              <activeRole.icon size={14} className={activeRole.color} />
              <span className={`text-xs font-semibold ${activeRole.color}`}>
                Signing in as {activeRole.label}
              </span>
            </div>
          )}
          {!selectedRole && <p className="text-xs text-slate-500 mb-5">Select a role below, then enter your credentials.</p>}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                {selectedRole ? 'Username' : t('emailLabel')}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={selectedRole ? 'text' : 'email'}
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-10"
                  placeholder={selectedRole ? 'Enter your username' : 'you@example.com'}
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{t('signIn')} <ChevronRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('noAccount')} <Link to="/register" className="text-brand hover:text-brand-light">{t('signUp')}</Link>
          </p>
        </div>

        {/* Role selector */}
        <div className="mt-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-surface-border" />
            <p className="text-xs text-slate-600 uppercase tracking-wider">Select Role</p>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ id, label, icon: Icon, color, border, activeBg }) => {
              const isActive = selectedRole === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(isActive ? null : id);
                    setForm({ email: '', password: '' });
                  }}
                  className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all
                    hover:-translate-y-0.5
                    ${isActive
                      ? `${border} ${activeBg} ring-1 ${border.replace('border-','ring-')}`
                      : 'border-surface-border hover:border-slate-600 bg-navy-800/40'}`}>
                  <Icon size={18} className={isActive ? color : 'text-slate-500'} />
                  <span className={`text-xs font-semibold ${isActive ? color : 'text-slate-400'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${border} ${color} leading-none`}>
                      SELECTED
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-700 mt-2">
            Select a role, then enter your credentials above
          </p>
        </div>

      </div>
    </div>
  );
}
