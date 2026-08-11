import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Users, Clock, Zap } from 'lucide-react';
import CrowdBadge from '../../components/ui/CrowdBadge';
import { queuesAPI } from '../../services/api';
import { getSocket, joinPublic } from '../../services/socket';

export default function PublicDisplay() {
  const { departmentId } = useParams();
  const [qd, setQd] = useState(null);
  const [time, setTime] = useState(new Date());

  const fetch = async () => {
    try {
      const { data } = await queuesAPI.publicView(departmentId);
      setQd(data);
    } catch {}
  };

  useEffect(() => {
    fetch();
    joinPublic(departmentId);
    const s = getSocket();
    s.on('displayUpdated', fetch);
    s.on('queueUpdated',   fetch);
    s.on('tokenCalled',    fetch);
    const tick = setInterval(() => setTime(new Date()), 1000);
    const refr = setInterval(fetch, 15000);
    return () => { s.off('displayUpdated'); s.off('queueUpdated'); s.off('tokenCalled'); clearInterval(tick); clearInterval(refr); };
  }, [departmentId]);

  const nowServing = qd?.serving?.[0];
  const nextTokens = qd?.next?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col" aria-live="polite">
      {/* Header */}
      <header className="bg-gradient-to-r from-navy-800 to-surface-card border-b border-surface-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-electric rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">SmartQ <span className="text-brand">AI</span></p>
            <p className="text-xs text-slate-500">Public Queue Display</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white tabular-nums">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-xs text-slate-500">{time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NOW SERVING */}
        <div className="lg:col-span-2 card p-8 flex flex-col items-center justify-center text-center min-h-64">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">NOW SERVING</p>
          {nowServing ? (
            <>
              <p className="text-[8rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric leading-none mb-4">
                {nowServing.tokenNumber}
              </p>
              <p className="text-2xl text-slate-300 font-medium mb-2">{nowServing.service?.name}</p>
              {nowServing.counter && (
                <div className="bg-brand/10 border border-brand/30 rounded-xl px-6 py-2 mt-2">
                  <p className="text-brand font-bold text-lg">{nowServing.counter.name}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <Activity size={64} className="text-slate-700 mx-auto mb-4" />
              <p className="text-2xl text-slate-600 font-medium">No active service</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-4">
          {/* Status */}
          <div className="card p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mb-1"><Users size={11} /> Waiting</p>
                <p className="text-3xl font-bold text-white">{qd?.waitingCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mb-1"><Clock size={11} /> Avg Wait</p>
                <p className="text-3xl font-bold text-white">{qd?.estimatedWait || '—'}<span className="text-sm text-slate-500 ml-1">min</span></p>
              </div>
              <div className="col-span-2 text-center">
                <p className="text-xs text-slate-500 mb-1">Crowd</p>
                {qd?.crowdLevel && <CrowdBadge level={qd.crowdLevel} />}
              </div>
            </div>
          </div>

          {/* NEXT UP */}
          <div className="card p-5 flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">NEXT UP</p>
            {nextTokens.length === 0 ? (
              <p className="text-slate-600 text-sm">No tokens waiting</p>
            ) : (
              <div className="space-y-2">
                {nextTokens.map((tk, i) => (
                  <div key={tk.id} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-brand/10 border border-brand/30' : 'bg-navy-800/60'}`}>
                    <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                    <span className={`text-xl font-extrabold ${i === 0 ? 'text-brand' : 'text-slate-300'}`}>{tk.tokenNumber}</span>
                    <span className="text-xs text-slate-500 truncate flex-1">{tk.service?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Counters */}
          {qd?.counters && (
            <div className="card p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">COUNTERS</p>
              <div className="grid grid-cols-3 gap-2">
                {qd.counters.map(c => (
                  <div key={c.id} className={`p-2 rounded-lg text-center ${c.status === 'OPEN' ? 'bg-emerald-500/10 border border-emerald-500/20' : c.status === 'PAUSED' ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-500/10 border border-slate-500/20'}`}>
                    <p className="text-xs font-bold text-white">C{c.number}</p>
                    <p className={`text-xs ${c.status === 'OPEN' ? 'text-emerald-400' : c.status === 'PAUSED' ? 'text-orange-400' : 'text-slate-600'}`}>{c.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-navy-800 px-8 py-2 text-center text-xs text-slate-600">
        SmartQ AI — Intelligent Queue Management — DEMO
      </footer>
    </div>
  );
}
