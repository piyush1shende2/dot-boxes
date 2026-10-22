// Pill toggle: night = moon knob on the left, starry city; day = sun knob on the right, clouds.
export default function ThemeToggle({ night, onToggle }) {
  return (
    <button className={'tg' + (night ? ' night' : '')} onClick={onToggle} role="switch" aria-checked={night} aria-label="Toggle dark mode">
      <svg className="tg-sky" viewBox="0 0 104 52" aria-hidden="true">
        <g className="tg-stars" fill="#fff">
          <circle cx="62" cy="14" r="1.6" /><circle cx="76" cy="9" r="1.2" /><circle cx="90" cy="16" r="1.5" /><circle cx="84" cy="24" r="1" /><circle cx="70" cy="22" r="1" />
        </g>
        <g className="tg-clouds" fill="#fff"><ellipse cx="38" cy="12" rx="10" ry="5" /><ellipse cx="46" cy="9" rx="6" ry="5" /><ellipse cx="68" cy="18" rx="8" ry="4" /></g>
        <g className="tg-city"><rect x="64" y="26" width="8" height="26" /><rect x="74" y="20" width="9" height="32" /><rect x="85" y="28" width="8" height="24" /><rect x="52" y="34" width="8" height="18" /></g>
      </svg>
      <span className="tg-knob"><i /></span>
    </button>
  )
}
