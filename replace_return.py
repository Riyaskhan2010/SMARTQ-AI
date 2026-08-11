"""Replace the return JSX (line 277 onwards) with a guaranteed 3-col inline-grid layout."""
f = r'c:\Users\moham\OneDrive\Documents\kiro\CIT\smartq-ai\frontend\src\pages\staff\StaffPanel.jsx'
with open(f, encoding='utf-8') as fh:
    lines = fh.readlines()

# Keep everything up to (not including) line 277 (0-indexed: 276)
KEEP = lines[:276]

NEW_RETURN = '''  const waiting = waitingTokens || [];
  const aiCrowd = aiInfo?.crowd_level || aiInfo?.crowdLevel;
  const aiETA   = aiInfo?.estimated_wait || aiInfo?.estimatedWait || 0;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>

        {/* ── 1. LOCATION BAR ──────────────────────────────── */}
        {staffSetup && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '8px', marginBottom: '16px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px', padding: '10px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '12px' }}>
              <SectorIcon slug={sectorSlug} size={13} className="text-brand" />
              <span style={{ color: '#6366f1', fontWeight: 600 }}>{staffSetup.sector?.name}</span>
              <ChevronRight size={10} style={{ color: '#4b5563' }} />
              <span style={{ color: '#94a3b8' }}>{staffSetup.organization?.name}</span>
              <ChevronRight size={10} style={{ color: '#4b5563' }} />
              <span style={{ color: '#94a3b8' }}>{staffSetup.department?.name}</span>
              <ChevronRight size={10} style={{ color: '#4b5563' }} />
              <span style={{ color: '#fff', fontWeight: 700 }}>{staffSetup.counter?.name}</span>
              {counter && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                  border: '1px solid', marginLeft: '4px',
                  ...(counter.status === 'OPEN'
                    ? { color: '#34d399', background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }
                    : counter.status === 'PAUSED'
                      ? { color: '#fb923c', background: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.3)' }
                      : { color: '#64748b', background: 'rgba(100,116,139,0.1)', borderColor: 'rgba(100,116,139,0.2)' }) }}>
                  {counter.status}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={fetchData} style={{ color: '#64748b', padding: '6px', borderRadius: '8px',
                background: 'transparent', border: 'none', cursor: 'pointer' }} title="Refresh">
                <RefreshCw size={13} />
              </button>
              <button onClick={handleChangeLocation}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                  color: '#94a3b8', border: '1px solid rgba(42,61,107,0.8)', borderRadius: '8px',
                  padding: '6px 12px', background: 'transparent', cursor: 'pointer' }}>
                <MapPin size={11} /> Change Location
              </button>
            </div>
          </div>
        )}
'''
)

NEW_RETURN += '''
        {/* ── 2. QUEUE OVERVIEW STRIP ─────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          marginBottom: '20px' }}
          className="grid-overview">
          {[
            { label: 'Waiting',   value: waiting.length,
              color: '#facc15', icon: Users },
            { label: 'Next Token', value: waiting[0]?.tokenNumber || '—',
              color: '#ffffff', icon: Tag },
            { label: 'Avg Wait',
              value: aiETA > 0 ? `${aiETA} min` : '—',
              color: '#60a5fa', icon: Clock },
            { label: 'Crowd',
              value: aiCrowd || '—',
              color: aiCrowd === 'HIGH' ? '#fb923c' : aiCrowd === 'MEDIUM' ? '#facc15' : '#34d399',
              icon: Activity, isCrowd: true },
          ].map(({ label, value, color, icon: Icon, isCrowd }) => (
            <div key={label}
              style={{ background: '#1f2d4a', border: '1px solid #2a3d6b', borderRadius: '12px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(15,23,42,0.6)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0 }}>
                <Icon size={14} color={color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                {isCrowd && value !== '—'
                  ? <CrowdBadge level={value} />
                  : <p style={{ fontSize: '18px', fontWeight: 800, color, margin: 0,
                      lineHeight: 1.2, marginTop: '2px' }}>{value}</p>}
              </div>
            </div>
          ))}
        </div>
'''

