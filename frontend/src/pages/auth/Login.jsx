import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ChevronRight, User, Shield, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { role: 'USER',  email: 'demo.user@smartq.ai',  icon: User,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  { role: 'ADMIN', email: 'demo.admin@smartq.ai', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { role: 'STAFF', email: 'demo.staff@smartq.ai', icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
];

export default function Login() {
  const { login }   = useAuth();
  const { t }       = useLanguage();
  const navigate    = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

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

  const fillDemo = (email) => setForm({ email, password: 'demo123' });

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
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('signIn')} <ChevronRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            {t('noAccount')} <Link to="/register" className="text-brand hover:text-brand-light">{t('signUp')}</Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-6">
          <p className="text-xs text-slate-600 text-center mb-3 uppercase tracking-wider">{t('demoCredentials')}</p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map(({ role, email, icon: Icon, color, bg, border }) => (
              <button key={role} onClick={() => fillDemo(email)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border ${border} ${bg} hover:opacity-80 transition-opacity text-left`}>
                <Icon size={16} className={color} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{role}</p>
                  <p className="text-xs text-slate-500 truncate">{email} / demo123</p>
                </div>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
