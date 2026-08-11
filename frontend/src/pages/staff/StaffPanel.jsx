// SmartQ AI — Staff Counter Dashboard
// API / Socket.IO / auth: UNCHANGED. Layout: inline-style 3-column grid.
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
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [startedAt, calledAt]);
  const mm = String(Math.floor(e / 60)).padStart(2, '0');
  const ss = String(e % 60).padStart(2, '0');
  const isLong = e > 600;
  return (
    <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'13px', fontWeight:700,
      color: isLong ? '#fb923c' : '#cbd5e1', fontFamily:'monospace' }}>
      <Clock size={10} />{mm}:{ss}{isLong && <span style={{ fontSize:'10px', color:'#fb923c', marginLeft:'2px' }}>Long</span>}
    </span>
  );
}

function Spin() { return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />; }

function TokenDetailModal({ token, position, onClose }) {
  if (!token) return null;
  const dept = token.service?.department;
  const org  = dept?.organization;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="bg-gradient-to-r from-brand/20 to-electric/10 border-b border-brand/20 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><Eye size={14} className="text-brand" /><span className="text-sm font-bold text-white">Service Details</span></div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-navy-700"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-electric leading-none">{token.tokenNumber}</p>
          <div className="divide-y divide-surface-border/40">
            {[['User', getDisplayName(token)],['Service', token.service?.name||'—'],['Dept', token.service?.department?.name||'—'],
              ['Org', org?.name||'—'],['Booked', token.bookedAt ? formatTime(token.bookedAt) : '—'],
              ['Position', '#'+position],['Est. Wait', token.estimatedWait > 0 ? token.estimatedWait+' min' : '—']
            ].map(([l,v]) => (
              <div key={l} className="flex items-center justify-between py-2">
                <span className="text-xs text-slate-500">{l}</span>
                <span className="text-xs font-medium text-slate-200">{v}</span>
              </div>
            ))}
          </div>
          {token.isFollowUp && token.prevVisitDate && (
            <div className="bg-electric/10 border border-electric/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-electric">🔄 Returning User</p>
              <p className="text-xs text-slate-400 mt-0.5">Previous: {formatDate(token.prevVisitDate)}</p>
            </div>
          )}
          <p className="text-[10px] text-slate-700 text-center">Service-relevant info only.</p>
        </div>
      </div>
    </div>
  );
}

