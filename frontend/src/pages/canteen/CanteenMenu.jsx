/**
 * CanteenMenu — browse menu items, add to cart, place order
 * URL: /canteen/menu?orgId=xxx&canteenId=xxx
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, Trash2, UtensilsCrossed,
  ArrowLeft, Coffee, Salad, Droplets, Clock, Zap, Brain, ChevronRight,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { canteenAPI } from '../../services/api';
import { useAuth }    from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PERIOD_TABS = ['ALL', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
const PERIOD_ICONS = { MORNING:'🌅', AFTERNOON:'☀️', EVENING:'🌤', NIGHT:'🌙', ALL:'🍽' };

const AVAIL_BADGE = {
  AVAILABLE:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  SOLD_OUT:     'text-red-400 bg-red-500/10 border-red-500/20',
  UNAVAILABLE:  'text-slate-500 bg-slate-500/10 border-slate-500/20',
};

export default function CanteenMenu() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const orgId     = params.get('orgId');
  const canteenId = params.get('canteenId');

  const [menuData, setMenuData]   = useState(null);
  const [canteenInfo, setCanteenInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState(null);   // null = use current
  const [cart, setCart]           = useState([]);      // [{ item, qty }]
  const [placing, setPlacing]     = useState(false);
  const [filter, setFilter]       = useState('ALL');   // counter type filter

  const fetchMenu = useCallback(async (p) => {
    try {
      const [menuRes, infoRes] = await Promise.all([
        canteenAPI.getMenu(canteenId, p || undefined),
        canteenAPI.getByOrg(orgId),
      ]);
      setMenuData(menuRes.data);
      setCanteenInfo(infoRes.data);
      if (!period) setPeriod(menuRes.data.mealPeriod);
    } catch (e) { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  }, [canteenId, orgId]);

  useEffect(() => {
    if (!canteenId || !orgId) { navigate('/sectors'); return; }
    fetchMenu(null);
  }, [canteenId, orgId]);

  // Cart helpers
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.item.id === item.id);
      if (ex) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1500 });
  };

  const changeQty = (itemId, delta) => {
    setCart(prev => prev
      .map(c => c.item.id === itemId ? { ...c, qty: c.qty + delta } : c)
      .filter(c => c.qty > 0)
    );
  };

  const getQty = (itemId) => cart.find(c => c.item.id === itemId)?.qty || 0;

  const placeOrder = async () => {
    if (!cart.length) return;
    if (!user) { navigate('/login'); return; }
    setPlacing(true);
    try {
      const { data } = await canteenAPI.placeOrder({
        canteenOrgId: canteenId,
        items: cart.map(c => ({ menuItemId: c.item.id, quantity: c.qty })),
      });
      toast.success(`Order ${data.order.orderNumber} placed!`);
      navigate(`/canteen/order/${data.order.id}?new=1`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Order failed');
    } finally { setPlacing(false); }
  };

  // Group items by counter
  const grouped = {};
  for (const item of (menuData?.items || [])) {
    const key = item.counter?.id;
    if (!grouped[key]) grouped[key] = { counter: item.counter, items: [] };
    grouped[key].items.push(item);
  }

  const filteredGroups = Object.values(grouped).filter(g =>
    filter === 'ALL' || g.counter?.type === filter || (filter === 'JUICE' && g.counter?.type === 'JUICE')
  );

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text="Loading menu…" /></div>;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link to={`/canteen?orgId=${orgId}`} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Canteen Menu</h1>
            <p className="text-xs text-slate-500">{canteenInfo?.canteen?.name}</p>
          </div>
          {/* Cart button */}
          {cart.length > 0 && (
            <button onClick={placeOrder} disabled={placing}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2 relative">
              <ShoppingCart size={15} />
              {placing
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>{cartCount} item{cartCount > 1 ? 's' : ''}</span><span className="font-bold">₹{cartTotal}</span></>}
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-400 rounded-full text-[9px] font-bold flex items-center justify-center text-white">{cartCount}</span>
            </button>
          )}
        </div>

        {/* Current period banner */}
        {menuData && (
          <div className="card p-3 mb-5 flex items-center gap-3 bg-brand/5 border-brand/20">
            <span className="text-xl">{PERIOD_ICONS[menuData.mealPeriod]}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand">{menuData.mealPeriod} Menu Active</p>
              <p className="text-xs text-slate-500">Showing items available for current time period</p>
            </div>
            {canteenInfo?.crowdLevel && <CrowdBadge level={canteenInfo.crowdLevel} />}
          </div>
        )}

        {/* Counter type filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {['ALL', 'BEVERAGES', 'MEALS', 'JUICE'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 text-xs px-4 py-1.5 rounded-full border font-semibold transition-all
                ${filter === f ? 'bg-brand text-white border-brand' : 'text-slate-400 border-surface-border hover:border-brand/40'}`}>
              {f === 'ALL' ? '🍽 All' : f === 'BEVERAGES' ? '☕ Beverages' : f === 'MEALS' ? '🍛 Meals' : '🍊 Juices'}
            </button>
          ))}
        </div>

        {/* Menu groups */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
            <p>No items available for current period</p>
          </div>
        ) : filteredGroups.map(({ counter, items }) => (
          <div key={counter?.id} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
                {counter?.type === 'BEVERAGES' ? <Coffee size={14} className="text-orange-400" />
                  : counter?.type === 'JUICE' ? <Droplets size={14} className="text-cyan-400" />
                  : <Salad size={14} className="text-orange-400" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{counter?.name}</h2>
              </div>
            </div>

            <div className="space-y-2">
              {items.map(item => {
                const qty = getQty(item.id);
                const unavail = item.availability !== 'AVAILABLE';
                return (
                  <div key={item.id} className={`card p-4 flex items-center gap-3 ${unavail ? 'opacity-50' : 'hover:border-brand/30 transition-colors'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        {item.availability !== 'AVAILABLE' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${AVAIL_BADGE[item.availability]}`}>
                            {item.availability === 'SOLD_OUT' ? 'SOLD OUT' : 'UNAVAIL.'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-semibold text-white">₹{item.price}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> ~{item.avgPrepTime}m</span>
                        <span className="text-brand/60">{item.mealPeriod}</span>
                      </div>
                    </div>

                    {unavail ? (
                      <span className="text-xs text-slate-600">Unavailable</span>
                    ) : qty === 0 ? (
                      <button onClick={() => addToCart(item)}
                        className="w-8 h-8 bg-brand/10 border border-brand/30 rounded-lg flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all">
                        <Plus size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(item.id, -1)}
                          className="w-7 h-7 bg-navy-800 border border-surface-border rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-bold text-white w-5 text-center">{qty}</span>
                        <button onClick={() => addToCart(item)}
                          className="w-7 h-7 bg-brand/10 border border-brand/30 rounded-lg flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all">
                          <Plus size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sticky bottom cart */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-navy-900/95 backdrop-blur border-t border-surface-border p-4">
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-slate-400">{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal}</p>
                <div className="flex gap-1 flex-wrap mt-0.5">
                  {cart.map(c => (
                    <span key={c.item.id} className="text-[10px] text-slate-500">{c.item.name} ×{c.qty}</span>
                  ))}
                </div>
              </div>
              <button onClick={placeOrder} disabled={placing}
                className="btn-primary flex items-center gap-2 py-3 px-6 text-sm font-semibold">
                {placing
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Zap size={15} /> Place Order</>}
              </button>
            </div>
          </div>
        )}
        <div className={cart.length > 0 ? 'h-24' : ''} />
      </div>
    </div>
  );
}
