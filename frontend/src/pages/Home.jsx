import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CloudRainWind, Radar, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Real-time <span className="text-cyanglow">Cloud Burst</span> prediction
            and <span className="text-skyblue">risk analysis</span>.
          </h1>
          <p className="max-w-xl text-sm text-slate-300">
            Monitor atmospheric conditions, forecast extreme rainfall, and stay ahead of
            high-risk weather events with an intelligent, data-driven dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-skyblue to-cyanglow px-5 py-2 text-sm font-medium text-slate-950 shadow-glow-cyan transition hover:brightness-110"
            >
              Run prediction
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-storm-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyanglow/70"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Risk index</div>
              <ShieldCheck className="h-4 w-4 text-cyanglow" />
            </div>
            <div className="mt-4 text-3xl font-semibold text-cyanglow">72%</div>
            <div className="mt-1 text-xs text-slate-400">High localized risk</div>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Storm activity</div>
              <CloudRainWind className="h-4 w-4 text-skyblue" />
            </div>
            <div className="mt-4 text-sm text-slate-200">
              Convective cells detected with intense cloud cover and high humidity.
            </div>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Model status</div>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-4 text-sm text-slate-200">Models online and serving predictions.</div>
          </div>
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Coverage</div>
              <Radar className="h-4 w-4 text-cyanglow" />
            </div>
            <div className="mt-4 text-2xl font-semibold text-white">Global</div>
            <div className="mt-1 text-xs text-slate-400">Latitude / longitude aware predictions.</div>
          </div>
        </div>
      </section>
    </main>
  );
}

