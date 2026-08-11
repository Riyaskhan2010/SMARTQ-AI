/**
 * CanteenStaff — staff operations panel for canteen orders
 * URL: /canteen/staff?orgId=xxx (canteen org ID, not college org ID)
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle, Clock, RefreshCw, ChevronRight,
  Coffee, Salad, Brain, Zap, AlertTriangle, ArrowLeft,
  Play, Package,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { canteenAPI } from '../../services/api';
import { formatTime }  from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_NEXT = { PLACED: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'COLLECTED' };
const STATUS_LABELS = { PLACED:'Placed', CONFIRMED:'Confirmed', PREPARING:'Preparing', READY:'Ready', COLLECTED:'Collected', CANCELLED:'Cancelled' };
const STATUS_COLOR  = { PLACED:'text-blue-400', CONFIRMED:'text-brand', PREPARING:'text-yellow-400', READY:'text-emerald-400', COLLECTED:'text-slate-500', CANCELLED:'text-red-400' };

function OrderCard({ order, onAdvance, onCancel, loading }) {
  const nextStatus = STATUS_NEXT[order.status];
  const advanceLabels = { CONFIRMED: 'Start Preparing', PREPARING: 'Mark Ready', READY: 'Mark Collected' };

  return (
    <div className={`card p-4 ${order.status === 'PREPARING' ? 'border-yellow-500/30 bg-yellow-500/5' : order.status === 'READY' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-2xl font-extrabold text-white">{order.orderNumber}</p>
          <p className="text-sm text-slate-300">{order.guestName || 'Guest'}</p>
          <p className="text-xs text-slate-500">{order.placedAt ? formatTime(order.placedAt) : '—'}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLOR[order.status]} bg-navy-800 border-surface-border`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items?.map(item => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-300">{item.name} × {item.quantity}</span>
            <span className="text-slate-500">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      <p className="text-xs font-bold text-white mb-3">Total: ₹{order.totalAmount}</p>

      {/* Actions */}
      <div className="flex gap-2">
        {nextStatus && nextStatus !== 'COLLECTED' && (
          <button onClick={() => onAdvance(order.id, nextStatus)} disabled={loading}
            className="flex-1 btn-success text-xs py-2 flex items-center justify-center gap-1.5">
            {loading ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={12} />}
            {advanceLabels[nextStatus] || 'Advance'}
          </button>
        )}
        {nextStatus === 'COLLECTED' && (
          <button onClick={() => onAdvance(order.id, 'COLLECTED')} disabled={loading}
            className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
            <CheckCircle size={12} /> Mark Collected
          </button>
        )}
        {['PLACED', 'CONFIRMED'].includes(order.status) && (
          <button onClick={() => onCancel(order.id)} disabled={loading}
            className="btn-danger text-xs py-2 px-3">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function CanteenStaff() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const canteenOrgId = params.get('orgId');

  const [counters, setCounters]       = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [queueData, setQueueData]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [actionLoad, setActionLoad]   = useState('');
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (!canteenOrgId) { navigate('/staff/setup'); return; }
    canteenAPI.getCounters(canteenOrgId)
      .then(({ data }) => setCounters(data))
      .catch(() => toast.error('Failed to load counters'))
      .finally(() => setInitLoading(false));
  }, [canteenOrgId]);

  const fetchQueue = useCallback(async () => {
    if (!selectedCounter) return;
    setLoading(true);
    try {
      const { data } = await canteenAPI.staffQueue(canteenOrgId, selectedCounter.id);
      setQueueData(data);
    } catch (e) { toast.error('Failed to load queue'); }
    finally { setLoading(false); }
  }, [canteenOrgId, selectedCounter]);

  useEffect(() => {
    if (selectedCounter) fetchQueue();
    const interval = selectedCounter ? setInterval(fetchQueue, 15000) : null;
    return () => { if (interval) clearInterval(interval); };
  }, [selectedCounter, fetchQueue]);

  const advance = async (orderId, status) => {
    setActionLoad(orderId);
    try {
      await canteenAPI.updateStatus(orderId, status);
      toast.success(`Order ${status === 'READY' ? 'marked ready' : status.toLowerCase()}`);
      fetchQueue();
    } catch (e) { toast.error('Action failed'); }
    finally { setActionLoad(''); }
  };

  const cancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    advance(orderId, 'CANCELLED');
  };

  if (initLoading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading canteen…" /></div>;

  const CounterIcon = ({ type }) => type === 'BEVERAGES' ? <Coffee size={16} /> : <Salad size={16} />;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Counter selection */}
        {!selectedCounter ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <Link to="/staff/setup" className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Link>
              <div>
                <h1 className="text-xl font-bold text-white">Select Counter</h1>
                <p className="text-slate-500 text-sm">Choose your service counter to begin</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {counters.map(c => (
                <button key={c.id} onClick={() => setSelectedCounter(c)}
                  className="card p-6 text-left hover:border-brand/40 hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400">
                      <CounterIcon type={c.type} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                        ${c.status === 'OPEN' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-500 bg-slate-500/10 border-slate-500/20'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    {c.type === 'BEVERAGES' ? 'Tea, Coffee, Snacks & Beverages' : 'Meals, Biryani & Main Food'}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-brand text-xs font-medium">
                    Select Counter <ChevronRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Active counter header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedCounter(null); setQueueData(null); }}
                  className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Canteen Staff</p>
                  <h1 className="text-xl font-bold text-white">{selectedCounter.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {queueData?.crowdLevel && <CrowdBadge level={queueData.crowdLevel} />}
                <button onClick={fetchQueue} className="text-slate-500 hover:text-white p-2 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* AI insight */}
            {queueData && (
              <div className="card p-4 mb-5 border-purple-500/20 bg-purple-500/5 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-purple-400" />
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">AI Queue Insight</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">Active: <strong className="text-white">{queueData.activeOrders}</strong></span>
                  <span className="text-slate-400">Est. Prep: <strong className="text-yellow-400">{queueData.aiETA} min</strong></span>
                </div>
                <p className="text-[10px] text-slate-700 ml-auto">AI recommends. Human decides.</p>
              </div>
            )}

            {loading && !queueData ? (
              <LoadingSpinner text="Loading orders…" />
            ) : (
              <div>
                {/* Serving (PREPARING) */}
                {queueData?.serving && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" /> Now Preparing
                    </p>
                    <OrderCard order={queueData.serving} onAdvance={advance} onCancel={cancel} loading={actionLoad === queueData.serving.id} />
                  </div>
                )}

                {/* Waiting queue */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waiting Orders</p>
                    <span className="text-xs text-slate-500">{queueData?.waiting?.length || 0} in queue</span>
                  </div>
                  {!queueData?.waiting?.length ? (
                    <div className="text-center py-12">
                      <Package size={36} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No waiting orders</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {queueData.waiting.map(order => (
                        <OrderCard key={order.id} order={order} onAdvance={advance} onCancel={cancel} loading={actionLoad === order.id} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
