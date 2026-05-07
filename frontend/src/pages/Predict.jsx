import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import { MapPin, CloudLightning } from 'lucide-react';
import api from '../services/api';
import RiskGauge from '../components/RiskGauge';

const defaultForm = {
  latitude: 20,
  longitude: 0,
  temperature: 25,
  humidity: 70,
  atmospheric_pressure: 1000,
  wind_speed: 10,
  rainfall_last_24h: 0,
  cloud_cover: 50,
  altitude: 500
};

function LocationSelector({ latitude, longitude, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    }
  });

  return latitude != null && longitude != null ? (
    <Marker position={[latitude, longitude]} />
  ) : null;
}

export default function Predict() {
  const [form, setForm] = useState(defaultForm);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [result, setResult] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    const loadModelInfo = async () => {
      try {
        const { data } = await api.get('/model/info');
        setModelInfo(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadModelInfo();
  }, []);

  const handleFieldChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    handleFieldChange(name, value === '' ? '' : Number(value));
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setForm((prev) => ({ ...prev, latitude, longitude }));
  };

  const validateForm = () => {
    const required = [
      'latitude',
      'longitude',
      'temperature',
      'humidity',
      'atmospheric_pressure',
      'wind_speed',
      'rainfall_last_24h',
      'cloud_cover',
      'altitude'
    ];
    for (const key of required) {
      const v = form[key];
      if (v === '' || v == null || Number.isNaN(Number(v))) {
        toast.error(`Please provide a valid value for ${key.replace(/_/g, ' ')}.`);
        return false;
      }
    }
    return true;
  };

  const handleFetchWeather = async () => {
    if (form.latitude == null || form.longitude == null) {
      toast.error('Please select a location first.');
      return;
    }
    setLoadingWeather(true);
    try {
      const { data } = await api.get('/weather/current', {
        params: { lat: form.latitude, lon: form.longitude }
      });
      setForm((prev) => ({
        ...prev,
        temperature: data.temperature,
        humidity: data.humidity,
        atmospheric_pressure: data.pressure,
        wind_speed: data.wind_speed,
        rainfall_last_24h: data.rainfall_last_24h,
        cloud_cover: data.cloud_cover
      }));
      toast.success(`Weather updated from ${data.source}.`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch current weather');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoadingPredict(true);
    try {
      const payload = {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        temperature: Number(form.temperature),
        humidity: Number(form.humidity),
        atmospheric_pressure: Number(form.atmospheric_pressure),
        wind_speed: Number(form.wind_speed),
        rainfall_last_24h: Number(form.rainfall_last_24h),
        cloud_cover: Number(form.cloud_cover),
        dew_point: null,
        altitude: Number(form.altitude)
      };
      const { data } = await api.post('/predict', payload);
      setResult(data.result);
      toast.success('Prediction computed and stored.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to compute prediction');
    } finally {
      setLoadingPredict(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    toast.info('Prediction is already saved to history.');
  };

  const featureData = useMemo(() => {
    if (!modelInfo?.feature_importance) return [];
    return Object.entries(modelInfo.feature_importance).map(([name, value]) => ({
      name,
      importance: value
    }));
  }, [modelInfo]);

  const riskScore = result ? result.risk_score : 0;
  const probabilityPct = result ? result.probability * 100 : 0;

  const riskLevelClass = (level) => {
    const l = String(level || '').toLowerCase();
    if (l === 'low') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (l === 'moderate') return 'bg-amber-500/20 text-amber-200 border-amber-500/40';
    if (l === 'high') return 'bg-orange-500/20 text-orange-200 border-orange-500/40';
    if (l === 'extreme') return 'bg-red-500/20 text-red-200 border-red-500/40';
    return 'bg-slate-700/40 text-slate-200 border-slate-600/60';
  };

  const safetyMessage = (level) => {
    const l = String(level || '').toLowerCase();
    if (l === 'low') {
      return 'Conditions are generally safe. Continue monitoring standard forecasts, especially if rainfall is expected to increase.';
    }
    if (l === 'moderate') {
      return 'Be weather-aware. Avoid low-lying areas with poor drainage and keep track of local advisories.';
    }
    if (l === 'high') {
      return 'Limit exposure in flood-prone zones. Prepare contingency plans, check evacuation routes, and monitor alerts closely.';
    }
    if (l === 'extreme') {
      return 'High potential for dangerous cloud burst events. Move to higher ground where possible and follow guidance from local authorities immediately.';
    }
    return 'Review local conditions and monitor evolving weather patterns.';
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cloud Burst Prediction</h1>
          <p className="mt-1 text-sm text-slate-300">
            Select a location, refine the observed weather fields, and estimate localized cloud burst risk.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetchWeather}
          disabled={loadingWeather}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-storm-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:border-cyanglow/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CloudLightning className="h-3.5 w-3.5 text-cyanglow" />
          {loadingWeather ? 'Fetching weather…' : 'Fetch current weather'}
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] lg:items-start">
        <div className="glass-panel space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr),minmax(0,1fr)]">
            <div className="space-y-3 text-xs text-slate-200">
              <h2 className="text-sm font-semibold text-white">Weather inputs</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span>Latitude (°)</span>
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleNumberInput}
                    className="rounded-lg border border-slate-700 bg-storm-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyanglow/80"
                    step="any"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Longitude (°)</span>
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleNumberInput}
                    className="rounded-lg border border-slate-700 bg-storm-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyanglow/80"
                    step="any"
                  />
                </label>
              </div>

              <div className="space-y-3">
                {[
                  ['temperature', 'Temperature (°C)', -10, 50],
                  ['humidity', 'Humidity (%)', 0, 100],
                  ['wind_speed', 'Wind speed (km/h)', 0, 150],
                  ['cloud_cover', 'Cloud cover (%)', 0, 100]
                ].map(([name, label, min, max]) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{label}</span>
                      <span className="text-slate-300">{form[name]}{name === 'humidity' || name === 'cloud_cover' ? '%' : name === 'temperature' ? '°C' : ' km/h'}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={form[name]}
                      onChange={(e) => handleFieldChange(name, Number(e.target.value))}
                      className="w-full accent-cyanglow"
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span>Pressure (hPa)</span>
                  <input
                    type="number"
                    name="atmospheric_pressure"
                    value={form.atmospheric_pressure}
                    onChange={handleNumberInput}
                    className="rounded-lg border border-slate-700 bg-storm-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyanglow/80"
                    step="any"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Rainfall last 24h (mm)</span>
                  <input
                    type="number"
                    name="rainfall_last_24h"
                    value={form.rainfall_last_24h}
                    onChange={handleNumberInput}
                    className="rounded-lg border border-slate-700 bg-storm-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyanglow/80"
                    step="any"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span>Altitude (m)</span>
                  <input
                    type="number"
                    name="altitude"
                    value={form.altitude}
                    onChange={handleNumberInput}
                    className="rounded-lg border border-slate-700 bg-storm-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyanglow/80"
                    step="any"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-cyanglow" />
                  <span className="text-[11px] font-semibold">Location selector</span>
                </div>
                <span className="text-[11px] text-slate-400">Click on map to set point</span>
              </div>
              <div className="h-56 overflow-hidden rounded-xl">
                <MapContainer
                  center={[form.latitude || 20, form.longitude || 0]}
                  zoom={4}
                  scrollWheelZoom={false}
                  whenReady={(event) => event.target.invalidateSize()}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationSelector
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onChange={handleLocationChange}
                  />
                </MapContainer>
              </div>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loadingPredict}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-skyblue to-cyanglow px-4 py-2 text-sm font-semibold text-slate-950 shadow-glow-cyan transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingPredict ? 'Predicting…' : 'Predict risk'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Prediction result</span>
              {result && (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${riskLevelClass(result.risk_level)}`}
                >
                  {result.risk_level}
                </span>
              )}
            </div>

            {!result && (
              <p className="mt-3 text-xs text-slate-300">
                Run a prediction to see risk levels, probability and tailored safety guidance.
              </p>
            )}

            {result && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <RiskGauge value={riskScore} />
                <div className="space-y-3">
                  <div className="glass-panel bg-storm-900/80 p-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">Cloud burst probability</span>
                      <span className="text-sm font-semibold text-cyanglow">
                        {probabilityPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Probabilities are derived from the classifier&apos;s confidence in a cloud burst event.
                    </div>
                  </div>
                  <div className="glass-panel bg-storm-900/80 p-3 text-[11px] text-slate-300">
                    <div className="mb-1 text-slate-200">Safety recommendations</div>
                    <p>{safetyMessage(result.risk_level)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 bg-storm-800 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:border-cyanglow/70"
                  >
                    Save prediction
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 text-xs text-slate-200">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Feature contributions</span>
              <span className="text-[11px] text-slate-400">Model-level importance</span>
            </div>
            <div className="h-52">
              {featureData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  Feature importance will appear once the model information is available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureData}>
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
      </section>
    </main>
  );
}

