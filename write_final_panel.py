"""Write the complete final StaffPanel.jsx — single source of truth."""
import re, os

f = r'c:\Users\moham\OneDrive\Documents\kiro\CIT\smartq-ai\frontend\src\pages\staff\StaffPanel.jsx'

# Segments are written as lists of lines (avoids triple-quote / JSX conflicts)
parts = []

# ── PART 1: Imports ──────────────────────────────────────────────
parts.append(r"""// SmartQ AI — Staff Counter Dashboard (redesigned with inline-style 3-col grid)
// API calls, Socket.IO, auth hooks: ALL UNCHANGED.
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, SkipForward, Activity, RefreshCw,
  User, Clock, ChevronRight, MapPin, Tag,
  Eye, X, Brain, Building2, GraduationCap, Landmark,
  Banknote, Mail, PauseCircle, PlayCircle,
  TrendingUp, BarChart2, GitBranch, Radio, Users,
} from 'lucide-react';
import Navbar         from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CrowdBadge     from '../../components/ui/CrowdBadge';
import { staffAPI, aiAPI } from '../../services/api';
import { useAuth }    from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getSocket, joinStaff } from '../../services/socket';
import { formatTime, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
""")

# ── PART 2: Pure helpers ─────────────────────────────────────────
parts.append(r"""
function getDisplayName(t) { return t?.user?.name || t?.notes || 'Guest User'; }

function SectorIcon({ slug, size = 16, className = '' }) {
  const M = { hospital: Building2, college: GraduationCap, government: Landmark, bank: Banknote, post: Mail };
  const I = M[slug] || Activity;
  return <I size={size} className={className} />;
}

function ServiceTimer({ startedAt, calledAt }) {
  const [e, setE] = useState(0);
  useEffect(() => {
    const base = startedAt || calledAt;
    if (!base) return;
    const s0 = new Date(base).getTime();
    const tick = () => setE(Math.floor((Date.now() - s0) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, calledAt]);
  const mm = String(Math.floor(e / 60)).padStart(2, '0');
  const ss = String(e % 60).padStart(2, '0');
  const isLong = e > 600;
  return (
    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'13px',
      fontWeight:700, color: isLong ? '#fb923c' : '#cbd5e1', fontFamily:'monospace' }}>
      <Clock size={10} />{mm}:{ss}
      {isLong && <span style={{ fontSize:'10px', color:'#fb923c', marginLeft:'3px' }}>Long</span>}
    </span>
  );
}

function Spin() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}
""")

# ── PART 3: TokenDetailModal ─────────────────────────────────────
parts.append(r"""
function TokenDetailModal({ token, position, onClose }) {
  if (!token) return null;
  const dept = token.service?.department;
  const org  = dept?.organization;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-r from-brand/20 to-electric/10 border-b border-brand/20 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-brand" />
            <span className="text-sm font-bold text-white">Service Details</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-navy-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric leading-none">
            {token.tokenNumber}
          </p>
          <div className="divide-y divide-surface-border/40">
            {[
              ['User',       getDisplayName(token)],
              ['Service',    token.service?.name || '\u2014'],
              ['Department', dept?.name || '\u2014'],
              ['Org',        org?.name || '\u2014'],
              ['Booked',     token.bookedAt ? formatTime(token.bookedAt) : '\u2014'],
              ['Position',   '#' + position],
              ['Est. Wait',  token.estimatedWait > 0 ? token.estimatedWait + ' min' : '\u2014'],
            ].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-medium text-slate-200">{v}</span>
              </div>
            ))}
          </div>
          {token.isFollowUp && token.prevVisitDate && (
            <div className="bg-electric/10 border border-electric/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-electric">\U0001f504 Returning User</p>
              <p className="text-xs text-slate-400 mt-0.5">Previous: {formatDate(token.prevVisitDate)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
""")

# ── PART 4: SmartAlerts ──────────────────────────────────────────
parts.append(r"""
function SmartAlerts({ waiting, avgETA, crowdLevel }) {
  const [dismissed, setDismissed] = useState([]);
  const rows = [];
  if (waiting >= 15 || crowdLevel === 'VERY_HIGH')
    rows.push({ id:'crit', c:'#ef4444', bg:'rgba(239,68,68,0.08)',   bd:'rgba(239,68,68,0.3)',   t:'Queue Critical',         m: waiting + ' waiting. Immediate action needed.' });
  else if (waiting >= 10 || crowdLevel === 'HIGH')
    rows.push({ id:'high', c:'#fb923c', bg:'rgba(251,146,60,0.08)',  bd:'rgba(251,146,60,0.3)',  t:'Queue Increasing',       m: waiting + ' waiting. Consider another counter.' });
  if (avgETA > 25)
    rows.push({ id:'wait', c:'#facc15', bg:'rgba(250,204,21,0.08)',  bd:'rgba(250,204,21,0.3)',  t:'High Wait Time',         m: 'Est. wait exceeded ' + avgETA + ' min.' });
  else if (avgETA > 15)
    rows.push({ id:'mod',  c:'#fde68a', bg:'rgba(253,230,138,0.06)', bd:'rgba(253,230,138,0.2)', t:'Wait Time Elevated',     m: 'Avg wait: ' + avgETA + ' min. Monitor queue.' });
  if (waiting >= 8 && avgETA > 0)
    rows.push({ id:'ctr',  c:'#60a5fa', bg:'rgba(96,165,250,0.08)',  bd:'rgba(96,165,250,0.25)', t:'Counter Recommendation', m: 'Opening another counter could reduce wait.' });
  const vis = rows.filter(a => !dismissed.includes(a.id));
  return (
    <div style={{ background:'#1f2d4a', border:'1px solid #2a3d6b', borderRadius:'12px', padding:'13px 15px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span>\U0001f514</span>
          <span style={{ fontSize:'10px', fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.055em' }}>Smart Alerts</span>
        </div>
        {vis.length > 0 && (
          <span style={{ fontSize:'11px', fontWeight:700, color:'#fb923c', background:'rgba(251,146,60,0.1)',
            border:'1px solid rgba(251,146,60,0.3)', borderRadius:'999px', padding:'2px 7px' }}>{vis.length}</span>
        )}
      </div>
      {vis.length === 0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px',
          background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'9px' }}>
          <span style={{ width:'7px', height:'7px', background:'#34d399', borderRadius:'50%', flexShrink:0 }} />
          <div>
            <p style={{ margin:0, fontSize:'12px', fontWeight:600, color:'#34d399' }}>All Good</p>
            <p style={{ margin:0, fontSize:'10px', color:'#64748b' }}>Queue under control.</p>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {vis.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:'7px',
              padding:'9px 10px', background:a.bg, border:`1px solid ${a.bd}`, borderRadius:'9px' }}>
              <span style={{ width:'7px', height:'7px', background:a.c, borderRadius:'50%', flexShrink:0, marginTop:'3px' }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:'11px', fontWeight:600, color:'#fff' }}>{a.t}</p>
                <p style={{ margin:'2px 0 0', fontSize:'10px', color:'#94a3b8', lineHeight:1.4 }}>{a.m}</p>
              </div>
              <button onClick={() => setDismissed(d => [...d, a.id])}
                style={{ fontSize:'10px', color:'#475569', background:'transparent', border:'none', cursor:'pointer' }}>&#x2715;</button>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize:'9px', color:'#334155', textAlign:'center', margin:'8px 0 0' }}>AI recommends. Human decides.</p>
    </div>
  );
}
""")

with open(f, 'w', encoding='utf-8', newline='\n') as fh:
    for p in parts:
        fh.write(p)

print('Wrote parts 1-4. Now appending main export separately...')
