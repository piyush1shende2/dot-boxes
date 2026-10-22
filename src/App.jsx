import { useEffect, useMemo, useRef, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import Sidebar from './Sidebar.jsx'
import Dropdown from './Dropdown.jsx'
import Board from './Board.jsx'
import { Icon, House } from './Icon.jsx'
import { COLORS, MODES, MAX_DOTS, createGame, applyMove, aiMove, winners } from './game.js'

const clampDots = (n) => Math.max(3, Math.min(MAX_DOTS, Number(n) || 3))
function buildPlayers(st) {
  if (st.pc === 'ai') return [
    { name: st.names[0] || 'You', color: COLORS[0], letter: st.letters[0] || '', ai: false },
    { name: 'AI', color: COLORS[4], letter: '', ai: true },
  ]
  return Array.from({ length: Number(st.pc) }, (_, i) => ({ name: st.names[i] || `Player ${i + 1}`, color: COLORS[i], letter: st.letters[i] || '', ai: false }))
}
const SAVE = 'dnb-save'

export default function App() {
  const [night, setNight] = useState(() => localStorage.getItem('dnb-theme') === 'night')
  const [st, setSt] = useState({ pc: 'ai', mode: 'simple', cr: 15, cc: 15, names: Array(7).fill(''), letters: Array(7).fill('') })
  const [cfg, setCfg] = useState(null)
  const [, bump] = useState(0)
  const [zoom, setZoom] = useState(null) // null = fit to screen
  const [vw, setVw] = useState(window.innerWidth)
  const [speed, setSpeed] = useState('normal')
  const [quality, setQualityRaw] = useState(() => {
    const saved = localStorage.getItem('dnb-quality'); if (saved) return saved
    const low = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 || matchMedia('(prefers-reduced-motion: reduce)').matches
    return low ? 'lite' : 'full' // low-end devices start in Lite
  })
  const setQuality = (q) => { setQualityRaw(q); localStorage.setItem('dnb-quality', q) }
  const slow = () => { if (quality === 'full') { setQuality('lite'); say('Switched to Lite effects for smoother play') } }
  const [sort, setSort] = useState('turn')
  const [pop, setPop] = useState(false)
  const [toast, setToast] = useState('')
  const gameRef = useRef(null), shell = useRef(null), tt = useRef(0), tr = useRef(0)
  const g = gameRef.current

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
    localStorage.setItem('dnb-theme', night ? 'night' : 'day')
  }, [night])
  useEffect(() => { const f = () => setVw(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])

  const say = (m) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 1800) }
  const start = (c) => { gameRef.current = createGame(c.R, c.C, c.players); setCfg(c); setZoom(null); bump((n) => n + 1) }
  const startFromSetup = () => {
    const R = st.mode === 'custom' ? clampDots(st.cr) : MODES[st.mode].dots, C = st.mode === 'custom' ? clampDots(st.cc) : MODES[st.mode].dots
    start({ R, C, players: buildPlayers(st), mode: st.mode })
  }
  const changeMode = (m) => start({ ...cfg, mode: m, R: MODES[m]?.dots ?? cfg.R, C: MODES[m]?.dots ?? cfg.C })
  const play = (t, r, c) => { if (applyMove(gameRef.current, t, r, c) >= 0) bump((n) => n + 1) }

  // AI turn (uses the same applyMove as humans; aiMove only ever offers undrawn lines)
  const aiTurn = !!g && !g.done && g.players[g.cur].ai
  useEffect(() => {
    if (!aiTurn) return
    const d = speed === 'fast' ? 70 : speed === 'slow' ? 1200 : g.total > 400 ? 90 : 650
    const id = setTimeout(() => { const m = aiMove(gameRef.current); if (m) play(...m) }, d)
    return () => clearTimeout(id)
  })

  const save = () => {
    localStorage.setItem(SAVE, JSON.stringify({ cfg, R: g.R, C: g.C, players: g.players, h: [...g.h], v: [...g.v], own: [...g.own], scores: g.scores, cur: g.cur, claimed: g.claimed, done: g.done, moves: g.moves, lastBy: g.lastBy, last: g.last }))
    say('Game saved ♥'); bump((n) => n + 1)
  }
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE)); if (!s) return say('No saved game yet')
      const n = createGame(s.R, s.C, s.players)
      n.h = Int8Array.from(s.h); n.v = Int8Array.from(s.v); n.own = Int8Array.from(s.own)
      Object.assign(n, { scores: s.scores, cur: s.cur, claimed: s.claimed, done: s.done, moves: s.moves, lastBy: s.lastBy, last: s.last })
      gameRef.current = n; setCfg(s.cfg); setZoom(null); bump((x) => x + 1); say('Game loaded')
    } catch { say('Could not load save') }
  }
  const hasSave = !!localStorage.getItem(SAVE)

  const tilt = (e) => { // 3D tilt (Full quality only), throttled to one update per frame
    if (quality !== 'full' || window.innerWidth < 900 || !shell.current || tr.current) return
    const r = e.currentTarget.getBoundingClientRect(), cx = e.clientX, cy = e.clientY
    tr.current = requestAnimationFrame(() => {
      tr.current = 0
      shell.current?.style.setProperty('--ry', ((cx - r.left) / r.width - 0.5) * 5 + 'deg')
      shell.current?.style.setProperty('--rx', -((cy - r.top) / r.height - 0.5) * 4 + 'deg')
    })
  }

  const preview = useMemo(() => buildPlayers(st), [st])
  const players = g ? g.players : preview
  const win = g && g.done ? winners(g) : []
  const turnP = g ? g.players[g.cur] : preview[0]
  const who = g && g.done ? { ...g.players[win[0]] } : turnP
  const status = !g ? 'online' : g.done ? 'winner' : turnP.ai ? 'thinking…' : 'online'
  const msg = !g ? 'Choose players & a mode, then start' : g.done
    ? (win.length > 1 ? "It's a tie!" : `${g.players[win[0]].name} wins!`)
    : `${turnP.name}${turnP.ai ? ' is thinking…' : "'s turn"}${g.last && g.last.got && g.last.by === g.cur ? ` · +${g.last.got} box${g.last.got > 1 ? 'es' : ''}, go again!` : ''}`

  const fitCell = Math.max(12, Math.min(56, Math.floor((Math.min(vw, 1180) - (vw > 900 ? 330 : 70) - 90) / ((g ? g.C : 10) - 1))))
  const cell = zoom ?? fitCell
  const order = players.map((_, i) => i).sort((a, b) => (sort === 'score' && g ? g.scores[b] - g.scores[a] : a - b))
  const confetti = useMemo(() => Array.from({ length: quality === 'full' ? 40 : quality === 'lite' ? 14 : 0 }, (_, i) => ({ l: Math.random() * 100, d: Math.random() * 1.5, t: 2.5 + Math.random() * 2, c: COLORS[i % 7] })), [g && g.done, quality])

  return (
    <div className={'stage' + (quality === 'full' ? '' : ' lite')} onPointerMove={tilt} onPointerLeave={() => { shell.current?.style.setProperty('--ry', '0deg'); shell.current?.style.setProperty('--rx', '0deg') }}>
      <div className="shell" ref={shell}>
        <div className="depth"><div className="chamf" /></div>
        <div className="face chamf">
          <Sidebar g={g} cfg={cfg} st={st} setSt={setSt} who={who} status={status} players={preview}
            onStart={startFromSetup} onRestart={() => start(cfg)} onNew={() => { gameRef.current = null; setCfg(null); bump((n) => n + 1) }}
            onMode={changeMode} zoom={zoom} setZoom={setZoom} speed={speed} setSpeed={setSpeed} quality={quality} setQuality={setQuality} />

          <section className="main">
            <div className="topbar">
              <div className="pill search"><Icon n="search" size={18} /><span key={msg} className="swap">{msg}</span></div>
              <div className="pop-wrap">
                <button className="round" disabled={!g} onClick={() => setPop(!pop)} aria-label="Zoom"><Icon n="sliders" size={20} /></button>
                {pop && g && <div className="popover"><small>Zoom</small><input type="range" min="8" max="80" value={cell} onChange={(e) => setZoom(Number(e.target.value))} /></div>}
              </div>
              <button className={'pill saved' + (hasSave ? ' has' : '')} onClick={g ? save : load}><Icon n="heart" size={16} />Saved</button>
              <Dropdown prefix="Sort by: " value={sort} options={[{ v: 'turn', t: 'Turn order' }, { v: 'score', t: 'Top score' }]} onChange={setSort} />
              <ThemeToggle night={night} onToggle={() => setNight(!night)} />
            </div>

            <div className="title"><h1>Dots <span>&amp;</span> Boxes</h1><p>Draw a line, close a box, claim the house.</p></div>

            <div className="windows">
              {order.map((i) => {
                const p = players[i], active = g && !g.done && g.cur === i, lit = active || win.includes(i) || (!g && i === 0)
                return (
                  <div key={i} className={'wwrap' + (active ? ' active' : '') + (win.includes(i) ? ' win' : '')} style={{ '--pc': p.color }}>
                    <div className="win chamf-s"><div className="win-in chamf-s">
                      <span className="wname">{p.name}</span>
                      <House color={p.color} lit={lit} />
                      <em key={g ? g.scores[i] : 0} className="wscore">{g ? g.scores[i] : 0}</em>
                    </div></div>
                  </div>
                )
              })}
            </div>

            {g && (
              <div className="board-window">
                <Board game={g} version={g.moves} cell={cell} night={night} onEdge={play} disabled={g.done || g.players[g.cur].ai} quality={quality} onSlow={slow} />
              </div>
            )}
          </section>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
      {g && g.done && (
        <div className="overlay">
          {confetti.map((c, i) => <i key={i} className="conf" style={{ left: c.l + '%', animationDelay: c.d + 's', animationDuration: c.t + 's', background: c.c }} />)}
          <div className="result">
            <House color={g.players[win[0]].color} lit size={120} />
            <h2>{win.length > 1 ? "It's a tie!" : `${g.players[win[0]].name} wins!`}</h2>
            {win.length > 1 && <p>{win.map((i) => g.players[i].name).join(' & ')}</p>}
            {g.players.map((p, i) => <p key={i} className="rl"><span className="chip sm" style={{ background: p.color }}>{p.letter}</span>{p.name}<b>{g.scores[i]}</b></p>)}
            <button className="dark" onClick={() => start(cfg)}>Play again</button>
            <button className="ghost" onClick={() => { gameRef.current = null; setCfg(null); bump((n) => n + 1) }}>New game</button>
          </div>
        </div>
      )}
    </div>
  )
}
