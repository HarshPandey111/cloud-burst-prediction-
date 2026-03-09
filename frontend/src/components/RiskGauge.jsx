export default function RiskGauge({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped < 25 ? '#22c55e' : clamped < 50 ? '#eab308' : clamped < 75 ? '#fb923c' : '#f97373';

  return (
    <div className="glass-panel flex flex-col items-center justify-center p-4">
      <div className="text-xs font-semibold text-slate-300">Current risk level</div>
      <div className="relative mt-3 h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s ease-out' }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rotate-90">
          <div className="text-2xl font-semibold text-white">{clamped.toFixed(0)}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">/ 100 risk</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        {clamped < 25
          ? 'Low risk'
          : clamped < 50
            ? 'Moderate conditions'
            : clamped < 75
              ? 'High localized risk'
              : 'Extreme risk – monitor closely'}
      </div>
    </div>
  );
}

