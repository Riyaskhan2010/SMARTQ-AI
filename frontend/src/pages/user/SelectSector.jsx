import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Landmark, Banknote, Mail,
  ChevronRight, Search } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { sectorsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const ICONS = {
  hospital: Building2, college: GraduationCap,
  government: Landmark, bank: Banknote, post: Mail,
};
const COLORS = {
  hospital:   { bg:'bg-red-500/10',     border:'border-red-500/30',     icon:'text-red-400',     hover:'hover:border-red-500/60' },
  college:    { bg:'bg-blue-500/10',    border:'border-blue-500/30',    icon:'text-blue-400',    hover:'hover:border-blue-500/60' },
  government: { bg:'bg-amber-500/10',   border:'border-amber-500/30',   icon:'text-amber-400',   hover:'hover:border-amber-500/60' },
  bank:       { bg:'bg-emerald-500/10', border:'border-emerald-500/30', icon:'text-emerald-400', hover:'hover:border-emerald-500/60' },
  post:       { bg:'bg-cyan-500/10',    border:'border-cyan-500/30',    icon:'text-cyan-400',    hover:'hover:border-cyan-500/60' },
};

export default function SelectSector() {
  const { t }    = useLanguage();
  const navigate = useNavigate();
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    sectorsAPI.list().then(({ data }) => setSectors(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = sectors.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <span className="text-brand font-medium">1. Select Sector</span>
          <ChevronRight size={12} />
          <span>Select Organization</span>
          <ChevronRight size={12} />
          <span>Select Service</span>
          <ChevronRight size={12} />
          <span>Book Token</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{t('selectSector')}</h1>
        <p className="text-slate-500 text-sm mb-6">Choose the type of service you need</p>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search sectors…" />
        </div>

        {loading ? <LoadingSpinner text={t('loading')} /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(s => {
              const Icon  = ICONS[s.slug] || Landmark;
              const style = COLORS[s.slug] || COLORS.government;
              return (
                <button key={s.id}
                  onClick={() => navigate(`/organizations?sector=${s.slug}`)}
                  className={`card p-6 flex items-center gap-4 text-left ${style.border} ${style.hover} transition-all duration-200 hover:-translate-y-0.5 group`}>
                  <div className={`w-14 h-14 ${style.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={26} className={style.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-lg">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s._count?.organizations || 0} organizations</p>
                    {s.description && <p className="text-xs text-slate-600 mt-1 truncate">{s.description}</p>}
                    {/* Hint about canteen inside College and Hospital */}
                    {(s.slug === 'college' || s.slug === 'hospital') && (
                      <p className="text-xs text-orange-400/60 mt-1">Includes Canteen 🍽</p>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
