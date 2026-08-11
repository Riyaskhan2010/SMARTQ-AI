/**
 * CanteenOrder — real-time order tracking page
 * URL: /canteen/order/:orderId
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle, Clock, Brain, Zap, MapPin, RefreshCw,
  UtensilsCrossed, Coffee, ChevronRight, Package,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { canteenAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime }  from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_META = {
  PLACED:     { label: 'Order Placed',      color: 'text-blue-400',     bg: 'bg-blue-500/10',     step: 0 },
  CONFIRMED:  { label: 'Confirmed',         color: 'text-brand',        bg: 'bg-brand/10',        step: 1 },
  PREPARING:  { label: 'Preparing',         color: 'text-yellow-400',   bg: 'bg-yellow-500/10',   step: 2 },
  READY:      { label: 'Ready for Pickup!', color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  step: 3 },
  COLLECTED:  { label: 'Collected',         color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  step: 4 },
  CANCELLED:  { label: 'Cancelled',         color: 'text-red-400',      bg: 'bg-red-500/10',      step: -1 },
};

const STEPS = ['Placed', 'Confirmed', 'Preparing', 'Ready'];

function addMinutes(mins) {
  const d = new Date(); d.setMinutes(d.getMinutes() + mins);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function CanteenOrder() {
  const { orderId } = useParams();
  const [qp]        = useSearchParams();
  const { t }       = useLanguage();
  const isNew       = qp.get('new') === '1';

  const [info, setInfo]     = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await canteenAPI.getOrder(orderId);
      setInfo(data);
    } catch (e) { toast.error('Failed to load order'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 20000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading order…" /></div>;
  if (!info) return <div className="min-h-screen bg-navy-900"><Navbar /><p className="text-center text-slate-500 pt-20">Order not found</p></div>;

  const { order, ordersAhead, crowdLevel } = info;
  const meta  = STATUS_META[order.status] || STATUS_META.PLACED;
  const step  = meta.step;
  const eta   = order.estimatedReadyTime || 12;
  const ready = addMinutes(Math.max(0, eta - Math.floor(ordersAhead * 0.5)));

  // Group items by counter
  const byCounter = {};
  for (const item of order.items || []) {
    const cname = item.counter?.name || 'Counter';
    if (!byCounter[cname]) byCounter[cname] = [];
    byCounter[cname].push(item);
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">

        {isNew && (
          <div className="card p-3 mb-5 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <p className="text-sm text-emerald-300 font-medium">Order placed successfully!</p>
          </div>
        )}

        {/* Order hero */}
        <div className="card p-6 mb-5 bg-gradient-to-br from-surface-card to-navy-700 border-brand/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Order</p>
              <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric leading-none">
                {order.orderNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border
                ${meta.color} ${meta.bg} ${meta.color.replace('text-', 'border-').replace('-400', '-500/30')}`}>
                {meta.label}
              </span>
              <button onClick={refresh} className="text-slate-500 hover:text-white p-1.5 transition-colors">
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Progress steps */}
          {order.status !== 'CANCELLED' && (
            <div className="flex items-center gap-1 mb-4">
              {STEPS.map((s, i) => {
                const done   = i < step;
                const active = i === step;
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                        ${done   ? 'bg-emerald-500 border-emerald-500 text-white'
                          : active ? 'bg-brand border-brand text-white animate-pulse-slow'
                          : 'bg-navy-800 border-surface-border text-slate-600'}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <p className={`text-[9px] mt-1 font-medium ${active ? 'text-brand' : done ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mb-4 rounded ${done ? 'bg-emerald-500' : 'bg-surface-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ETA cards */}
          {order.status !== 'CANCELLED' && order.status !== 'COLLECTED' && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-navy-800/70 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Brain size={9} className="text-purple-400" /> AI Est.</p>
                <p className="text-lg font-bold text-white">{eta}<span className="text-xs text-slate-500 ml-1">min</span></p>
              </div>
              <div className="bg-navy-800/70 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5 flex items-center justify-center gap-1"><Package size={9} /> Ahead</p>
                <p className="text-lg font-bold text-yellow-400">{ordersAhead}</p>
              </div>
              <div className="bg-navy-800/70 rounded-xl p-3 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">Crowd</p>
                <CrowdBadge level={crowdLevel} />
              </div>
            </div>
          )}

          {/* Pickup time */}
          {order.status !== 'CANCELLED' && order.status !== 'COLLECTED' && (
            <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 flex items-center gap-2 mb-4">
              <Zap size={14} className="text-brand flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400">Recommended Pickup Time</p>
                <p className="text-sm font-bold text-brand">{ready}</p>
              </div>
            </div>
          )}

          {order.status === 'READY' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center mb-4">
              <p className="text-emerald-400 font-bold text-sm">🎉 Your order is ready!</p>
              <p className="text-xs text-slate-400 mt-0.5">Please collect from the counter</p>
            </div>
          )}
        </div>

        {/* Order items grouped by counter */}
        <div className="card p-5 mb-5">
          <h3 className="section-title">Order Details</h3>
          {Object.entries(byCounter).map(([counterName, items]) => (
            <div key={counterName} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={12} className="text-orange-400" />
                <p className="text-xs font-semibold text-orange-300">{counterName}</p>
              </div>
              <div className="space-y-2 pl-5">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.name} × {item.quantity}</span>
                    <span className="text-white font-medium">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="border-t border-surface-border mt-3 pt-3 flex justify-between text-sm font-bold">
            <span className="text-slate-400">Total</span>
            <span className="text-white">₹{order.totalAmount}</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
            <Clock size={9} /> Placed {order.placedAt ? formatTime(order.placedAt) : '—'}
          </p>
        </div>

        {/* Navigation hint */}
        {order.status !== 'COLLECTED' && order.status !== 'CANCELLED' && (
          <div className="card p-4 border-electric/20 bg-electric/5 flex items-start gap-2">
            <UtensilsCrossed size={16} className="text-electric mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-electric">SmartQ Navigation</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {Object.keys(byCounter).length === 1
                  ? `Your order will be ready at ${Object.keys(byCounter)[0]}.`
                  : `Your order spans multiple counters. Check each counter listed above.`}
              </p>
            </div>
          </div>
        )}

        <Link to="/dashboard" className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
