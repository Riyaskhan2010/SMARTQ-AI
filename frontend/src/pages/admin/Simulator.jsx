import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, Plus, Minus, TrendingUp, TrendingDown, Minus as MinusIcon, Brain, RefreshCw } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge from '../../components/ui/CrowdBadge';
import { simulationAPI, adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

export default function Simulator() {
  const { t }    = useLanguage();
  const [queues, setQueues]       = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('');
  const [params, setParams]       = useState({ deltaCounters: 0, deltaArrivalRate: 0, deltaServiceTime: 0 });
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(true);

  useEffect(() => {
    adminAPI.dashboard().then(({ data }) => {
      setQueues(data.queues || []);
      if (data.queues?.length) setSelectedQueue(data.queues[0].id);
    }).finally(() => setFetching(false));
  }, []);

  const run = async () => {
    if (!selectedQueue) { toast.error('Select a queue first'); return; }
    setLoading(true);
    try {
      const { data } = await simulationAPI.run({ queueId: selectedQueue, ...params });
      setResult(data);
    } catch (e) { toast.error(e.response?.data?.error || 'Simulation failed'); }
    finally { setLoading(false); }
  };

  const Counter = ({ label, k, step = 1, min = -5, max = 10 }) => (
    <div className="flex items-center justify-between p-4 bg-navy-800/60 rounded-xl">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => setParams(p => ({ ...p, [k]: Math.max(min, p[k] - step) }))}
          className="w-8 h-8 bg-surface-card border border-surface-border rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-brand/40 transition-all">
          <Minus size={14} />
        </button>
        <span className="text-lg font-bold text-white w-10 text-center">{params[k] >= 0 ? `+${params[k]}` : params[k]}</span>
        <button onClick={() => setParams(p => ({ ...p, [k]: Math.min(max, p[k] + step) }))}
          className="w-8 h-8 bg-surface-card border border-surface-border rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-brand/40 transition-all">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/admin" className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitBranch size={22} className="text-brand" /> Queue Simulator
            </h1>
            <p className="text-slate-500 text-sm">What-if analysis — AI recommends, human decides</p>
          </div>
        </div>

        <div className="mt-6 bg-brand/5 border border-brand/20 rounded-xl p-3 mb-6 flex items-start gap-2">
          <Brain size={15} className="text-brand mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">Adjust parameters below to simulate different scenarios. The AI will predict the impact on queue wait times and crowd levels.</p>
        </div>

        {/* Queue selector */}
        {fetching ? <LoadingSpinner /> : (
          <div className="card p-5 mb-5">
            <h2 className="section-title">Select Queue</h2>
            <select value={selectedQueue} onChange={e => setSelectedQueue(e.target.value)}
              className="input">
              {queues.map(q => <option key={q.id} value={q.id}>{q.id.slice(0, 8)}… (Dept: {q.departmentId?.slice(0, 8)})</option>)}
            </select>
          </div>
        )}

        {/* Controls */}
        <div className="card p-5 mb-5">
          <h2 className="section-title">Simulation Parameters</h2>
          <div className="space-y-3">
            <Counter label="Counter Change" k="deltaCounters" min={-5} max={10} />
            <Counter label="Arrival Rate Change (%)" k="deltaArrivalRate" step={10} min={-50} max={100} />
            <Counter label="Service Time Change (min)" k="deltaServiceTime" step={1} min={-5} max={20} />          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { label: '+1 Counter', delta: { deltaCounters: 1, deltaArrivalRate: 0, deltaServiceTime: 0 } },
              { label: '+2 Counters', delta: { deltaCounters: 2, deltaArrivalRate: 0, deltaServiceTime: 0 } },
              { label: 'Lunch rush +30%', delta: { deltaCounters: 0, deltaArrivalRate: 30, deltaServiceTime: 0 } },
              { label: 'Slower service +3min', delta: { deltaCounters: 0, deltaArrivalRate: 0, deltaServiceTime: 3 } },
            ].map(p => (
              <button key={p.label} onClick={() => setParams(p.delta)}
                className="text-xs bg-surface-card border border-surface-border rounded-lg px-3 py-1.5 text-slate-400 hover:text-white hover:border-brand/40 transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={run} disabled={loading || !selectedQueue}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-6">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={16} /> Run Simulation</>}
        </button>

        {/* Results */}
        {result && (
          <div className="card p-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Brain size={18} className="text-brand" /> Simulation Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-navy-800/60 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Current ETA</p>
                <p className="text-4xl font-extrabold text-white">{result.current.eta}</p>
                <p className="text-xs text-slate-500">{t('min')}</p>
                <div className="mt-2"><CrowdBadge level={result.current.crowdLevel} /></div>
                <p className="text-xs text-slate-600 mt-1">{result.current.activeCounters} counters active</p>
              </div>
              <div className="bg-navy-800/60 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-1">Predicted ETA</p>
                <p className={`text-4xl font-extrabold ${result.simulated.eta < result.current.eta ? 'text-emerald-400' : result.simulated.eta > result.current.eta ? 'text-red-400' : 'text-white'}`}>
                  {result.simulated.eta}
                </p>
                <p className="text-xs text-slate-500">{t('min')}</p>
                <div className="mt-2"><CrowdBadge level={result.simulated.crowdLevel} /></div>
                <p className="text-xs text-slate-600 mt-1">{result.simulated.activeCounters} counters active</p>
              </div>
            </div>

            {/* Improvement banner */}
            <div className={`rounded-xl p-4 flex items-center gap-3 mb-4 ${result.improvement > 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : result.improvement < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-500/10 border border-slate-500/20'}`}>
              {result.improvement > 0 ? <TrendingUp size={20} className="text-emerald-400 flex-shrink-0" />
                : result.improvement < 0 ? <TrendingDown size={20} className="text-red-400 flex-shrink-0" />
                : <MinusIcon size={20} className="text-slate-400 flex-shrink-0" />}
              <div>
                <p className={`text-sm font-semibold ${result.improvement > 0 ? 'text-emerald-400' : result.improvement < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {result.improvement > 0 ? `Save ${result.improvement} minutes` : result.improvement < 0 ? `Add ${Math.abs(result.improvement)} minutes` : 'No change'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{result.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
