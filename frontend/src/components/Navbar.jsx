import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CloudLightning, Menu, Moon, Sun } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/predict', label: 'Predict' },
  { to: '/history', label: 'History' },
  { to: '/risk-map', label: 'Risk Map' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/about', label: 'About' }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-storm-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-skyblue to-cyanglow shadow-glow-cyan">
            <CloudLightning className="h-5 w-5 text-slate-950" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-cyanglow">
              Cloud Burst
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">Prediction &amp; Risk Analysis</div>
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-cyanglow' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-storm-800 text-slate-200 shadow-sm transition hover:border-cyanglow/70 hover:text-cyanglow"
            aria-label="Toggle theme"
          >
            {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-storm-800 text-slate-200 shadow-sm"
            aria-label="Toggle theme"
          >
            {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-storm-800 text-slate-200 shadow-sm"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-800 bg-storm-900/95 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2 text-sm font-medium ${
                    isActive ? 'text-cyanglow' : 'text-slate-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

