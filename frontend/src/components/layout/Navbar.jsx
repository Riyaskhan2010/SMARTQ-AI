import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Globe, LogOut, ChevronDown, Menu, X, Zap,
  CheckCheck, Ticket, Clock, Star, Info, UtensilsCrossed,
  Calendar, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

// ── Notification type → icon + colour ─────────────────────────────
function notifStyle(type) {
  const map = {
    TOKEN_BOOKED:       { icon: Ticket,         color: 'text-brand',        bg: 'bg-brand/15' },
    YOUR_TURN:          { icon: Bell,            color: 'text-yellow-400',   bg: 'bg-yellow-400/15' },
    TOKEN_CALLED:       { icon: Bell,            color: 'text-yellow-400',   bg: 'bg-yellow-400/15' },
    SERVICE_COMPLETED:  { icon: CheckCheck,      color: 'text-emerald-400',  bg: 'bg-emerald-400/15' },
    QUEUE_UPDATE:       { icon: Clock,           color: 'text-blue-400',     bg: 'bg-blue-400/15' },
    APPOINTMENT:        { icon: Calendar,        color: 'text-purple-400',   bg: 'bg-purple-400/15' },
    CANTEEN:            { icon: UtensilsCrossed, color: 'text-orange-400',   bg: 'bg-orange-400/15' },
    CANTEEN_ORDER:      { icon: UtensilsCrossed, color: 'text-orange-400',   bg: 'bg-orange-400/15' },
    ALERT:              { icon: AlertCircle,     color: 'text-red-400',      bg: 'bg-red-400/15' },
  };
  const key = Object.keys(map).find(k => type?.toUpperCase().includes(k)) || 'INFO';
  return map[key] || { icon: Info, color: 'text-slate-400', bg: 'bg-slate-400/15' };
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { t, lang, setLang, languages } = useLanguage();
  const { notifications = [], unreadCount = 0, markRead, markAllRead } = useNotifications() || {};
  const navigate          = useNavigate();
  const location          = useLocation();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const [profOpen, setProfOpen]   = useState(false);
  const [bellOpen, setBellOpen]   = useState(false);
  const bellRef = useRef(null);

  // Close bell panel when clicking outside
  useEffect(() => {
    if (!bellOpen) return;
    function handle(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [bellOpen]);

  const handleLogout = () => { logout(); navigate('/'); setBellOpen(false); setProfOpen(false); };
  const dashPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/staff' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand to-electric rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">SmartQ <span className="text-brand">AI</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {user && (
              <Link to={dashPath} className={`text-sm font-medium transition-colors ${location.pathname === dashPath ? 'text-brand' : 'text-slate-400 hover:text-white'}`}>
                {t('dashboard')}
              </Link>
            )}

            {/* Language */}
            <div className="relative">
              <button onClick={() => { setLangOpen(p => !p); setProfOpen(false); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
                <Globe size={16} /><span>{lang.toUpperCase()}</span><ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-9 w-48 bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-navy-700 transition-colors ${lang === l.code ? 'text-brand' : 'text-slate-300'}`}>
                      <span>{l.nativeName}</span>
                      <span className="text-xs text-slate-500">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* ── Bell dropdown ──────────────────────── */}
                <div className="relative" ref={bellRef}>
                  <button
                    onClick={() => { setBellOpen(p => !p); setLangOpen(false); setProfOpen(false); }}
                    className="relative text-slate-400 hover:text-white transition-colors p-1"
                    aria-label="Notifications">
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand rounded-full text-[10px] text-white flex items-center justify-center font-bold leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {bellOpen && (
                    <div className="absolute right-0 top-11 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-fade-in">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                        <div className="flex items-center gap-2">
                          <Bell size={14} className="text-brand" />
                          <span className="text-sm font-bold text-white">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-brand/20 text-brand border border-brand/30 px-1.5 py-0.5 rounded-full font-bold">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllRead?.()}
                            className="text-[11px] text-brand hover:text-brand-light flex items-center gap-1 transition-colors">
                            <CheckCheck size={11} /> Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell size={28} className="text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 20).map(n => {
                            const { icon: Icon, color, bg } = notifStyle(n.type);
                            return (
                              <button key={n.id}
                                onClick={() => { markRead?.(n.id); setBellOpen(false); }}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-navy-700/60 transition-colors border-b border-surface-border/50 last:border-0
                                  ${n.isRead ? 'opacity-60' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${bg}`}>
                                  <Icon size={14} className={color} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-medium leading-tight ${n.isRead ? 'text-slate-400' : 'text-white'}`}>
                                      {n.title || n.type?.replace(/_/g,' ')}
                                    </p>
                                    {!n.isRead && <span className="w-2 h-2 bg-brand rounded-full flex-shrink-0 mt-1" />}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                  <p className="text-[10px] text-slate-600 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2 border-t border-surface-border">
                        <Link to="/notifications" onClick={() => setBellOpen(false)}
                          className="text-xs text-brand hover:text-brand-light transition-colors">
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => { setProfOpen(p => !p); setLangOpen(false); }}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand to-electric rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 hidden lg:block">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={12} className="text-slate-500" />
                  </button>
                  {profOpen && (
                    <div className="absolute right-0 top-11 w-48 bg-surface-card border border-surface-border rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                      <div className="px-4 py-3 border-b border-surface-border">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                      </div>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-navy-700 transition-colors">
                        <LogOut size={14} />{t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">{t('login')}</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">{t('register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMenuOpen(p => !p)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fade-in">
            {user ? (
              <>
                <Link to={dashPath} onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-slate-300 hover:text-white text-sm">{t('dashboard')}</Link>
                <button onClick={handleLogout} className="block px-2 py-2 text-red-400 text-sm">{t('logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login"    onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-slate-300 hover:text-white text-sm">{t('login')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-2 py-2 text-slate-300 hover:text-white text-sm">{t('register')}</Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
