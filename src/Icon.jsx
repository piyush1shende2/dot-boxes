const P = {
  chevron: 'M6 9l6 6 6-6', check: 'M5 12.5l4.5 4.5L19 7',
  search: 'M21 21l-4.3-4.3 M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
  sliders: 'M4 7h9 M17 7h3 M4 17h3 M11 17h9 M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  home: 'M3 11l9-7.5 9 7.5 M5 10v10h14V10 M10 20v-5h4v5',
  building: 'M5 21V4h10v17 M15 21V10h4v11 M8 8h4 M8 12h4 M8 16h4 M3 21h18',
  bed: 'M3 19V6 M3 15h18v4 M21 15v-3a3 3 0 0 0-3-3h-7v6',
  palm: 'M12 21V10 M12 10c-3-4-7-3-8-1 M12 10c3-4 7-3 8-1 M12 10c0-4 1-6 3-7 M12 10c0-4-1-6-3-7',
  pin: 'M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  tag: 'M3 12V4h8l10 10-8 8z M7.5 8.5h.01',
  users: 'M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M20 20v-2a3 3 0 0 0-2-2.8 M16 4.2a3 3 0 0 1 0 5.6',
  grid: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
}
export function Icon({ n, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n]} />
    </svg>
  )
}

// Miniature 3D house (front wall + side wall + two roof planes). Roof = player colour; windows light up on their turn.
export function House({ color, lit, size = 84 }) {
  return (
    <svg viewBox="0 0 100 90" width={size} className={'house' + (lit ? ' lit' : '')} aria-hidden="true">
      <ellipse cx="50" cy="85" rx="44" ry="5" fill="rgba(0,0,0,.2)" />
      <circle cx="7" cy="72" r="8" fill="#5f9a5a" /><rect x="6" y="76" width="2" height="10" fill="#6b4a2f" />
      <polygon points="64,46 90,36 90,78 64,86" fill="#c9bcaa" />
      <rect x="14" y="46" width="50" height="40" fill="#f6eee2" />
      <polygon points="8,48 39,16 70,48" fill={color} />
      <polygon points="39,16 66,6 96,38 70,48" fill={color} /><polygon points="39,16 66,6 96,38 70,48" fill="rgba(0,0,0,.3)" />
      <rect className="hw" x="21" y="55" width="10" height="12" rx="1.5" /><rect className="hw" x="47" y="55" width="10" height="12" rx="1.5" />
      <rect x="34" y="68" width="12" height="18" rx="2" fill="#7a5233" />
      <polygon className="hw" points="72,56 82,52 82,62 72,66" />
    </svg>
  )
}
