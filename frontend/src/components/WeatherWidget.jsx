import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MapPin } from 'lucide-react';
import api from '../services/api';

const presets = [
  { label: 'Custom', lat: null, lon: null },
  { label: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { label: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { label: 'London', lat: 51.5074, lon: -0.1278 },
  { label: 'Tokyo', lat: 35.6895, lon: 139.6917 }
];

export default function WeatherWidget() {
  const [selection, setSelection] = useState(presets[1]); // default New Delhi
  const [coords, setCoords] = useState({ lat: presets[1].lat, lon: presets[1].lon });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadWeather = async (lat, lon) => {
    if (lat == null || lon == null) return;
    setLoading(true);
    try {
      const { data: res } = await api.get('/weather/current', { params: { lat, lon } });
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(coords.lat, coords.lon);
  }, []);

  const handlePresetChange = (e) => {
    const preset = presets.find((p) => p.label === e.target.value);
    setSelection(preset);
    if (preset.lat != null && preset.lon != null) {
      setCoords({ lat: preset.lat, lon: preset.lon });
      loadWeather(preset.lat, preset.lon);
    }
  };

  const handleCoordChange = (e) => {
    const { name, value } = e.target;
    setCoords((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (coords.lat == null || coords.lon == null || coords.lat === '' || coords.lon === '') {
      toast.error('Please provide valid latitude and longitude');
      return;
    }
    loadWeather(Number(coords.lat), Number(coords.lon));
  };

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <MapPin className="h-3.5 w-3.5 text-cyanglow" />
          <span>Current weather</span>
        </div>
        <select
          value={selection.label}
          onChange={handlePresetChange}
          className="rounded-full border border-slate-700 bg-storm-800 px-3 py-1 text-[11px] text-slate-200 outline-none focus:border-cyanglow/70"
        >
          {presets.map((p) => (
            <option key={p.label}>{p.label}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
        <label className="flex flex-col gap-1">
          <span>Latitude</span>
          <input
            type="number"
            name="lat"
            value={coords.lat ?? ''}
            onChange={handleCoordChange}
            className="rounded-lg border border-slate-700 bg-storm-800 px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyanglow/80"
            step="any"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Longitude</span>
          <input
            type="number"
            name="lon"
            value={coords.lon ?? ''}
            onChange={handleCoordChange}
            className="rounded-lg border border-slate-700 bg-storm-800 px-2 py-1 text-xs text-slate-100 outline-none focus:border-cyanglow/80"
            step="any"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 mt-1 inline-flex items-center justify-center rounded-full bg-storm-800 px-3 py-1.5 text-[11px] font-medium text-slate-100 ring-cyanglow/40 transition hover:bg-storm-700 focus-visible:ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update location'}
        </button>
      </form>

      <div className="mt-1 text-[11px] text-slate-300">
        {!data && <div className="text-slate-500">Weather data will appear here.</div>}
        {data && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-slate-400">Temperature</div>
              <div className="text-sm font-semibold text-white">
                {data.temperature.toFixed(1)}°C
              </div>
            </div>
            <div>
              <div className="text-slate-400">Humidity</div>
              <div className="text-sm font-semibold text-white">
                {data.humidity.toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400">Pressure</div>
              <div className="text-sm font-semibold text-white">
                {data.pressure.toFixed(0)} hPa
              </div>
            </div>
            <div>
              <div className="text-slate-400">Wind</div>
              <div className="text-sm font-semibold text-white">
                {data.wind_speed.toFixed(1)} km/h
              </div>
            </div>
            <div>
              <div className="text-slate-400">Rain (24h)</div>
              <div className="text-sm font-semibold text-white">
                {data.rainfall_last_24h.toFixed(1)} mm
              </div>
            </div>
            <div>
              <div className="text-slate-400">Cloud cover</div>
              <div className="text-sm font-semibold text-white">
                {data.cloud_cover.toFixed(0)}%
              </div>
            </div>
            {data.description && (
              <div className="col-span-2 mt-1 text-[11px] text-slate-400">
                {data.description} ({data.source})
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

