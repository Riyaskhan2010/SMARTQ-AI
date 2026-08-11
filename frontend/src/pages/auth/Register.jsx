import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Phone, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const { t }        = useLanguage();
  const navigate     = useNavigate();
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <h2 className="text-xl font-semibold text-white mb-6">{t('signUp')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('nameLabel')}</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="input pl-10" placeholder="Your full name" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('emailLabel')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input pl-10" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('phoneLabel')}</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input pl-10" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">{t('passwordLabel')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  className="input pl-10" placeholder="Min 6 characters" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('signUp')} <ChevronRight size={18} /></>}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            {t('haveAccount')} <Link to="/login" className="text-brand hover:text-brand-light">{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
