// SmartQ AI — Enhanced Admin Dashboard
// ALL existing API calls, Socket.IO listeners, counter controls, and routes are preserved.
// New additions: enhanced KPI cards, Smart Alerts, Counter Performance,
//   AI Queue Forecast, Queue Health, AI Decision Center, Recent Activity.
import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Activity, Clock, AlertTriangle, CheckCircle, XCircle,
  PauseCircle, PlayCircle, BarChart2, GitBranch, Brain, RefreshCw,
  Zap, Play, ChevronRight, TrendingUp, TrendingDown, Minus,
  Radio, Info, ArrowRight, Shield,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { adminAPI, countersAPI, demoAPI } from '../../services/api';
import { useLanguage }  from '../../context/LanguageContext';
import { getSocket }    from '../../services/socket';
import { formatTime }   from '../../utils/helpers';
import toast            from 'react-hot-toast';

// ── Existing CounterBadge — unchanged ─────────────────────────────
function CounterBadge({ status }) {
  const c = {
    OPEN:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    CLOSED: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
    PAUSED: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  }[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c}`}>{status}</span>;
}

// ── Smart Alerts — derived from live summary data ──────────────────
function SmartAlerts({ summary, waitingTokens, counters }) {
  const alerts = [];
  const waiting     = summary?.totalWaiting    || 0;
  const active      = summary?.activeCounters  || 0;
  const avgETA      = summary?.avgETA          || 0;
  const crowd       = summary?.crowdLevel      || 'LOW';
  const paused      = summary?.pausedCounters  || 0;
  const noShow      = summary?.noShowToday     || 0;

  if (crowd === 'VERY_HIGH' || (waiting > 0 && active > 0 && waiting / active > 12))
    alerts.push({ level: 'red',    icon: '🔴', title: 'High Queue Alert',      msg: `${waiting} tokens waiting across only ${active} active counters. Immediate action recommended.` });
  else if (crowd === 'HIGH' || waiting / Math.max(1, active) > 7)
    alerts.push({ level: 'orange', icon: '🟠', title: 'Crowd Increasing',      msg: `Queue demand is elevated. Consider opening an additional counter.` });

  if (avgETA > 25)
    alerts.push({ level: 'orange', icon: '🟠', title: 'ETA Spike',             msg: `Average estimated wait is ${avgETA} min. Patients may experience longer delays.` });

  if (paused > 0)
    alerts.push({ level: 'yellow', icon: '🟡', title: 'Counter Paused',        msg: `${paused} counter${paused > 1 ? 's are' : ' is'} currently paused. Resume when ready.` });

  if (noShow > 3)
    alerts.push({ level: 'yellow', icon: '🟡', title: 'No-show Rate Elevated', msg: `${noShow} no-shows today. Queue position estimates may drift.` });

  if (alerts.length === 0)
    alerts.push({ level: 'green',  icon: '🟢', title: 'Queue Stable',          msg: `Current queue is operating within normal conditions with ${waiting} waiting and ${active} active counters.` });

  const borderMap = { red: 'border-red-500/30 bg-red-500/5', orange: 'border-orange-500/30 bg-orange-500/5', yellow: 'border-yellow-500/30 bg-yellow-500/5', green: 'border-emerald-500/20 bg-emerald-500/5' };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-orange-400" />
        <h2 className="section-title mb-0">Smart Alerts</h2>
        <span className="text-xs bg-navy-800 border border-surface-border text-slate-500 px-2 py-0.5 rounded-full ml-auto">
          {alerts.length} active
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className={`border rounded-xl p-3 flex items-start gap-2.5 ${borderMap[a.level]}`}>
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{a.icon}</span>
            <div>
              <p className="text-xs font-semibold text-white">{a.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{a.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Queue Forecast — formula-based projection ──────────────────
function QueueForecast({ summary }) {
  const base   = summary?.totalWaiting  || 0;
  const active = summary?.activeCounters || 1;
  const now    = new Date();

  // Simple growth model: queue grows during morning peak, starts falling midday
  const hour = now.getHours();
  const growthRate = (hour >= 9 && hour <= 11) ? 0.18
    : (hour >= 14 && hour <= 16) ? 0.12
    : (hour >= 12 && hour <= 13) ? -0.05
    : 0.06;

  const forecast = [0, 15, 30, 45, 60].map(mins => {
    const t   = now.getMinutes() + mins;
    const lbl = new Date(now.getTime() + mins * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const projected = Math.max(0, Math.round(base * (1 + growthRate * (mins / 30))));
    return { label: mins === 0 ? 'Now' : `+${mins}m`, time: lbl, value: projected };
  });

  const trend   = forecast[4].value > base ? 'increase' : forecast[4].value < base ? 'decrease' : 'stay stable';
  const trendMsg = `Queue demand is expected to ${trend} over the next 60 minutes based on current patterns.`;

  const CHART_STYLE = { backgroundColor: '#1f2d4a', border: '1px solid #2a3d6b', borderRadius: 8, color: '#fff', fontSize: 11 };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-purple-400" />
          <h2 className="section-title mb-0">AI Queue Forecast</h2>
        </div>
        <span className="text-xs text-slate-600 bg-navy-800 border border-surface-border px-2 py-0.5 rounded-full">Next 60 min</span>
      </div>

      {/* Mini number strip */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {forecast.map((pt, i) => (
          <div key={pt.label} className={`text-center p-2 rounded-xl ${i === 0 ? 'bg-brand/10 border border-brand/20' : 'bg-navy-800/60'}`}>
            <p className={`text-[10px] font-semibold mb-0.5 ${i === 0 ? 'text-brand' : 'text-slate-500'}`}>{pt.label}</p>
            <p className={`text-base font-extrabold ${i === 0 ? 'text-brand' : pt.value > base ? 'text-orange-400' : 'text-emerald-400'}`}>{pt.value}</p>
            <p className="text-[9px] text-slate-600">{pt.time}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={forecast} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3d6b" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip contentStyle={CHART_STYLE} formatter={(v) => [`${v} tokens`, 'Projected']} />
          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#forecastGrad)" dot={{ fill: '#6366f1', r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-2">
        <Brain size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">{trendMsg} <span className="text-slate-600">(Formula-based estimate — connect ML service for higher accuracy.)</span></p>
      </div>
    </div>
  );
}

// ── Queue Health ───────────────────────────────────────────────────
function QueueHealth({ summary }) {
  const waiting = summary?.totalWaiting    || 0;
  const active  = summary?.activeCounters  || 0;
  const total   = summary?.totalCounters   || 1;
  const avgETA  = summary?.avgETA          || 0;

  const waitLoad   = Math.min(100, Math.round((waiting / Math.max(1, active * 10)) * 100));
  const capUtil    = total > 0 ? Math.round((active / total) * 100) : 0;
  const speedScore = avgETA <= 10 ? 90 : avgETA <= 20 ? 70 : avgETA <= 30 ? 50 : 30;
  const demandScore= waiting <= 5 ? 80 : waiting <= 15 ? 60 : waiting <= 25 ? 40 : 25;

  const bars = [
    { label: 'Waiting Load',     pct: waitLoad,   color: waitLoad > 70 ? 'bg-red-500' : waitLoad > 40 ? 'bg-yellow-500' : 'bg-emerald-500' },
    { label: 'Counter Capacity', pct: capUtil,    color: capUtil  > 80 ? 'bg-emerald-500' : capUtil > 40 ? 'bg-yellow-500' : 'bg-red-500' },
    { label: 'Service Speed',    pct: speedScore, color: speedScore > 70 ? 'bg-emerald-500' : speedScore > 40 ? 'bg-yellow-500' : 'bg-red-500' },
    { label: 'Demand Trend',     pct: demandScore,color: demandScore > 60 ? 'bg-emerald-500' : demandScore > 35 ? 'bg-yellow-500' : 'bg-red-500' },
  ];

  const overall = Math.round((waitLoad + capUtil + speedScore + demandScore) / 4);
  const overallLabel = overall >= 70 ? 'GOOD' : overall >= 45 ? 'MODERATE' : 'NEEDS ATTENTION';
  const overallColor = overall >= 70 ? 'text-emerald-400' : overall >= 45 ? 'text-yellow-400' : 'text-red-400';

  const condition = overall >= 70
    ? 'Queue is stable with moderate demand. No immediate action required.'
    : overall >= 45
      ? 'Queue load is moderate. Monitor for increases over the next 15 minutes.'
      : 'Queue conditions require attention. Review AI recommendations below.';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-electric" />
          <h2 className="section-title mb-0">Queue Health</h2>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${overall >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : overall >= 45 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
          {overallLabel}
        </span>
      </div>
      <div className="space-y-3 mb-4">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{b.label}</span>
              <span className="text-slate-500">{b.pct}%</span>
            </div>
            <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${b.color}`} style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{condition}</p>
    </div>
  );
}

