import { useEffect, useRef, useState } from 'react';

export default function StatsCard({ title, value = 0, suffix = '', description, accent = 'cyan' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = Number.isFinite(value) ? value : 0;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        prevValueRef.current = end;
      }
    };

    requestAnimationFrame(tick);
  }, [value]);

  const colorClass =
    accent === 'green'
      ? 'text-emerald-400'
      : accent === 'amber'
        ? 'text-amber-300'
        : accent === 'red'
          ? 'text-red-400'
          : 'text-cyanglow';

  return (
    <div className="glass-panel flex flex-col justify-between p-4 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-glow-cyan/70">
      <div className="text-xs font-medium text-slate-300">{title}</div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">
        <span className={colorClass}>
          {Number.isFinite(displayValue) ? displayValue.toFixed(0) : '—'}
        </span>
        {suffix && <span className="ml-1 text-sm text-slate-400">{suffix}</span>}
      </div>
      {description && <div className="mt-2 text-[11px] text-slate-400">{description}</div>}
    </div>
  );
}