function SmartAlerts({ waiting, avgETA, crowdLevel }) {
  const [dismissed, setDismissed] = useState([]);
  const rows = [];
  if (waiting >= 15 || crowdLevel === 'VERY_HIGH')
    rows.push({ id:'crit', c:'#ef4444', bg:'rgba(239,68,68,0.08)',   bd:'rgba(239,68,68,0.3)',   t:'Queue Critical',         m: waiting+' waiting. Immediate action needed.' });
  else if (waiting >= 10 || crowdLevel === 'HIGH')
    rows.push({ id:'high', c:'#fb923c', bg:'rgba(251,146,60,0.08)',  bd:'rgba(251,146,60,0.3)',  t:'Queue Increasing',       m: waiting+' waiting. Consider another counter.' });
  if (avgETA > 25)
    rows.push({ id:'wait', c:'#facc15', bg:'rgba(250,204,21,0.08)',  bd:'rgba(250,204,21,0.3)',  t:'High Wait Time',         m:'Est. wait exceeded '+avgETA+' min.' });
  else if (avgETA > 15)
    rows.push({ id:'mod',  c:'#fde68a', bg:'rgba(253,230,138,0.06)', bd:'rgba(253,230,138,0.2)', t:'Wait Time Elevated',     m:'Avg wait: '+avgETA+' min. Monitor queue.' });
  if (waiting >= 8 && avgETA > 0)
    rows.push({ id:'ctr',  c:'#60a5fa', bg:'rgba(96,165,250,0.08)',  bd:'rgba(96,165,250,0.25)', t:'Counter Recommendation', m:'Opening another counter could reduce wait.' });
  const vis = rows.filter(a => !dismissed.includes(a.id));
  const S = { background:'#1f2d4a', border:'1px solid #2a3d6b', borderRadius:'12px', padding:'13px 15px' };
  return (
    <div style={S}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span>🔔</span>
          <span style={{ fontSize:'10px', fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.05em' }}>Smart Alerts</span>
        </div>
        {vis.length > 0 && <span style={{ fontSize:'11px', fontWeight:700, color:'#fb923c', background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.3)', borderRadius:'999px', padding:'2px 7px' }}>{vis.length}</span>}
      </div>
      {vis.length === 0 ? (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px', background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'9px' }}>
          <span style={{ width:'7px', height:'7px', background:'#34d399', borderRadius:'50%', flexShrink:0 }} />
          <div><p style={{ margin:0, fontSize:'12px', fontWeight:600, color:'#34d399' }}>All Good</p><p style={{ margin:0, fontSize:'10px', color:'#64748b' }}>Queue under control.</p></div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
          {vis.map(a => (
            <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:'7px', padding:'9px 10px', background:a.bg, border:'1px solid '+a.bd, borderRadius:'9px' }}>
              <span style={{ width:'7px', height:'7px', background:a.c, borderRadius:'50%', flexShrink:0, marginTop:'3px' }} />
              <div style={{ flex:1, minWidth:0 }}><p style={{ margin:0, fontSize:'11px', fontWeight:600, color:'#fff' }}>{a.t}</p><p style={{ margin:'2px 0 0', fontSize:'10px', color:'#94a3b8', lineHeight:1.4 }}>{a.m}</p></div>
              <button onClick={() => setDismissed(d => [...d, a.id])} style={{ fontSize:'10px', color:'#475569', background:'transparent', border:'none', cursor:'pointer' }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize:'9px', color:'#334155', textAlign:'center', margin:'8px 0 0' }}>AI recommends. Human decides.</p>
    </div>
  );
}

export default function StaffPanel() {
  const { staffSetup, clearStaffSetup } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoad, setActionLoad] = useState('');
  const [aiInfo, setAiInfo]         = useState(null);
  const [detailToken, setDetailToken]   = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: d } = await staffAPI.counter();
      setData(d);
      if (d.staff?.counterId) joinStaff(d.staff.counterId);
      if (d.queue?.id) aiAPI.predict({ queueId: d.queue.id }).then(({ data: ai }) => setAiInfo(ai)).catch(() => {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const s = getSocket();
    s.on('queueUpdated', fetchData);
    s.on('tokenCalled', fetchData);
    return () => { s.off('queueUpdated'); s.off('tokenCalled'); };
  }, [fetchData]);

  const act = async (fn, label) => {
    setActionLoad(label);
    try { await fn(); toast.success(label + ' successful'); fetchData(); }
    catch (e) { toast.error(e.response?.data?.error || label + ' failed'); }
    finally { setActionLoad(''); }
  };

  const go = async () => { await clearStaffSetup(); navigate('/staff/setup'); };

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;

  const { staff, queue, servingToken, waitingTokens } = data || {};
  const counter    = staffSetup?.counter || staff?.counter;
  const org        = staffSetup?.organization || staff?.organization;
  const dept       = staffSetup?.department;
  const sectorSlug = staffSetup?.sector?.slug || 'government';
  const waiting    = waitingTokens || [];
  const aiCrowd    = aiInfo?.crowd_level || aiInfo?.crowdLevel;
  const aiETA      = aiInfo?.estimated_wait || aiInfo?.estimatedWait || 0;

  const C   = { background:'#1f2d4a', border:'1px solid #2a3d6b', borderRadius:'12px' };
  const HDR = { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', background:'rgba(13,22,48,0.5)', borderBottom:'1px solid rgba(42,61,107,0.5)' };
  const LBL = { margin:0, fontSize:'10px', fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.055em' };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e' }}>
      <Navbar />
      <div style={{ maxWidth:'1440px', margin:'0 auto', padding:'16px 22px 28px' }}>

        {staffSetup && (
          <div style={{ ...C, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px', marginBottom:'13px', padding:'10px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', fontSize:'12px' }}>
              <SectorIcon slug={sectorSlug} size={13} className="text-brand" />
              <span style={{ color:'#6366f1', fontWeight:600 }}>{staffSetup.sector?.name}</span>
              <ChevronRight size={10} color="#4b5563" />
              <span style={{ color:'#94a3b8' }}>{staffSetup.organization?.name}</span>
              <ChevronRight size={10} color="#4b5563" />
              <span style={{ color:'#94a3b8' }}>{staffSetup.department?.name}</span>
              <ChevronRight size={10} color="#4b5563" />
              <span style={{ color:'#fff', fontWeight:700 }}>{staffSetup.counter?.name}</span>
              {counter && (
                <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'999px', border:'1px solid', marginLeft:'4px',
                  ...(counter.status==='OPEN' ? {color:'#34d399',background:'rgba(52,211,153,0.1)',borderColor:'rgba(52,211,153,0.3)'}
                    : counter.status==='PAUSED' ? {color:'#fb923c',background:'rgba(251,146,60,0.1)',borderColor:'rgba(251,146,60,0.3)'}
                    : {color:'#64748b',background:'rgba(100,116,139,0.1)',borderColor:'rgba(100,116,139,0.2)'})}}>
                  {counter.status}
                </span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <button onClick={fetchData} style={{ color:'#64748b', padding:'5px', background:'transparent', border:'none', cursor:'pointer', borderRadius:'7px' }}><RefreshCw size={13} /></button>
              <button onClick={go} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#94a3b8', border:'1px solid #2a3d6b', borderRadius:'8px', padding:'6px 12px', background:'transparent', cursor:'pointer' }}>
                <MapPin size={11} /> Change Location
              </button>
            </div>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { l:'Waiting',    v: waiting.length,                       color:'#facc15', I: Users    },
            { l:'Next Token', v: waiting[0]?.tokenNumber || '\u2014',  color:'#fff',    I: Tag      },
            { l:'Avg Wait',   v: aiETA > 0 ? aiETA+' min' : '\u2014', color:'#60a5fa', I: Clock    },
            { l:'Crowd',      v: aiCrowd || '\u2014', isCrowd:true,    color:'#fb923c', I: Activity },
          ].map(({ l, v, color, I, isCrowd }) => (
            <div key={l} style={{ ...C, padding:'11px 14px', display:'flex', alignItems:'center', gap:'11px' }}>
              <div style={{ width:'31px', height:'31px', background:'rgba(13,22,48,0.7)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <I size={14} color={color} />
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontSize:'9px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</p>
                {isCrowd && v !== '\u2014' ? <div style={{ marginTop:'3px' }}><CrowdBadge level={v} /></div> : <p style={{ margin:'2px 0 0', fontSize:'16px', fontWeight:800, color, lineHeight:1.1 }}>{v}</p>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)', gap:'14px', alignItems:'start', width:'100%' }}>

          <div style={{ ...C, overflow:'hidden' }}>
            <div style={HDR}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Radio size={11} color="#34d399" /><span style={LBL}>Live Queue</span></div>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#facc15', background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'999px', padding:'2px 8px' }}>{waiting.length}</span>
            </div>
            {waiting.length === 0 ? (
              <div style={{ padding:'36px 14px', textAlign:'center' }}>
                <CheckCircle size={26} color="rgba(52,211,153,0.3)" style={{ margin:'0 auto 8px' }} />
                <p style={{ margin:0, color:'#475569', fontSize:'12px' }}>No waiting tokens</p>
                <p style={{ margin:'2px 0 0', color:'#334155', fontSize:'10px' }}>All caught up!</p>
              </div>
            ) : (
              <div>
                {waiting.slice(0, 9).map((tk, i) => {
                  const sel = tk.id === selectedToken?.token.id;
                  return (
                    <button key={tk.id} onClick={() => setSelectedToken({ token: tk, position: i+1 })}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:'8px', padding:'9px 14px', textAlign:'left', background: sel ? 'rgba(99,102,241,0.12)' : 'transparent', border:'none', borderBottom:'1px solid rgba(42,61,107,0.35)', cursor:'pointer' }}
                      onMouseEnter={e => { if(!sel) e.currentTarget.style.background='rgba(13,22,48,0.7)'; }}
                      onMouseLeave={e => { if(!sel) e.currentTarget.style.background='transparent'; }}>
                      <span style={{ fontSize:'9px', color:'#475569', width:'14px', flexShrink:0 }}>#{i+1}</span>
                      <span style={{ fontSize:'13px', fontWeight:800, width:'44px', flexShrink:0, color: sel?'#6366f1':'#fff' }}>{tk.tokenNumber}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontSize:'12px', fontWeight:500, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{getDisplayName(tk)}</p>
                        <p style={{ margin:0, fontSize:'10px', color:'rgba(99,102,241,0.75)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tk.service?.name}</p>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'2px', flexShrink:0 }}>
                        {tk.estimatedWait > 0 && <span style={{ fontSize:'10px', color:'rgba(250,204,21,0.8)' }}>~{tk.estimatedWait}m</span>}
                        {tk.isFollowUp && <span style={{ fontSize:'9px', color:'#06b6d4', background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:'999px', padding:'1px 5px' }}>FU</span>}
                      </div>
                    </button>
                  );
                })}
                {waiting.length > 9 && <p style={{ textAlign:'center', fontSize:'10px', color:'#475569', padding:'7px 0', margin:0 }}>+{waiting.length-9} more in queue</p>}
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ ...C, overflow:'hidden', borderColor: servingToken ? 'rgba(96,165,250,0.4)' : '#2a3d6b' }}>
              <div style={{ ...HDR, background: servingToken ? 'linear-gradient(to right,rgba(59,130,246,0.2),rgba(99,102,241,0.1))' : 'rgba(13,22,48,0.5)', borderBottomColor: servingToken ? 'rgba(96,165,250,0.3)' : 'rgba(42,61,107,0.5)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background: servingToken ? '#60a5fa' : '#374151' }} />
                  <span style={{ ...LBL, color: servingToken ? '#93c5fd' : '#6b7280' }}>{servingToken ? 'Now Serving' : 'Counter Idle'}</span>
                </div>
                {servingToken && <ServiceTimer startedAt={servingToken.startedAt} calledAt={servingToken.calledAt} />}
              </div>
              <div style={{ padding:'22px 20px' }}>
                {servingToken ? (
                  <>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'18px', marginBottom:'20px' }}>
                      <div style={{ flexShrink:0 }}>
                        <p style={{ margin:0, fontSize:'72px', fontWeight:900, lineHeight:1, background:'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{servingToken.tokenNumber}</p>
                        {servingToken.calledAt && <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#475569' }}>Called {formatTime(servingToken.calledAt)}</p>}
                      </div>
                      <div style={{ flex:1, minWidth:0, paddingTop:'8px' }}>
                        <p style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:700, color:'#fff', lineHeight:1.2 }}>{getDisplayName(servingToken)}</p>
                        <p style={{ margin:'0 0 8px', fontSize:'14px', color:'#94a3b8' }}>{servingToken.service?.name}</p>
                        {servingToken.isFollowUp
                          ? <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#06b6d4', background:'rgba(6,182,212,0.1)', border:'1px solid rgba(6,182,212,0.25)', borderRadius:'999px', padding:'2px 10px', fontWeight:500 }}>🔄 Follow-up</span>
                          : <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#34d399', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:'999px', padding:'2px 10px', fontWeight:500 }}>🆕 New Visit</span>}
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'20px' }}>
                      {[['Org', org?.name],['Dept', dept?.name || servingToken.service?.department?.name],['Counter', counter?.name]].map(([l,v]) => v ? (
                        <div key={l} style={{ background:'rgba(13,22,48,0.6)', borderRadius:'9px', padding:'9px' }}>
                          <p style={{ margin:0, fontSize:'9px', color:'#475569', textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</p>
                          <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#cbd5e1', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</p>
                        </div>
                      ) : null)}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                      <button onClick={() => act(() => staffAPI.complete(servingToken.id), 'Complete')} disabled={!!actionLoad} className="btn-success" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', fontSize:'14px', fontWeight:600, borderRadius:'10px' }}>{actionLoad==='Complete' ? <Spin /> : <CheckCircle size={16} />} Complete</button>
                      <button onClick={() => act(() => staffAPI.noShow(servingToken.id), 'No Show')} disabled={!!actionLoad} className="btn-danger" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', fontSize:'14px', fontWeight:600, borderRadius:'10px' }}>{actionLoad==='No Show' ? <Spin /> : <XCircle size={15} />} No-show</button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'40px 0' }}>
                    <Activity size={36} color="#334155" style={{ margin:'0 auto 12px' }} />
                    <p style={{ margin:0, color:'#64748b', fontSize:'14px', fontWeight:500 }}>No token being served</p>
                    <p style={{ margin:'4px 0 0', color:'#334155', fontSize:'12px' }}>Call the next token to begin</p>
                  </div>
                )}
              </div>
            </div>
            {!servingToken && queue && (
              <button onClick={() => act(staffAPI.next, 'Next')} disabled={!!actionLoad || !waiting.length} className="btn-primary" style={{ width:'100%', padding:'15px', fontSize:'16px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', borderRadius:'12px', opacity: (!waiting.length || !!actionLoad) ? 0.4 : 1, cursor: (!waiting.length || !!actionLoad) ? 'not-allowed' : 'pointer' }}>
                {actionLoad==='Next' ? <div style={{ width:'20px', height:'20px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /> : <><SkipForward size={20} /> Call Next Token</>}
              </button>
            )}
            {selectedToken && selectedToken.token.id !== servingToken?.id && (
              <div style={{ ...C, padding:'14px 16px', background:'rgba(99,102,241,0.06)', borderColor:'rgba(99,102,241,0.25)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'9px' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#6366f1', textTransform:'uppercase', letterSpacing:'0.05em' }}>Queue Selection</span>
                  <button onClick={() => setDetailToken({ token: selectedToken.token, position: selectedToken.position })} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#94a3b8', background:'transparent', border:'1px solid #2a3d6b', borderRadius:'6px', padding:'3px 8px', cursor:'pointer' }}><Eye size={10} /> Details</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <span style={{ fontSize:'24px', fontWeight:900, color:'#6366f1' }}>{selectedToken.token.tokenNumber}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#fff' }}>{getDisplayName(selectedToken.token)}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>{selectedToken.token.service?.name}</p>
                  </div>
                  <div style={{ textAlign:'right' }}><p style={{ margin:0, fontSize:'11px', color:'#475569' }}>#{selectedToken.position}</p>{selectedToken.token.estimatedWait > 0 && <p style={{ margin:0, fontSize:'11px', color:'#facc15' }}>~{selectedToken.token.estimatedWait}m</p>}</div>
                </div>
              </div>
            )}
            {(aiCrowd || aiETA > 0) && (
              <div style={{ ...C, padding:'14px 16px', background:'rgba(168,85,247,0.05)', borderColor:'rgba(168,85,247,0.2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'11px' }}>
                  <Brain size={13} color="#a855f7" />
                  <span style={{ fontSize:'10px', fontWeight:700, color:'#c084fc', textTransform:'uppercase', letterSpacing:'0.055em' }}>AI Queue Insight</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'10px' }}>
                  {aiCrowd && <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><span style={{ fontSize:'10px', color:'#64748b' }}>Crowd Level</span><CrowdBadge level={aiCrowd} /></div>}
                  {aiETA > 0 && <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><span style={{ fontSize:'10px', color:'#64748b' }}>Est. Wait</span><span style={{ fontSize:'12px', fontWeight:600, color:'#fff' }}>{aiETA} min</span></div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}><span style={{ fontSize:'10px', color:'#64748b' }}>Queue Trend</span><span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:600, color:'#fb923c' }}><TrendingUp size={10} color="#fb923c" />Increasing</span></div>
                </div>
                {waiting.length > 8 && <p style={{ fontSize:'10px', color:'#94a3b8', lineHeight:1.5, margin:'0 0 9px', background:'rgba(13,22,48,0.5)', borderRadius:'8px', padding:'8px 10px' }}>💡 Queue increasing. Consider opening another counter.</p>}
                <Link to="/admin/simulator" className="btn-secondary" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'11px', padding:'7px', borderRadius:'8px', textDecoration:'none', width:'100%' }}><GitBranch size={11} /> View Simulation</Link>
                <p style={{ fontSize:'9px', color:'#334155', textAlign:'center', margin:'7px 0 0' }}>AI recommends. Human decides.</p>
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <SmartAlerts waiting={waiting.length} avgETA={aiETA} crowdLevel={aiCrowd} />
            <div style={{ ...C, padding:'13px 15px' }}>
              <p style={{ ...LBL, marginBottom:'10px' }}>Quick Actions</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                <button onClick={() => act(staffAPI.next, 'Next')} disabled={!waiting.length || !!actionLoad} className="btn-primary" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'12px', padding:'9px', borderRadius:'8px', width:'100%', opacity:(!waiting.length||!!actionLoad)?0.4:1, cursor:(!waiting.length||!!actionLoad)?'not-allowed':'pointer' }}>{actionLoad==='Next'?<Spin />:<><SkipForward size={12} /> Call Next Token</>}</button>
                {counter?.status==='OPEN' && <button className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', padding:'7px 10px', borderRadius:'8px', width:'100%' }}><PauseCircle size={11} /> Pause Counter</button>}
                {counter?.status==='PAUSED' && <button className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', padding:'7px 10px', borderRadius:'8px', width:'100%' }}><PlayCircle size={11} /> Resume Counter</button>}
                <button onClick={go} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', padding:'7px 10px', borderRadius:'8px', width:'100%' }}><MapPin size={11} /> Change Location</button>
                <Link to="/admin/analytics" className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', padding:'7px 10px', borderRadius:'8px', textDecoration:'none' }}><BarChart2 size={11} /> Analytics</Link>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              <div style={{ ...C, padding:'12px' }}>
                <p style={{ margin:'0 0 5px', fontSize:'9px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>Staff</p>
                <p style={{ margin:0, fontSize:'12px', fontWeight:600, color:'#fff' }}>Demo Staff</p>
                <p style={{ margin:'2px 0 5px', fontSize:'10px', color:'#64748b' }}>09:00–17:00</p>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#34d399' }}><span style={{ width:'6px', height:'6px', background:'#34d399', borderRadius:'50%' }} /> Online</span>
              </div>
              <div style={{ ...C, padding:'12px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                  <p style={{ margin:0, fontSize:'9px', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em' }}>Today</p>
                  <span style={{ fontSize:'8px', color:'#334155', background:'#0d1630', border:'1px solid #2a3d6b', borderRadius:'999px', padding:'1px 5px' }}>DEMO</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
                  {[['42','Served','#34d399'],[waiting.length,'Waiting','#facc15'],['4.2m','Avg','#60a5fa'],['3','No-show','#f87171']].map(([v,l,c]) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <p style={{ margin:0, fontSize:'14px', fontWeight:800, color:c }}>{v}</p>
                      <p style={{ margin:0, fontSize:'8px', color:'#4b5563' }}>{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {detailToken && <TokenDetailModal token={detailToken.token} position={detailToken.position} onClose={() => setDetailToken(null)} />}
    </div>
  );
}
