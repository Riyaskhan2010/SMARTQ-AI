/**
 * VisitPlan.jsx — Smart Visit Plan for Hospital organizations
 * URL: /hospital/visit-plan?orgId=xxx
 *
 * Flow: Select services → AI sequences them → Confirm → Book tokens → Track
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope, FlaskConical, Pill, Receipt, FileText,
  UtensilsCrossed, ChevronRight, ArrowLeft, Brain, Zap,
  CheckCircle, Clock, Users, ArrowDown, GripVertical,
  AlertCircle, RefreshCw, Info,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { orgsAPI, servicesAPI, visitPlanAPI, canteenAPI } from '../../services/api';
import { useAuth }    from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

// ── Dept icon map ─────────────────────────────────────────────────
const DEPT_ICON = {
  'Outpatient Department (OPD)': Stethoscope,
  'Laboratory Services':         FlaskConical,
  'Pharmacy':                    Pill,
  'Billing':                     Receipt,
  'Appointment / Registration':  FileText,
  'Canteen':                     UtensilsCrossed,
};

// ── Logical dependency ordering ───────────────────────────────────
// Higher number = later in sequence
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

function getDeptStyle(deptName) {
  return DEPT_COLOR[deptName] || 'text-brand bg-brand/10 border-brand/20';
}

// ── Step 1: Service selection ─────────────────────────────────────
function ServiceSelector({ org, canteenId, selectedDepts, onToggleDept, onNext, queueInfos }) {
  const depts = (org?.departments || []).filter(d => d.isActive !== false);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Plan Your Hospital Visit</h2>
        <p className="text-slate-500 text-sm">Select everything you need during this visit. You can choose one or more services.</p>
      </div>

      <div className="space-y-3 mb-6">
        {depts.map(dept => {
          const Icon       = DEPT_ICON[dept.name] || FileText;
          const style      = getDeptStyle(dept.name);
          const isSelected = selectedDepts.some(d => d.id === dept.id);
          const isCanteen  = dept.name.toLowerCase().includes('canteen');
          // Pick first service of dept as representative
          const repSvc     = dept.services?.[0];
          const qi         = repSvc ? queueInfos[repSvc.id] : null;

          return (
            <button key={dept.id}
              onClick={() => onToggleDept(dept, isCanteen)}
              className={`card w-full p-4 flex items-center gap-4 text-left transition-all duration-200 hover:-translate-y-0.5
                ${isSelected
                  ? 'border-brand/60 bg-brand/8'
                  : 'hover:border-brand/30'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isSelected ? 'bg-brand/20 border-brand/40' : style}`}>
                <Icon size={18} className={isSelected ? 'text-brand' : ''} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{dept.name}</p>
                  {isCanteen && <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">Canteen</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>
                {qi && (
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users size={10} /> {qi.waitingCount} waiting
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400/80">
                      <Clock size={10} /> ~{qi.estimatedWait}m wait
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {qi && <CrowdBadge level={qi.crowdLevel} />}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'bg-brand border-brand' : 'border-slate-600'}`}>
                  {isSelected && <CheckCircle size={12} className="text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={selectedDepts.length === 0}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-40">
        <Brain size={18} />
        {selectedDepts.length === 1 ? 'Continue to Booking' : `Plan ${selectedDepts.length} Services with AI`}
        <ChevronRight size={18} />
      </button>

      {selectedDepts.length > 1 && (
        <p className="text-center text-xs text-slate-600 mt-2">
          AI will recommend the most efficient sequence for your visit.
        </p>
      )}
    </div>
  );
}

// ── Step 2: AI Sequence review ────────────────────────────────────
function SequenceReview({ sequence, onReorder, onConfirm, booking, totalETA }) {
  const [dragging, setDragging] = useState(null);

  const moveUp   = (i) => { if (i === 0) return; const s=[...sequence];[s[i-1],s[i]]=[s[i],s[i-1]];onReorder(s); };
  const moveDown = (i) => { if (i===sequence.length-1) return; const s=[...sequence];[s[i],s[i+1]]=[s[i+1],s[i]];onReorder(s); };

  return (
    <div>
      <div className="card p-4 mb-5 border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-purple-300">AI Recommended Visit Sequence</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Based on current queue lengths, service dependencies, and estimated wait times. You can adjust the order if needed.
        </p>
        <p className="text-[10px] text-slate-600 mt-1.5">AI recommends. Human decides.</p>
      </div>

      <div className="space-y-2 mb-5">
        {sequence.map((dept, i) => {
          const Icon  = DEPT_ICON[dept.name] || FileText;
          const style = getDeptStyle(dept.name);
          return (
            <div key={dept.id} className="card p-3 flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <div className="w-6 h-6 bg-brand/20 rounded-full flex items-center justify-center text-xs font-bold text-brand">
                  {i + 1}
                </div>
                {i < sequence.length - 1 && <div className="w-px h-3 bg-surface-border" />}
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${style}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{dept.name}</p>
                {dept._eta > 0 && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={9} /> ~{dept._eta}m wait
                  </p>
                )}
              </div>
              {/* Reorder controls */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  className="text-slate-600 hover:text-white disabled:opacity-20 p-0.5 rounded transition-colors text-xs">▲</button>
                <button onClick={() => moveDown(i)} disabled={i === sequence.length - 1}
                  className="text-slate-600 hover:text-white disabled:opacity-20 p-0.5 rounded transition-colors text-xs">▼</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4 mb-5 border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">AI Estimated Total Visit Time</p>
            <p className="text-2xl font-extrabold text-emerald-400">{totalETA} <span className="text-sm text-slate-500">min</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{sequence.length} services</p>
            <p className="text-xs text-slate-600">in sequence</p>
          </div>
        </div>
      </div>

      <button onClick={onConfirm} disabled={booking}
        className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
        {booking
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Zap size={18} /> Confirm & Book All Tokens</>}
      </button>
    </div>
  );
}

