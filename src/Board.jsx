import { useEffect, useRef, useState } from 'react'
import { glowEdges, isFree } from './game.js'

const PAD = 18
// Two stacked canvases:
//  base - static art (boxes, lines, dots). Redrawn fully only on resize/theme/new game; each move just paints the new pieces.
//  fx   - glow, hover, pings, box pops. It only runs while something is animating (and is capped at ~30fps).
// quality: 'full' (pulsing glow + particles) | 'lite' (static glow, no blur, small effects) | 'off' (no animations)
export default function Board({ game, version, cell, night, onEdge, disabled, quality, onSlow }) {
  const anim = quality !== 'off', lite = quality !== 'full'
  const base = useRef(null), fx = useRef(null), hover = useRef(null), anims = useRef([])
  const seen = useRef(-1), kick = useRef(() => {}), drawn = useRef({ g: null, moves: -1, key: '' }), slowRef = useRef(onSlow)
  const [cursor, setCursor] = useState('default')
  slowRef.current = onSlow
  const { R, C } = game
  const W = (C - 1) * cell + PAD * 2, H = (R - 1) * cell + PAD * 2
  let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1 : 2)
  if (W * H * dpr * dpr > 6e6) dpr = Math.max(1, Math.sqrt(6e6 / (W * H))) // cap canvas pixels on huge boards
  const px = (k) => PAD + k * cell
  const seg = (e) => (e.t === 'h' ? [px(e.c), px(e.r), px(e.c + 1), px(e.r)] : [px(e.c), px(e.r), px(e.c), px(e.r + 1)])

  // ---- static layer ----
  useEffect(() => {
    const c = base.current, x = c.getContext('2d'), d = drawn.current
    const key = `${W}x${H}|${cell}|${night}|${dpr}`
    const ink = night ? '#d7e2ff' : '#3b332c', faint = night ? 'rgba(160,190,255,.16)' : 'rgba(90,70,45,.12)'
    const lw = Math.max(3, cell * 0.16), dr = Math.max(2.5, cell * 0.11)
    const incremental = d.g === game && d.key === key && game.moves === d.moves + 1 && game.last
    if (d.g === game && d.key === key && game.moves === d.moves) return

    const box = (r, k) => {
      const o = game.own[r * (C - 1) + k]; if (o < 0) return
      const p = game.players[o], X = px(k), Y = px(r)
      x.fillStyle = p.color; x.fillRect(X + 1, Y + 1, cell - 2, cell - 2)
      x.fillStyle = 'rgba(255,255,255,.28)'; x.fillRect(X + 1, Y + 1, cell - 2, (cell - 2) * 0.38) // 3D bevel
      x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(X + 1, Y + cell * 0.72, cell - 2, cell * 0.28 - 1)
      if (p.letter && cell >= 14) { x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `700 ${Math.max(8, cell * 0.55)}px system-ui, sans-serif`; x.fillText(p.letter, X + cell / 2, Y + cell / 2 + 1) }
      else if (cell >= 18) { // tiny house glyph
        const s = cell * 0.48, cx = X + cell / 2, cy = Y + cell / 2
        x.fillStyle = 'rgba(255,255,255,.92)'; x.beginPath(); x.moveTo(cx - s * .7, cy - s * .05); x.lineTo(cx, cy - s * .7); x.lineTo(cx + s * .7, cy - s * .05); x.fill()
        x.fillRect(cx - s * .5, cy, s, s * .6)
      }
    }
    const edge = (t, r, k) => {
      const o = t === 'h' ? game.h[r * (C - 1) + k] : game.v[r * C + k]; if (o < 0) return
      x.strokeStyle = game.players[o].color; x.lineWidth = lw; x.lineCap = 'round'
      x.beginPath(); x.moveTo(px(k), px(r)); t === 'h' ? x.lineTo(px(k + 1), px(r)) : x.lineTo(px(k), px(r + 1)); x.stroke()
    }
    const dot = (r, k) => {
      x.fillStyle = ink; x.beginPath(); x.arc(px(k), px(r), dr, 0, 7); x.fill()
      if (cell >= 24 && !lite) { x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.arc(px(k) - dr * .3, px(r) - dr * .3, dr * .35, 0, 7); x.fill() }
    }

    if (incremental) {
      const l = game.last
      edge(l.t, l.r, l.c)
      const ends = l.t === 'h' ? [[l.r, l.c], [l.r, l.c + 1]] : [[l.r, l.c], [l.r + 1, l.c]]
      ends.forEach(([r, k]) => dot(r, k))
      for (const [r, k] of l.boxes) {
        box(r, k)
        edge('h', r, k); edge('h', r + 1, k); edge('v', r, k); edge('v', r, k + 1)
        dot(r, k); dot(r, k + 1); dot(r + 1, k); dot(r + 1, k + 1)
      }
    } else { // full redraw
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr)
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H)
      for (let r = 0; r < R - 1; r++) for (let k = 0; k < C - 1; k++) box(r, k)
      x.strokeStyle = faint; x.lineWidth = 1; x.beginPath()
      for (let r = 0; r < R; r++) { x.moveTo(px(0), px(r)); x.lineTo(px(C - 1), px(r)) }
      for (let k = 0; k < C; k++) { x.moveTo(px(k), px(0)); x.lineTo(px(k), px(R - 1)) }
      x.stroke()
      x.lineCap = 'round'; x.lineWidth = lw
      game.players.forEach((p, i) => { // one path per player = far fewer canvas calls
        x.strokeStyle = p.color; x.beginPath()
        for (let r = 0; r < R; r++) for (let k = 0; k < C - 1; k++) if (game.h[r * (C - 1) + k] === i) { x.moveTo(px(k), px(r)); x.lineTo(px(k + 1), px(r)) }
        for (let r = 0; r < R - 1; r++) for (let k = 0; k < C; k++) if (game.v[r * C + k] === i) { x.moveTo(px(k), px(r)); x.lineTo(px(k), px(r + 1)) }
        x.stroke()
      })
      x.fillStyle = ink; x.beginPath()
      for (let r = 0; r < R; r++) for (let k = 0; k < C; k++) { x.moveTo(px(k) + dr, px(r)); x.arc(px(k), px(r), dr, 0, 7) }
      x.fill()
      if (cell >= 24 && !lite) {
        x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath()
        for (let r = 0; r < R; r++) for (let k = 0; k < C; k++) { const hx = px(k) - dr * .3, hy = px(r) - dr * .3; x.moveTo(hx + dr * .35, hy); x.arc(hx, hy, dr * .35, 0, 7) }
        x.fill()
      }
    }
    d.g = game; d.key = key; d.moves = game.moves
  }, [game, version, cell, night, W, H, dpr, lite])

  // ---- queue animations for the newest move ----
  useEffect(() => {
    const l = game.last
    if (!l || l.id === seen.current) { if (!l) seen.current = -1; return }
    seen.current = l.id
    if (!anim) return
    const t0 = performance.now(), col = game.players[l.by].color
    anims.current.push({ k: 'ping', e: l, col, t0, d: 520 })
    l.boxes.forEach(([r, c, p]) => anims.current.push({ k: 'box', r, c, col: game.players[p].color, t0, d: lite ? 450 : 800 }))
    kick.current()
  }, [game, version, anim, lite])

  // ---- fx layer sizing ----
  useEffect(() => { const c = fx.current; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr) }, [W, H, dpr])

  // ---- animated layer: runs only while something is moving ----
  useEffect(() => {
    const x = fx.current.getContext('2d')
    const lw = Math.max(3, cell * 0.16)
    let raf = 0, last = 0, frames = 0, acc = 0
    const line = (e) => { const [a, b, d, f] = seg(e); x.beginPath(); x.moveTo(a, b); x.lineTo(d, f); x.stroke() }
    const frame = (now) => {
      raf = 0
      if (!lite && last && now - last < 30) { raf = requestAnimationFrame(frame); return } // ~30fps cap
      if (last && !lite) { acc += now - last; if (++frames >= 45) { if (acc / frames > 45 && slowRef.current) slowRef.current(); acc = 0; frames = 0 } }
      last = now
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); x.lineCap = 'round'
      const glow = glowEdges(game)
      const pulse = !lite && anim ? 0.5 + 0.5 * Math.sin(now / 260) : 0.6
      for (const e of glow) { // every player's latest line glows
        const col = game.players[e.p].color
        x.save()
        if (lite) { x.globalAlpha = 0.35; x.strokeStyle = col; x.lineWidth = lw * 2.4; line(e); x.globalAlpha = 1 }
        else { x.shadowColor = col; x.shadowBlur = 8 + 16 * pulse }
        x.strokeStyle = col; x.lineWidth = lw * 1.3; line(e)
        x.shadowBlur = 0; x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = Math.max(1.5, lw * 0.3); line(e); x.restore()
      }
      const h = hover.current
      if (h && h.free && !disabled) { x.strokeStyle = game.players[game.cur].color + '88'; x.lineWidth = lw; line(h) }
      anims.current = anims.current.filter((a) => now - a.t0 < a.d)
      for (const a of anims.current) {
        const p = (now - a.t0) / a.d
        if (a.k === 'ping') {
          const [x1, y1, x2, y2] = seg(a.e); x.strokeStyle = a.col; x.globalAlpha = 1 - p; x.lineWidth = 2
          x.beginPath(); x.arc((x1 + x2) / 2, (y1 + y2) / 2, cell * (0.2 + 0.8 * p), 0, 7); x.stroke(); x.globalAlpha = 1
        } else if (a.k === 'box') {
          const cx = px(a.c) + cell / 2, cy = px(a.r) + cell / 2, s = cell * (0.5 + 0.7 * Math.sin(Math.min(1, p * 1.4) * Math.PI / 2))
          x.globalAlpha = Math.max(0, 1 - p); x.fillStyle = '#fff'; x.fillRect(cx - s / 2, cy - s / 2, s, s)
          if (!lite) {
            x.fillStyle = a.col
            for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, d = cell * (0.4 + p * 1.1); x.beginPath(); x.arc(cx + Math.cos(an) * d, cy + Math.sin(an) * d, Math.max(1, cell * 0.1 * (1 - p)), 0, 7); x.fill() }
          }
          x.globalAlpha = 1
        } else if (a.k === 'bad') { // tried to redraw an existing line
          x.strokeStyle = '#ff4d4d'; x.globalAlpha = 1 - p; x.lineWidth = lw * 1.2
          x.save(); x.translate(Math.sin(p * 30) * 2, 0); line(a.e); x.restore(); x.globalAlpha = 1
        }
      }
      // keep looping only while something moves; otherwise draw once and sleep
      if ((!lite && anim && glow.length) || anims.current.length) raf = requestAnimationFrame(frame); else last = 0
    }
    kick.current = () => { if (!raf) raf = requestAnimationFrame(frame) }
    kick.current()
    return () => { cancelAnimationFrame(raf); kick.current = () => {} }
  }, [game, version, W, H, cell, disabled, anim, lite, dpr])

  // offsetX/offsetY are in the canvas's own coordinates, so picking still works under the 3D tilt.
  const locate = (e) => {
    const gx = (e.nativeEvent.offsetX - PAD) / cell, gy = (e.nativeEvent.offsetY - PAD) / cell
    const hr = Math.round(gy), hc = Math.floor(gx), vc = Math.round(gx), vr = Math.floor(gy)
    const dh = Math.abs(gy - hr), dv = Math.abs(gx - vc)
    let b = null
    if (hr >= 0 && hr < R && hc >= 0 && hc < C - 1 && dh < 0.35) b = { t: 'h', r: hr, c: hc, d: dh }
    if (vr >= 0 && vr < R - 1 && vc >= 0 && vc < C && dv < 0.35 && (!b || dv < b.d)) b = { t: 'v', r: vr, c: vc, d: dv }
    if (b) b.free = isFree(game, b.t, b.r, b.c)
    return b
  }
  const onMove = (e) => {
    const m = locate(e), o = hover.current
    hover.current = m
    const cur = !m ? 'default' : m.free && !disabled ? 'pointer' : 'not-allowed'
    if (cur !== cursor) setCursor(cur)
    if (!o !== !m || (o && m && (o.t !== m.t || o.r !== m.r || o.c !== m.c))) kick.current()
  }
  const onClick = (e) => {
    if (disabled) return
    const m = locate(e); if (!m) return
    if (!m.free) { anims.current.push({ k: 'bad', e: m, t0: performance.now(), d: 380 }); kick.current(); return } // drawn lines are permanent
    onEdge(m.t, m.r, m.c)
  }
  return (
    <div className="cvwrap" style={{ width: W, height: H }}>
      <canvas ref={base} style={{ width: W, height: H }} />
      <canvas ref={fx} style={{ width: W, height: H, cursor, touchAction: 'manipulation' }}
        onPointerMove={onMove} onPointerLeave={() => { hover.current = null; setCursor('default'); kick.current() }} onClick={onClick} />
    </div>
  )
}
