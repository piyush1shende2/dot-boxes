// Pure game logic (no React). Dots grid is R x C dots -> (R-1) x (C-1) boxes.
export const COLORS = ['#e8453c', '#f28c28', '#f2c94c', '#3fae5a', '#2f80ed', '#5b4bc4', '#a24bd1'] // rainbow
export const MODES = {
  simple: { label: 'Simple', dots: 10 },
  medium: { label: 'Medium', dots: 30 },
  hard: { label: 'Hard', dots: 50 },
}
export const MAX_DOTS = 100

export function createGame(R, C, players) {
  return {
    R, C, players,
    h: new Int8Array(R * (C - 1)).fill(-1), // horizontal edges, value = player who drew it
    v: new Int8Array((R - 1) * C).fill(-1), // vertical edges
    own: new Int8Array((R - 1) * (C - 1)).fill(-1), // box owners
    scores: players.map(() => 0),
    cur: 0, claimed: 0, total: (R - 1) * (C - 1), done: false, last: null,
    moves: 0, lastBy: players.map(() => null), // lastBy[p] = latest edge drawn by player p
  }
}
const hi = (g, r, c) => r * (g.C - 1) + c
const vi = (g, r, c) => r * g.C + c

export function sides(g, r, c) {
  return (g.h[hi(g, r, c)] >= 0) + (g.h[hi(g, r + 1, c)] >= 0) + (g.v[vi(g, r, c)] >= 0) + (g.v[vi(g, r, c + 1)] >= 0)
}
// Boxes touching an edge ('h' or 'v')
function adjBoxes(g, t, r, c) {
  const out = []
  if (t === 'h') { if (r > 0) out.push([r - 1, c]); if (r < g.R - 1) out.push([r, c]) }
  else { if (c > 0) out.push([r, c - 1]); if (c < g.C - 1) out.push([r, c]) }
  return out
}
export function isFree(g, t, r, c) {
  if (t === 'h') return r >= 0 && r < g.R && c >= 0 && c < g.C - 1 && g.h[hi(g, r, c)] < 0
  return r >= 0 && r < g.R - 1 && c >= 0 && c < g.C && g.v[vi(g, r, c)] < 0
}
// Returns number of boxes completed (-1 if illegal). Completing a box keeps the turn.
export function applyMove(g, t, r, c) {
  if (g.done || !isFree(g, t, r, c)) return -1
  if (t === 'h') g.h[hi(g, r, c)] = g.cur; else g.v[vi(g, r, c)] = g.cur
  let got = 0; const nb = []
  g.moves++; g.lastBy[g.cur] = { t, r, c }
  for (const [br, bc] of adjBoxes(g, t, r, c)) {
    if (sides(g, br, bc) === 4 && g.own[br * (g.C - 1) + bc] < 0) {
      g.own[br * (g.C - 1) + bc] = g.cur; g.scores[g.cur]++; g.claimed++; got++; nb.push([br, bc, g.cur])
    }
  }
  g.last = { t, r, c, got, by: g.cur, id: g.moves, boxes: nb }
  if (g.claimed === g.total) g.done = true
  else if (!got) g.cur = (g.cur + 1) % g.players.length
  return got
}
export function winners(g) {
  const best = Math.max(...g.scores)
  return g.scores.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0)
}
// Simple AI: 1) take any box with 3 sides, 2) otherwise a safe edge (no box reaches 3 sides), 3) otherwise random.
export function aiMove(g) {
  const take = [], safe = [], any = []
  const scan = (t, rows, cols) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!isFree(g, t, r, c)) continue
      let best = 0
      for (const [br, bc] of adjBoxes(g, t, r, c)) best = Math.max(best, sides(g, br, bc))
      const m = [t, r, c]; any.push(m)
      if (best === 3) take.push(m); else if (best < 2) safe.push(m)
    }
  }
  scan('h', g.R, g.C - 1); scan('v', g.R - 1, g.C)
  const pick = (a) => a[Math.floor(Math.random() * a.length)]
  return pick(take.length ? take : safe.length ? safe : any)
}

// Edges that should glow: every player's latest line, except the player whose turn it is
// (their glow ends when their turn comes round again) - unless they just scored and keep the turn.
export function glowEdges(g) {
  const out = []
  g.lastBy.forEach((e, p) => {
    if (e && (g.done || p !== g.cur || (g.last && g.last.by === p))) out.push({ ...e, p })
  })
  return out
}
