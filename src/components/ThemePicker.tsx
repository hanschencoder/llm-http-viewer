import { useState, useRef, useEffect, useCallback } from 'react';
import { THEMES, type Theme } from '../utils/themes';

interface Props {
  current: Theme;
  onChange: (theme: Theme) => void;
}

const light = THEMES.filter(t => t.mode === 'light');
const dark  = THEMES.filter(t => t.mode === 'dark');

export function ThemePicker({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  return (
    <div className="theme-picker" ref={ref}>
      <button className="theme-btn" onClick={() => setOpen(p => !p)} title="切换主题">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <span>{current.label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="theme-dropdown">
          <div className="theme-group-label">浅色</div>
          {light.map(t => (
            <button
              key={t.id}
              className={`theme-option ${t.id === current.id ? 'active' : ''}`}
              onClick={() => { onChange(t); close(); }}
            >
              {t.label}
            </button>
          ))}
          <div className="theme-group-label">深色</div>
          {dark.map(t => (
            <button
              key={t.id}
              className={`theme-option ${t.id === current.id ? 'active' : ''}`}
              onClick={() => { onChange(t); close(); }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
