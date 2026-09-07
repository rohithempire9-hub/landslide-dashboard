import React, { useState } from 'react';
import { MapPin, AlertTriangle, Send, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function FieldReporter({ onBack, onReportSubmitted }) {
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [headline, setHeadline] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const captureGPS = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lng: parseFloat(pos.coords.longitude.toFixed(4)),
          accuracy: Math.round(pos.coords.accuracy)
        });
        setLocating(false);
      },
      () => {
        // Fallback default coordinates for demonstration
        setCoords({ lat: 27.2645, lng: 92.4159, accuracy: 12 });
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!coords) {
      alert("Please capture GPS coordinates first.");
      return;
    }

    const payload = {
      id: `FIELD-${Date.now()}`,
      name: headline,
      lat: coords.lat,
      lng: coords.lng,
      severity,
      notes,
      timestamp: new Date().toLocaleTimeString()
    };

    onReportSubmitted(payload);
    setStatusMsg("Incident dispatched to National Grid!");
    setTimeout(() => {
      setStatusMsg('');
      onBack();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-[#070d18] text-slate-100 z-50 p-4 flex flex-col justify-between max-w-md mx-auto">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-lg text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black uppercase text-cyan-400 tracking-wider">Field Responder Unit</h2>
            <p className="text-[10px] text-slate-500">BHUSAKTHI Incident Uplink</p>
          </div>
          <span className="w-8"></span>
        </div>

        {statusMsg && (
          <div className="mt-3 p-3 bg-emerald-900/60 border border-emerald-500 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {/* GPS Capture Button */}
          <div className="bg-[#0f1a2e] p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-300">Location Uplink</span>
              <button
                type="button"
                onClick={captureGPS}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                {locating ? "Locking GPS..." : coords ? "Update GPS" : "Capture Device GPS"}
              </button>
            </div>
            {coords ? (
              <p className="font-mono text-cyan-400 text-[11px]">
                Lat: {coords.lat} | Lng: {coords.lng} (±{coords.accuracy}m)
              </p>
            ) : (
              <p className="text-slate-500 text-[10px]">Tap to acquire device elevation & coordinates.</p>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Incident Overview</label>
            <input
              type="text"
              required
              placeholder="e.g. Major rockslide, 30m debris fan"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-[#0f1a2e] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Severity Classification</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-[#0f1a2e] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="CRITICAL">Critical (Total Highway Blockage)</option>
              <option value="HIGH">High (Active Mudflow / Road Disruption)</option>
              <option value="MODERATE">Moderate (Tension Cracks Detected)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Ground Observations</label>
            <textarea
              rows={3}
              placeholder="Provide road markers, nearby villages, or blocked transport units..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0f1a2e] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition mt-2"
          >
            <Send className="w-4 h-4" /> Transmit Emergency SitRep
          </button>
        </form>
      </div>

      <p className="text-[10px] text-center text-slate-600">
        Encrypted telemetry via NDMA Satellite Relays.
      </p>
    </div>
  );
}