import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ChevronRight, User, Shield, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { role: 'USER',  label: 'Login as User',  email: 'demo.user@smartq.ai',  icon: User,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   dest: '/dashboard' },
  { role: 'ADMIN', label: 'Login as Admin', email: 'demo.admin@smartq.ai', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', dest: '/admin' },
  { role: 'STAFF', label: 'Login as Staff', email: 'demo.staff@smartq.ai', icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dest: '/staff/setup' },
];

export default function Login() {
  const { login }   = useAuth();
  const { t }       = useLanguage();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // stores role while loading

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.role);
    try {
      await login(account.email, 'demo123');
      toast.success(`Logged in as ${account.role.charAt(0) + account.role.slice(1).toLowerCase()}`);
      navigate(account.dest);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

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

        {/* Login card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">{t('signIn')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('emailLabel')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10" placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>{t('signIn')} <ChevronRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('noAccount')} <Link to="/register" className="text-brand hover:text-brand-light">{t('signUp')}</Link>
          </p>
        </div>

        {/* Quick Demo section */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-surface-border" />
            <p className="text-xs text-slate-600 uppercase tracking-wider">Quick Demo</p>
            <div className="flex-1 h-px bg-surface-border" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(({ role, label, icon: Icon, color, bg, border }) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(DEMO_ACCOUNTS.find(a => a.role === role))}
                disabled={!!demoLoading}
                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border ${border} ${bg}
                  transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait`}>
                {demoLoading === role
                  ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  : <Icon size={18} className={color} />}
                <span className="text-xs font-semibold text-white leading-tight text-center">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-slate-700 mt-2">One click — no credentials needed</p>
        </div>
      </div>
    </div>
  );
}
