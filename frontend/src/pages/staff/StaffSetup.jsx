/**
 * StaffSetup.jsx
 * Multi-step wizard: Sector → Organization → Department → Counter
 * After completion the selected context is saved to AuthContext and
 * the staff is redirected to the Counter Panel (/staff).
 */
import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  Building2, GraduationCap, Landmark, Banknote, Mail,
  ChevronRight, ArrowLeft, CheckCircle, Zap, MapPin,
  Layers, Hash, Users, UtensilsCrossed,
} from 'lucide-react';
import Navbar           from '../../components/layout/Navbar';
import LoadingSpinner   from '../../components/ui/LoadingSpinner';
import { sectorsAPI, orgsAPI, staffAPI, canteenAPI } from '../../services/api';
import { useAuth }      from '../../context/AuthContext';
import { useLanguage }  from '../../context/LanguageContext';
import toast            from 'react-hot-toast';

// ── Sector icon / style map ───────────────────────────────────────
const SECTOR_META = {
  hospital:   { icon: Building2,     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     desc: 'Manage patient queues and services' },
  college:    { icon: GraduationCap, color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    desc: 'Manage student services and admissions' },
  government: { icon: Landmark,      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   desc: 'Manage government office queues' },
  bank:       { icon: Banknote,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Manage banking service counters' },
  post:       { icon: Mail,          color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    desc: 'Manage postal service queues' },
};

function getSectorMeta(slug) {
  return SECTOR_META[slug] || SECTOR_META.government;
}

// ── Step indicator ────────────────────────────────────────────────
const STEPS = ['Sector', 'Organization', 'Department', 'Counter'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${done   ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                active ? 'bg-brand/20 text-brand border border-brand/40' :
                         'bg-navy-800/60 text-slate-500 border border-surface-border'}`}>
              {done
                ? <CheckCircle size={11} />
                : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${active ? 'bg-brand text-white' : 'bg-navy-700 text-slate-500'}`}>{i + 1}</span>}
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={12} className={done ? 'text-emerald-600' : 'text-slate-700'} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function StaffSetup() {
  const { saveStaffSetup } = useAuth();
  const { t }              = useLanguage();
  const navigate           = useNavigate();

  const [step, setStep]             = useState(0);   // 0=sector, 1=org, 2=dept, 3=counter
  const [sectors, setSectors]       = useState([]);
  const [orgs, setOrgs]             = useState([]);
  const [depts, setDepts]           = useState([]);
  const [counters, setCounters]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [assigning, setAssigning]   = useState(false);

  const [selected, setSelected] = useState({
    sector: null, organization: null, department: null, counter: null,
  });

  // Load sectors on mount
  useEffect(() => {
    setLoading(true);
    sectorsAPI.list()
      .then(({ data }) => setSectors(data))
      .catch(() => toast.error('Failed to load sectors'))
      .finally(() => setLoading(false));
  }, []);

  // ── Step handlers ──────────────────────────────────────────────

  const pickSector = async (sector) => {
    setSelected(p => ({ ...p, sector, organization: null, department: null, counter: null }));
    setLoading(true);
    try {
      const { data } = await orgsAPI.list({ sector: sector.slug });
      setOrgs(data);
      setStep(1);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  };

  const pickOrg = async (org) => {
    setSelected(p => ({ ...p, organization: org, department: null, counter: null }));
    setLoading(true);
    try {
      const { data } = await orgsAPI.get(org.id);
      setDepts(data.departments || []);
      setStep(2);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  const pickDept = async (dept) => {
    setSelected(p => ({ ...p, department: dept, counter: null }));
    // Canteen departments redirect to the canteen staff panel
    if (dept.name.toLowerCase().includes('canteen')) {
      setLoading(true);
      try {
        const { data } = await canteenAPI.getByOrg(selected.organization.id);
        if (!data?.canteen?.id) throw new Error('Canteen not found');
        navigate(`/canteen/staff?orgId=${data.canteen.id}`);
      } catch {
        toast.error('Canteen not configured for this organization');
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const { data } = await staffAPI.deptCounters(dept.id);
      setCounters(data);
      setStep(3);
    } catch { toast.error('Failed to load counters'); }
    finally { setLoading(false); }
  };

  const pickCounter = async (counter) => {
    setAssigning(true);
    try {
      await staffAPI.assignCounter({
        counterId:      counter.id,
        organizationId: selected.organization.id,
      });
      const setup = {
        sector:       selected.sector,
        organization: selected.organization,
        department:   selected.department,
        counter,
      };
      saveStaffSetup(setup);
      toast.success(`Counter assigned: ${counter.name}`);
      navigate('/staff');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to assign counter');
    } finally {
      setAssigning(false);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  // ── Render helpers ─────────────────────────────────────────────

  const PageHeader = ({ title, subtitle }) => (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {step > 0 && (
          <button onClick={goBack}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-navy-700">
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      <p className="text-slate-500 text-sm ml-9">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header card */}
        <div className="card p-5 mb-8 bg-gradient-to-r from-brand/10 to-electric/5 border-brand/20 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-brand to-electric rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Staff Setup</h2>
            <p className="text-sm text-slate-400">Where are you working today? Select your sector and counter.</p>
          </div>
        </div>

        <StepBar current={step} />

        {loading && <LoadingSpinner text="Loading…" />}

        {/* ── Step 0: Sector ────────────────────────────────────── */}
        {!loading && step === 0 && (
          <>
            <PageHeader title="Select Sector" subtitle="Choose the type of service you are managing today." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sectors.map(sector => {
                const meta = getSectorMeta(sector.slug);
                const Icon = meta.icon;
                return (
                  <button key={sector.id} onClick={() => pickSector(sector)}
                    className={`card p-6 flex items-start gap-4 text-left hover:-translate-y-0.5 transition-all duration-200 ${meta.border} hover:border-opacity-70 group`}>
                    <div className={`w-14 h-14 ${meta.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon size={26} className={meta.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-white">{sector.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                      <p className="text-xs text-slate-600 mt-1.5">{sector._count?.organizations || 0} organizations</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors mt-1 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 1: Organization ──────────────────────────────── */}
        {!loading && step === 1 && (
          <>
            <PageHeader
              title={`Select ${selected.sector?.name}`}
              subtitle="Choose the organization you are working at today." />
            {orgs.length === 0
              ? <p className="text-slate-500 text-center py-12">No organizations found for this sector.</p>
              : (
                <div className="space-y-3">
                  {orgs.map(org => (
                    <button key={org.id} onClick={() => pickOrg(org)}
                      className="card w-full p-5 flex items-center gap-4 text-left hover:border-brand/40 transition-all hover:-translate-y-0.5 group">
                      <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-extrabold text-brand">
                          {(org.shortName || org.name).charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{org.name}</p>
                          {org.isDemo && (
                            <span className="text-xs bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full">DEMO</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                          <MapPin size={10} /> {org.address}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
          </>
        )}

        {/* ── Step 2: Department ────────────────────────────────── */}
        {!loading && step === 2 && (
          <>
            <PageHeader
              title="Select Department / Service"
              subtitle={`Choose the department you are managing at ${selected.organization?.name}.`} />
            {depts.filter(d => d.isActive !== false).length === 0
              ? <p className="text-slate-500 text-center py-12">No departments found.</p>
              : (
                <div className="space-y-3">
                  {depts.filter(d => d.isActive !== false).map(dept => {
                    const isCanteen = dept.name.toLowerCase().includes('canteen');
                    return (
                    <button key={dept.id} onClick={() => pickDept(dept)}
                      className={`card w-full p-5 flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 group ${isCanteen ? 'hover:border-orange-500/40 border-orange-500/20 bg-orange-500/5' : 'hover:border-brand/40'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCanteen ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-electric/10'}`}>
                        {isCanteen
                          ? <UtensilsCrossed size={18} className="text-orange-400" />
                          : <Layers size={18} className="text-electric" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">{dept.name}</p>
                        {dept.description && <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>}
                        {isCanteen
                          ? <p className="text-xs text-orange-400/70 mt-1">3 Counters: Beverages · Meals · Fresh Juice</p>
                          : dept.services?.length > 0 && (
                              <p className="text-xs text-slate-600 mt-1">{dept.services.length} service{dept.services.length !== 1 ? 's' : ''}</p>
                            )}
                      </div>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </button>
                    );
                  })}
                </div>
              )}
          </>
        )}

        {/* ── Step 3: Counter ───────────────────────────────────── */}
        {!loading && step === 3 && (
          <>
            <PageHeader
              title="Select Counter"
              subtitle={`Choose the counter you will be operating at ${selected.department?.name}.`} />

            {/* Context breadcrumb */}
            <div className="card p-4 mb-6 bg-brand/5 border-brand/20">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Your assignment</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-brand font-medium">{selected.sector?.name}</span>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="text-slate-300">{selected.organization?.name}</span>
                <ChevronRight size={12} className="text-slate-600" />
                <span className="text-slate-300">{selected.department?.name}</span>
              </div>
            </div>

            {counters.length === 0
              ? <p className="text-slate-500 text-center py-12">No counters found for this department.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {counters.map(counter => {
                    const occupied = counter.staff?.some(s => s.userId !== undefined);
                    const statusStyle = {
                      OPEN:   'border-emerald-500/40 bg-emerald-500/5',
                      CLOSED: 'border-slate-500/30 bg-slate-500/5',
                      PAUSED: 'border-orange-500/40 bg-orange-500/5',
                    }[counter.status] || 'border-surface-border';

                    return (
                      <button key={counter.id} onClick={() => pickCounter(counter)} disabled={assigning}
                        className={`card p-5 flex flex-col gap-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand/50 ${statusStyle} group`}>
                        <div className="flex items-center justify-between">
                          <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                            <Hash size={22} className="text-brand" />
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border
                            ${counter.status === 'OPEN'   ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                              counter.status === 'PAUSED' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
                                                            'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
                            {counter.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white">{counter.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{selected.department?.name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Users size={10} /> Counter #{counter.number}
                          </span>
                          <span className="text-xs text-brand group-hover:text-brand-light font-medium flex items-center gap-1">
                            Select <ChevronRight size={12} />
                          </span>
                        </div>
                        {assigning && (
                          <div className="w-full h-0.5 bg-brand/30 rounded animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
