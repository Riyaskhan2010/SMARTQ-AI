/**
 * CanteenAdmin — admin monitoring, menu management, analytics
 * URL: /admin/canteen?orgId=xxx (college organization ID)
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowLeft, RefreshCw, Brain, Coffee, Salad,
  CheckCircle, XCircle, AlertTriangle, Clock,
  BarChart2, TrendingUp,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { canteenAPI, orgsAPI } from '../../services/api';
import { formatTime }   from '../../utils/helpers';
import toast from 'react-hot-toast';

const TOOLTIP_STYLE = { backgroundColor:'#1f2d4a', border:'1px solid #2a3d6b', borderRadius:8, color:'#fff', fontSize:11 };
const PIE_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899'];

const AVAIL_OPTS = ['AVAILABLE', 'SOLD_OUT', 'UNAVAILABLE'];
const AVAIL_COLOR = { AVAILABLE:'text-emerald-400', SOLD_OUT:'text-red-400', UNAVAILABLE:'text-slate-500' };

export default function CanteenAdmin() {
  const [params]    = useSearchParams();
  const orgId       = params.get('orgId');

  const [canteenOrg, setCanteenOrg]   = useState(null);
  const [dashboard, setDashboard]     = useState(null);
  const [analytics, setAnalytics]     = useState(null);
  const [menu, setMenu]               = useState([]);
  const [counters, setCounters]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('overview');

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    try {
      // Auto-resolve: find the first college org that has a canteen
      let resolvedOrgId = orgId;
      if (orgId === 'auto') {
        const { orgsAPI: oAPI } = await import('../../services/api');
        const { data: colleges } = await oAPI.list({ sector: 'college' });
        for (const college of colleges) {
          try {
            const res = await canteenAPI.getByOrg(college.id);
            if (res.data?.canteen) { resolvedOrgId = college.id; break; }
          } catch {}
        }
      }
      const infoRes = await canteenAPI.getByOrg(resolvedOrgId);
      const co = infoRes.data.canteen;
      setCanteenOrg(co);
      setCounters(co.counters || []);

      const [dashRes, menuRes, analyticsRes] = await Promise.all([
        canteenAPI.adminDashboard(co.id),
        canteenAPI.getMenu(co.id),
        canteenAPI.adminAnalytics(co.id),
      ]);
      setDashboard(dashRes.data);
      setMenu(menuRes.data.items || []);
      setAnalytics(analyticsRes.data);
    } catch (e) { toast.error('Failed to load canteen admin data'); }
    finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleItem = async (itemId, current) => {
    const next = current === 'AVAILABLE' ? 'SOLD_OUT' : 'AVAILABLE';
    try {
      await canteenAPI.toggleItem(itemId, next);
      setMenu(prev => prev.map(i => i.id === itemId ? { ...i, availability: next } : i));
      toast.success(next === 'SOLD_OUT' ? 'Marked as Sold Out' : 'Marked as Available');
    } catch { toast.error('Failed to update item'); }
  };

  const toggleCounter = async (counterId, current) => {
    const next = current === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await canteenAPI.toggleCounter(counterId, next);
      setCounters(prev => prev.map(c => c.id === counterId ? { ...c, status: next } : c));
      toast.success(`Counter ${next.toLowerCase()}`);
    } catch { toast.error('Failed to update counter'); }
  };

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading canteen admin…" /></div>;

  const TABS = ['overview', 'orders', 'menu', 'analytics'];

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Canteen Dashboard</h1>
              <p className="text-slate-500 text-sm">{canteenOrg?.name}</p>
            </div>
          </div>
          <button onClick={fetchAll} className="flex items-center gap-1.5 text-slate-400 hover:text-white btn-secondary py-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 border-b border-surface-border pb-2 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium px-4 py-2 rounded-lg capitalize transition-all whitespace-nowrap
                ${activeTab === tab ? 'bg-brand/10 text-brand border border-brand/30' : 'text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {activeTab === 'overview' && dashboard && (
          <div>
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Orders', value: dashboard.summary.total,     color: 'text-blue-400'    },
                { label: 'Active',       value: dashboard.summary.active,    color: 'text-yellow-400'  },
                { label: 'Completed',    value: dashboard.summary.completed, color: 'text-emerald-400' },
                { label: 'Cancelled',    value: dashboard.summary.cancelled, color: 'text-red-400'     },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* AI + counters row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* AI insight */}
              <div className="card p-5 border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={15} className="text-purple-400" />
                  <h2 className="text-sm font-bold text-purple-300">AI Recommendation</h2>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div><p className="text-[10px] text-slate-500 mb-0.5">Crowd</p><CrowdBadge level={dashboard.summary.crowdLevel} /></div>
                  <div><p className="text-[10px] text-slate-500 mb-0.5">Est. Prep</p><p className="text-sm font-bold text-white">{dashboard.summary.aiETA} min</p></div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-navy-800/60 rounded-lg p-2.5">
                  💡 {dashboard.recommendation}
                </p>
                <p className="text-[9px] text-slate-700 mt-2">AI recommends. Human decides.</p>
              </div>

              {/* Counter status */}
              <div className="card p-5">
                <h2 className="section-title">Counter Status</h2>
                <div className="space-y-2">
                  {(dashboard.counters || counters).map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                          ${c.status === 'OPEN' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
                          {c.status}
                        </span>
                      </div>
                      <button onClick={() => toggleCounter(c.id, c.status)}
                        className={`text-xs btn-secondary py-1.5 px-3 ${c.status === 'OPEN' ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {c.status === 'OPEN' ? 'Close' : 'Open'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="card p-5">
              <h2 className="section-title">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 uppercase border-b border-surface-border">
                    <th className="pb-2">Order</th><th className="pb-2">Customer</th>
                    <th className="pb-2 hidden sm:table-cell">Items</th>
                    <th className="pb-2">Total</th><th className="pb-2">Status</th>
                    <th className="pb-2">Time</th>
                  </tr></thead>
                  <tbody className="divide-y divide-surface-border/40">
                    {(dashboard.recent || []).slice(0,12).map(o => (
                      <tr key={o.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-white">{o.orderNumber}</td>
                        <td className="py-2.5 text-slate-300">{o.guestName || '—'}</td>
                        <td className="py-2.5 text-slate-400 hidden sm:table-cell text-xs truncate max-w-[140px]">
                          {o.items?.map(i => `${i.name}×${i.quantity}`).join(', ')}
                        </td>
                        <td className="py-2.5 text-slate-300">₹{o.totalAmount}</td>
                        <td className="py-2.5">
                          <span className={`text-xs font-semibold ${
                            o.status === 'READY' || o.status === 'COLLECTED' ? 'text-emerald-400' :
                            o.status === 'PREPARING' ? 'text-yellow-400' :
                            o.status === 'CANCELLED' ? 'text-red-400' : 'text-blue-400'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500 text-xs">{formatTime(o.placedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MENU MANAGEMENT ──────────────────────────────────── */}
        {activeTab === 'menu' && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Menu Management</h2>
              <p className="text-xs text-slate-500">Toggle item availability</p>
            </div>
            <div className="space-y-2">
              {menu.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-navy-800/60 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                      <span>₹{item.price}</span>
                      <span>~{item.avgPrepTime}m</span>
                      <span className="text-brand/60">{item.mealPeriod}</span>
                    </div>
                  </div>
                  <select
                    value={item.availability}
                    onChange={e => toggleItem(item.id, item.availability)}
                    className="text-xs bg-navy-800 border border-surface-border rounded-lg px-2 py-1.5 cursor-pointer"
                    style={{ color: item.availability === 'AVAILABLE' ? '#34d399' : item.availability === 'SOLD_OUT' ? '#f87171' : '#94a3b8' }}>
                    {AVAIL_OPTS.map(o => <option key={o} value={o}>{o.replace('_',' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ────────────────────────────────────────── */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="card p-5">
                <h2 className="section-title">Orders by Hour (Today)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3d6b" />
                    <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={h => `${h}:00`} />
                    <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={h => `${h}:00`} />
                    <Bar dataKey="count" fill="#f97316" radius={[4,4,0,0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-5">
                <h2 className="section-title">Popular Items (Today)</h2>
                {analytics.popular?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics.popular} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {analytics.popular.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-slate-600 text-sm py-8 text-center">No order data yet today</p>}
              </div>
            </div>
            <div className="card p-5">
              <h2 className="section-title">Today's Summary</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label:'Total Orders', value: analytics.totalOrders,  color:'text-blue-400' },
                  { label:'Peak Hour',    value: analytics.hourly?.reduce((a,b)=>b.count>a.count?b:a, {hour:'-',count:0})?.hour+'h', color:'text-orange-400' },
                  { label:'Top Item',     value: analytics.popular?.[0]?.name?.split(' ')[0] || '—', color:'text-brand' },
                ].map(s => (
                  <div key={s.label} className="bg-navy-800/60 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ───────────────────────────────────────── */}
        {activeTab === 'orders' && dashboard && (
          <div className="card p-5">
            <h2 className="section-title">All Orders</h2>
            <div className="space-y-3">
              {(dashboard.recent || []).map(o => (
                <div key={o.id} className="p-4 bg-navy-800/60 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-extrabold text-white">{o.orderNumber}</span>
                      <span className={`text-xs font-bold ${
                        o.status === 'READY' || o.status === 'COLLECTED' ? 'text-emerald-400' :
                        o.status === 'PREPARING' ? 'text-yellow-400' :
                        o.status === 'CANCELLED' ? 'text-red-400' : 'text-blue-400'}`}>
                        {o.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{formatTime(o.placedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-300">{o.guestName}</p>
                  <div className="text-xs text-slate-500 mt-1">
                    {o.items?.map(i => `${i.name} ×${i.quantity}`).join(' · ')} · ₹{o.totalAmount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
