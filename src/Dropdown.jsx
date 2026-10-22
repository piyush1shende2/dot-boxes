import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'

export default function Dropdown({ value, options, onChange, big, prefix = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', h)
    return () => document.removeEventListener('pointerdown', h)
  }, [])
  const cur = options.find((o) => o.v === value)
  return (
    <div className={'dd' + (big ? ' big' : '')} ref={ref}>
      <button className="dd-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{prefix}{cur ? cur.t : ''}</span>
        <span className={'dd-ch' + (open ? ' up' : '')}><Icon n="chevron" size={big ? 20 : 14} /></span>
      </button>
      {open && (
        <ul className="dd-list">
          {options.map((o) => (
            <li key={o.v}><button className={o.v === value ? 'on' : ''} onClick={() => { onChange(o.v); setOpen(false) }}>{o.t}</button></li>
          ))}
        </ul>
      )}
    </div>
  )
}
