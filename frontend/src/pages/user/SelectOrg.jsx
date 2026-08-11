import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Users, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { orgsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function SelectOrg() {
  const { t }      = useLanguage();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const sector     = params.get('sector') || '';
  const isCanteen  = params.get('canteen') === '1';
  const [orgs, setOrgs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    orgsAPI.list({ sector }).then(({ data }) => setOrgs(data)).catch(() => {}).finally(() => setLoading(false));
  }, [sector]);

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-600 mb-6">
          <Link to="/sectors" className="text-brand hover:text-brand-light">1. Sector</Link>
          <ChevronRight size={12} />
          <span className="text-brand font-medium">2. Select Organization</span>
          <ChevronRight size={12} />
          <span>3. Service</span>
          <ChevronRight size={12} />
          <span>4. Book</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/sectors')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">{t('selectOrganization')}</h1>
        </div>
        <p className="text-slate-500 text-sm mb-6 ml-8">All organizations near Chennai</p>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" placeholder="Search organizations…" />
        </div>

        {loading ? <LoadingSpinner text={t('loading')} /> : (
          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-slate-600 text-center py-8">No organizations found</p>}
            {filtered.map(org => (
              <button key={org.id}
                onClick={() => navigate(isCanteen ? `/canteen?orgId=${org.id}` : `/services?orgId=${org.id}`)}
                className="card w-full p-5 flex items-start gap-4 text-left hover:border-brand/40 transition-all hover:-translate-y-0.5 group">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-brand">
                  {org.shortName?.charAt(0) || org.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{org.name}</p>
                  {org.isDemo && <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full font-medium">DEMO</span>}
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {org.address}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {org.phone && <span className="text-xs text-slate-600 flex items-center gap-1"><Phone size={10} /> {org.phone}</span>}
                    <span className="text-xs text-slate-600 flex items-center gap-1"><Clock size={10} /> {org.openTime} – {org.closeTime}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
