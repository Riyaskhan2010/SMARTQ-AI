/**
 * BookToken.jsx
 * Existing single-service booking flow — EXTENDED for hospital orgs:
 * after service details, shows "Add Another Service?" step.
 * Non-hospital orgs: identical behaviour as before.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, ArrowLeft, Clock, Users, Activity, Ticket,
  User, Zap, Brain, Plus, SkipForward, CheckCircle,
  Stethoscope, FlaskConical, Pill, Receipt, FileText, UtensilsCrossed,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { servicesAPI, tokensAPI, historyAPI, orgsAPI, visitPlanAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { addMinutes, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

// ── Dept icon + ordering (mirrors VisitPlan.jsx) ──────────────────
const DEPT_ICON = {
  'Outpatient Department (OPD)': Stethoscope,
  'Laboratory Services':         FlaskConical,
  'Pharmacy':                    Pill,
  'Billing':                     Receipt,
  'Appointment / Registration':  FileText,
  'Canteen':                     UtensilsCrossed,
};
const DEPT_ORDER = {
  'Appointment / Registration':  1,
  'Outpatient Department (OPD)': 2,
  'Laboratory Services':         3,
  'Pharmacy':                    4,
  'Billing':                     5,
  'Canteen':                     6,
};
const DEPT_COLOR = {
  'Outpatient Department (OPD)': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Laboratory Services':         'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Pharmacy':                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Billing':                     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Appointment / Registration':  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Canteen':                     'text-orange-400 bg-orange-500/10 border-orange-500/20',
};
function deptStyle(name) {
  return DEPT_COLOR[name] || 'text-brand bg-brand/10 border-brand/20';
}

// ── "Add Another Service" panel (hospital-only step 2) ───────────
function AddServicePanel({ primaryDept, orgDepts, extraDepts, onToggle, onConfirmExtras, onSkip, queueInfos }) {
  // Filter out the dept that contains the primary service, and canteen
  const available = orgDepts.filter(d =>
    d.id !== primaryDept?.id &&
    !d.name.toLowerCase().includes('canteen') &&
    d.services?.length > 0
  );

  return (
    <div className="card p-5 mb-5 border-brand/20 bg-brand/5">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={15} className="text-brand" />
        <h3 className="font-semibold text-white text-sm">Are you visiting any other service today?</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">Plan your complete hospital visit in one booking.</p>

      {available.length === 0 && (
        <p className="text-xs text-slate-600 mb-4">No additional services available.</p>
      )}

      <div className="space-y-2 mb-4">
        {available.map(dept => {
          const Icon       = DEPT_ICON[dept.name] || FileText;
          const style      = deptStyle(dept.name);
          const isSelected = extraDepts.some(d => d.id === dept.id);
          const repSvc     = dept.services?.[0];
          const qi         = repSvc ? queueInfos[repSvc.id] : null;

          return (
            <button key={dept.id} onClick={() => onToggle(dept)}
              className={`w-full p-3 flex items-center gap-3 rounded-xl border text-left transition-all
                ${isSelected ? 'border-brand/60 bg-brand/10' : 'border-surface-border hover:border-brand/30 bg-navy-800/40'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${style}`}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{dept.name}</p>
                {qi && (
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1"><Users size={9}/> {qi.waitingCount} waiting</span>
                    <span className="flex items-center gap-1"><Clock size={9}/> ~{qi.estimatedWait}m</span>
                  </p>
                )}
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${isSelected ? 'bg-brand border-brand' : 'border-slate-600'}`}>
                {isSelected && <CheckCircle size={11} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        {extraDepts.length > 0 ? (
          <button onClick={onConfirmExtras}
            className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
            <Brain size={14} /> Plan {extraDepts.length + 1} Services with AI
          </button>
        ) : (
          <button onClick={onConfirmExtras} disabled
            className="btn-primary flex-1 py-2.5 text-sm opacity-40 flex items-center justify-center gap-2">
            <Plus size={14} /> Select a service above
          </button>
        )}
        <button onClick={onSkip}
          className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-1.5">
          <SkipForward size={13} /> Skip
        </button>
      </div>
    </div>
  );
}

// ── AI Sequence confirmation panel (hospital multi-service step 3) ─
function SequencePanel({ sequence, onReorder, onConfirm, booking, totalETA }) {
  const moveUp   = (i) => { if (i === 0) return; const s=[...sequence]; [s[i-1],s[i]]=[s[i],s[i-1]]; onReorder(s); };
  const moveDown = (i) => { if (i===sequence.length-1) return; const s=[...sequence]; [s[i],s[i+1]]=[s[i+1],s[i]]; onReorder(s); };

  return (
    <div className="card p-5 mb-5 border-purple-500/20 bg-purple-500/5">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={15} className="text-purple-400" />
        <h3 className="font-semibold text-purple-300 text-sm">AI Recommended Visit Sequence</h3>
      </div>
      <p className="text-xs text-slate-500 mb-1">Based on queue lengths, dependencies, and estimated wait times.</p>
      <p className="text-[10px] text-slate-600 mb-4">AI recommends. Human decides.</p>

      <div className="space-y-2 mb-4">
        {sequence.map((item, i) => {
          const Icon  = DEPT_ICON[item.deptName] || FileText;
          const style = deptStyle(item.deptName);
          return (
            <div key={item.deptId || i} className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl border border-surface-border">
              <div className="w-6 h-6 bg-brand/20 rounded-full flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
                {i + 1}
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${style}`}>
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.deptName}</p>
                {item.eta > 0 && <p className="text-xs text-slate-500">~{item.eta}m wait</p>}
              </div>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moveUp(i)} disabled={i===0} className="text-slate-600 hover:text-white disabled:opacity-20 text-xs p-0.5">▲</button>
                <button onClick={() => moveDown(i)} disabled={i===sequence.length-1} className="text-slate-600 hover:text-white disabled:opacity-20 text-xs p-0.5">▼</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
        <div>
          <p className="text-xs text-slate-500">AI Estimated Total Visit</p>
          <p className="text-xl font-extrabold text-emerald-400">{totalETA} <span className="text-xs text-slate-500">min</span></p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>{sequence.length} services</p>
          <p>in sequence</p>
        </div>
      </div>

      <button onClick={onConfirm} disabled={booking}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
        {booking
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Zap size={16} /> Confirm Visit Plan</>}
      </button>
    </div>
  );
}

// ── Main BookToken component ──────────────────────────────────────
export default function BookToken() {
  const { serviceId }  = useParams();
  const navigate       = useNavigate();
  const { t }          = useLanguage();

  // Core state
  const [info, setInfo]           = useState(null);
  const [visitType, setVisitType] = useState('new');
  const [lastVisit, setLastVisit] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [booking, setBooking]     = useState(false);

  // Hospital multi-service state
  // step: 'details' | 'addService' | 'sequence'
  const [step, setStep]           = useState('details');
  const [isHospital, setIsHospital] = useState(false);
  const [orgDepts, setOrgDepts]   = useState([]);   // all departments of the org
  const [extraDepts, setExtraDepts] = useState([]); // user-selected extras
  const [sequence, setSequence]   = useState([]);
  const [totalETA, setTotalETA]   = useState(0);
  const [deptQueueInfos, setDeptQueueInfos] = useState({}); // svcId → queueInfo

  useEffect(() => {
    Promise.all([
      servicesAPI.queueInfo(serviceId),
      historyAPI.list().catch(() => ({ data: [] })),
    ]).then(([infoRes, histRes]) => {
      const svcInfo = infoRes.data;
      setInfo(svcInfo);
      const h = Array.isArray(histRes.data) ? histRes.data : [];
      setLastVisit(h[0] || null);

      // Detect hospital org and load sibling depts
      const orgId   = svcInfo.service?.department?.organization?.id;
      const sector  = svcInfo.service?.department?.organization?.sector;
      const isHosp  = sector?.slug === 'hospital' || sector?.name?.toLowerCase().includes('hospital');
      setIsHospital(isHosp);

      if (isHosp && orgId) {
        orgsAPI.get(orgId).then(({ data: org }) => {
          const depts = org.departments?.filter(d => d.isActive !== false) || [];
          setOrgDepts(depts);
          // Fetch queue info for all services in those depts
          const allSvcs = depts
            .filter(d => !d.name.toLowerCase().includes('canteen'))
            .flatMap(d => d.services || []);
          Promise.allSettled(allSvcs.map(s => servicesAPI.queueInfo(s.id)))
            .then(results => {
              const map = {};
              results.forEach((r, i) => {
                if (r.status === 'fulfilled') map[allSvcs[i].id] = r.value.data;
              });
              setDeptQueueInfos(map);
            });
        }).catch(() => {});
      }
    }).catch(() => navigate('/sectors')).finally(() => setLoading(false));
  }, [serviceId]);

  // ── Find the primary dept (the dept containing this service) ────
  const primaryDept = orgDepts.find(d => d.services?.some(s => s.id === serviceId)) || null;

  // ── Toggle extra dept selection ──────────────────────────────────
  const toggleExtra = (dept) => {
    setExtraDepts(prev =>
      prev.some(d => d.id === dept.id) ? prev.filter(d => d.id !== dept.id) : [...prev, dept]
    );
  };

  // ── Build AI sequence from primary + extras ───────────────────────
  const buildSequence = useCallback(() => {
    const primarySvc = info?.service;
    const primaryItem = {
      deptId:      primaryDept?.id || 'primary',
      deptName:    primaryDept?.name || primarySvc?.department?.name || 'Doctor Consultation',
      serviceId,
      serviceName: primarySvc?.name || 'Service',
      repSvcId:    serviceId,
      eta:         info?.estimatedWait || 15,
    };

    const extraItems = extraDepts.map(dept => {
      const repSvc = dept.services?.[0];
      const qi     = repSvc ? deptQueueInfos[repSvc.id] : null;
      return {
        deptId:      dept.id,
        deptName:    dept.name,
        serviceId:   repSvc?.id,
        serviceName: repSvc?.name || dept.name,
        repSvcId:    repSvc?.id,
        eta:         qi?.estimatedWait || 15,
      };
    });

    // Sort: primary first (keep its DEPT_ORDER position), then sort extras by DEPT_ORDER
    const all = [primaryItem, ...extraItems].sort((a, b) => {
      const oa = DEPT_ORDER[a.deptName] || 99;
      const ob = DEPT_ORDER[b.deptName] || 99;
      return oa !== ob ? oa - ob : (a.eta - b.eta);
    });

    setSequence(all);
    setTotalETA(all.reduce((s, it) => s + it.eta + 8, 0));
    setStep('sequence');
  }, [info, primaryDept, serviceId, extraDepts, deptQueueInfos]);

  // ── Recalculate ETA when sequence is manually reordered ─────────
  useEffect(() => {
    if (sequence.length > 0)
      setTotalETA(sequence.reduce((s, it) => s + (it.eta || 15) + 8, 0));
  }, [sequence]);

  // ── Single-service book (original logic) ────────────────────────
  const handleBookSingle = async () => {
    setBooking(true);
    try {
      const { data } = await tokensAPI.book({ serviceId, isFollowUp: visitType === 'followup' });
      toast.success(`Token ${data.token.tokenNumber} booked!`);
      navigate(`/token/${data.token.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // ── Multi-service visit plan book ────────────────────────────────
  const handleBookPlan = async () => {
    setBooking(true);
    try {
      const toBook = sequence
        .filter(it => it.repSvcId)
        .map(it => ({ serviceId: it.repSvcId }));

      if (toBook.length === 0) { toast.error('No bookable services'); setBooking(false); return; }

      const results  = await visitPlanAPI.bookPlan(toBook);
      const good     = results.filter(r => r.success);
      const bad      = results.filter(r => !r.success);
      bad.forEach(f => toast.error(f.error || 'One booking failed'));
      if (good.length === 0) { setBooking(false); return; }

      const orgId  = info?.service?.department?.organization?.id;
      const orgName = info?.service?.department?.organization?.name;

      const plan = {
        orgId,
        orgName,
        createdAt: new Date().toISOString(),
        items: sequence.map((item, i) => {
          const res = results[i];
          return {
            deptId:      item.deptId,
            deptName:    item.deptName,
            serviceId:   item.repSvcId,
            serviceName: item.serviceName,
            token:       res?.success ? res.data?.token : null,
            tokenId:     res?.success ? res.data?.token?.id : null,
            eta:         item.eta,
            status:      res?.success ? 'BOOKED' : 'FAILED',
          };
        }),
        totalETA,
      };

      sessionStorage.setItem('smartq_visit_plan', JSON.stringify(plan));
      toast.success(`${good.length} token${good.length > 1 ? 's' : ''} booked!`);
      navigate(`/hospital/visit-plan/tracking?orgId=${orgId}`);
    } catch (err) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;
  if (!info) return null;

  const { service, waitingCount, activeCounters, estimatedWait, crowdLevel, servingToken } = info;
  const travelTime = 18;
  const departure  = addMinutes(Math.max(0, estimatedWait - travelTime));
  const orgId      = service?.department?.organization?.id;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <span className="text-brand font-medium">4. Book Token</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step !== 'details' ? setStep(step === 'sequence' ? 'addService' : 'details') : navigate(-1)}
            className="text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{service.name}</h1>
            <p className="text-slate-500 text-sm">{service.department?.organization?.name}</p>
          </div>
        </div>

        {/* ── Queue preview card (always visible) ─────────────── */}
        <div className="card p-5 mb-5 bg-gradient-to-br from-surface-card to-navy-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Brain size={12} className="text-brand" /> SmartQ AI Prediction
            </span>
            <CrowdBadge level={crowdLevel} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Users size={11}/>{t('peopleAhead')}</p>
              <p className="text-3xl font-bold text-white">{waitingCount}</p>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={11}/>{t('estimatedWait')}</p>
              <p className="text-3xl font-bold text-white">{estimatedWait}<span className="text-base text-slate-500 ml-1">{t('min')}</span></p>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity size={11}/>{t('currentQueue')}</p>
              <p className="text-2xl font-bold text-white">{servingToken || '—'}</p>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap size={11}/>Dept. {activeCounters} counters</p>
              <p className="text-lg font-bold text-emerald-400">Open</p>
            </div>
          </div>
          {estimatedWait > 0 && (
            <div className="mt-3 p-3 bg-brand/10 border border-brand/20 rounded-xl flex items-center gap-2">
              <Zap size={13} className="text-brand flex-shrink-0" />
              <p className="text-xs text-brand">Leave by <strong>{departure}</strong> — travel {travelTime} min + queue {estimatedWait} min</p>
            </div>
          )}
        </div>

        {/* ── Visit type selector (details step only) ──────────── */}
        {step === 'details' && (
          <>
            <div className="card p-5 mb-5">
              <p className="text-sm font-medium text-slate-300 mb-3">{t('visitType')}</p>
              <div className="grid grid-cols-2 gap-3">
                {['new', 'followup'].map(type => (
                  <button key={type} onClick={() => setVisitType(type)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${visitType === type ? 'border-brand bg-brand/10 text-brand' : 'border-surface-border text-slate-400 hover:border-brand/30'}`}>
                    <User size={16} className="mx-auto mb-1" />
                    {type === 'new' ? t('newVisit') : t('followUp')}
                  </button>
                ))}
              </div>
              {visitType === 'followup' && lastVisit && (
                <div className="mt-3 p-3 bg-electric/10 border border-electric/20 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">{t('previousVisit')}</p>
                  <p className="text-sm font-medium text-white">{lastVisit.serviceName}</p>
                  <p className="text-xs text-slate-400">{lastVisit.organizationName} · {formatDate(lastVisit.visitDate)}</p>
                </div>
              )}
            </div>

            {service.fee && (
              <div className="card p-4 mb-5 border-amber-500/30 bg-amber-500/5">
                <p className="text-sm text-amber-400">Registration fee applies: <strong>₹{service.fee}</strong></p>
                <p className="text-xs text-slate-500 mt-0.5">Payment collected at the counter</p>
              </div>
            )}

            {/* CTA: hospital shows "Continue" → step 2; non-hospital books directly */}
            {isHospital ? (
              <button onClick={() => setStep('addService')}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                <ChevronRight size={18} /> Continue
              </button>
            ) : (
              <button onClick={handleBookSingle} disabled={booking}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
                {booking
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Ticket size={18} /> {t('bookToken')}</>}
              </button>
            )}
          </>
        )}

        {/* ── Step 2: Add Another Service (hospital only) ──────── */}
        {step === 'addService' && (
          <AddServicePanel
            primaryDept={primaryDept}
            orgDepts={orgDepts}
            extraDepts={extraDepts}
            onToggle={toggleExtra}
            onConfirmExtras={buildSequence}
            onSkip={handleBookSingle}
            queueInfos={deptQueueInfos}
          />
        )}

        {/* ── Step 3: AI Sequence + confirm (hospital multi) ───── */}
        {step === 'sequence' && (
          <SequencePanel
            sequence={sequence}
            onReorder={setSequence}
            onConfirm={handleBookPlan}
            booking={booking}
            totalETA={totalETA}
          />
        )}
      </div>
    </div>
  );
}
