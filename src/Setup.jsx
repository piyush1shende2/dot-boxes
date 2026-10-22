import { useState } from 'react'
import { COLORS, MODES, MAX_DOTS } from './game.js'

export default function Setup({ onStart }) {
  const [kind, setKind] = useState('ai') // 'ai' = you vs AI, 'multi' = 2-7 players
  const [count, setCount] = useState(2)
  const [names, setNames] = useState(Array(7).fill(''))
  const [letters, setLetters] = useState(Array(7).fill(''))
  const [mode, setMode] = useState('simple')
  const [cr, setCr] = useState(15)
  const [cc, setCc] = useState(15)
  const clamp = (n) => Math.max(3, Math.min(MAX_DOTS, Number(n) || 3))
  const set = (arr, fn, i, v) => fn(arr.map((x, j) => (j === i ? v : x)))

  const start = () => {
    let players
    if (kind === 'ai') {
      players = [
        { name: names[0] || 'You', color: COLORS[0], letter: letters[0], ai: false },
        { name: 'AI', color: COLORS[4], letter: 'AI'.slice(0, 1), ai: true },
      ]
    } else {
      players = Array.from({ length: count }, (_, i) => ({ name: names[i] || `Player ${i + 1}`, color: COLORS[i], letter: letters[i], ai: false }))
    }
    const R = mode === 'custom' ? clamp(cr) : MODES[mode].dots
    const C = mode === 'custom' ? clamp(cc) : MODES[mode].dots
    onStart({ players, R, C })
  }
  const rows = kind === 'ai' ? 1 : count

  return (
    <div className="setup">
      <section className="card blob">
        <h2>1 · Who is playing?</h2>
        <div className="seg">
          <button className={kind === 'ai' ? 'on' : ''} onClick={() => setKind('ai')}>You vs AI</button>
          <button className={kind === 'multi' ? 'on' : ''} onClick={() => setKind('multi')}>2–7 Players</button>
        </div>
        {kind === 'multi' && (
          <div className="stepper">
            <button onClick={() => setCount(Math.max(2, count - 1))}>−</button>
            <b>{count} players</b>
            <button onClick={() => setCount(Math.min(7, count + 1))}>+</button>
          </div>
        )}
        <div className="plist">
          {Array.from({ length: rows }, (_, i) => (
            <div className="prow" key={i}>
              <span className="chip" style={{ background: COLORS[i] }}>{letters[i] || ''}</span>
              <input placeholder={kind === 'ai' ? 'You' : `Player ${i + 1}`} value={names[i]} maxLength={12} onChange={(e) => set(names, setNames, i, e.target.value)} />
              <input className="letter" placeholder="A" title="Optional letter" value={letters[i]} maxLength={1} onChange={(e) => set(letters, setLetters, i, e.target.value.toUpperCase())} />
            </div>
          ))}
          {kind === 'ai' && <div className="prow"><span className="chip" style={{ background: COLORS[4] }}>A</span><span className="aiTag">Computer (AI)</span></div>}
          <p className="hint">Leave the letter empty to mark boxes with your rainbow colour only.</p>
        </div>
      </section>

      <section className="card blob2">
        <h2>2 · Game mode</h2>
        <div className="modes">
          {Object.entries(MODES).map(([k, m]) => (
            <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}><b>{m.label}</b><small>{m.dots} × {m.dots} dots</small></button>
          ))}
          <button className={mode === 'custom' ? 'on' : ''} onClick={() => setMode('custom')}><b>Custom</b><small>up to {MAX_DOTS} × {MAX_DOTS}</small></button>
        </div>
        {mode === 'custom' && (
          <div className="custom">
            <label>Rows <input type="number" min="3" max={MAX_DOTS} value={cr} onChange={(e) => setCr(e.target.value)} onBlur={() => setCr(clamp(cr))} /></label>
            <span>×</span>
            <label>Columns <input type="number" min="3" max={MAX_DOTS} value={cc} onChange={(e) => setCc(e.target.value)} onBlur={() => setCc(clamp(cc))} /></label>
            <small>dots (min 3)</small>
          </div>
        )}
        <button className="go" onClick={start}>Start game</button>
      </section>
    </div>
  )
}
