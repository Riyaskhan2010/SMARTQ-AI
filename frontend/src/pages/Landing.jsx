import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain, Ticket, Activity, Navigation, GitBranch, Globe,
  ArrowRight, Zap, CheckCircle, ChevronRight, Users, Shield,
  Wrench, Building2, GraduationCap, Landmark, Banknote,
  Clock, MapPin, TrendingUp, BarChart2, Radio, Sparkles,
  Menu, X,
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast           from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ── inline Navbar (landing-only, supports smooth-scroll anchors) ─
function LandingNav() {
  const { user, logout }   = useAuth();
  const { t, lang, setLang, languages } = useLanguage();
  const navigate           = useNavigate();
  const [open, setOpen]    = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dashPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/staff/setup' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-electric rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">SmartQ <span className="text-brand">AI</span></span>
          </Link>

          {/* Desktop centre links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[['Features','features'],['How It Works','how-it-works'],['Sectors','sectors'],['Demo','demo']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-slate-400 hover:text-white transition-colors font-medium">{label}</button>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language */}
            <div className="relative">
              <button onClick={() => setLangOpen(p => !p)}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
                <Globe size={15} /><span>{lang.toUpperCase()}</span><ChevronRight size={11} className="rotate-90" />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-9 w-44 bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-navy-700 transition-colors ${lang === l.code ? 'text-brand' : 'text-slate-300'}`}>
                      <span>{l.nativeName}</span><span className="text-slate-600">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link to={dashPath} className="btn-primary text-sm py-2 px-5">Dashboard</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-slate-400 hover:text-white transition-colors">{t('logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm py-2 px-4">{t('login')}</Link>
                <Link to="/register" className="btn-primary  text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpen(p => !p)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1 border-t border-surface-border pt-3">
            {[['Features','features'],['How It Works','how-it-works'],['Sectors','sectors'],['Demo','demo']].map(([label, id]) => (
              <button key={id} onClick={() => { scrollTo(id); setOpen(false); }}
                className="block w-full text-left px-2 py-2 text-slate-300 hover:text-white text-sm">{label}</button>
            ))}
            {user
              ? <Link to={dashPath} onClick={() => setOpen(false)} className="block px-2 py-2 text-brand text-sm font-medium">Dashboard</Link>
              : <Link to="/login"   onClick={() => setOpen(false)} className="block px-2 py-2 text-slate-300 text-sm">{t('login')}</Link>}
          </div>
        )}
      </div>
    </header>
  );
}

// ── Live preview card (demo data) ────────────────────────────────
function LivePreviewCard() {
  const [eta, setEta]         = useState(24);
  const [pulse, setPulse]     = useState(false);
  const [secAgo, setSecAgo]   = useState(12);
  const [confidence]          = useState(92);

  useEffect(() => {
    const t = setInterval(() => {
      setEta(e => { const n = e + (Math.random() > 0.5 ? 1 : -1); return Math.max(18, Math.min(35, n)); });
      setSecAgo(0);
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }, 4000);
    const tick = setInterval(() => setSecAgo(s => s + 1), 1000);
    return () => { clearInterval(t); clearInterval(tick); };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <div className="absolute -inset-4 bg-gradient-to-br from-brand/20 to-electric/10 rounded-3xl blur-2xl pointer-events-none" />
      <div className="relative card p-6 border-brand/30 bg-surface-card/90 backdrop-blur">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand to-electric rounded-lg flex items-center justify-center">
              <Zap size={13} className="text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block leading-none">SmartQ Live</span>
              <span className="text-[10px] text-slate-600">Rajiv Gandhi Govt Hospital · OPD</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold">LIVE</span>
          </div>
        </div>

        {/* Primary metrics */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {[
            { label: 'Queue',      value: '18',      unit: 'people',   color: 'text-white',        icon: '👥' },
            { label: 'AI Wait',   value: String(eta), unit: 'min',     color: pulse ? 'text-brand' : 'text-white', icon: '⏱' },
            { label: 'Crowd',     value: 'MEDIUM',   unit: null,       color: 'text-yellow-400',   icon: '📊' },
            { label: 'Travel ETA', value: '18',      unit: 'min',      color: 'text-white',        icon: '🗺' },
          ].map(m => (
            <div key={m.label} className="bg-navy-800/80 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-500 mb-0.5">{m.label}</p>
              <p className={`text-lg font-extrabold transition-colors duration-300 ${m.color}`}>
                {m.value}{m.unit && <span className="text-[10px] text-slate-500 ml-1">{m.unit}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Counters active bar */}
        <div className="flex items-center gap-2 bg-navy-800/60 rounded-xl px-3 py-2 mb-3">
          <div className="flex gap-1">
            {[1,2,3].map(n => <span key={n} className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/40 rounded flex items-center justify-center text-[9px] font-bold text-emerald-400">C{n}</span>)}
            <span className="w-5 h-5 bg-slate-700/50 border border-slate-600/30 rounded flex items-center justify-center text-[9px] font-bold text-slate-600">C4</span>
          </div>
          <span className="text-xs text-slate-400">4 Counters · 3 Active</span>
        </div>

        {/* Departure */}
        <div className="bg-brand/10 border border-brand/25 rounded-xl p-2.5 mb-3 flex items-center gap-2">
          <Clock size={13} className="text-brand flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] text-slate-500">Recommended Departure</p>
            <p className="text-sm font-bold text-brand">1:42 PM</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Travel + Queue</p>
            <p className="text-xs text-slate-300 font-medium">18 + {eta} min</p>
          </div>
        </div>

        {/* Confidence + updated */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 transition-opacity duration-300 ${pulse ? 'opacity-100' : 'opacity-70'}`}>
            <Brain size={11} className="text-purple-400" />
            <span className="text-[10px] text-purple-400 font-medium">AI Confidence: {confidence}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-600">Updated {secAgo}s ago</span>
            <span className="text-[10px] bg-navy-800 border border-surface-border text-slate-600 px-1.5 py-0.5 rounded-full">DEMO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing export ───────────────────────────────────────────
