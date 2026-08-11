import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const TOOLTIP_STYLE = { backgroundColor: '#1f2d4a', border: '1px solid #2a3d6b', borderRadius: 8, color: '#fff', fontSize: 12 };

export default function Analytics() {
  const { t }    = useLanguage();
  const [data, setData]     = useState(null);
  const [range, setRange]   = useState('7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.analytics(range).then(({ data: d }) => setData(d)).finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;

  const { summary, daily, peakHours, services } = data || {};

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('analytics')}</h1>
              <p className="text-slate-500 text-sm">Queue performance insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['1', '7', '30'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r ? 'bg-brand text-white' : 'text-slate-400 hover:text-white bg-surface-card border border-surface-border'}`}>
                {r === '1' ? 'Today' : r === '7' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tokens', value: summary?.totalTokens || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: summary?.totalCompleted || 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Avg Wait', value: `${summary?.overallAvgWait || 0} min`, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'No-show Rate', value: `${summary?.noShowRate || 0}%`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500">{label}</p>
                <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}><Icon size={14} className={color} /></div>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily volume */}
          <div className="card p-5">
            <h2 className="section-title">Daily Token Volume</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3d6b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Average wait trend */}
          <div className="card p-5">
            <h2 className="section-title">Average Wait Time (min)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3d6b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="avgWait" stroke="#06b6d4" strokeWidth={2} dot={false} name="Avg Wait" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Peak hours */}
          <div className="card p-5">
            <h2 className="section-title">Peak Hours</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3d6b" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={h => `${h}:00`} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={h => `${h}:00`} />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Service breakdown */}
          <div className="card p-5">
            <h2 className="section-title">Service Breakdown</h2>
            {services?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={services} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {services.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-600 text-sm py-8 text-center">No data for this range</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
