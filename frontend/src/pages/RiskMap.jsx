import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import api from '../services/api';

const riskLevels = ['low', 'moderate', 'high', 'extreme'];

const riskColor = (level) => {
  const l = String(level || '').toLowerCase();
  if (l === 'low') return '#22c55e';
  if (l === 'moderate') return '#eab308';
  if (l === 'high') return '#fb923c';
  if (l === 'extreme') return '#f97373';
  return '#38bdf8';
};

export default function RiskMap() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [center, setCenter] = useState([22.5, 79]); // India-ish default
  const [zoom, setZoom] = useState(4.5);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/predictions/history', {
        params: { skip: 0, limit: 200 }
      });
      setPoints(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (filter !== 'all' && String(p.risk_level).toLowerCase() !== filter) return false;
      return true;
    });
  }, [points, filter]);

  const heatCircles = filteredPoints.map((p) => ({
    lat: p.latitude,
    lon: p.longitude,
    weight: Math.max(0.2, p.confidence_score)
  }));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        search.trim()
      )}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'cloud-burst-dashboard' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const hit = data[0];
        setCenter([parseFloat(hit.lat), parseFloat(hit.lon)]);
        setZoom(7);
      } else {
        toast.info('No results found for that location.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to search location');
    }
  };

  return (
    <main className="flex h-[calc(100vh-56px)] flex-col bg-storm-900">
      <header className="z-20 border-b border-slate-800 bg-storm-900/95 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white md:text-xl">Risk map</h1>
            <p className="text-[11px] text-slate-300 md:text-xs">
              Spatial distribution of recent cloud burst predictions with risk-aware coloring.
            </p>
          </div>
          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-sm items-center gap-2 rounded-full border border-slate-700 bg-storm-900 px-3 py-1.5 text-[11px] text-slate-200"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city or location"
              className="flex-1 bg-transparent text-[11px] text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="rounded-full bg-storm-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-storm-700"
            >
              Go
            </button>
          </form>
        </div>
      </header>

      <section className="relative flex-1">
        <div className="absolute left-4 top-4 z-20 space-y-2 rounded-2xl border border-slate-800 bg-storm-900/90 p-3 text-[11px] text-slate-200 shadow-lg">
          <div className="mb-1 text-[11px] font-semibold text-white">Filters</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                filter === 'all'
                  ? 'bg-cyanglow text-slate-950'
                  : 'bg-storm-800 text-slate-200 hover:bg-storm-700'
              }`}
            >
              All
            </button>
            {riskLevels.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilter(r)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                  filter === r
                    ? 'bg-cyanglow text-slate-950'
                    : 'bg-storm-800 text-slate-200 hover:bg-storm-700'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            {filteredPoints.length} of {points.length} predictions shown
          </div>
        </div>

        <div className="absolute right-4 top-4 z-20 rounded-2xl border border-slate-800 bg-storm-900/90 p-3 text-[11px] text-slate-200 shadow-lg">
          <div className="mb-1 text-[11px] font-semibold text-white">Legend</div>
          <div className="space-y-1">
            {[
              ['Low', '#22c55e'],
              ['Moderate', '#eab308'],
              ['High', '#fb923c'],
              ['Extreme', '#f97373']
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            Larger, brighter circles indicate higher model risk scores.
          </div>
        </div>

        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          whenReady={(event) => event.target.invalidateSize()}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {heatCircles.map((p, idx) => (
            <CircleMarker
              key={`${p.lat}-${p.lon}-${idx}`}
              center={[p.lat, p.lon]}
              radius={4 + p.weight * 6}
              pathOptions={{
                color: riskColor(filteredPoints[idx]?.risk_level),
                fillColor: riskColor(filteredPoints[idx]?.risk_level),
                fillOpacity: 0.35,
                weight: 1
              }}
            />
          ))}
          {filteredPoints.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={5}
              pathOptions={{
                color: riskColor(p.risk_level),
                fillColor: riskColor(p.risk_level),
                fillOpacity: 0.85,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="text-[11px]">
                  <div className="mb-1 font-semibold">
                    {String(p.risk_level).toUpperCase()} •{' '}
                    {(p.confidence_score * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="text-slate-500">Location:</span>{' '}
                    {p.latitude.toFixed(2)}, {p.longitude.toFixed(2)}
                  </div>
                  <div>
                    <span className="text-slate-500">Temp:</span>{' '}
                    {p.temperature.toFixed(1)}°C
                  </div>
                  <div>
                    <span className="text-slate-500">Rain24h:</span>{' '}
                    {p.rainfall.toFixed(1)} mm
                  </div>
                  <div className="mt-1 text-slate-500">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </section>
    </main>
  );
}

