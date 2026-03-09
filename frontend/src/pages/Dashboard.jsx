import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { toast } from 'react-toastify';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import RiskGauge from '../components/RiskGauge';
import WeatherWidget from '../components/WeatherWidget';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [regions, setRegions] = useState({});

  const loadData = async () => {
    try {
      const [histRes, infoRes, alertsRes, regionsRes] = await Promise.all([
        api.get('/predictions/history', { params: { skip: 0, limit: 200 } }),
        api.get('/model/info'),
        api.get('/alerts', { params: { active_only: true } }),
        api.get('/alerts/regions')
      ]);
      setHistory(histRes.data);
      setModelInfo(infoRes.data);
      setAlerts(alertsRes.data);
      setRegions(regionsRes.data?.regions || {});
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPredictions = history.length;
  const activeAlerts = alerts.length;
  const highRiskRegions = Object.keys(regions).length;
  const modelAccuracy = modelInfo?.accuracy ? modelInfo.accuracy * 100 : 0;

  const recentRiskScore =
    history.length > 0 ? history[0].confidence_score * 100 : 0;

  const trendData = useMemo(
    () =>
      history
        .slice()
        .reverse()
        .map((h, idx) => ({
          id: h.id,
          index: idx + 1,
          risk_score: h.confidence_score * 100
        })),
    [history]
  );

  const featureImportanceData = useMemo(() => {
    if (!modelInfo?.feature_importance) return [];
    return Object.entries(modelInfo.feature_importance).map(([name, value]) => ({
      name,
      importance: value
    }));
  }, [modelInfo]);

  const recent10 = useMemo(() => history.slice(0, 10), [history]);

  const severityColor = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s.includes('low')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (s.includes('moderate') || s.includes('medium'))
      return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    if (s.includes('high')) return 'bg-orange-500/20 text-orange-200 border-orange-500/40';
    if (s.includes('extreme') || s.includes('severe'))
      return 'bg-red-500/20 text-red-200 border-red-500/40';
    return 'bg-slate-700/40 text-slate-200 border-slate-600/60';
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cloud Burst dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Monitor prediction volume, active alerts, model health and live weather signals.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="self-start rounded-full border border-slate-700 bg-storm-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-cyanglow/70"
        >
          Refresh
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total predictions"
          value={totalPredictions}
          description="Records stored in the last window."
        />
        <StatsCard
          title="Active alerts"
          value={activeAlerts}
          accent={activeAlerts > 0 ? 'amber' : 'green'}
          description="Cloud burst related weather alerts online."
        />
        <StatsCard
          title="High-risk regions"
          value={highRiskRegions}
          accent={highRiskRegions > 0 ? 'red' : 'green'}
          description="Regions with at least one active alert."
        />
        <StatsCard
          title="Model accuracy (synthetic)"
          value={modelAccuracy}
          suffix="%"
          accent="cyan"
          description="Evaluated on freshly generated synthetic scenarios."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
        <div className="space-y-4">
          <div className="glass-panel flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Historical risk trend</span>
              <span className="text-slate-400">Last {trendData.length} predictions</span>
            </div>
            <div className="h-56">
              {trendData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Not enough data to display trend.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="index" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e293b',
                        borderRadius: 8,
                        fontSize: 11
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#00d4ff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel flex flex-col p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Feature importance</span>
              <span className="text-slate-400 text-[11px]">
                Top drivers of cloud burst classification
              </span>
            </div>
            <div className="h-56">
              {featureImportanceData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Model information not available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureImportanceData}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={(v) => v.replace(/_/g, ' ')}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <ReTooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e293b',
                        borderRadius: 8,
                        fontSize: 11
                      }}
                    />
                    <Bar dataKey="importance" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <WeatherWidget />
          <RiskGauge value={recentRiskScore} />
          <div className="glass-panel max-h-52 overflow-hidden p-4 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-white">Active alerts</span>
              <span className="text-slate-400 text-[11px]">
                {activeAlerts} currently online
              </span>
            </div>
            <div className="space-y-2 overflow-auto max-h-40 pr-1">
              {alerts.length === 0 && (
                <div className="text-slate-500">No active alerts.</div>
              )}
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col gap-0.5 rounded-xl border px-3 py-2 ${severityColor(a.severity)}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold uppercase tracking-wide">
                      {a.severity}
                    </span>
                    <span className="text-slate-200">{a.region}</span>
                  </div>
                  <div className="text-[11px] text-slate-100">{a.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Recent predictions</span>
          <span className="text-slate-400 text-[11px]">Last 10 records</span>
        </div>
        <div className="max-h-64 overflow-auto text-[11px]">
          <table className="min-w-full border-collapse">
            <thead className="bg-storm-800/90 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Lat/Lon</th>
                <th className="px-3 py-2 text-left font-medium">Temp</th>
                <th className="px-3 py-2 text-left font-medium">Humidity</th>
                <th className="px-3 py-2 text-left font-medium">Rain 24h</th>
                <th className="px-3 py-2 text-left font-medium">Clouds</th>
                <th className="px-3 py-2 text-left font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {recent10.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                    No prediction records found.
                  </td>
                </tr>
              )}
              {recent10.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-800/80 hover:bg-storm-800/70"
                >
                  <td className="px-3 py-2 text-slate-300">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.latitude.toFixed(2)}, {row.longitude.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.temperature.toFixed(1)}°C
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.humidity.toFixed(0)}%
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.rainfall.toFixed(1)} mm
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.cloud_cover.toFixed(0)}%
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {(row.confidence_score * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