export default function Landing() {
  const { t }        = useLanguage();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const dashPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/staff/setup' : '/dashboard';

  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">
      <LandingNav />

      {/* ── 1. HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24">
        {/* Background glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/8 via-transparent to-electric/5 pointer-events-none" />
        <div className="absolute top-10 left-1/3 w-80 h-80 bg-brand/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-electric/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/30 rounded-full px-4 py-1.5 mb-6">
                <Sparkles size={13} className="text-brand" />
                <span className="text-xs text-brand font-semibold uppercase tracking-wider">AI-Powered Queue Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
                Turn Waiting Time<br />
                Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric">Smart Time.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6">
                AI-powered queue prediction, smart arrival planning, and real-time counter
                management — all in one platform.
              </p>

              <p className="text-sm font-medium text-slate-500 mb-8 tracking-wide">Predict • Plan • Navigate • Adapt • Serve</p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
                {user ? (
                  <Link to={dashPath} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                    Go to Dashboard <ArrowRight size={18} />
                  </Link>
                ) : (
                  <>
                    <button onClick={() => scrollTo('demo')} className="btn-primary text-base px-8 py-3 flex items-center gap-2">
                      Try Live Demo <ArrowRight size={18} />
                    </button>
                    <button onClick={() => scrollTo('how-it-works')} className="btn-secondary text-base px-8 py-3">
                      Explore How It Works
                    </button>
                  </>
                )}
              </div>

              {/* Tag strip */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {['Hospital', 'College', 'Govt Office', 'Bank', 'Post Office'].map(s => (
                  <span key={s} className="text-xs bg-navy-800 border border-surface-border text-slate-400 px-3 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>

            {/* Right: live preview card */}
            <div className="flex-1 w-full lg:flex lg:justify-end">
              <LivePreviewCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CAPABILITY METRICS ─────────────────────────────── */}
      <section className="border-y border-surface-border bg-surface-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: '8+', label: 'Languages',    sub: 'Tamil, Hindi, Arabic…' },
              { value: '4',  label: 'Primary Sectors', sub: 'Hospitals, Colleges…' },
              { value: 'AI', label: 'Predictions',  sub: 'Real-time ETA + Crowd' },
              { value: 'Live', label: 'Queue Updates', sub: 'Socket.IO real-time' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric">{s.value}</p>
                <p className="text-sm font-semibold text-white mt-1">{s.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PROBLEM SECTION ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">The Problem With Traditional Queues</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Long queues waste time, create overcrowding, and make service capacity difficult to manage.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Clock,      title: 'Uncertain Waiting',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',
              desc: "Users don't know how long they will actually wait — leading to frustration and wasted time." },
            { icon: MapPin,     title: 'Unplanned Arrival',       color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
              desc: 'People arrive too early and spend unnecessary time at the service centre.' },
            { icon: Users,      title: 'Crowd Overload',          color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
              desc: 'Service providers struggle to balance counters during peak demand without predictive data.' },
            { icon: Brain,      title: 'No Predictive Intelligence', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20',
              desc: 'Traditional queue systems manage tokens, but cannot predict what will happen next.' },
          ].map(({ icon: Icon, title, color, bg, border, desc }) => (
            <div key={title} className={`card p-6 ${border} hover:-translate-y-0.5 transition-all`}>
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <h3 className={`text-sm font-bold ${color} mb-2`}>{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Solution bridge */}
        <div className="mt-10 card p-6 border-brand/20 bg-gradient-to-r from-brand/5 to-electric/5 text-center">
          <p className="text-sm text-slate-400 mb-2">SmartQ AI solves all four problems with one platform.</p>
          <p className="text-base font-bold text-white">
            <span className="text-brand">Predict</span> → <span className="text-blue-400">Plan</span> → <span className="text-orange-400">Navigate</span> → <span className="text-emerald-400">Adapt</span> → <span className="text-pink-400">Serve</span>
          </p>
          <p className="text-xs text-slate-500 mt-2">
            From booking a token remotely to receiving an AI-powered departure recommendation and
            tracking the queue in real time — SmartQ AI turns waiting into a predictable service journey.
          </p>
        </div>
      </section>

      {/* ── 4. ARCHITECTURE / WORKFLOW VISUAL ─────────────────── */}
      <section className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How SmartQ AI Works Behind the Scenes</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              The platform connects user actions to real-time queue intelligence and operational control.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User flow */}
            <div className="card p-6 border-blue-500/20">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Users size={13} /> User Journey
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Token Booking',        color: 'bg-brand/20 text-brand border-brand/30',          icon: Ticket },
                  { label: 'Real-Time Queue Engine', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Activity },
                  { label: 'AI Prediction Engine',  color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Brain },
                  { label: 'Queue ETA + Crowd Intel + Travel ETA', color: 'bg-electric/20 text-electric border-electric/30', icon: Clock },
                  { label: 'Smart Departure Time',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: MapPin },
                  { label: 'Real-Time Notifications', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Zap },
                  { label: 'Service Completion',    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',  icon: CheckCircle },
                ].map(({ label, color, icon: Icon }, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      {i < 6 && <div className="w-px h-2 bg-surface-border" />}
                    </div>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations flow */}
            <div className="card p-6 border-purple-500/20">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Shield size={13} /> Operations Flow
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Live Queue State',      color: 'bg-brand/20 text-brand border-brand/30',              icon: Activity },
                  { label: 'AI Continuous Analysis', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Brain },
                  { label: 'AI Recommendation Generated', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: TrendingUp },
                  { label: 'Admin Reviews Recommendation', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Shield },
                  { label: 'Human Approves Action',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
                  { label: 'Counter Action Executed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    icon: Wrench },
                  { label: 'Queue Recalculation + Notify', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', icon: Zap },
                ].map(({ label, color, icon: Icon }, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      {i < 6 && <div className="w-px h-2 bg-surface-border" />}
                    </div>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-xs text-purple-300 font-semibold text-center">AI recommends. Humans remain in control.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ONE PLATFORM. EVERY QUEUE. ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">One Platform. Every Queue.</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SmartQ AI connects users, service providers, and staff through one
            intelligent real-time queue platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* USER */}
          <div className="card p-6 border-blue-500/30 hover:border-blue-500/60 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users size={22} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">User / Citizen</h3>
            <p className="text-xs text-slate-500 mb-4">Patient · Student · Citizen</p>
            <ul className="space-y-2">
              {['Book tokens remotely', 'Track live queue position', 'Get AI-estimated wait time', 'Plan departure with travel ETA', 'Receive smart notifications'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={13} className="text-blue-400 flex-shrink-0" />{i}
                </li>
              ))}
            </ul>
            <Link to={user ? '/dashboard' : '/register'} className="mt-5 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              User Dashboard <ChevronRight size={14} />
            </Link>
          </div>

          {/* ADMIN */}
          <div className="card p-6 border-purple-500/30 hover:border-purple-500/60 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={22} className="text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Organization Admin</h3>
            <p className="text-xs text-slate-500 mb-4">Hospital · College · Govt Office</p>
            <ul className="space-y-2">
              {['Monitor live queue metrics', 'Open / close / pause counters', 'View AI recommendations', 'Run what-if simulations', 'Analyse trends with charts'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={13} className="text-purple-400 flex-shrink-0" />{i}
                </li>
              ))}
            </ul>
            <Link to={user?.role === 'ADMIN' ? '/admin' : '/login'} className="mt-5 flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Admin Dashboard <ChevronRight size={14} />
            </Link>
          </div>

          {/* STAFF */}
          <div className="card p-6 border-emerald-500/30 hover:border-emerald-500/60 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Wrench size={22} className="text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Counter Staff</h3>
            <p className="text-xs text-slate-500 mb-4">Select Sector → Org → Counter</p>
            <ul className="space-y-2">
              {['Select sector and organization', 'Choose your service counter', 'Call next token', 'Complete or mark no-show', 'Queue updates in real time'].map(i => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />{i}
                </li>
              ))}
            </ul>
            <Link to={user?.role === 'STAFF' ? '/staff/setup' : '/login'} className="mt-5 flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Staff Panel <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How It Works</h2>
            <p className="text-slate-500">Six steps from booking to service completion.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { step: '01', label: 'Book',     desc: 'Select service and get a token instantly.',          color: 'text-brand',   bg: 'bg-brand/10',   icon: Ticket },
              { step: '02', label: 'Predict',  desc: 'AI estimates waiting time and crowd level.',         color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Brain },
              { step: '03', label: 'Plan',     desc: 'System recommends when to leave your location.',     color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: Clock },
              { step: '04', label: 'Navigate', desc: 'Get route and combined travel + queue ETA.',         color: 'text-orange-400', bg: 'bg-orange-500/10', icon: MapPin },
              { step: '05', label: 'Adapt',    desc: 'Queue adjusts dynamically as counters operate.',     color: 'text-emerald-400',bg: 'bg-emerald-500/10',icon: Activity },
              { step: '06', label: 'Serve',    desc: 'Staff manages the queue and completes service.',     color: 'text-pink-400',   bg: 'bg-pink-500/10',   icon: CheckCircle },
            ].map(({ step, label, desc, color, bg, icon: Icon }, i) => (
              <div key={step} className="flex flex-col items-center text-center group">
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-3 group-hover:-translate-y-1 transition-transform duration-200`}>
                  <Icon size={22} className={color} />
                </div>
                <span className="text-xs text-slate-600 font-mono mb-0.5">{step}</span>
                <p className={`text-sm font-bold ${color} mb-1`}>{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                {i < 5 && <ChevronRight size={14} className="text-slate-700 mt-3 hidden lg:block rotate-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SECTORS ────────────────────────────────────────── */}
      <section id="sectors" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Built for Every Service Queue</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            One queue intelligence platform that adapts across multiple service environments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Building2, label: 'Hospitals', slug: 'hospital',
              color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30',
              services: ['Government & Private OP', 'Follow-up / Lab', 'Registration', 'Specialist Consult'] },
            { icon: GraduationCap, label: 'Colleges', slug: 'college',
              color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30',
              services: ['Admission Office', 'Fees Section', 'Exam Cell', 'Certificates'] },
            { icon: Landmark, label: 'Government Offices', slug: 'government',
              color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
              services: ['Passport / RTO', 'VAO / Collectorate', 'Certificate Services', 'Public Enquiry'] },
            { icon: Banknote, label: 'Banks', slug: 'bank',
              color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
              services: ['Account Enquiry', 'Cash Services', 'Loan Services', 'Customer Support'] },
          ].map(({ icon: Icon, label, slug, color, bg, border, services }) => (
            <div key={slug} className={`card p-6 ${border} hover:border-opacity-80 hover:-translate-y-0.5 transition-all duration-200`}>
              <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
                <Icon size={24} className={color} />
              </div>
              <h3 className={`text-base font-bold ${color} mb-3`}>{label}</h3>
              <ul className="space-y-1.5">
                {services.map(s => (
                  <li key={s} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={`w-1.5 h-1.5 ${bg.replace('/10', '/60')} rounded-full flex-shrink-0`} />{s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-600 mt-5">Post Office services also supported via the Government sector</p>
      </section>

      {/* ── 6. AI INNOVATION ──────────────────────────────────── */}
      <section className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-4">
              <Brain size={13} className="text-purple-400" />
              <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">AI Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">AI Recommends. Human Decides.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              SmartQ AI continuously analyses queue conditions and provides actionable
              recommendations while keeping operational control with staff and administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: Brain,      title: 'AI ETA Prediction',    color: 'text-purple-400', bg: 'bg-purple-500/10',
                desc: 'Predict waiting time using live queue conditions, active counters, historical patterns, and time-of-day factors.' },
              { icon: Activity,   title: 'Crowd Intelligence',   color: 'text-orange-400', bg: 'bg-orange-500/10',
                desc: 'Identify LOW / MEDIUM / HIGH / VERY HIGH crowd conditions in real time and recommend pre-emptive counter actions.' },
              { icon: TrendingUp, title: 'AI Recommendations',   color: 'text-emerald-400', bg: 'bg-emerald-500/10',
                desc: 'Suggest operational changes such as opening a counter when crowd exceeds thresholds. Admin must approve every action.' },
            ].map(({ icon: Icon, title, color, bg, desc }) => (
              <div key={title} className="card p-6 hover:border-brand/30 transition-all hover:-translate-y-0.5">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* AI example */}
          <div className="card p-6 md:p-8 border-purple-500/20 bg-purple-500/5 max-w-2xl mx-auto">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Example Scenario</p>
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 bg-navy-800/80 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Current</p>
                <p className="text-3xl font-extrabold text-white mb-1">32 <span className="text-sm text-slate-500">min</span></p>
                <p className="text-xs text-slate-400">3 Active Counters · 18 Waiting</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-4 py-3 text-center">
                  <Brain size={18} className="text-purple-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-purple-300">Open Counter 4</p>
                  <p className="text-xs text-slate-500 mt-0.5">AI Recommends</p>
                </div>
              </div>
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Predicted</p>
                <p className="text-3xl font-extrabold text-emerald-400 mb-1">21 <span className="text-sm text-slate-500">min</span></p>
                <p className="text-xs text-slate-400">4 Active Counters · saves 11 min</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link to={user?.role === 'ADMIN' ? '/admin' : '/login'}
                className="btn-secondary text-sm py-2 px-6 inline-flex items-center gap-1.5">
                Explore Admin Demo <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. MORE THAN DIGITAL TOKENS ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">More Than Digital Tokens</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            SmartQ combines queue intelligence with arrival planning and real-time operational control.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Traditional */}
          <div className="card p-6 border-slate-700/40 opacity-80">
            <p className="text-sm font-semibold text-slate-400 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-slate-700/60 border border-slate-600/40 rounded-lg flex items-center justify-center text-xs text-slate-500">✕</span>
              Traditional Queue System
            </p>
            <ul className="space-y-3">
              {[
                'Book token at counter only',
                'Wait physically in line',
                'No ETA visibility',
                'No real-time updates',
                'No travel planning',
                'Manual queue management',
              ].map(i => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-500">
                  <span className="w-4 h-4 bg-slate-700/50 rounded flex items-center justify-center flex-shrink-0">
                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                  </span>{i}
                </li>
              ))}
            </ul>
          </div>

          {/* SmartQ */}
          <div className="card p-6 border-brand/40 bg-gradient-to-br from-brand/8 to-electric/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-sm font-semibold text-brand mb-5 flex items-center gap-2 relative">
              <span className="w-6 h-6 bg-gradient-to-br from-brand to-electric rounded-lg flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </span>
              SmartQ AI
              <span className="ml-auto text-[10px] bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full">INTELLIGENT</span>
            </p>
            <ul className="space-y-3 relative">
              {[
                'Book remotely from anywhere',
                'Track position in real time',
                'AI-estimated waiting time',
                'Live queue updates via Socket.IO',
                'Smart travel + departure planning',
                'AI-assisted counter management',
              ].map(i => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-slate-200 font-medium">
                  <CheckCircle size={15} className="text-brand flex-shrink-0" />{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8. KEY FEATURES ───────────────────────────────────── */}
      <section id="features" className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Key Features</h2>
            <p className="text-slate-500">Everything needed to manage queues intelligently.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Brain,      title: 'AI Queue Prediction',  color: 'text-purple-400', bg: 'bg-purple-500/10',
                desc: 'ML-powered waiting-time and crowd-level prediction with confidence scoring.' },
              { icon: Ticket,     title: 'Smart Token',          color: 'text-blue-400',   bg: 'bg-blue-500/10',
                desc: 'Book, track, and manage service tokens remotely. New visit and follow-up support.' },
              { icon: Activity,   title: 'Dynamic Queue',        color: 'text-emerald-400',bg: 'bg-emerald-500/10',
                desc: 'Queue recalculates in real time as counters open, pause, or close via Socket.IO.' },
              { icon: Navigation, title: 'Smart Navigation',     color: 'text-orange-400', bg: 'bg-orange-500/10',
                desc: 'Combine travel ETA with queue ETA using OpenStreetMap for optimal departure time.' },
              { icon: GitBranch,  title: 'AI Digital Twin',      color: 'text-pink-400',   bg: 'bg-pink-500/10',
                desc: 'Run what-if simulations to model the impact of counter changes before acting.' },
              { icon: Globe,      title: 'Multilingual Access',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',
                desc: 'Full UI in 8 languages: English, Tamil, Hindi, Arabic, Telugu, Malayalam, Kannada, Bengali.' },
            ].map(({ icon: Icon, title, color, bg, desc }) => (
              <div key={title} className="card p-6 hover:border-brand/30 transition-all hover:-translate-y-0.5 group">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:-translate-y-0.5 transition-transform`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CHENNAI DEMO ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card p-8 sm:p-12 border-electric/20 bg-gradient-to-br from-surface-card to-navy-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-brand/5 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-electric/10 border border-electric/30 rounded-full px-3 py-1 mb-4">
                <MapPin size={12} className="text-electric" />
                <span className="text-xs text-electric font-semibold">Chennai Demo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Experience the Chennai Demo</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-lg">
                Explore a pre-loaded SmartQ AI scenario with sample organizations, active queues,
                AI predictions, counter management, and real-time Socket.IO updates.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {[['Building2','Hospitals'],['GraduationCap','Colleges'],['Landmark','Govt Offices'],['Banknote','Banks']].map(([,label]) => (
                  <span key={label} className="text-xs bg-navy-800/80 border border-surface-border text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-electric rounded-full" />{label}
                  </span>
                ))}
              </div>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
                Launch Demo <ArrowRight size={16} />
              </Link>
            </div>

            {/* Three perspectives */}
            <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              {[
                { role: 'USER',  color: 'text-blue-400', border: 'border-blue-500/20',
                  steps: ['Select service', 'Book token', 'Track ETA'] },
                { role: 'STAFF', color: 'text-emerald-400', border: 'border-emerald-500/20',
                  steps: ['Select sector', 'Select counter', 'Manage queue'] },
                { role: 'ADMIN', color: 'text-purple-400', border: 'border-purple-500/20',
                  steps: ['Monitor queue', 'AI insights', 'Manage capacity'] },
              ].map(({ role, color, border, steps }) => (
                <div key={role} className={`bg-navy-800/60 border ${border} rounded-xl p-4 min-w-[140px]`}>
                  <p className={`text-xs font-bold ${color} mb-3`}>{role}</p>
                  <div className="space-y-1.5">
                    {steps.map((s, i) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">{i + 1}.</span>
                        <span className="text-xs text-slate-400">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. HOW EACH ROLE WORKS ───────────────────────────── */}
      <section id="demo" className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">How SmartQ AI Works</h2>
            <p className="text-slate-500">One platform connecting users, staff, and administrators.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* USER */}
            <div className="card p-6 border-blue-500/30 hover:border-blue-500/60 transition-all hover:-translate-y-0.5 flex flex-col">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Users size={22} className="text-blue-400" />
              </div>
              <p className="text-xl font-bold text-blue-400 mb-0.5">USER</p>
              <p className="text-xs text-slate-500 mb-4 italic">Book → Track → Navigate</p>
              <ul className="space-y-2 flex-1">
                {[
                  'Book service tokens remotely',
                  'Select sector, organization, and service',
                  'Track live queue position',
                  'View AI-estimated waiting time',
                  'Get smart departure and travel guidance',
                  'Receive real-time queue notifications',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle size={11} className="text-blue-400 flex-shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ADMIN */}
            <div className="card p-6 border-purple-500/30 hover:border-purple-500/60 transition-all hover:-translate-y-0.5 flex flex-col">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Shield size={22} className="text-purple-400" />
              </div>
              <p className="text-xl font-bold text-purple-400 mb-0.5">ADMIN</p>
              <p className="text-xs text-slate-500 mb-4 italic">Monitor → Predict → Optimize</p>
              <ul className="space-y-2 flex-1">
                {[
                  'Monitor live queues across organizations',
                  'View AI queue insights and crowd conditions',
                  'Manage counters and service capacity',
                  'Review AI recommendations',
                  'Run queue simulations',
                  'Analyse queue performance and trends',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle size={11} className="text-purple-400 flex-shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* STAFF */}
            <div className="card p-6 border-emerald-500/30 hover:border-emerald-500/60 transition-all hover:-translate-y-0.5 flex flex-col">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Wrench size={22} className="text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400 mb-0.5">STAFF</p>
              <p className="text-xs text-slate-500 mb-4 italic">Call → Serve → Update</p>
              <ul className="space-y-2 flex-1">
                {[
                  'Select sector and organization',
                  'Select department/service and counter',
                  'Call the next token',
                  'Complete a service',
                  'Mark a token as no-show',
                  'Update queue status in real time',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle size={11} className="text-emerald-400 flex-shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. TEAM LEADER ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Team Leader</h2>
          <p className="text-slate-500">Building SmartQ AI — Intelligent Queue &amp; Service Management Platform</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="card p-6 sm:p-8 border-brand/30 bg-gradient-to-br from-surface-card to-navy-700 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-electric/6 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">

              {/* Photo */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <div className="w-44 h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56 rounded-2xl overflow-hidden border-2 border-brand/40 shadow-xl shadow-brand/10 bg-navy-800">
                  <img
                    src="/riyaskhan.jpeg"
                    alt="Mohamed Riyaskhan S"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/30 px-3 py-1 rounded-full uppercase tracking-wider">
                  Team Leader
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Team Leader</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">Mohamed Riyaskhan S</h3>
                <p className="text-sm text-slate-400 mb-5">SmartQ AI — Hackathon 2026</p>

                {/* Contact grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Phone */}
                  <a href="tel:+919150900577"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-800/60 hover:bg-navy-700/70 border border-surface-border hover:border-brand/30 transition-all group">
                    <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-emerald-500/40 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 14 19.79 19.79 0 0 1 1.61 5.4 2 2 0 0 1 3.6 3.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.77a16 16 0 0 0 6 6l1.27-.73a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 18.92z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Phone</p>
                      <p className="text-sm font-semibold text-white">+91 9150900577</p>
                    </div>
                  </a>

                  {/* Personal Email */}
                  <a href="mailto:mriyaskhan254@gmail.com"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-800/60 hover:bg-navy-700/70 border border-surface-border hover:border-brand/30 transition-all group">
                    <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-red-500/40 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Personal Email</p>
                      <p className="text-sm font-semibold text-white truncate">mriyaskhan254@gmail.com</p>
                    </div>
                  </a>

                  {/* College Email */}
                  <a href="mailto:mohamedriyaskhans.bit25@rathinam.in"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-navy-800/60 hover:bg-navy-700/70 border border-surface-border hover:border-brand/30 transition-all group">
                    <div className="w-8 h-8 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-brand/40 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">College Email</p>
                      <p className="text-sm font-semibold text-white truncate">mohamedriyaskhans.bit25@rathinam.in</p>
                    </div>
                  </a>

                  {/* LinkedIn + GitHub row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <a href="https://www.linkedin.com/in/mohamed-riyaskhan-s-9a5247386" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-800/60 hover:bg-blue-600/10 border border-surface-border hover:border-blue-500/40 transition-all group">
                      <div className="w-8 h-8 bg-blue-600/10 border border-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">LinkedIn</p>
                        <p className="text-xs font-semibold text-blue-400 truncate">Profile ↗</p>
                      </div>
                    </a>

                    <a href="https://github.com/Riyaskhan2010" target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-navy-800/60 hover:bg-slate-600/10 border border-surface-border hover:border-slate-500/40 transition-all group">
                      <div className="w-8 h-8 bg-slate-500/10 border border-slate-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-slate-400/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-slate-300"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">GitHub</p>
                        <p className="text-xs font-semibold text-slate-300 truncate">Riyaskhan2010 ↗</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. TEAM MEMBERS ──────────────────────────────────── */}
      <section className="bg-surface-card/20 border-y border-surface-border py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Team Members</h2>
            <p className="text-slate-500">SmartQ AI — Hackathon 2026</p>
          </div>

          {/* Members row */}
          <div className="flex flex-wrap justify-center gap-12 sm:gap-16 lg:gap-20">
            {[
              { name: 'Rema Prinitha T', photo: '/rema.jpeg',     initials: 'RP' },
              { name: 'Stephen V',       photo: '/stephen.jpg',  initials: 'SV' },
              { name: 'Thirunesh K',     photo: '/thirunesh.jpg',initials: 'TK' },
            ].map(({ name, photo, initials }) => (
              <div key={name} className="flex flex-col items-center gap-5 group">

                {/* Photo circle */}
                <div className="relative">
                  {/* Hover glow */}
                  <div className="absolute -inset-2 bg-gradient-to-br from-brand/25 to-electric/15 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  {/* Ring */}
                  <div className="relative w-40 h-40 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full p-[3px] bg-gradient-to-br from-brand/50 to-electric/30 shadow-xl shadow-brand/10">
                    <div className="w-full h-full rounded-full overflow-hidden bg-navy-800">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy-700 to-navy-800">
                          <span className="text-4xl font-extrabold text-brand/60">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <p className="text-base sm:text-lg font-semibold text-white text-center tracking-wide">
                  {name}
                </p>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card p-10 sm:p-16 text-center border-brand/20 bg-gradient-to-br from-brand/8 via-navy-800 to-electric/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand/8 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Experience Intelligent<br className="hidden sm:block" /> Queue Management?
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
              Predict the queue. Plan your arrival. Navigate smarter. Serve faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => scrollTo('demo')} className="btn-primary text-base px-10 py-3.5 flex items-center gap-2">
                Try Live Demo <ArrowRight size={18} />
              </button>
              <button onClick={() => scrollTo('features')} className="btn-secondary text-base px-10 py-3.5">
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

            {/* Brand */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-brand to-electric rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-lg">SmartQ <span className="text-brand">AI</span></span>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Intelligent Queue & Service Management Platform
              </p>
              <p className="text-xs text-slate-600 mt-1 italic">Predict • Plan • Navigate • Adapt • Serve</p>
              <p className="text-xs text-slate-700 mt-3">Hackathon Prototype — Chennai 2026</p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Product</p>
                <ul className="space-y-1.5">
                  <li><button onClick={() => scrollTo('features')} className="text-slate-400 hover:text-white transition-colors text-xs">Features</button></li>
                  <li><button onClick={() => scrollTo('how-it-works')} className="text-slate-400 hover:text-white transition-colors text-xs">How It Works</button></li>
                  <li><button onClick={() => scrollTo('sectors')} className="text-slate-400 hover:text-white transition-colors text-xs">Sectors</button></li>
                </ul>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Demo</p>
                <ul className="space-y-1.5">
                  <li><button onClick={() => scrollTo('demo')} className="text-slate-400 hover:text-white transition-colors text-xs">Try Demo</button></li>
                  <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors text-xs">Login</Link></li>
                  <li><Link to="/register" className="text-slate-400 hover:text-white transition-colors text-xs">Register</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Dashboard</p>
                <ul className="space-y-1.5">
                  <li><Link to={user ? '/dashboard' : '/login'} className="text-slate-400 hover:text-white transition-colors text-xs">User</Link></li>
                  <li><Link to={user?.role === 'ADMIN' ? '/admin' : '/login'} className="text-slate-400 hover:text-white transition-colors text-xs">Admin</Link></li>
                  <li><Link to={user?.role === 'STAFF' ? '/staff/setup' : '/login'} className="text-slate-400 hover:text-white transition-colors text-xs">Staff</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-700">© 2026 SmartQ AI — Hackathon Prototype. Not for production use without security hardening.</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-600">All systems operational · Chennai Demo 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
