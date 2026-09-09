import React, { useState } from 'react';
import { MapPin, AlertTriangle, Send, CheckCircle2, ArrowLeft, Camera, WifiOff } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://bhushakti-backend.onrender.com';

export default function FieldReporter({ onBack, onReportSubmitted }) {
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [headline, setHeadline] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [sending, setSending] = useState(false);

  const captureGPS = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setStatusMsg('GPS is not supported by this browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)), accuracy: Math.round(pos.coords.accuracy) });
        setLocating(false);
      },
      () => {
        setStatusMsg('GPS unavailable. Capture again when connectivity/location is available.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const readMedia = async (files) => {
    const selected = Array.from(files).slice(0, 3);
    const encoded = [];
    for (const file of selected) {
      if (file.size > 2 * 1024 * 1024) continue;
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      encoded.push(data);
    }
    setMedia(encoded);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) { setStatusMsg('Please capture GPS coordinates first.'); return; }
    setSending(true); setStatusMsg('Transmitting field report...');
    const payload = {
      sector_name: headline,
      district: 'Field Observation',
      state: 'North Eastern Region',
      lat: coords.lat,
      lng: coords.lng,
      severity,
      type: severity === 'CRITICAL' ? 'Critical slope failure / blockage' : 'Field slope observation',
      notes,
      media,
    };
    try {
      const response = await fetch(`${API}/api/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('server');
      const data = await response.json();
      onReportSubmitted(data.incident);
      setStatusMsg('Incident received by BHUSAKTHI command centre.');
      setTimeout(onBack, 1300);
    } catch {
      setStatusMsg('Network unavailable. Report captured locally for demo review.');
      onReportSubmitted({ ...payload, id: `OFFLINE-${Date.now()}`, status: 'PENDING SYNC', timestamp: new Date().toISOString() });
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#050b15] text-slate-100 z-[2000] p-4 flex flex-col max-w-lg mx-auto overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-lg"><ArrowLeft className="w-4 h-4" /></button>
        <div className="text-center"><h2 className="text-sm font-black uppercase text-cyan-400 tracking-wider">Field Responder</h2><p className="text-[10px] text-slate-500">BHUSAKTHI Incident Uplink</p></div>
        <WifiOff className="w-4 h-4 text-slate-600" />
      </div>
      {statusMsg && <div className="mt-3 p-3 bg-cyan-950/50 border border-cyan-700 text-cyan-200 text-xs rounded-xl">{statusMsg}</div>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
        <div className="bg-[#0b1527] p-3 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-2"><span className="font-bold">Geo-tag</span><button type="button" onClick={captureGPS} className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 rounded font-bold flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{locating ? 'Locking GPS…' : coords ? 'Update GPS' : 'Capture GPS'}</button></div>
          {coords ? <p className="font-mono text-cyan-400">{coords.lat}, {coords.lng} · ±{coords.accuracy}m</p> : <p className="text-slate-500">Required for a geo-tagged incident.</p>}
        </div>
        <input required value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Incident headline — e.g. Major rockslide near village road" className="w-full bg-[#0b1527] border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-cyan-500" />
        <select value={severity} onChange={e=>setSeverity(e.target.value)} className="w-full bg-[#0b1527] border border-slate-800 rounded-lg p-3 text-white"><option>CRITICAL</option><option>HIGH</option><option>MODERATE</option></select>
        <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Cracks, debris, water flow, road blockage, nearby village, vehicles affected…" className="w-full bg-[#0b1527] border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-cyan-500" />
        <label className="block border border-dashed border-slate-700 rounded-xl p-4 bg-[#0b1527] cursor-pointer"><span className="flex items-center gap-2 font-bold text-slate-300"><Camera className="w-4 h-4 text-cyan-400" />Attach up to 3 photos/videos</span><span className="text-[10px] text-slate-500">Demo upload limit: 2 MB each</span><input type="file" accept="image/*,video/*" multiple onChange={e=>readMedia(e.target.files)} className="hidden" /></label>
        {media.length > 0 && <div className="text-[10px] text-emerald-400">{media.length} media item(s) attached for transmission.</div>}
        <button disabled={sending} className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4" />{sending ? 'Transmitting…' : 'Transmit Emergency SitRep'}</button>
      </form>
      <p className="mt-auto pt-5 text-[10px] text-center text-slate-600">Low-network ready · queued reports can be synced when connectivity returns.</p>
    </div>
  );
}
