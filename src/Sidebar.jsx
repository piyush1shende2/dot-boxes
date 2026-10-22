import { useState } from 'react'
import { Icon } from './Icon.jsx'
import Dropdown from './Dropdown.jsx'
import { MODES, MAX_DOTS } from './game.js'

const MODE_ICON = { simple: 'home', medium: 'building', hard: 'bed', custom: 'palm' }
const MODE_OPTS = [...Object.entries(MODES).map(([v, m]) => ({ v, t: `${m.label} · ${m.dots}×${m.dots}` })), { v: 'custom', t: 'Custom · up to 100' }]
const PC_OPTS = [{ v: 'ai', t: 'You vs AI' }, ...[2, 3, 4, 5, 6, 7].map((n) => ({ v: String(n), t: `${n} players` }))]

function Row({ icon, title, sub, open, onToggle, children }) {
  return (
    <div className={'frow' + (open ? ' open' : '')}>
      <button className="frow-h" onClick={onToggle}>
        <Icon n={icon} size={22} />
        <span><b>{title}</b><small>{sub}</small></span>
        <span className="dd-ch"><Icon n="chevron" size={16} /></span>
      </button>
      <div className="frow-b"><div>{children}</div></div>
    </div>
  )
}
const Seg = ({ value, opts, onChange }) => (
  <div className="seg">{opts.map(([v, t]) => <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{t}</button>)}</div>
)

export default function Sidebar({ g, cfg, st, setSt, who, status, onStart, onRestart, onNew, onMode, zoom, setZoom, speed, setSpeed, quality, setQuality, players }) {
  const [open, setOpen] = useState(null)
  const tg = (k) => setOpen(open === k ? null : k)
  const upd = (k, i, v) => setSt((s) => ({ ...s, [k]: s[k].map((x, j) => (j === i ? v : x)) }))
  const humans = st.pc === 'ai' ? 1 : Number(st.pc)
  const modeKey = g ? cfg.mode : st.mode
  const dots = g ? `${g.R} × ${g.C}` : st.mode === 'custom' ? `${st.cr} × ${st.cc}` : `${MODES[st.mode].dots} × ${MODES[st.mode].dots}`

  return (
    <aside className="side">
      <div className="who">
        <span className="avatar" style={{ background: who.color }}>{who.letter || who.name[0]}</span>
        <div><b>{who.name}</b><small><i className="online" />{status}</small></div>
      </div>

      {!g ? (
        <>
          <h3>Players</h3>
          <Dropdown big value={st.pc} options={PC_OPTS} onChange={(pc) => setSt((s) => ({ ...s, pc }))} />
          <div className="radios">
            {MODE_OPTS.map((o) => (
              <button key={o.v} className={'radio' + (st.mode === o.v ? ' on' : '')} onClick={() => setSt((s) => ({ ...s, mode: o.v }))}>
                <span className="rc"><Icon n="check" size={13} /></span><Icon n={MODE_ICON[o.v]} size={20} /><span>{o.t.split(' · ')[0]}</span>
              </button>
            ))}
          </div>
          <h3>Filters</h3>
          <Row icon="users" title="Players" sub={st.pc === 'ai' ? 'You vs AI' : `${humans} players`} open={open === 'p'} onToggle={() => tg('p')}>
            {Array.from({ length: humans }, (_, i) => (
              <div className="prow" key={i}>
                <span className="chip" style={{ background: players[i].color }}>{st.letters[i]}</span>
                <input placeholder={st.pc === 'ai' ? 'You' : `Player ${i + 1}`} maxLength={12} value={st.names[i]} onChange={(e) => upd('names', i, e.target.value)} />
                <input className="letter" placeholder="A" maxLength={1} title="Optional letter" value={st.letters[i]} onChange={(e) => upd('letters', i, e.target.value.toUpperCase())} />
              </div>
            ))}
          </Row>
          <Row icon="grid" title="Grid size" sub={`${dots} dots`} open={open === 'g'} onToggle={() => tg('g')}>
            <div className="custom">
              {[['cr', 'Rows'], ['cc', 'Cols']].map(([k, l]) => (
                <label key={k}>{l}
                  <input type="number" min="3" max={MAX_DOTS} value={st[k]}
                    onChange={(e) => setSt((s) => ({ ...s, [k]: e.target.value, mode: 'custom' }))}
                    onBlur={() => setSt((s) => ({ ...s, [k]: Math.max(3, Math.min(MAX_DOTS, Number(s[k]) || 3)) }))} />
                </label>
              ))}
            </div>
            <small className="hint">3 – {MAX_DOTS} dots per side (custom mode)</small>
          </Row>
          <Row icon="clock" title="AI speed" sub={speed} open={open === 's'} onToggle={() => tg('s')}>
            <Seg value={speed} opts={[['fast', 'fast'], ['normal', 'normal'], ['slow', 'slow']]} onChange={setSpeed} />
          </Row>
          <Row icon="star" title="Effects" sub={{ full: 'Full', lite: 'Lite (smooth)', off: 'Off' }[quality]} open={open === 'f'} onToggle={() => tg('f')}>
            <Seg value={quality} opts={[['full', 'Full'], ['lite', 'Lite'], ['off', 'Off']]} onChange={setQuality} />
            <small className="hint">Lite is best for older phones and PCs.</small>
          </Row>
          <button className="dark" onClick={onStart}>Start game</button>
        </>
      ) : (
        <>
          <h3>Game Mode</h3>
          <Dropdown big value={modeKey} options={MODE_OPTS.filter((o) => o.v !== 'custom' || modeKey === 'custom')} onChange={onMode} />
          <div className="radios">
            {[['fit', 'Fit to screen', 'grid', null], ['m', 'Medium', 'building', 30], ['l', 'Large', 'palm', 48]].map(([k, t, ic, z]) => (
              <button key={k} className={'radio' + ((z === null ? zoom === null : zoom === z) ? ' on' : '')} onClick={() => setZoom(z)}>
                <span className="rc"><Icon n="check" size={13} /></span><Icon n={ic} size={20} /><span>{t}</span>
              </button>
            ))}
          </div>
          <h3>Match</h3>
          <Row icon="users" title="Players" sub={`${g.players.length} playing`} open={open === 'p'} onToggle={() => tg('p')}>
            {g.players.map((p, i) => <div className="prow" key={i}><span className="chip sm" style={{ background: p.color }}>{p.letter}</span><span>{p.name}</span><b style={{ marginLeft: 'auto' }}>{g.scores[i]}</b></div>)}
          </Row>
          <Row icon="grid" title="Board" sub={`${dots} dots`} open={open === 'g'} onToggle={() => tg('g')}>
            <small className="hint">{g.total} boxes · {g.R * (g.C - 1) + (g.R - 1) * g.C} lines</small>
          </Row>
          <Row icon="tag" title="Moves" sub={`${g.moves} played`} open={open === 'm'} onToggle={() => tg('m')}>
            <small className="hint">Completing a box gives you another turn.</small>
          </Row>
          <Row icon="star" title="Boxes left" sub={`${g.total - g.claimed}`} open={open === 'b'} onToggle={() => tg('b')}>
            <div className="bar"><i style={{ width: `${(g.claimed / g.total) * 100}%` }} /></div>
          </Row>
          <button className="dark" onClick={onRestart}>Restart</button>
          <button className="ghost" onClick={onNew}>New game</button>
        </>
      )}
    </aside>
  )
}
