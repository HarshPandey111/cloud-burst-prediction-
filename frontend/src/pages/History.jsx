import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const PAGE_SIZE = 10;
const riskLevels = ['low', 'moderate', 'high', 'extreme'];

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [riskFilter, setRiskFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/predictions/history', {
        params: { skip: 0, limit: 200 }
      });
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((row) => {
        if (riskFilter && String(row.risk_level).toLowerCase() !== riskFilter) return false;
        if (locationFilter) {
          const loc = `${row.latitude.toFixed(2)}, ${row.longitude.toFixed(2)}`.toLowerCase();
          if (!loc.includes(locationFilter.toLowerCase())) return false;
        }
        if (dateFrom) {
          const d = new Date(row.created_at);
          if (d < new Date(dateFrom)) return false;
        }
        if (dateTo) {
          const d = new Date(row.created_at);
          if (d > new Date(dateTo + 'T23:59:59')) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'created_at') {
          return (new Date(a.created_at) - new Date(b.created_at)) * dir;
        }
        if (sortBy === 'risk_level') {
          return String(a.risk_level).localeCompare(String(b.risk_level)) * dir;
        }
        if (sortBy === 'confidence_score') {
          return (a.confidence_score - b.confidence_score) * dir;
        }
        if (sortBy === 'temperature') {
          return (a.temperature - b.temperature) * dir;
        }
        return 0;
      });
  }, [items, riskFilter, locationFilter, dateFrom, dateTo, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onSort = (column) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.info('No rows to export.');
      return;
    }
    const header = [
      'Date',
      'Latitude',
      'Longitude',
      'Temperature',
      'Humidity',
      'Pressure',
      'WindSpeed',
      'Rain24h',
      'CloudCover',
      'RiskLevel',
      'Score'
    ];
    const rows = filtered.map((r) => [
      new Date(r.created_at).toISOString(),
      r.latitude,
      r.longitude,
      r.temperature,
      r.humidity,
      r.pressure,
      r.wind_speed,
      r.rainfall,
      r.cloud_cover,
      r.risk_level,
      r.confidence_score
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cloud_burst_predictions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const riskChipClass = (level) => {
    const l = String(level || '').toLowerCase();
    if (l === 'low') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (l === 'moderate') return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    if (l === 'high') return 'bg-orange-500/20 text-orange-200 border-orange-500/40';
    if (l === 'extreme') return 'bg-red-500/20 text-red-200 border-red-500/40';
    return 'bg-slate-700/40 text-slate-200 border-slate-600/60';
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Prediction history</h1>
          <p className="mt-1 text-sm text-slate-300">
            Explore historical predictions, filter by conditions, and export data for analysis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-full border border-slate-700 bg-storm-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-cyanglow/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-full border border-slate-700 bg-storm-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-cyanglow/70"
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="mb-3 grid gap-3 rounded-2xl border border-slate-800 bg-storm-900/70 p-3 text-[11px] text-slate-200 md:grid-cols-4">
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">Date range</div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-storm-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-cyanglow/80"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-storm-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-cyanglow/80"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">Risk level</div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-storm-900 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-cyanglow/80"
          >
            <option value="">All</option>
            {riskLevels.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">Location contains</div>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="e.g. 28.6, 77.2"
            className="w-full rounded-lg border border-slate-700 bg-storm-900 px-2 py-1 text-[11px] text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyanglow/80"
          />
        </div>
        <div className="flex items-end justify-start gap-2">
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setRiskFilter('');
              setLocationFilter('');
              setPage(1);
            }}
            className="rounded-full border border-slate-700 bg-storm-900 px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-cyanglow/70"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="glass-panel overflow-hidden text-xs">
        <div className="max-h-[480px] overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-storm-800/90 text-slate-300">
              <tr>
                {['Date', 'Location', 'Risk Level', 'Score', 'Details'].map((col) => (
                  <th
                    key={col}
                    className="cursor-pointer px-3 py-2 text-left font-medium hover:text-cyanglow"
                    onClick={() =>
                      onSort(
                        col === 'Date'
                          ? 'created_at'
                          : col === 'Risk Level'
                            ? 'risk_level'
                            : col === 'Score'
                              ? 'confidence_score'
                              : col === 'Location'
                                ? 'temperature'
                                : ''
                      )
                    }
                  >
                    {col}
                    {((col === 'Date' && sortBy === 'created_at') ||
                      (col === 'Risk Level' && sortBy === 'risk_level') ||
                      (col === 'Score' && sortBy === 'confidence_score')) && (
                      <span className="ml-1 text-[10px]">
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                    No prediction records match the current filters.
                  </td>
                </tr>
              )}
              {paged.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-slate-800/80 hover:bg-storm-800/70"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-3 py-2 text-slate-300">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {row.latitude.toFixed(2)}, {row.longitude.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskChipClass(row.risk_level)}`}
                    >
                      {row.risk_level}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {(row.confidence_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-cyanglow">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 bg-storm-900/80 px-3 py-2 text-[11px] text-slate-300">
          <div>
            Page {currentPage} of {totalPages} • {filtered.length} records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-slate-700 bg-storm-900 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-slate-700 bg-storm-900 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl border border-slate-700 bg-storm-900 p-4 text-xs text-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Prediction details</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-700 bg-storm-800 px-2 py-0.5 text-[11px] text-slate-200 hover:border-cyanglow/70"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">Time:</span>{' '}
                <span className="text-slate-200">
                  {new Date(selected.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>{' '}
                <span className="text-slate-200">
                  {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Risk level:</span>{' '}
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskChipClass(selected.risk_level)}`}
                >
                  {selected.risk_level}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Risk score:</span>{' '}
                {(selected.confidence_score * 100).toFixed(1)}%
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-storm-950/70 p-2">
                <div>
                  <div className="text-slate-400">Temperature</div>
                  <div className="font-semibold text-slate-100">
                    {selected.temperature.toFixed(1)}°C
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Humidity</div>
                  <div className="font-semibold text-slate-100">
                    {selected.humidity.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Pressure</div>
                  <div className="font-semibold text-slate-100">
                    {selected.pressure.toFixed(0)} hPa
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Wind speed</div>
                  <div className="font-semibold text-slate-100">
                    {selected.wind_speed.toFixed(1)} km/h
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Rainfall 24h</div>
                  <div className="font-semibold text-slate-100">
                    {selected.rainfall.toFixed(1)} mm
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Cloud cover</div>
                  <div className="font-semibold text-slate-100">
                    {selected.cloud_cover.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

