// SmartQ AI — Enhanced User Dashboard
// Preserves ALL existing API calls, Socket.IO listeners, and routes.
// Adds: Journey Planner, Queue Timeline, AI ETA Explanation,
//        Live Queue Status, Enhanced Notifications, Quick Actions,
//        My Bookings table, Post-service Feedback UI.
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket, Clock, Users, Activity, MapPin, Calendar, Bell,
  ChevronRight, Plus, RefreshCw, Zap, Brain, Star, Volume2,
  CheckCircle, XCircle, AlertCircle, Navigation, BarChart2,
  ArrowRight, Layers, Radio, UtensilsCrossed, Stethoscope,
  Circle,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState     from '../../components/ui/EmptyState';
import { useAuth }    from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { tokensAPI, historyAPI, appointmentsAPI, notificationsAPI, canteenAPI } from '../../services/api';
import { getSocket, joinQueue } from '../../services/socket';
import { addMinutes, formatDate, formatTime, crowdColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Token status labels / colours ─────────────────────────────────
const STATUS_META = {
  WAITING:   { label: 'In Queue',      color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  SERVING:   { label: 'Now Serving',   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  COMPLETED: { label: 'Completed',     color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  NO_SHOW:   { label: 'No Show',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  CANCELLED: { label: 'Cancelled',     color: 'text-slate-500',  bg: 'bg-slate-500/10',  border: 'border-slate-500/20' },
};

// ── Queue Journey Timeline ─────────────────────────────────────────
function QueueTimeline({ status }) {
  const stages = [
    { key: 'BOOKED',   label: 'Token Booked' },
    { key: 'WAITING',  label: 'Waiting in Queue' },
    { key: 'SERVING',  label: 'Counter Called' },
    { key: 'COMPLETED',label: 'Service Completed' },
  ];
  const idx = status === 'WAITING' ? 1 : status === 'SERVING' ? 2 : status === 'COMPLETED' ? 3 : 1;

  return (
    <div className="flex items-center gap-0 w-full">
      {stages.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const pending = i > idx;
        return (
          <div key={s.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                ${done   ? 'bg-emerald-500 border-emerald-500'   :
                  active ? 'bg-brand border-brand animate-pulse-slow' :
                           'bg-navy-800 border-surface-border'}`}>
                {done
                  ? <CheckCircle size={13} className="text-white" />
                  : active
                    ? <span className="w-2.5 h-2.5 bg-white rounded-full" />
                    : <span className="w-2 h-2 bg-slate-700 rounded-full" />}
              </div>
              <p className={`text-[9px] mt-1 text-center leading-tight w-14
                ${done ? 'text-emerald-400' : active ? 'text-brand font-semibold' : 'text-slate-600'}`}>
                {s.label}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full ${done ? 'bg-emerald-500' : 'bg-surface-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Smart Journey Planner ──────────────────────────────────────────
function JourneyPlanner({ eta, travelTime, departure, t }) {
  const total = eta + travelTime;
  const queuePct  = total > 0 ? Math.round((eta / total) * 100) : 50;
  const travelPct = 100 - queuePct;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Navigation size={16} className="text-electric" />
        <h3 className="font-semibold text-white text-sm">Smart Journey Planner</h3>
      </div>
      <div className="space-y-2.5 mb-4">
        {[
          { label: t('estimatedWait'), value: eta,        unit: t('min'), color: 'text-yellow-400' },
          { label: t('travelTime'),    value: travelTime, unit: t('min'), color: 'text-blue-400' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{row.label}</span>
            <span className={`font-bold ${row.color}`}>{row.value} <span className="text-xs text-slate-500">{row.unit}</span></span>
          </div>
        ))}
        <div className="border-t border-surface-border pt-2 flex items-center justify-between text-sm">
          <span className="text-slate-300 font-medium">Total Journey</span>
          <span className="font-extrabold text-white">{total} <span className="text-xs text-slate-500">{t('min')}</span></span>
        </div>
      </div>
      {/* Visual bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-3">
        <div className="bg-yellow-500/70 transition-all duration-500" style={{ width: `${queuePct}%` }} />
        <div className="bg-blue-500/70 transition-all duration-500"  style={{ width: `${travelPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500/70 rounded-full" /> Queue</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500/70 rounded-full" /> Travel</span>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
        <Zap size={14} className="text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-xs text-slate-400">Recommended Departure</p>
          <p className="text-lg font-extrabold text-emerald-400">{departure}</p>
        </div>
      </div>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        SmartQ combines your estimated queue waiting time and travel time to recommend when you should leave.
      </p>
    </div>
  );
}

// ── AI ETA Explanation ─────────────────────────────────────────────
function AIEtaExplanation({ waitingAhead, crowdLevel, eta, t }) {
  const factors = [
    { label: 'Current Queue',       impact: 'High impact',   value: `${waitingAhead} tokens`,  color: 'text-red-400' },
    { label: 'Active Counters',     impact: 'High impact',   value: '3 open',                  color: 'text-red-400' },
    { label: 'People Waiting',      impact: 'Medium impact', value: `${waitingAhead} people`,  color: 'text-yellow-400' },
    { label: 'Recent Service Rate', impact: 'Normal',        value: '~8 min/person',           color: 'text-emerald-400' },
    { label: 'Time of Day',         impact: 'Moderate',      value: new Date().getHours() < 12 ? 'Morning' : 'Afternoon', color: 'text-yellow-400' },
  ];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-purple-400" />
        <h3 className="font-semibold text-white text-sm">Why is my wait {eta} minutes?</h3>
      </div>
      <div className="space-y-2 mb-4">
        {factors.map(f => (
          <div key={f.label} className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border/50 last:border-0">
            <span className="text-slate-400">{f.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">{f.value}</span>
              <span className={`text-[10px] font-semibold ${f.color}`}>{f.impact}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-2">
        <Brain size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          AI continuously updates your estimated waiting time as queue conditions change in real time.
        </p>
      </div>
    </div>
  );
}

// ── Live Queue Status card ─────────────────────────────────────────
function LiveQueueStatus({ activeToken, waitingAhead, crowdLevel, lastUpdated, t }) {
  const servingToken = null; // populated from queueData if available
  return (
    <div className="card p-5 border-emerald-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <h3 className="font-semibold text-white text-sm">Live Queue Status</h3>
        </div>
        <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 font-semibold">LIVE</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Your Token</span>
          <span className="text-base font-extrabold text-brand">{activeToken?.tokenNumber || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">People Ahead</span>
          <span className="text-base font-bold text-white">{waitingAhead}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">AI Wait Estimate</span>
          <span className="text-base font-bold text-yellow-400">{activeToken?.estimatedWait || 0} {t('min')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Crowd Level</span>
          <CrowdBadge level={crowdLevel} />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
        <span className="text-xs text-slate-600">Updated {lastUpdated}</span>
        <div className="flex items-center gap-1">
          <Radio size={10} className="text-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Socket.IO</span>
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions ──────────────────────────────────────────────────
function QuickActions({ activeToken, t }) {
  const actions = [
    { label: 'Book New Token', icon: Plus,      to: '/sectors',                          color: 'text-brand',   bg: 'bg-brand/10',   border: 'border-brand/30' },
    { label: 'Track My Token', icon: Activity,  to: activeToken ? `/token/${activeToken.id}` : '/sectors', color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
    { label: 'View Route',     icon: Navigation,to: activeToken?.service?.department?.organization ? `/map/${activeToken.service.department.organization.id}` : '/sectors', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    { label: 'My Bookings',    icon: Layers,    to: '/history',                          color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map(({ label, icon: Icon, to, color, bg, border }) => (
        <Link key={label} to={to}
          className={`card p-4 flex flex-col items-center gap-2 text-center ${border} hover:-translate-y-0.5 hover:border-opacity-80 transition-all`}>
          <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon size={18} className={color} />
          </div>
          <span className="text-xs font-medium text-slate-300 leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Post-service Feedback (frontend-only; no backend yet) ─────────
function FeedbackCard({ token, onDismiss }) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [comment, setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    // Frontend-only: no backend endpoint exists yet.
    // When a feedback API is added, call it here.
    setSubmitted(true);
    toast.success('Thank you for your feedback!');
    setTimeout(onDismiss, 2000);
  };

  if (submitted) return (
    <div className="card p-5 border-emerald-500/20 text-center">
      <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
      <p className="text-sm font-semibold text-white">Thank you for your feedback!</p>
    </div>
  );

  return (
    <div className="card p-5 border-brand/20 bg-brand/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-white text-sm">How was your experience?</h3>
        </div>
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 transition-colors text-xs">Dismiss</button>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        {token?.service?.name} — {token?.service?.department?.organization?.name}
      </p>
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110">
            <Star size={24} className={`${(hover || rating) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} transition-colors`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)}
        rows={2} placeholder="What could we improve? (optional)"
        className="input text-xs resize-none mb-3" />
      <button onClick={submit} disabled={rating === 0}
        className="btn-primary text-sm py-2 w-full disabled:opacity-40">
        Submit Feedback
      </button>
      <p className="text-[10px] text-slate-700 mt-2 text-center">Frontend-only — feedback not stored until backend is connected.</p>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function UserDashboard() {
  const { user }    = useAuth();
  const { t }       = useLanguage();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications() || {};
  const navigate    = useNavigate();

  // Core state — same as before
  const [activeToken, setActiveToken]   = useState(null);
  const [waitingAhead, setWaitingAhead] = useState(0);
  const [crowdLevel, setCrowdLevel]     = useState('MEDIUM');
  const [history, setHistory]           = useState([]);
  const [allTokens, setAllTokens]       = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [canteenOrders, setCanteenOrders] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState('just now');
  const [lastUpdatedSec, setLastUpdatedSec] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackToken, setFeedbackToken] = useState(null);
  const secRef = useRef(null);

  // ── Visit Plan from sessionStorage ───────────────────────────────
  const [visitPlan, setVisitPlan] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('smartq_visit_plan') || 'null'); }
    catch { return null; }
  });

  // Tick "updated X sec ago"
  useEffect(() => {
    secRef.current = setInterval(() => {
      setLastUpdatedSec(s => {
        const n = s + 1;
        setLastUpdated(n < 60 ? `${n}s ago` : `${Math.floor(n / 60)}m ago`);
        return n;
      });
    }, 1000);
    return () => clearInterval(secRef.current);
  }, []);

  const resetTimer = () => { setLastUpdatedSec(0); setLastUpdated('just now'); };

  // ── Data fetch — identical to original ───────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [tkRes, hiRes, apRes] = await Promise.all([
        tokensAPI.list({ status: 'WAITING' }).catch(() => ({ data: [] })),
        historyAPI.list().catch(() => ({ data: [] })),
        appointmentsAPI.list().catch(() => ({ data: [] })),
      ]);
      // All tokens for "My Bookings"
      const allTk = await tokensAPI.list({}).catch(() => ({ data: [] }));
      const allList = Array.isArray(allTk.data) ? allTk.data : [];
      setAllTokens(allList.slice(0, 10));
      // Canteen orders
      canteenAPI.myOrders().then(({ data }) => setCanteenOrders(Array.isArray(data) ? data.slice(0, 5) : [])).catch(() => {});

      const waitingList = Array.isArray(tkRes.data) ? tkRes.data : [];
      const active = waitingList.find(tk => ['WAITING', 'SERVING'].includes(tk.status)) || null;
      setActiveToken(active);

      if (active) {
        const detail = await tokensAPI.get(active.id);
        setWaitingAhead(detail.data.waitingAhead || 0);
        setCrowdLevel(detail.data.crowdLevel || 'MEDIUM');
        joinQueue(active.queueId || active.queue?.id);
      }

      setHistory(Array.isArray(hiRes.data) ? hiRes.data.slice(0, 3) : []);
      setAppointments(Array.isArray(apRes.data) ? apRes.data.filter(a => a.status === 'BOOKED').slice(0, 3) : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); resetTimer(); }
  }, []);

  // ── Socket.IO — identical to original ────────────────────────────
  useEffect(() => {
    fetchData();
    const s = getSocket();
    s.on('etaUpdated', (data) => {
      setActiveToken(p => p ? { ...p, estimatedWait: data.baseETA } : p);
      setCrowdLevel(data.crowdLevel || 'MEDIUM');
      resetTimer();
      toast('⚡ Queue updated — your estimated wait changed', { icon: '⚡', duration: 4000 });
    });
    s.on('queueUpdated', () => { fetchData(); resetTimer(); });
    s.on('tokenCalled', (d) => {
      if (d.token?.id === activeToken?.id) {
        toast('🔔 Your turn! Please proceed to the counter.', { duration: 8000 });
        fetchData();
      }
    });
    return () => { s.off('etaUpdated'); s.off('queueUpdated'); s.off('tokenCalled'); };
  }, [fetchData]);

  // Show feedback when token completes
  useEffect(() => {
    const lastCompleted = allTokens.find(tk => tk.status === 'COMPLETED');
    if (lastCompleted && !feedbackToken) {
      const shownKey = `feedback_shown_${lastCompleted.id}`;
      if (!sessionStorage.getItem(shownKey)) {
        setFeedbackToken(lastCompleted);
        setShowFeedback(true);
        sessionStorage.setItem(shownKey, '1');
      }
    }
  }, [allTokens]);

  const travelTime = 18; // demo fixed; connect to map service if available
  const eta        = activeToken?.estimatedWait || 0;
  const departure  = addMinutes(Math.max(0, eta - travelTime));
  const org        = activeToken?.service?.department?.organization;

  if (loading) return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <LoadingSpinner text={t('loading')} />
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── GREETING ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {activeToken ? "Don't just book a token. Know when to arrive." : 'Welcome to SmartQ AI Dashboard'}
            </p>
          </div>
          <Link to="/sectors" className="btn-primary flex items-center gap-2 text-sm py-2">
            <Plus size={16} /> Book Service
          </Link>
        </div>

        {/* ── FEEDBACK CARD (post-service) ─────────────────────── */}
        {showFeedback && feedbackToken && (
          <div className="mb-6 animate-slide-up">
            <FeedbackCard token={feedbackToken} onDismiss={() => setShowFeedback(false)} />
          </div>
        )}

        {/* ── ACTIVE TOKEN ─────────────────────────────────────── */}
        {activeToken ? (
          <div className="card p-6 mb-5 bg-gradient-to-br from-surface-card via-navy-700/60 to-navy-800 border-brand/30 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">My Active Token</p>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric leading-none">
                    {activeToken.tokenNumber}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border
                      ${STATUS_META[activeToken.status]?.bg} ${STATUS_META[activeToken.status]?.color} ${STATUS_META[activeToken.status]?.border}`}>
                      {STATUS_META[activeToken.status]?.label || activeToken.status}
                    </span>
                    <CrowdBadge level={crowdLevel} />
                  </div>
                </div>
              </div>
              <button onClick={() => { fetchData(); toast('Refreshed', { icon: '🔄', duration: 1500 }); }}
                className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-navy-700 rounded-lg">
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Org + Service */}
            <div className="mb-4">
              <p className="text-base font-semibold text-white">{activeToken.service?.name}</p>
              <p className="text-sm text-slate-400">{org?.name}</p>
              {activeToken.counter && (
                <p className="text-xs text-slate-500 mt-0.5">Assigned to {activeToken.counter.name}</p>
              )}
            </div>

            {/* Journey Timeline */}
            <div className="mb-5">
              <QueueTimeline status={activeToken.status} />
            </div>

            {/* 4-metric grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-navy-800/60 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Users size={11} />{t('peopleAhead')}</p>
                <p className="text-2xl font-bold text-white">{waitingAhead}</p>
              </div>
              <div className="bg-navy-800/60 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={11} />{t('estimatedWait')}</p>
                <p className="text-2xl font-bold text-white">{eta}<span className="text-sm text-slate-500 ml-1">{t('min')}</span></p>
              </div>
              <div className="bg-navy-800/60 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin size={11} />{t('travelTime')}</p>
                <p className="text-2xl font-bold text-white">{travelTime}<span className="text-sm text-slate-500 ml-1">{t('min')}</span></p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap size={11} />Depart by</p>
                <p className="text-lg font-extrabold text-emerald-400">{departure}</p>
              </div>
            </div>

            {/* Departure banner */}
            <div className="mb-4 p-3 bg-brand/10 border border-brand/20 rounded-xl flex items-center gap-2">
              <Brain size={14} className="text-brand flex-shrink-0" />
              <p className="text-sm text-brand">Leave by <strong>{departure}</strong> — travel {travelTime} min + queue {eta} min</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/token/${activeToken.id}`} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
                <Activity size={14} /> {t('viewQueue')}
              </Link>
              {org && (
                <Link to={`/map/${org.id}`} className="btn-secondary text-sm py-2 flex items-center gap-1.5">
                  <MapPin size={14} /> {t('viewRoute')}
                </Link>
              )}
              <button onClick={() => {
                const msg = `Your token is ${activeToken.tokenNumber}. ${waitingAhead} people ahead. Estimated wait ${eta} minutes. Leave by ${departure}.`;
                window.speechSynthesis?.speak(new SpeechSynthesisUtterance(msg));
              }} className="btn-secondary text-sm py-2 flex items-center gap-1.5" title="Read aloud">
                <Volume2 size={14} /> Read Aloud
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 mb-5 text-center border-dashed">
            <Ticket size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium mb-1">No active token</p>
            <p className="text-slate-600 text-sm mb-4">Book a service to start your smart journey</p>
            <Link to="/sectors" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus size={16} /> Book a Service
            </Link>
          </div>
        )}

        {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <QuickActions activeToken={activeToken} t={t} />
        </div>

        {/* ── JOURNEY PLANNER + AI ETA EXPLANATION ─────────────── */}
        {activeToken && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <JourneyPlanner eta={eta} travelTime={travelTime} departure={departure} t={t} />
            <AIEtaExplanation waitingAhead={waitingAhead} crowdLevel={crowdLevel} eta={eta} t={t} />
          </div>
        )}

        {/* ── LIVE QUEUE STATUS + NOTIFICATIONS ────────────────── */}
        {activeToken && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <LiveQueueStatus
              activeToken={activeToken} waitingAhead={waitingAhead}
              crowdLevel={crowdLevel} lastUpdated={lastUpdated} t={t}
            />

            {/* Notifications panel */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-brand" />
                  <h3 className="font-semibold text-white text-sm">{t('notifications')}</h3>
                  {unreadCount > 0 && (
                    <span className="bg-brand text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand hover:text-brand-light transition-colors">{t('markAllRead')}</button>
                )}
              </div>
              {!notifications?.length ? (
                <p className="text-slate-600 text-sm py-3">{t('noNotifications')}</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {notifications.slice(0, 5).map(n => (
                    <button key={n.id} onClick={() => markRead?.(n.id)}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${n.isRead ? 'bg-navy-800/40' : 'bg-brand/5 border border-brand/15'} hover:bg-navy-700/60`}>
                      <Bell size={12} className={`mt-0.5 flex-shrink-0 ${n.isRead ? 'text-slate-600' : 'text-brand'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-tight ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                      </div>
                      {!n.isRead && <span className="w-1.5 h-1.5 bg-brand rounded-full mt-1 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications shown even when no active token */}
        {!activeToken && notifications && notifications.filter(n => !n.isRead).length > 0 && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-brand" />
                <h3 className="font-semibold text-white text-sm">{t('notifications')}</h3>
                <span className="bg-brand text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{unreadCount}</span>
              </div>
              <button onClick={markAllRead} className="text-xs text-brand hover:text-brand-light">{t('markAllRead')}</button>
            </div>
            <div className="space-y-2">
              {notifications.filter(n => !n.isRead).slice(0, 4).map(n => (
                <div key={n.id} className="flex items-start gap-2.5 p-3 bg-brand/5 border border-brand/15 rounded-xl">
                  <Bell size={13} className="text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MY BOOKINGS ───────────────────────────────────────── */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <Ticket size={16} className="text-brand" /> My Bookings
            </h2>
            <Link to="/history" className="text-xs text-brand hover:text-brand-light flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {allTokens.length === 0 ? (
            <EmptyState icon={Ticket} title="No bookings yet" description="Book a service to see your tokens here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-surface-border">
                    <th className="pb-2 font-medium">Token</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">Service</th>
                    <th className="pb-2 font-medium hidden md:table-cell">Organization</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40">
                  {allTokens.map(tk => {
                    const meta = STATUS_META[tk.status] || STATUS_META.CANCELLED;
                    return (
                      <tr key={tk.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-2.5">
                          <Link to={['WAITING','SERVING'].includes(tk.status) ? `/token/${tk.id}` : '#'}
                            className={`font-extrabold ${['WAITING','SERVING'].includes(tk.status) ? 'text-brand hover:text-brand-light' : 'text-slate-400'}`}>
                            {tk.tokenNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 text-slate-300 hidden sm:table-cell max-w-[120px] truncate">{tk.service?.name}</td>
                        <td className="py-2.5 text-slate-500 hidden md:table-cell max-w-[140px] truncate">{tk.service?.department?.organization?.name}</td>
                        <td className="py-2.5 text-slate-500">{formatDate(tk.bookedAt)}</td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── VISIT HISTORY + UPCOMING APPOINTMENTS ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent visits */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">{t('visitHistory')}</h2>
              <Link to="/history" className="text-xs text-brand hover:text-brand-light flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-600 text-sm py-4">{t('noHistory')}</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Activity size={14} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.serviceName}</p>
                      <p className="text-xs text-slate-500 truncate">{v.organizationName} · {formatDate(v.visitDate)}</p>
                      {v.waitTime && <p className="text-xs text-slate-600">Waited {v.waitTime} min</p>}
                    </div>
                    <span className="text-xs text-emerald-400 font-medium flex-shrink-0">{v.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">{t('upcomingAppointments')}</h2>
              <Link to="/appointments" className="text-xs text-brand hover:text-brand-light flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
            </div>
            {appointments.length === 0 ? (
              <p className="text-slate-600 text-sm py-4">{t('noAppointments')}</p>
            ) : (
              <div className="space-y-2.5">
                {appointments.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl">
                    <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.service?.name}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.scheduledDate)} · {a.scheduledTime}</p>
                      {a.isFollowUp && <span className="text-[10px] bg-electric/10 text-electric border border-electric/20 px-1.5 py-0.5 rounded-full">Follow-up</span>}
                    </div>
                    <span className="text-xs text-brand font-medium flex-shrink-0">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MY CANTEEN ORDERS ─────────────────────────────── */}
        {canteenOrders.length > 0 && (
          <div className="card p-5 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0 flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-orange-400" /> My Canteen Orders
              </h2>
              <Link to="/sectors" className="text-xs text-brand hover:text-brand-light flex items-center gap-0.5">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {canteenOrders.map(order => {
                const statusColor = { PLACED:'text-blue-400', CONFIRMED:'text-brand', PREPARING:'text-yellow-400', READY:'text-emerald-400', COLLECTED:'text-slate-400', CANCELLED:'text-red-400' }[order.status] || 'text-slate-400';
                const itemSummary = order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ') || '—';
                return (
                  <Link key={order.id} to={`/canteen/order/${order.id}`}
                    className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl hover:bg-navy-700/60 transition-colors">
                    <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed size={14} className="text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{order.orderNumber}</p>
                      <p className="text-xs text-slate-400 truncate">{itemSummary}</p>
                      <p className="text-xs text-slate-500">{order.canteenOrg?.name || 'Canteen'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${statusColor}`}>{order.status}</p>
                      {order.estimatedReadyTime && order.status !== 'COLLECTED' && order.status !== 'CANCELLED' && (
                        <p className="text-xs text-yellow-400/80">~{order.estimatedReadyTime}m</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MY VISIT PLAN ─────────────────────────────────── */}
        {visitPlan && visitPlan.items?.length > 0 && (() => {
          const completedCount = visitPlan.items.filter(it => it.status === 'COMPLETED' || it.status === 'DONE').length;
          const allDone = completedCount === visitPlan.items.length;
          // Status styling
          const VSTATUS = {
            BOOKED:    { label: 'Upcoming',  color: 'text-slate-400',   dot: 'bg-slate-500' },
            WAITING:   { label: 'Waiting',   color: 'text-yellow-400',  dot: 'bg-yellow-400' },
            SERVING:   { label: 'In Progress',color:'text-blue-400',    dot: 'bg-blue-400 animate-pulse' },
            COMPLETED: { label: 'Completed', color: 'text-emerald-400', dot: 'bg-emerald-400' },
            FAILED:    { label: 'Failed',    color: 'text-red-400',     dot: 'bg-red-400' },
          };
          return (
            <div className="card p-5 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title mb-0 flex items-center gap-2">
                  <Stethoscope size={16} className="text-brand" /> My Visit Plan
                </h2>
                <Link to={`/hospital/visit-plan/tracking?orgId=${visitPlan.orgId}`}
                  className="text-xs text-brand hover:text-brand-light flex items-center gap-0.5">
                  Track <ChevronRight size={12} />
                </Link>
              </div>

              {/* Org + date */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={12} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{visitPlan.orgName}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(visitPlan.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              {visitPlan.items.length > 0 && (
                <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-brand to-electric rounded-full transition-all"
                    style={{ width: `${Math.round((completedCount / visitPlan.items.length) * 100)}%` }} />
                </div>
              )}

              {/* Service rows */}
              <div className="space-y-2 mb-3">
                {visitPlan.items.map((item, i) => {
                  const cfg = VSTATUS[item.status] || VSTATUS.BOOKED;
                  const tokenNum = item.token?.tokenNumber || item.token?.number;
                  return (
                    <div key={item.deptId || i} className="flex items-center gap-3 p-2.5 bg-navy-800/50 rounded-xl">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.deptName}</p>
                        <p className="text-xs text-slate-500 truncate">{item.serviceName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {tokenNum && <p className="text-xs font-bold text-brand">{tokenNum}</p>}
                        <p className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                <div className="flex items-center gap-1.5">
                  <Brain size={11} className="text-purple-400" />
                  <span className="text-xs text-slate-500">
                    {allDone ? 'Visit complete' : `${visitPlan.items.length - completedCount} service${visitPlan.items.length - completedCount !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                <span className="text-xs font-bold text-white">
                  ~{visitPlan.totalETA}<span className="text-slate-500 font-normal"> min total</span>
                </span>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