NEW_RETURN += '''
        {/* ── 3. MAIN 3-COLUMN GRID ───────────────────────── */}
        {/* Inline style guarantees the grid — no Tailwind purge risk */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)',
          gap: '16px',
          alignItems: 'start',
          width: '100%',
        }}>

          {/* ── LEFT: LIVE QUEUE ──────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ background: '#1f2d4a', border: '1px solid #2a3d6b', borderRadius: '12px',
              overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', background: 'rgba(15,23,42,0.5)',
                borderBottom: '1px solid rgba(42,61,107,0.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#34d399',
                    borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff',
                    textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Queue</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#facc15',
                  background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
                  borderRadius: '999px', padding: '2px 8px' }}>
                  {waiting.length}
                </span>
              </div>
              {/* Rows */}
              {waiting.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>No waiting tokens</p>
                </div>
              ) : (
                <div>
                  {waiting.slice(0, 8).map((tk, i) => {
                    const isSel = tk.id === selectedToken?.token.id;
                    return (
                      <button key={tk.id}
                        onClick={() => setSelectedToken({ token: tk, position: i + 1 })}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 16px', textAlign: 'left', background: isSel
                            ? 'rgba(99,102,241,0.12)' : 'transparent',
                          border: 'none', borderBottom: '1px solid rgba(42,61,107,0.4)',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(15,23,42,0.6)'; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ fontSize: '10px', color: '#475569', width: '16px',
                          flexShrink: 0, fontFamily: 'monospace' }}>#{i+1}</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, width: '48px', flexShrink: 0,
                          color: isSel ? '#6366f1' : '#fff' }}>{tk.tokenNumber}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 500,
                            color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis' }}>{getDisplayName(tk)}</p>
                          <p style={{ margin: 0, fontSize: '10px', color: 'rgba(99,102,241,0.8)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {tk.service?.name}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                          gap: '2px', flexShrink: 0 }}>
                          {tk.estimatedWait > 0 && (
                            <span style={{ fontSize: '10px', color: 'rgba(250,204,21,0.8)' }}>
                              ~{tk.estimatedWait}m
                            </span>
                          )}
                          {tk.isFollowUp && (
                            <span style={{ fontSize: '9px', color: '#06b6d4',
                              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                              borderRadius: '999px', padding: '1px 5px' }}>FU</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {waiting.length > 8 && (
                    <p style={{ textAlign: 'center', fontSize: '10px', color: '#475569',
                      padding: '8px 0', margin: 0 }}>
                      +{waiting.length - 8} more in queue
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
'''

