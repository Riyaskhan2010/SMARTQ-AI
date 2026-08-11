import { useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { appointmentsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Appointments() {
  const { t }  = useLanguage();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsAPI.list().then(({ data }) => setAppts(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    await appointmentsAPI.cancel(id);
    setAppts(p => p.filter(a => a.id !== id));
    toast.success('Appointment cancelled');
  };

  const STATUS_COLORS = { BOOKED: 'text-brand', CONFIRMED: 'text-emerald-400', COMPLETED: 'text-slate-400', CANCELLED: 'text-red-400' };

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t('upcomingAppointments')}</h1>
        {loading ? <LoadingSpinner text={t('loading')} /> : appts.length === 0 ? (
          <EmptyState icon={Calendar} title={t('noAppointments')} description="Scheduled appointments will appear here." />
        ) : (
          <div className="space-y-3">
            {appts.map(a => (
              <div key={a.id} className="card p-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{a.service?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.service?.department?.organization?.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(a.scheduledDate)} · {a.scheduledTime}</p>
                  {a.isFollowUp && <span className="text-xs bg-electric/10 text-electric border border-electric/20 px-2 py-0.5 rounded-full">Follow-up</span>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-semibold ${STATUS_COLORS[a.status] || 'text-slate-400'}`}>{a.status}</span>
                  {a.status === 'BOOKED' && (
                    <button onClick={() => cancel(a.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
