import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Clock, DollarSign, Activity, Users, UtensilsCrossed, Brain, Zap } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge from '../../components/ui/CrowdBadge';
import { orgsAPI, servicesAPI, canteenAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function SelectService() {
  const { t }    = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orgId    = params.get('orgId');
  const [org, setOrg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueInfos, setQueueInfos] = useState({});
  const [canteenId, setCanteenId]   = useState(null); // set if org has a canteen
  const [isHospital, setIsHospital] = useState(false);

  useEffect(() => {
    if (!orgId) { navigate('/sectors'); return; }
    orgsAPI.get(orgId)
      .then(({ data }) => {
        setOrg(data);
        // Detect hospital sector
        const sector = data.sector;
        setIsHospital(
          sector?.slug === 'hospital' ||
          sector?.name?.toLowerCase().includes('hospital')
        );
        // Check if this org has a canteen
        canteenAPI.getByOrg(orgId)
          .then(r => setCanteenId(r.data?.canteen?.id))
          .catch(() => {});
        // Fetch queue info for each non-canteen service
        const allServices = data.departments
          ?.filter(d => !d.name.toLowerCase().includes('canteen'))
          .flatMap(d => d.services || []) || [];
        Promise.all(allServices.map(s => servicesAPI.queueInfo(s.id).then(r => [s.id, r.data]).catch(() => [s.id, null])))
          .then(entries => setQueueInfos(Object.fromEntries(entries)));
      })
      .catch(() => navigate('/sectors'))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;
  if (!org) return null;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <Link to="/sectors" className="text-brand hover:text-brand-light">1. Sector</Link>
          <ChevronRight size={12} />
          <Link to="/organizations" className="text-brand hover:text-brand-light">2. Organization</Link>
          <ChevronRight size={12} />
          <span className="text-brand font-medium">3. Select Service</span>
          <ChevronRight size={12} />
          <span>4. Book</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
            <p className="text-slate-500 text-sm">{t('selectService')}</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* ── Hospital Smart Visit Plan banner ─────────────────── */}
          {isHospital && (
            <div className="card p-4 border-brand/30 bg-gradient-to-r from-brand/8 to-purple-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand/20 border border-brand/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-white">Plan Your Complete Hospital Visit</p>
                    <span className="text-[10px] bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full font-bold">AI</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">Select multiple services — Doctor, Lab, Pharmacy — and AI will plan the best sequence for you in one booking.</p>
                  <button
                    onClick={() => navigate(`/hospital/visit-plan?orgId=${orgId}`)}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                    <Zap size={13} /> Plan Visit with AI
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Canteen quick-access card — only shown if org has a canteen */}
          {canteenId && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Canteen</h2>
              <button
                onClick={() => navigate(`/canteen?orgId=${orgId}`)}
                className="card w-full p-4 flex items-center gap-4 text-left hover:border-orange-500/40 border-orange-500/20 bg-orange-500/5 transition-all hover:-translate-y-0.5 group">
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed size={18} className="text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white mb-1">Order Food Online</p>
                  <p className="text-xs text-slate-500">SmartQ Canteen — AI estimated pickup time · 3 Counters: Beverages, Meals & Fresh Juice</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] bg-brand/20 text-brand border border-brand/30 px-2 py-0.5 rounded-full font-bold">NEW</span>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </button>
            </div>
          )}

          {/* Standard service departments */}
          {org.departments
            ?.filter(dept => !dept.name.toLowerCase().includes('canteen'))
            .map(dept => (
            dept.services?.length > 0 && (
              <div key={dept.id}>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">{dept.name}</h2>
                <div className="space-y-2">
                  {dept.services.map(svc => {
                    const info = queueInfos[svc.id];
                    return (
                      <button key={svc.id}
                        onClick={() => navigate(`/book/${svc.id}`)}
                        className="card w-full p-4 flex items-center gap-4 text-left hover:border-brand/40 transition-all hover:-translate-y-0.5 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">{svc.name}</p>
                            {svc.fee && (
                              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <DollarSign size={10} /> ₹{svc.fee}
                              </span>
                            )}
                          </div>
                          {svc.description && <p className="text-xs text-slate-500 mb-2">{svc.description}</p>}
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1"><Clock size={10} /> ~{svc.avgServiceTime} min/person</span>
                            {info && <span className="flex items-center gap-1"><Users size={10} /> {info.waitingCount} waiting</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {info && <CrowdBadge level={info.crowdLevel} />}
                          {info && <span className="text-xs text-slate-500">~{info.estimatedWait} {t('min')} wait</span>}
                          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
