/**
 * CanteenHome — entry point when user selects College → Canteen
 * URL: /canteen?orgId=xxx
 * Shows canteen info, counters, current meal period, and CTA to browse menu.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  UtensilsCrossed, Clock, Users, Activity, ChevronRight,
  ArrowLeft, Coffee, Salad, Droplets, Zap, MapPin, Brain,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { canteenAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const PERIOD_LABELS = {
  MORNING:   { label: 'Morning Menu',   time: '7:00 AM – 11:00 AM',  icon: '🌅' },
  AFTERNOON: { label: 'Afternoon Menu', time: '11:00 AM – 3:30 PM', icon: '☀️' },
  EVENING:   { label: 'Evening Menu',   time: '3:30 PM – 6:30 PM',   icon: '🌤' },
  NIGHT:     { label: 'Night Menu',     time: '6:30 PM onwards',     icon: '🌙' },
};

const COUNTER_ICONS = { BEVERAGES: Coffee, MEALS: Salad, JUICE: Droplets };

export default function CanteenHome() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const { t }       = useLanguage();
  const orgId       = params.get('orgId');

  const [info, setInfo]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { navigate('/sectors'); return; }
    canteenAPI.getByOrg(orgId)
      .then(({ data }) => setInfo(data))
      .catch(() => toast.error('Canteen not found for this organization'))
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading canteen…" /></div>;
  if (!info) return (
    <div className="min-h-screen bg-navy-900"><Navbar />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <UtensilsCrossed size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg font-medium">No canteen found</p>
        <p className="text-slate-600 text-sm mt-1">This organization doesn't have a canteen registered yet.</p>
        <Link to="/sectors" className="btn-secondary mt-6 inline-flex items-center gap-2"><ArrowLeft size={15} /> Back</Link>
      </div>
    </div>
  );

  const { canteen, mealPeriod, activeOrders, crowdLevel } = info;
  const period = PERIOD_LABELS[mealPeriod] || PERIOD_LABELS.AFTERNOON;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Hero card */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-surface-card via-navy-700/60 to-navy-800 border-brand/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
                  <UtensilsCrossed size={20} className="text-orange-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{canteen.name}</h1>
                  <p className="text-xs text-slate-500">Smart Canteen — AI-Powered Queue</p>
                </div>
              </div>
            </div>
            <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${canteen.isOpen ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
              {canteen.isOpen ? 'OPEN' : 'CLOSED'}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-navy-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Active Orders</p>
              <p className="text-xl font-bold text-yellow-400">{activeOrders}</p>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Crowd</p>
              <div className="flex justify-center mt-0.5"><CrowdBadge level={crowdLevel} /></div>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Hours</p>
              <p className="text-xs font-semibold text-white">{canteen.openTime}–{canteen.closeTime}</p>
            </div>
          </div>

          {/* Current meal period */}
          <div className="flex items-center gap-3 p-3 bg-brand/10 border border-brand/20 rounded-xl mb-4">
            <span className="text-2xl">{period.icon}</span>
            <div>
              <p className="text-sm font-semibold text-brand">{period.label}</p>
              <p className="text-xs text-slate-400">{period.time}</p>
            </div>
            <div className="ml-auto">
              <Clock size={16} className="text-slate-500" />
            </div>
          </div>

          <Link to={`/canteen/menu?orgId=${orgId}&canteenId=${canteen.id}`}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <UtensilsCrossed size={16} /> Browse Menu & Order
          </Link>
        </div>

        {/* Counters */}
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Available Counters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {canteen.counters?.map(c => {
            const Icon = COUNTER_ICONS[c.type] || UtensilsCrossed;
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                      ${c.status === 'OPEN' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : c.status === 'PAUSED' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                        : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <Link to={`/canteen/menu?orgId=${orgId}&canteenId=${canteen.id}&counter=${c.id}`}
                  className="btn-secondary text-xs py-1.5 w-full flex items-center justify-center gap-1">
                  View Menu <ChevronRight size={12} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* AI info */}
        <div className="card p-4 border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">SmartQ AI Canteen</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Place your order remotely. AI estimates your food preparation time based on current queue load and counter workload.
          </p>
          <p className="text-[10px] text-slate-700 mt-2">AI recommends. Human decides.</p>
        </div>
      </div>
    </div>
  );
}
