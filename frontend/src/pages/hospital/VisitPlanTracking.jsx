/**
 * VisitPlanTracking.jsx — Live tracking for a Smart Visit Plan
 * URL: /hospital/visit-plan/tracking?orgId=xxx
 *
 * Reads the plan from sessionStorage key `smartq_visit_plan`.
 * Polls each booked token's status from GET /api/tokens/:id every 15 s.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope, FlaskConical, Pill, Receipt, FileText,
  UtensilsCrossed, CheckCircle, Clock, ChevronRight,
  Activity, ArrowLeft, RefreshCw, Brain, Calendar,
  AlertCircle, Circle, MapPin, Zap,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { tokensAPI }  from '../../services/api';
import { getSocket }  from '../../services/socket';
import toast          from 'react-hot-toast';

// ── Icon map (matches VisitPlan.jsx) ─────────────────────────────
const DEPT_ICON = {
  'Outpatient Department (OPD)': Stethoscope,
  'Laboratory Services':         FlaskConical,
  'Pharmacy':                    Pill,
  'Billing':                     Receipt,
  'Appointment / Registration':  FileText,
  'Canteen':                     UtensilsCrossed,
};

const DEPT_COLOR = {
  'Outpatient Department (OPD)': { ring: 'border-red-500/40',     icon: 'text-red-400',     bg: 'bg-red-500/10' },
  'Laboratory Services':         { ring: 'border-blue-500/40',    icon: 'text-blue-400',    bg: 'bg-blue-500/10' },
  'Pharmacy':                    { ring: 'border-emerald-500/40', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Billing':                     { ring: 'border-amber-500/40',   icon: 'text-amber-400',   bg: 'bg-amber-500/10' },
  'Appointment / Registration':  { ring: 'border-purple-500/40',  icon: 'text-purple-400',  bg: 'bg-purple-500/10' },
  'Canteen':                     { ring: 'border-orange-500/40',  icon: 'text-orange-400',  bg: 'bg-orange-500/10' },
};

function deptStyle(name) {
  return DEPT_COLOR[name] || { ring: 'border-brand/30', icon: 'text-brand', bg: 'bg-brand/10' };
}

// ── Token status → visit plan status ──────────────────────────────
function mapTokenStatus(tokenStatus, index, currentIndex) {
  if (tokenStatus === 'COMPLETED' || tokenStatus === 'NO_SHOW') return 'COMPLETED';
  if (tokenStatus === 'SERVING')  return 'IN PROGRESS';
  if (tokenStatus === 'CANCELLED') return 'CANCELLED';
  if (index < currentIndex)       return 'COMPLETED';
  if (index === currentIndex)     return 'WAITING';
  return 'UPCOMING';
}

// ── Status display config ─────────────────────────────────────────
const STATUS_CFG = {
  UPCOMING:    { label: 'Upcoming',    color: 'text-slate-500',    bg: 'bg-slate-700/40',     border: 'border-slate-600/30',    icon: Circle },
  WAITING:     { label: 'Waiting',     color: 'text-yellow-400',   bg: 'bg-yellow-500/10',    border: 'border-yellow-500/30',   icon: Clock },
  'IN PROGRESS':{ label: 'In Progress',color: 'text-blue-400',     bg: 'bg-blue-500/10',      border: 'border-blue-500/30',     icon: Activity },
  COMPLETED:   { label: 'Completed',   color: 'text-emerald-400',  bg: 'bg-emerald-500/10',   border: 'border-emerald-500/30',  icon: CheckCircle },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400',      bg: 'bg-red-500/10',       border: 'border-red-500/30',      icon: AlertCircle },
  FAILED:      { label: 'Failed',      color: 'text-red-400',      bg: 'bg-red-500/10',       border: 'border-red-500/30',      icon: AlertCircle },
};

// ── Single service row ─────────────────────────────────────────────
function ServiceRow({ item, index, visitStatus, tokenDetail, isCurrent, isNext }) {
  const Icon   = DEPT_ICON[item.deptName] || FileText;
  const style  = deptStyle(item.deptName);
  const cfg    = STATUS_CFG[visitStatus] || STATUS_CFG.UPCOMING;
  const StatusIcon = cfg.icon;
  const tokenNum   = item.token?.tokenNumber || item.token?.number || '—';

  return (
    <div className={`card p-4 flex items-center gap-4 transition-all
      ${isCurrent ? 'border-brand/50 bg-brand/5' : ''}
      ${visitStatus === 'COMPLETED' ? 'opacity-70' : ''}
    `}>
      {/* Step number / status icon */}
      <div className="flex flex-col items-center flex-shrink-0 w-8">
        {visitStatus === 'COMPLETED'
          ? <CheckCircle size={22} className="text-emerald-400" />
          : isCurrent
            ? <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center animate-pulse">
                <span className="text-[10px] font-bold text-white">{index + 1}</span>
              </div>
            : <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${visitStatus === 'UPCOMING' ? 'border-slate-600 bg-navy-800' : 'border-brand/60 bg-brand/10'}`}>
                <span className="text-[10px] font-bold text-slate-400">{index + 1}</span>
              </div>
        }
        {isNext && (
          <span className="text-[8px] font-bold text-brand mt-0.5">NEXT</span>
        )}
      </div>

      {/* Dept icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.ring} ${style.bg}`}>
        <Icon size={18} className={style.icon} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${visitStatus === 'UPCOMING' ? 'text-slate-400' : 'text-white'}`}>
          {item.deptName}
        </p>
        <p className="text-xs text-slate-500">{item.serviceName}</p>
        {item.tokenId && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold text-brand">Token: {tokenNum}</span>
            {tokenDetail?.waitingAhead != null && visitStatus === 'WAITING' && (
              <span className="text-xs text-slate-500">{tokenDetail.waitingAhead} ahead</span>
            )}
          </div>
        )}
        {item.eta > 0 && visitStatus !== 'COMPLETED' && (
          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
            <Clock size={9} /> ~{item.eta}m estimated wait
          </p>
        )}
      </div>

      {/* Status badge + link */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          {cfg.label}
        </span>
        {item.tokenId && ['WAITING','IN PROGRESS'].includes(visitStatus) && (
          <Link to={`/token/${item.tokenId}`}
            className="text-[10px] text-brand hover:text-brand-light flex items-center gap-0.5 transition-colors">
            Live <ChevronRight size={8} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main VisitPlanTracking ─────────────────────────────────────────
export default function VisitPlanTracking() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const orgId      = params.get('orgId');

  const [plan, setPlan]             = useState(null);
  const [tokenDetails, setTokenDetails] = useState({}); // tokenId → detail
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const pollRef = useRef(null);

  // ── Load plan from sessionStorage ─────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem('smartq_visit_plan');
    if (!raw) {
      toast.error('No visit plan found');
      navigate(orgId ? `/hospital/visit-plan?orgId=${orgId}` : '/sectors');
      return;
    }
    try {
      const p = JSON.parse(raw);
      setPlan(p);
    } catch {
      navigate('/sectors');
    }
    setLoading(false);
  }, []);

  // ── Poll token statuses ───────────────────────────────────────
  const fetchStatuses = useCallback(async (currentPlan) => {
    if (!currentPlan) return;
    const tokenIds = currentPlan.items
      .filter(it => it.tokenId)
      .map(it => it.tokenId);

    if (tokenIds.length === 0) return;

    setRefreshing(true);
    try {
      const results = await Promise.allSettled(
        tokenIds.map(id => tokensAPI.get(id))
      );
      const details = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          details[tokenIds[i]] = r.value.data;
        }
      });
      setTokenDetails(details);
      setLastUpdate(new Date());
    } catch (e) {
      // silent — stale data stays visible
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Start polling once plan is loaded
  useEffect(() => {
    if (!plan) return;
    fetchStatuses(plan);
    pollRef.current = setInterval(() => fetchStatuses(plan), 15000);
    return () => clearInterval(pollRef.current);
  }, [plan, fetchStatuses]);

  // ── Socket updates ─────────────────────────────────────────────
  useEffect(() => {
    const s = getSocket();
    const refresh = () => plan && fetchStatuses(plan);
    s.on('queueUpdated', refresh);
    s.on('tokenCalled',  refresh);
    s.on('etaUpdated',   refresh);
    return () => {
      s.off('queueUpdated', refresh);
      s.off('tokenCalled',  refresh);
      s.off('etaUpdated',   refresh);
    };
  }, [plan, fetchStatuses]);

  if (loading || !plan) return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <LoadingSpinner text="Loading your visit plan…" />
    </div>
  );

  // ── Derive per-item visit status ──────────────────────────────
  // currentIndex = first item that is not COMPLETED
  const enrichedItems = plan.items.map(item => {
    const detail      = item.tokenId ? tokenDetails[item.tokenId] : null;
    const tokenStatus = detail?.status || (item.status === 'FAILED' ? 'CANCELLED' : 'WAITING');
    return { ...item, _tokenDetail: detail, _tokenStatus: tokenStatus };
  });

  const currentIndex = enrichedItems.findIndex(
    it => !['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(it._tokenStatus)
  );

  const itemsWithVisitStatus = enrichedItems.map((item, i) => ({
    ...item,
    _visitStatus: item.status === 'FAILED'
      ? 'FAILED'
      : mapTokenStatus(item._tokenStatus, i, currentIndex === -1 ? 999 : currentIndex),
  }));

  const completedCount = itemsWithVisitStatus.filter(it => it._visitStatus === 'COMPLETED').length;
  const totalCount     = itemsWithVisitStatus.length;
  const allDone        = completedCount === totalCount;

  // ── Recalculate remaining ETA ─────────────────────────────────
  const remainingETA = itemsWithVisitStatus
    .filter(it => ['WAITING','IN PROGRESS','UPCOMING'].includes(it._visitStatus))
    .reduce((sum, it) => sum + (it._tokenDetail?.estimatedWait || it.eta || 0) + 8, 0);

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <Link to="/sectors" className="text-brand hover:text-brand-light">Sectors</Link>
          <ChevronRight size={10} />
          <Link to={`/hospital/visit-plan?orgId=${plan.orgId}`} className="text-brand hover:text-brand-light">Plan Visit</Link>
          <ChevronRight size={10} />
          <span className="text-brand font-medium">Tracking</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-navy-700">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Your Visit Plan</h1>
              <p className="text-xs text-slate-500 mt-0.5">{plan.orgName}</p>
            </div>
          </div>
          <button onClick={() => fetchStatuses(plan)}
            className={`text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-navy-700 ${refreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Visit date */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-5">
          <Calendar size={11} />
          <span>Booked {new Date(plan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-slate-700">·</span>
          <span>Updated {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Progress bar */}
        <div className="card p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-slate-500">Visit Progress</p>
              <p className="text-base font-bold text-white">
                {completedCount} of {totalCount} services completed
              </p>
            </div>
            <div className="text-right">
              {allDone ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Visit Complete!</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="text-base font-bold text-yellow-400">{remainingETA} <span className="text-xs text-slate-500">min</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-electric rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-600">
            <span>{progressPct}% done</span>
            <span className="flex items-center gap-1"><Brain size={8} className="text-purple-400" /> AI recommends. Human decides.</span>
          </div>
        </div>

        {/* AI insight — current status */}
        {!allDone && currentIndex !== -1 && (
          <div className="card p-4 mb-5 border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={13} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-300">AI Status</span>
            </div>
            <p className="text-sm text-white">
              Currently at: <span className="font-bold">{itemsWithVisitStatus[currentIndex]?.deptName}</span>
            </p>
            {currentIndex + 1 < totalCount && (
              <p className="text-xs text-slate-500 mt-0.5">
                Up next: {itemsWithVisitStatus[currentIndex + 1]?.deptName}
                {itemsWithVisitStatus[currentIndex + 1]?.eta > 0
                  ? ` · ~${itemsWithVisitStatus[currentIndex + 1].eta}m estimated wait`
                  : ''}
              </p>
            )}
          </div>
        )}

        {/* All done banner */}
        {allDone && (
          <div className="card p-5 mb-5 border-emerald-500/30 bg-emerald-500/8 text-center">
            <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-white mb-1">Visit Complete!</h2>
            <p className="text-sm text-slate-400">All services have been completed. Have a great day!</p>
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
              Back to Dashboard <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Service rows */}
        <div className="space-y-3">
          {itemsWithVisitStatus.map((item, i) => (
            <ServiceRow
              key={item.deptId || i}
              item={item}
              index={i}
              visitStatus={item._visitStatus}
              tokenDetail={item._tokenDetail}
              isCurrent={i === currentIndex}
              isNext={currentIndex !== -1 && i === currentIndex + 1}
            />
          ))}
        </div>

        {/* Total ETA footer */}
        <div className="card p-4 mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-brand" />
            <span className="text-sm text-slate-400">AI Estimated Total Visit</span>
          </div>
          <div className="text-right">
            <span className={`text-lg font-extrabold ${allDone ? 'text-emerald-400 line-through opacity-50' : 'text-white'}`}>
              {plan.totalETA} <span className="text-xs text-slate-500">min original</span>
            </span>
            {!allDone && remainingETA > 0 && (
              <p className="text-xs text-yellow-400 font-semibold">{remainingETA} min remaining</p>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-3 mt-5">
          <Link to={`/hospital/visit-plan?orgId=${plan.orgId}`}
            className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2">
            <ArrowLeft size={14} /> Edit Plan
          </Link>
          <Link to="/dashboard"
            className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2">
            Dashboard <ChevronRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