NEW_RETURN += '''
          {/* ── CENTER: NOW SERVING ───────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Main serving card */}
            <div style={{ background: '#1f2d4a', border: servingToken
                ? '1px solid rgba(96,165,250,0.35)' : '1px solid #2a3d6b',
              borderRadius: '14px', overflow: 'hidden' }}>

              {/* Status bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', borderBottom: '1px solid rgba(42,61,107,0.6)',
                background: servingToken
                  ? 'linear-gradient(to right, rgba(59,130,246,0.2), rgba(99,102,241,0.1))'
                  : 'rgba(15,23,42,0.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
                    background: servingToken ? '#60a5fa' : '#4b5563',
                    ...(servingToken ? { animation: 'pulse 2s infinite' } : {}),
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: servingToken ? '#93c5fd' : '#64748b' }}>
                    {servingToken ? 'Now Serving' : 'Counter Idle'}
                  </span>
                </div>
                {servingToken && <ServiceTimer startedAt={servingToken.startedAt} calledAt={servingToken.calledAt} />}
              </div>

              <div style={{ padding: '24px 20px' }}>
                {servingToken ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
                      <div style={{ flexShrink: 0 }}>
                        <p style={{ fontSize: '72px', fontWeight: 900, lineHeight: 1, margin: 0,
                          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          {servingToken.tokenNumber}
                        </p>
                        {servingToken.calledAt && (
                          <p style={{ fontSize: '10px', color: '#475569', margin: '4px 0 0' }}>
                            Called {formatTime(servingToken.calledAt)}
                          </p>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingTop: '8px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#fff',
                          lineHeight: 1.2 }}>{getDisplayName(servingToken)}</p>
                        <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#94a3b8' }}>
                          {servingToken.service?.name}
                        </p>
                        {servingToken.isFollowUp ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', color: '#06b6d4', background: 'rgba(6,182,212,0.1)',
                            border: '1px solid rgba(6,182,212,0.25)', borderRadius: '999px',
                            padding: '2px 10px', fontWeight: 500 }}>🔄 Follow-up</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '12px', color: '#34d399', background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.25)', borderRadius: '999px',
                            padding: '2px 10px', fontWeight: 500 }}>🆕 New Visit</span>
                        )}
                      </div>
                      <div style={{ width: '52px', height: '52px', background: 'rgba(96,165,250,0.1)',
                        border: '1px solid rgba(96,165,250,0.2)', borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Activity size={22} color="#60a5fa" />
                      </div>
                    </div>

                    {/* Context chips */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px', marginBottom: '20px' }}>
                      {[
                        { label: 'Organization', value: org?.name },
                        { label: 'Department',   value: dept?.name || servingToken.service?.department?.name },
                        { label: 'Counter',      value: counter?.name },
                      ].map(({ label, value }) => value ? (
                        <div key={label} style={{ background: 'rgba(15,23,42,0.6)',
                          borderRadius: '10px', padding: '10px' }}>
                          <p style={{ margin: '0 0 2px', fontSize: '9px', color: '#475569',
                            textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {value}
                          </p>
                        </div>
                      ) : null)}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button onClick={() => act(() => staffAPI.complete(servingToken.id), 'Complete')}
                        disabled={!!actionLoad} className="btn-success"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '8px', padding: '12px', fontSize: '14px', fontWeight: 600,
                          borderRadius: '10px' }}>
                        {actionLoad === 'Complete' ? <Spin /> : <CheckCircle size={16} />} Complete
                      </button>
                      <button onClick={() => act(() => staffAPI.noShow(servingToken.id), 'No Show')}
                        disabled={!!actionLoad} className="btn-danger"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                          gap: '8px', padding: '12px', fontSize: '14px', fontWeight: 600,
                          borderRadius: '10px' }}>
                        {actionLoad === 'No Show' ? <Spin /> : <XCircle size={15} />} No-show
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Activity size={36} color="#334155" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                      No token being served
                    </p>
                    <p style={{ color: '#334155', fontSize: '12px', margin: '4px 0 0' }}>
                      Call the next token to begin
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CALL NEXT TOKEN */}
            {!servingToken && queue && (
              <button onClick={() => act(staffAPI.next, 'Next')}
                disabled={!!actionLoad || !waiting.length}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  borderRadius: '12px', opacity: (!waiting.length || !!actionLoad) ? 0.4 : 1 }}>
                {actionLoad === 'Next'
                  ? <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <><SkipForward size={20} /> Call Next Token</>}
              </button>
            )}

            {/* Selected from queue preview */}
            {selectedToken && selectedToken.token.id !== servingToken?.id && (
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1',
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>Queue Selection</span>
                  <button onClick={() => setDetailToken({ token: selectedToken.token,
                    position: selectedToken.position })}
                    style={{ fontSize: '11px', color: '#94a3b8', background: 'transparent',
                      border: '1px solid rgba(42,61,107,0.8)', borderRadius: '6px',
                      padding: '3px 8px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: '4px' }}>
                    <Eye size={10} /> Details
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#6366f1' }}>
                    {selectedToken.token.tokenNumber}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                      {getDisplayName(selectedToken.token)}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {selectedToken.token.service?.name}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>
                      #{selectedToken.position}
                    </p>
                    {selectedToken.token.estimatedWait > 0 && (
                      <p style={{ margin: 0, fontSize: '11px', color: '#facc15' }}>
                        ~{selectedToken.token.estimatedWait}m
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
'''

