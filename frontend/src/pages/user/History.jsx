import { useEffect, useState } from 'react';
import { Activity, Clock } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { historyAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../utils/helpers';

export default function History() {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historyAPI.list().then(({ data }) => setHistory(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS = { COMPLETED: 'text-emerald-400', NO_SHOW: 'text-red-400', CANCELLED: 'text-slate-500' };

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t('visitHistory')}</h1>
        {loading ? <LoadingSpinner text={t('loading')} /> : history.length === 0 ? (
          <EmptyState icon={Activity} title={t('noHistory')} description="Your completed service visits will appear here." />
        ) : (
          <div className="space-y-3">
            {history.map((v, i) => (
              <div key={i} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-border/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity size={18} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{v.serviceName}</p>
                  <p className="text-xs text-slate-500 truncate">{v.organizationName}</p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> {formatDate(v.visitDate)}
                    {v.waitTime && ` · waited ${v.waitTime} min`}
                  </p>
                </div>
                <span className={`text-xs font-semibold ${STATUS_COLORS[v.status] || 'text-slate-400'}`}>{v.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