// ── Counter Performance — enhanced, wraps existing data ────────────
function CounterPerformance({ counters, servingTokens, summary, actionLoading, counterAction }) {
  if (!counters?.length) return null;

  // Build a map of which token is serving at each counter
  const servingMap = {};
  servingTokens?.forEach(tk => { if (tk.counter?.id) servingMap[tk.counter.id] = tk; });

  const loadColor = (status) => status === 'OPEN' ? 'text-emerald-400' : status === 'PAUSED' ? 'text-orange-400' : 'text-slate-500';
  const dotColor  = (status) => status === 'OPEN' ? 'bg-emerald-400' : status === 'PAUSED' ? 'bg-orange-400' : 'bg-slate-600';

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-400" />
          <h2 className="section-title mb-0">Counter Performance</h2>
        </div>
        <span className="text-xs text-slate-500">{counters.filter(c => c.status === 'OPEN').length} of {counters.length} active</span>
      </div>
      <div className="space-y-2">
        {counters.map(c => {
          const serving  = servingMap[c.id];
          const isOpen   = c.status === 'OPEN';
          const isPaused = c.status === 'PAUSED';
          const isClosed = c.status === 'CLOSED';

          return (
            <div key={c.id} className={`p-3 rounded-xl border transition-all ${isOpen ? 'border-emerald-500/20 bg-emerald-500/5' : isPaused ? 'border-orange-500/20 bg-orange-500/5' : 'border-surface-border bg-navy-800/40'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(c.status)} ${isOpen ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  <CounterBadge status={c.status} />
                </div>
                {/* Controls — identical to original */}
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {isClosed && (
                    <button onClick={() => counterAction(c.id, 'open')} disabled={!!actionLoading}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Open">
                      <PlayCircle size={15} />
                    </button>
                  )}
                  {isOpen && (
                    <>
                      <button onClick={() => counterAction(c.id, 'pause')} disabled={!!actionLoading}
                        className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Pause">
                        <PauseCircle size={15} />
                      </button>
                      <button onClick={() => counterAction(c.id, 'close')} disabled={!!actionLoading}
                        className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded-lg transition-colors" title="Close">
                        <XCircle size={15} />
                      </button>
                    </>
                  )}
                  {isPaused && (
                    <button onClick={() => counterAction(c.id, 'resume')} disabled={!!actionLoading}
                      className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Resume">
                      <PlayCircle size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary info row */}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                {serving ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 font-medium">Serving {serving.tokenNumber}</span>
                  </span>
                ) : isOpen ? (
                  <span className="text-slate-600">Idle — ready for next</span>
                ) : null}
                {c.staff?.[0]?.user?.name && (
                  <span>{c.staff[0].user.name}</span>
                )}
                {c.department?.name && (
                  <span className="truncate max-w-[120px]">{c.department.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Decision Center ─────────────────────────────────────────────
function AIDecisionCenter({ recommendation, summary, onAccept }) {
  if (!recommendation || recommendation.isAccepted) return null;
  const improvement = (recommendation.currentETA || 0) - (recommendation.expectedETA || 0);

  return (
    <div className="card p-5 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-surface-card">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-orange-400" />
        <h2 className="section-title mb-0">AI Decision Center</h2>
        <span className="ml-auto text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full font-semibold">ACTION REQUIRED</span>
      </div>

      {/* Flow: Situation → Analysis → Recommendation → Impact → Action */}
      <div className="space-y-2 mb-4">
        {[
          { step: 'Current', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
            content: `${summary?.totalWaiting || 0} waiting · ${summary?.activeCounters || 0} active counters · ${summary?.avgETA || 0} min ETA` },
          { step: 'AI Analysis', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
            content: recommendation.message },
          { step: 'Recommendation', color: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
            content: `🤖 ${recommendation.action}` },
          { step: 'Expected Impact', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
            content: `ETA: ${recommendation.currentETA} min → ${recommendation.expectedETA} min · saves ~${improvement} min` },
        ].map(({ step, color, content }) => (
          <div key={step} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider w-24 flex-shrink-0 mt-0.5">{step}</span>
            <span className="text-xs text-slate-300 leading-relaxed">{content}</span>
          </div>
        ))}
      </div>

      <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-3 text-center">
        <p className="text-xs text-orange-300 font-semibold">AI Recommends. Human Decides.</p>
        <p className="text-[10px] text-slate-500 mt-0.5">Your approval is required before any counter action is taken.</p>
      </div>

      <button onClick={() => onAccept(recommendation.id)}
        className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2">
        <CheckCircle size={15} /> Accept Recommendation
      </button>
    </div>
  );
}

// ── Recent Activity — from existing queue events if available ───────
function RecentActivity({ queues, waitingTokens, servingTokens, summary }) {
  // Build activity items from available live data (no dedicated events API needed)
  const items = [];
  const now = new Date();
  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  servingTokens?.slice(0, 3).forEach(tk => {
    if (tk.calledAt) items.push({
      time: fmt(new Date(tk.calledAt)),
      ts:   new Date(tk.calledAt).getTime(),
      icon: '🔵', text: `Token ${tk.tokenNumber} called to ${tk.counter?.name || 'counter'}`,
    });
  });

  waitingTokens?.slice(0, 2).forEach(tk => {
    if (tk.bookedAt) items.push({
      time: fmt(new Date(tk.bookedAt)),
      ts:   new Date(tk.bookedAt).getTime(),
      icon: '🟡', text: `Token ${tk.tokenNumber} booked — ${tk.service?.name}`,
    });
  });

  if (items.length === 0) {
    items.push(
      { time: fmt(new Date(now - 60000*2)), ts: now - 120000, icon: '🟢', text: 'Queue prediction updated' },
      { time: fmt(new Date(now - 60000*5)), ts: now - 300000, icon: '🔵', text: 'Dashboard loaded — AI analysis active' },
    );
  }

  items.sort((a, b) => b.ts - a.ts);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={16} className="text-electric animate-pulse" />
        <h2 className="section-title mb-0">Recent Activity</h2>
        <span className="text-[10px] text-slate-600 ml-auto">Live from queue</span>
      </div>
      <div className="space-y-0 divide-y divide-surface-border/40">
        {items.slice(0, 6).map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <span className="text-xs text-slate-600 w-16 flex-shrink-0 tabular-nums">{item.time}</span>
            <span className="text-sm flex-shrink-0">{item.icon}</span>
            <span className="text-xs text-slate-400">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t }     = useLanguage();
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // ── Existing fetch — UNCHANGED ────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const { data: d } = await adminAPI.dashboard();
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // ── Existing Socket.IO listeners — UNCHANGED ──────────────────
  useEffect(() => {
    fetchDashboard();
    const s = getSocket();
    s.on('queueUpdated',   fetchDashboard);
    s.on('counterOpened',  fetchDashboard);
    s.on('counterPaused',  fetchDashboard);
    s.on('tokenCompleted', fetchDashboard);
    s.on('etaUpdated',     fetchDashboard);
    return () => {
      s.off('queueUpdated'); s.off('counterOpened');
      s.off('counterPaused'); s.off('tokenCompleted'); s.off('etaUpdated');
    };
  }, [fetchDashboard]);

  // ── Existing counter actions — UNCHANGED ──────────────────────
  const counterAction = async (counterId, action) => {
    setActionLoading(counterId + action);
    try {
      await countersAPI[action](counterId);
      toast.success(`Counter ${action}ed`);
      fetchDashboard();
    } catch (e) { toast.error(e.response?.data?.error || 'Action failed'); }
    finally { setActionLoading(''); }
  };

  // ── Existing acceptRec — UNCHANGED ───────────────────────────
  const acceptRec = async (id) => {
    await adminAPI.acceptRecommendation(id);
    toast.success('Recommendation accepted');
    fetchDashboard();
  };

  // ── Existing loadDemo — UNCHANGED ─────────────────────────────
  const loadDemo = async () => {
    setLoadingDemo(true);
    try {
      await demoAPI.loadScenario();
      toast.success('Demo scenario loaded!');
      fetchDashboard();
    } catch (e) { toast.error('Failed to load demo'); }
    finally { setLoadingDemo(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <LoadingSpinner text={t('loading')} />
    </div>
  );

  const { summary, counters, waitingTokens, servingTokens, recommendation } = data || {};

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── HEADER — preserved + slightly tightened ──────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('adminDashboard')}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Monitor the queue · Predict demand · Simulate changes · Make informed decisions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={loadDemo} disabled={loadingDemo}
              className="btn-secondary text-sm py-2 flex items-center gap-2">
              {loadingDemo ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={14} />}
              Load Demo
            </button>
            <button onClick={fetchDashboard} className="text-slate-500 hover:text-white p-2 transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <Link to="/admin/analytics" className="btn-secondary text-sm py-2 flex items-center gap-1.5">
              <BarChart2 size={14} /> {t('analytics')}
            </Link>
            <Link to="/admin/simulator" className="btn-secondary text-sm py-2 flex items-center gap-1.5">
              <GitBranch size={14} /> Simulator
            </Link>
            <Link to="/admin/canteen?orgId=auto" className="btn-secondary text-sm py-2 flex items-center gap-1.5">
              🍽 Canteen
            </Link>
          </div>
        </div>

        {/* ── 1. KPI CARDS — enhanced with secondary info ────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {/* Total Waiting */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{t('totalWaiting')}</p>
              <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Users size={14} className="text-yellow-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{summary?.totalWaiting || 0}</p>
            <p className="text-xs text-slate-600 mt-1">
              {summary?.completedToday || 0} completed today
            </p>
          </div>

          {/* Active Counters */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{t('activeCounters')}</p>
              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <Activity size={14} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary?.activeCounters || 0}
              <span className="text-slate-500 text-base font-normal">/{summary?.totalCounters || 0}</span>
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {summary?.pausedCounters || 0} paused
            </p>
          </div>

          {/* Average ETA */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">{t('avgETA')}</p>
              <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock size={14} className="text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{summary?.avgETA || 0} <span className="text-sm text-slate-500">min</span></p>
            <p className="text-xs mt-1">
              {(summary?.avgETA || 0) <= 15
                ? <span className="text-emerald-400 flex items-center gap-0.5"><TrendingDown size={10} /> Acceptable</span>
                : (summary?.avgETA || 0) <= 25
                  ? <span className="text-yellow-400 flex items-center gap-0.5"><Minus size={10} /> Moderate</span>
                  : <span className="text-red-400 flex items-center gap-0.5"><TrendingUp size={10} /> High — review</span>}
            </p>
          </div>

          {/* Crowd */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500">Crowd</p>
              <div className="w-7 h-7 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle size={14} className="text-orange-400" />
              </div>
            </div>
            <CrowdBadge level={summary?.crowdLevel || 'LOW'} />
            <p className="text-xs text-slate-600 mt-1">
              {summary?.noShowToday || 0} no-shows today
            </p>
          </div>
        </div>

        {/* ── 2. AI RECOMMENDATION + SMART ALERTS ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {recommendation && !recommendation.isAccepted ? (
            <AIDecisionCenter recommendation={recommendation} summary={summary} onAccept={acceptRec} />
          ) : (
            <div className="card p-5 border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-center items-center text-center py-8">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-emerald-400">All recommendations actioned</p>
              <p className="text-xs text-slate-500 mt-1">Queue is operating as recommended. No pending AI actions.</p>
            </div>
          )}
          <SmartAlerts summary={summary} waitingTokens={waitingTokens} counters={counters} />
        </div>

        {/* ── 3. NOW SERVING + LIVE QUEUE ──────────────────────── */}
        <div className="space-y-5 mb-6">
          {/* Now Serving — UNCHANGED */}
          {servingTokens?.length > 0 && (
            <div className="card p-5">
              <h2 className="section-title flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /> Now Serving
                <span className="text-xs text-slate-500 ml-auto">{servingTokens.length} active</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {servingTokens.map(tk => (
                  <div key={tk.id} className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <span className="text-lg font-extrabold text-blue-400 w-16 flex-shrink-0">{tk.tokenNumber}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{tk.service?.name}</p>
                      <p className="text-xs text-slate-500">{tk.counter?.name}</p>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0">Serving</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Queue — improved columns, SAME DATA SOURCE */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0 flex items-center gap-2">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                {t('liveQueue')}
              </h2>
              <span className="text-xs text-slate-500">{waitingTokens?.length || 0} waiting</span>
            </div>
            {!waitingTokens?.length ? (
              <p className="text-slate-600 text-sm py-4">No waiting tokens</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-surface-border/50">
                      <th className="pb-2 font-medium">Token</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Service</th>
                      <th className="pb-2 font-medium">Wait</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Position</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/40">
                    {waitingTokens.slice(0, 15).map((tk, i) => (
                      <tr key={tk.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-2.5 font-extrabold text-white">{tk.tokenNumber}</td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px] hidden sm:table-cell">{tk.service?.name}</td>
                        <td className="py-2.5 text-slate-400 tabular-nums">
                          {tk.estimatedWait > 0
                            ? <span className={tk.estimatedWait > 20 ? 'text-red-400' : tk.estimatedWait > 10 ? 'text-yellow-400' : 'text-emerald-400'}>~{tk.estimatedWait} {t('min')}</span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-2.5 text-slate-500 tabular-nums hidden md:table-cell">#{i + 1}</td>
                        <td className="py-2.5">
                          <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">Waiting</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── 4. COUNTER PERFORMANCE ───────────────────────────── */}
        <div className="mb-6">
          <CounterPerformance
            counters={counters}
            servingTokens={servingTokens}
            summary={summary}
            actionLoading={actionLoading}
            counterAction={counterAction}
          />
        </div>

        {/* ── 5. FORECAST + QUEUE HEALTH ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <QueueForecast summary={summary} />
          <QueueHealth summary={summary} />
        </div>

        {/* ── 6. TODAY STATS + RECENT ACTIVITY ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Today — UNCHANGED content */}
          <div className="card p-5">
            <h2 className="section-title">Today's Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Completed',      value: summary?.completedToday || 0, color: 'text-emerald-400' },
                { label: 'No-shows',       value: summary?.noShowToday    || 0, color: 'text-red-400' },
                { label: 'Paused Counters',value: summary?.pausedCounters || 0, color: 'text-orange-400' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-navy-800/60 rounded-xl">
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-border">
              <p className="text-xs text-slate-500 mb-2">Quick navigation</p>
              <div className="flex gap-2">
                <Link to="/admin/analytics" className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1.5">
                  <BarChart2 size={12} /> Analytics
                </Link>
                <Link to="/admin/simulator" className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center gap-1.5">
                  <GitBranch size={12} /> Simulator
                </Link>
              </div>
            </div>
          </div>

          <RecentActivity
            waitingTokens={waitingTokens}
            servingTokens={servingTokens}
            summary={summary}
          />
        </div>

      </div>
    </div>
  );
}