NEW_RETURN += '''
          {/* ── RIGHT: SMART STAFF ASSISTANT ─────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <SmartAlerts waiting={waiting.length} avgETA={aiETA} crowdLevel={aiCrowd} />

            {/* AI Queue Insight */}
            {(aiCrowd || aiETA > 0) && (
              <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Brain size={13} color="#a855f7" />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#c084fc',
                    textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Queue Insight</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { label: 'Crowd Level', badge: aiCrowd },
                    { label: 'Est. Wait',   val: aiETA > 0 ? `${aiETA} min` : '—', color: '#fff' },
                    { label: 'Queue Trend', val: 'Increasing', color: '#fb923c', withIcon: true },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{row.label}</span>
                      {row.badge
                        ? <CrowdBadge level={row.badge} />
                        : <span style={{ fontSize: '12px', fontWeight: 600, color: row.color,
                            display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {row.withIcon && <TrendingUp size={10} color={row.color} />}
                            {row.val}
                          </span>}
                    </div>
                  ))}
                </div>
                {waiting.length > 8 && (
                  <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 8px',
                    background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '8px 10px' }}>
                    💡 Queue is increasing. Consider opening another counter.
                  </p>
                )}
                <Link to="/admin/simulator" className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '6px', fontSize: '11px', padding: '7px', borderRadius: '8px',
                    width: '100%', textDecoration: 'none' }}>
                  <GitBranch size={11} /> View Simulation
                </Link>
                <p style={{ fontSize: '9px', color: '#334155', textAlign: 'center',
                  margin: '8px 0 0' }}>AI recommends. Human decides.</p>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ background: '#1f2d4a', border: '1px solid #2a3d6b',
              borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#fff', textTransform: 'uppercase',
                letterSpacing: '0.06em', margin: '0 0 10px' }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <button onClick={() => act(staffAPI.next, 'Next')}
                  disabled={!waiting.length || !!actionLoad}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '6px', fontSize: '12px', padding: '9px', borderRadius: '8px',
                    width: '100%', opacity: (!waiting.length || !!actionLoad) ? 0.4 : 1 }}>
                  {actionLoad === 'Next' ? <Spin /> : <SkipForward size={12} />} Call Next Token
                </button>
                {counter?.status === 'OPEN' && (
                  <button className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                      padding: '7px 10px', borderRadius: '8px', width: '100%' }}>
                    <PauseCircle size={11} /> Pause Counter
                  </button>
                )}
                {counter?.status === 'PAUSED' && (
                  <button className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                      padding: '7px 10px', borderRadius: '8px', width: '100%' }}>
                    <PlayCircle size={11} /> Resume Counter
                  </button>
                )}
                <button onClick={handleChangeLocation} className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                    padding: '7px 10px', borderRadius: '8px', width: '100%' }}>
                  <MapPin size={11} /> Change Location
                </button>
                <Link to="/admin/analytics" className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
                    padding: '7px 10px', borderRadius: '8px', textDecoration: 'none' }}>
                  <BarChart2 size={11} /> Analytics
                </Link>
              </div>
            </div>

            {/* Staff On Duty + Today compact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: '0.05em', margin: '0 0 6px' }}>Staff</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', margin: 0 }}>Demo Staff</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 6px' }}>09:00–17:00</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', color: '#34d399' }}>
                  <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%',
                    animation: 'pulse 2s infinite' }} /> Online
                </span>
              </div>
              <div style={{ background: '#1f2d4a', border: '1px solid #2a3d6b',
                borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '8px' }}>
                  <p style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: '0.05em', margin: 0 }}>Today</p>
                  <span style={{ fontSize: '8px', color: '#334155', background: '#0d1630',
                    border: '1px solid #2a3d6b', borderRadius: '999px', padding: '1px 5px' }}>DEMO</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { v: 42, l: 'Served', c: '#34d399' },
                    { v: waiting.length, l: 'Waiting', c: '#facc15' },
                    { v: '4.2m', l: 'Avg', c: '#60a5fa' },
                    { v: 3, l: 'No-show', c: '#f87171' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: s.c }}>{s.v}</p>
                      <p style={{ margin: 0, fontSize: '8px', color: '#4b5563' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {detailToken && (
        <TokenDetailModal token={detailToken.token} position={detailToken.position}
          onClose={() => setDetailToken(null)} />
      )}
    </div>
  );
}
'''

with open(f, 'w', encoding='utf-8', newline='\n') as fh:
    fh.writelines(KEEP)
    fh.write(NEW_RETURN)

with open(f, encoding='utf-8') as fh:
    result = fh.read()
import re
fns = re.findall(r'^(?:function |export default function )(\w+)', result, re.MULTILINE)
print('Functions:', fns)
print('Total lines:', result.count('\n'))
print('grid inline style:', 'gridTemplateColumns' in result)