// ── Main VisitPlan component ───────────────────────────────────────
export default function VisitPlan() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { t }     = useLanguage();
  const orgId     = params.get('orgId');

  const [step, setStep]           = useState(0); // 0=select, 1=sequence, 2=booking
  const [org, setOrg]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [sequence, setSequence]   = useState([]);
  const [queueInfos, setQueueInfos] = useState({});
  const [totalETA, setTotalETA]   = useState(0);
  const [booking, setBooking]     = useState(false);
  const [canteenId, setCanteenId] = useState(null);

  // Fetch org data
  useEffect(() => {
    if (!orgId) { navigate('/sectors'); return; }
    orgsAPI.get(orgId)
      .then(({ data }) => {
        setOrg(data);
        // Queue infos for ETA display
        const allSvcs = data.departments
          ?.filter(d => !d.name.toLowerCase().includes('canteen'))
          .flatMap(d => d.services || []) || [];
        visitPlanAPI.getMultiQueueInfo(allSvcs.map(s => s.id))
          .then(infos => setQueueInfos(infos));
        // Canteen check
        canteenAPI.getByOrg(orgId)
          .then(r => setCanteenId(r.data?.canteen?.id))
          .catch(() => {});
      })
      .catch(() => navigate('/sectors'))
      .finally(() => setLoading(false));
  }, [orgId]);

  // Toggle dept selection
  const toggleDept = (dept, isCanteen) => {
    if (isCanteen) {
      // Canteen → go straight to canteen page
      navigate(`/canteen?orgId=${orgId}`);
      return;
    }
    setSelectedDepts(prev =>
      prev.some(d => d.id === dept.id)
        ? prev.filter(d => d.id !== dept.id)
        : [...prev, dept]
    );
  };

  // Build AI sequence when moving to step 1
  const goToSequence = useCallback(() => {
    // Sort by logical dependency order, then by queue length (shorter first if same order)
    const sorted = [...selectedDepts].sort((a, b) => {
      const orderA = DEPT_ORDER[a.name] || 99;
      const orderB = DEPT_ORDER[b.name] || 99;
      if (orderA !== orderB) return orderA - orderB;
      // Same order level: shorter queue first
      const etaA = a.services?.[0] ? (queueInfos[a.services[0].id]?.estimatedWait || 50) : 50;
      const etaB = b.services?.[0] ? (queueInfos[b.services[0].id]?.estimatedWait || 50) : 50;
      return etaA - etaB;
    });

    // Add ETA annotation
    const annotated = sorted.map(d => {
      const repSvc = d.services?.[0];
      const eta    = repSvc ? (queueInfos[repSvc.id]?.estimatedWait || 15) : 15;
      return { ...d, _eta: eta, _repSvcId: repSvc?.id };
    });

    setSequence(annotated);
    setTotalETA(annotated.reduce((s, d) => s + d._eta + (d._svcTime || 8), 0));
    setStep(1);
  }, [selectedDepts, queueInfos]);

  // Update total ETA when sequence changes
  useEffect(() => {
    if (sequence.length > 0)
      setTotalETA(sequence.reduce((s, d) => s + (d._eta || 15) + 8, 0));
  }, [sequence]);

  // Confirm + book all tokens
  const confirmAndBook = async () => {
    setBooking(true);
    try {
      // Book one token per department (use first service of each dept)
      const toBook = sequence
        .filter(d => d._repSvcId)
        .map(d => ({ serviceId: d._repSvcId }));

      if (toBook.length === 0) {
        toast.error('No bookable services selected');
        setBooking(false);
        return;
      }

      const results = await visitPlanAPI.bookPlan(toBook);
      const successful = results.filter(r => r.success);
      const failed     = results.filter(r => !r.success);

      if (failed.length > 0)
        failed.forEach(f => toast.error(f.error || 'Booking failed for one service'));

      if (successful.length === 0) {
        setBooking(false);
        return;
      }

      // Build visit plan object and save to sessionStorage for tracking page
      const plan = {
        orgId,
        orgName: org.name,
        createdAt: new Date().toISOString(),
        items: sequence.map((dept, i) => {
          const result = results[i];
          return {
            deptId:   dept.id,
            deptName: dept.name,
            serviceId: dept._repSvcId,
            serviceName: dept.services?.[0]?.name || dept.name,
            token:    result?.success ? result.data?.token : null,
            tokenId:  result?.success ? result.data?.token?.id : null,
            eta:      dept._eta,
            status:   result?.success ? 'BOOKED' : 'FAILED',
          };
        }),
        totalETA,
      };

      sessionStorage.setItem('smartq_visit_plan', JSON.stringify(plan));
      toast.success(`${successful.length} token${successful.length > 1 ? 's' : ''} booked!`);
      navigate(`/hospital/visit-plan/tracking?orgId=${orgId}`);
    } catch (err) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading hospital services…" /></div>;
  if (!org) return null;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <Link to="/sectors" className="text-brand hover:text-brand-light">Sectors</Link>
          <ChevronRight size={10} />
          <Link to={`/services?orgId=${orgId}`} className="text-brand hover:text-brand-light">{org.shortName || org.name}</Link>
          <ChevronRight size={10} />
          <span className="text-brand font-medium">{step === 0 ? 'Plan Visit' : 'AI Sequence'}</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {step > 0 && (
            <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-navy-700">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Smart Visit Plan</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Select Services', 'AI Sequence', 'Book & Track'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                ${i < step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  i === step ? 'bg-brand/20 text-brand border border-brand/40' :
                               'bg-navy-800/60 text-slate-500 border border-surface-border'}`}>
                {i < step ? <CheckCircle size={11} /> : <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-current/20">{i+1}</span>}
                {label}
              </div>
              {i < 2 && <ChevronRight size={10} className="text-slate-700" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 0 && (
          <ServiceSelector
            org={org}
            canteenId={canteenId}
            selectedDepts={selectedDepts}
            onToggleDept={toggleDept}
            onNext={goToSequence}
            queueInfos={queueInfos}
          />
        )}
        {step === 1 && (
          <SequenceReview
            sequence={sequence}
            onReorder={setSequence}
            onConfirm={confirmAndBook}
            booking={booking}
            totalETA={totalETA}
          />
        )}
      </div>
    </div>
  );
}
