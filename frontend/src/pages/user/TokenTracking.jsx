import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Users, Activity, Zap, MapPin, Brain, RefreshCw, Volume2, ChevronRight } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge from '../../components/ui/CrowdBadge';
import { tokensAPI, queuesAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getSocket, joinQueue } from '../../services/socket';
import { addMinutes, crowdColor, crowdBg } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function TokenTracking() {
  const { tokenId } = useParams();
  const { t }       = useLanguage();
  const [token, setToken]       = useState(null);
  const [waitingAhead, setWaitingAhead] = useState(0);
  const [crowdLevel, setCrowdLevel]     = useState('MEDIUM');
  const [queueData, setQueueData]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const refreshRef = useRef(null);

  const fetchToken = async () => {
    try {
      const { data } = await tokensAPI.get(tokenId);
      setToken(data.token);
      setWaitingAhead(data.waitingAhead || 0);
      setCrowdLevel(data.crowdLevel || 'MEDIUM');

      const deptId = data.token.service?.departmentId;
      if (deptId) {
        const q = await queuesAPI.byDept(deptId).catch(() => null);
        if (q) setQueueData(q.data);
      }

      if (data.token.queueId) joinQueue(data.token.queueId);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchToken();
    const s = getSocket();
    s.on('etaUpdated', (d) => {
      setToken(p => p ? { ...p, estimatedWait: d.baseETA } : p);
      setCrowdLevel(d.crowdLevel || 'MEDIUM');
      toast('⚡ Queue updated — your estimated wait changed', { duration: 4000 });
    });
    s.on('queueUpdated', fetchToken);
    s.on('tokenCalled', (d) => {
      if (d.token?.userId === token?.userId) toast('🔔 Your turn! Please proceed to the counter.', { duration: 8000 });
    });
    refreshRef.current = setInterval(fetchToken, 30000);
    return () => { s.off('etaUpdated'); s.off('queueUpdated'); s.off('tokenCalled'); clearInterval(refreshRef.current); };
  }, [tokenId]);

  const speak = () => {
    if (!token) return;
    const msg = `Your token is ${token.tokenNumber}. ${waitingAhead} people ahead. Estimated wait ${token.estimatedWait} minutes.`;
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(msg));
  };

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;
  if (!token) return <div className="min-h-screen bg-navy-900"><Navbar /><p className="text-center text-slate-500 pt-20">Token not found</p></div>;

  const travelTime = 18;
  const eta = token.estimatedWait || 0;
  const departure = addMinutes(Math.max(0, eta - travelTime));
  const org = token.service?.department?.organization;

  const STATUS_LABELS = { WAITING: 'Waiting', SERVING: 'Now Serving', COMPLETED: 'Completed', NO_SHOW: 'No Show', CANCELLED: 'Cancelled' };
  const STATUS_COLORS = { WAITING: 'text-yellow-400', SERVING: 'text-blue-400 animate-pulse', COMPLETED: 'text-emerald-400', NO_SHOW: 'text-red-400', CANCELLED: 'text-slate-500' };

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        {/* Token hero */}
        <div className="card p-8 mb-6 text-center bg-gradient-to-br from-surface-card via-navy-700 to-navy-800 border-brand/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">{t('yourToken')}</span>
            <div className="flex items-center gap-2">
              <button onClick={speak} className="text-slate-500 hover:text-white p-1 transition-colors" title="Read aloud">
                <Volume2 size={16} />
              </button>
              <button onClick={fetchToken} className="text-slate-500 hover:text-white p-1 transition-colors">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <p className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric mb-2">
            {token.tokenNumber}
          </p>
          <p className={`text-sm font-semibold mb-4 ${STATUS_COLORS[token.status]}`}>{STATUS_LABELS[token.status]}</p>

          {token.status === 'SERVING' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
              <p className="text-blue-300 font-semibold">🎯 {t('yourTurnApproaching')}</p>
              {token.counter && <p className="text-xs text-slate-400 mt-1">Please proceed to {token.counter.name}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Users size={11} />{t('peopleAhead')}</p>
              <p className="text-3xl font-bold text-white">{waitingAhead}</p>
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Clock size={11} />{t('estimatedWait')}</p>
              <p className="text-3xl font-bold text-white">{eta}<span className="text-sm text-slate-500 ml-1">{t('min')}</span></p>
            </div>
            <div className={`rounded-xl p-3 ${crowdBg(crowdLevel)}`}>
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Activity size={11} />{t('crowdLevel')}</p>
              <CrowdBadge level={crowdLevel} />
            </div>
            <div className="bg-navy-800/60 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Zap size={11} />Depart by</p>
              <p className="text-lg font-bold text-emerald-400">{departure}</p>
            </div>
          </div>
        </div>

        {/* AI info */}
        <div className="card p-4 mb-4 flex items-start gap-3 border-brand/20 bg-brand/5">
          <Brain size={18} className="text-brand flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">{t('aiPrediction')}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Leave by <strong className="text-white">{departure}</strong> — travel {travelTime} min + queue {eta} min
            </p>
          </div>
        </div>

        {/* Service details */}
        <div className="card p-5 mb-4">
          <h3 className="section-title">Booking Details</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Service</span>
              <span className="text-white font-medium">{token.service?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Organization</span>
              <span className="text-white text-right max-w-[60%]">{org?.name}</span>
            </div>
            {token.counter && (
              <div className="flex justify-between">
                <span className="text-slate-500">Counter</span>
                <span className="text-white">{token.counter.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Visit Type</span>
              <span className="text-white">{token.isFollowUp ? 'Follow-up' : 'New Visit'}</span>
            </div>
          </div>
        </div>

        {/* Queue mini-view */}
        {queueData && (
          <div className="card p-5 mb-4">
            <h3 className="section-title">Queue Status</h3>
            <div className="space-y-2">
              {queueData.allServing?.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="text-sm font-bold text-blue-400 w-12">{t.tokenNumber}</span>
                  <span className="text-xs text-slate-400 flex-1">{t.service?.name}</span>
                  <span className="text-xs text-blue-400">Serving – {t.counter?.name}</span>
                </div>
              ))}
              {queueData.allWaiting?.slice(0, 5).map((tk, i) => (
                <div key={tk.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${tk.tokenNumber === token.tokenNumber ? 'bg-brand/10 border border-brand/30' : 'bg-navy-800/60'}`}>
                  <span className={`text-sm font-bold w-12 ${tk.tokenNumber === token.tokenNumber ? 'text-brand' : 'text-slate-300'}`}>{tk.tokenNumber}</span>
                  <span className="text-xs text-slate-400 flex-1">{tk.service?.name}</span>
                  <span className="text-xs text-slate-500">~{tk.estimatedWait} {t('min')}</span>
                  {tk.tokenNumber === token.tokenNumber && <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full font-bold">YOU</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {org && (
          <Link to={`/map/${org.id}`} className="btn-secondary w-full flex items-center justify-center gap-2">
            <MapPin size={16} /> {t('viewRoute')} — {org.name}
          </Link>
        )}
      </div>
    </div>
  );
}
