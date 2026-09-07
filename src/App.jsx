import FieldReporter from './FieldReporter';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { 
  AlertTriangle, ShieldCheck, CloudRain, Droplets, 
  MapPin, Radio, Bell, Send, CheckCircle2,
  Navigation, Volume2, Download, Play, Square, Layers, 
  Settings, PhoneCall, RefreshCw, Box
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import Terrain3D from './Terrain3D';

const REGIONS_DATA = [
  {
    id: "AR-01",
    name: "West Kameng",
    state: "Arunachal Pradesh",
    lat: 27.2645,
    lng: 92.4159,
    baseSusceptibility: 87,
    slope: 44,
    elevation: 2100,
    road: "NH-415 (Itanagar - Banderdewa)",
    roadStatus: "CLOSED"
  },
  {
    id: "ML-01",
    name: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.2986,
    lng: 91.5822,
    baseSusceptibility: 74,
    slope: 36,
    elevation: 1480,
    road: "NH-6 (Shillong - Silchar)",
    roadStatus: "RESTRICTED"
  },
  {
    id: "NL-01",
    name: "Dimapur - Kohima",
    state: "Nagaland",
    lat: 25.6751,
    lng: 94.1086,
    baseSusceptibility: 58,
    slope: 28,
    elevation: 1444,
    road: "NH-29 (Dimapur Corridor)",
    roadStatus: "RESTRICTED"
  },
  {
    id: "AS-01",
    name: "Guwahati Valley",
    state: "Assam",
    lat: 26.1445,
    lng: 91.7362,
    baseSusceptibility: 22,
    slope: 12,
    elevation: 55,
    road: "GS Road / NH-27",
    roadStatus: "OPEN"
  }
];

const FORECAST_DATA = [
  { time: '00:00', rain: 20, threat: 30 },
  { time: '04:00', rain: 45, threat: 50 },
  { time: '08:00', rain: 80, threat: 72 },
  { time: '12:00', rain: 126, threat: 87 },
  { time: '16:00', rain: 95, threat: 75 },
  { time: '20:00', rain: 60, threat: 55 },
];

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 8, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS_DATA[0]);
  const [liveRain, setLiveRain] = useState(126);
  const [liveMoisture, setLiveMoisture] = useState(82);
  const [view3D, setView3D] = useState(false);
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [showFieldView, setShowFieldView] = useState(false);

  const handleFieldIncident = (incident) => {
    const newSector = {
      id: incident.id,
      name: incident.name,
      state: "Ground Alert",
      lat: incident.lat,
      lng: incident.lng,
      baseSusceptibility: incident.severity === "CRITICAL" ? 95 : 70,
      slope: 38,
      elevation: 1600,
      road: "Local Access Link",
      roadStatus: "CLOSED"
    };
    REGIONS_DATA.unshift(newSector);
    setSelectedRegion(newSector);
    speakNotice(`Urgent ground incident submitted for ${incident.name}`);
  };

  // Dynamic Risk Formula
  const calculatedRisk = Math.min(
    100,
    Math.round(
      selectedRegion.baseSusceptibility * 0.40 +
      Math.min(liveRain * 0.8, 50) * 0.35 +
      (liveMoisture * 0.4) * 0.15 +
      (selectedRegion.slope * 0.8) * 0.10
    )
  );

  const riskFactors = [
    { name: 'Rainfall Intensity', value: 42, color: '#06b6d4' },
    { name: 'Soil Saturation', value: 28, color: '#f59e0b' },
    { name: 'Slope Gradient', value: 18, color: '#ef4444' },
    { name: 'Lithology', value: 12, color: '#8b5cf6' }
  ];

  const speakNotice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d18] text-slate-200 font-sans text-xs select-none">
      {showFieldView && (
        <FieldReporter 
          onBack={() => setShowFieldView(false)} 
          onReportSubmitted={handleFieldIncident} 
        />
      )}

      {/* 1. LEFT NARROW NAVIGATION BAR */}
      <aside className="w-56 bg-[#0a1120] border-r border-slate-800 flex flex-col justify-between p-3 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wider uppercase text-white">BHUSAKTHI AI</h1>
              <p className="text-[10px] text-slate-400">Early Warning System - NLP</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1">
            {[
              { label: 'Dashboard', icon: MapPin },
              { label: 'Risk Overview Map', icon: Layers },
              { label: 'Weather & Forecast', icon: CloudRain },
              { label: 'Road Connectivity', icon: Navigation },
              { label: 'Alerts & Notifications', icon: Bell },
              { label: 'Response Planner', icon: ShieldCheck },
              { label: 'Sensors', icon: Box },
              { label: 'Settings', icon: Settings }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label.toUpperCase())}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left ${
                  activeTab === item.label.toUpperCase() 
                    ? "bg-[#14233c] text-cyan-400 border border-cyan-500/30 font-bold" 
                    : "text-slate-400 hover:bg-[#0f192b] hover:text-slate-200"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Offline Cache & Node Status Card */}
        <div className="bg-[#0f1a2e] border border-slate-800 p-2.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Offline Store</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">Cached regional GIS tiles (AP, ML, NL) ready for field loss-of-signal operation.</p>
        </div>
      </aside>

      {/* 2. MAIN MISSION CONTROL AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP STATUS BAR & KPI STAT CARDS */}
        <div className="p-3 border-b border-slate-800/80 bg-[#0a1222] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> HIGH RISK ALERT
            </span>
            <span className="text-slate-400 text-[11px]">Multiple active landslides detected in Northeast sector</span>
          </div>

          {/* KPI CARDS */}
          <div className="flex items-center gap-2">
            <div className="bg-[#0f1a2e] border border-red-900/50 px-3 py-1.5 rounded-lg text-center min-w-[75px]">
              <p className="text-sm font-black text-red-500">23</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">High Risk</p>
            </div>
            <div className="bg-[#0f1a2e] border border-amber-900/50 px-3 py-1.5 rounded-lg text-center min-w-[75px]">
              <p className="text-sm font-black text-amber-500">47</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Moderate</p>
            </div>
            <div className="bg-[#0f1a2e] border border-cyan-900/50 px-3 py-1.5 rounded-lg text-center min-w-[75px]">
              <p className="text-sm font-black text-cyan-400">68</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Monitoring</p>
            </div>
            <div className="bg-[#0f1a2e] border border-emerald-900/50 px-3 py-1.5 rounded-lg text-center min-w-[75px]">
              <p className="text-sm font-black text-emerald-500">12</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Safe Areas</p>
            </div>
            <button
              onClick={() => setShowFieldView(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1.5 transition ml-1"
            >
              <MapPin className="w-3 h-3" /> Field App (GPS)
            </button>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="flex-1 p-3 grid grid-cols-12 gap-3 min-h-0">
          
          {/* COLUMN 1 (5 cols): Map & 3D Topographic View */}
          <div className="col-span-5 flex flex-col gap-3">
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Risk Overview Map</span>
                </div>
                
                {/* 3D / 2D GIS Toggle */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setView3D(!view3D)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                      view3D ? "bg-cyan-600 text-white border-cyan-400 shadow-md" : "bg-[#14233c] text-slate-400 border-slate-700"
                    }`}
                  >
                    <Box className="w-3 h-3" /> {view3D ? "3D Mesh Active" : "View 3D Terrain"}
                  </button>
                  <select 
                    value={selectedRegion.id}
                    onChange={(e) => setSelectedRegion(REGIONS_DATA.find(r => r.id === e.target.value))}
                    className="bg-[#14233c] border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none"
                  >
                    {REGIONS_DATA.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.state})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MAP CONTAINER */}
              <div className="relative flex-1 rounded-lg overflow-hidden border border-slate-800 bg-[#050912] min-h-[260px]">
                {view3D ? (
                  <Terrain3D riskScore={calculatedRisk} slopeAngle={selectedRegion.slope} />
                ) : (
                  <MapContainer 
                    center={[selectedRegion.lat, selectedRegion.lng]} 
                    zoom={8} 
                    className="h-full w-full"
                    scrollWheelZoom={false}
                    zoomControl={false}
                  >
                    <MapRecenter center={[selectedRegion.lat, selectedRegion.lng]} />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution='Tiles &copy; Esri'
                      maxZoom={18}
                    />
                    {REGIONS_DATA.map((r) => {
                      const isTarget = r.id === selectedRegion.id;
                      return (
                        <CircleMarker
                          key={r.id}
                          center={[r.lat, r.lng]}
                          radius={isTarget ? 12 : 7}
                          pathOptions={{
                            color: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                            fillColor: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.8
                          }}
                          eventHandlers={{ click: () => setSelectedRegion(r) }}
                        >
                          <Popup>
                            <span className="text-slate-900 font-bold">{r.name}</span>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                )}

                {/* Floating Map Legend */}
                <div className="absolute top-2 left-2 bg-[#0a1222]/85 backdrop-blur border border-slate-700/80 p-2 rounded text-[10px] pointer-events-none z-[400] space-y-1">
                  <p className="font-bold text-slate-300">Active Sector: <span className="text-cyan-400">{selectedRegion.name}</span></p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Danger</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Watch</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Safe</span>
                  </div>
                </div>
              </div>

              {/* Road Connectivity Bar */}
              <div className="mt-3 bg-[#0f1a2e] border border-slate-800 p-2 rounded-lg">
                <p className="font-bold text-slate-400 uppercase text-[9px] mb-1.5">Critical Arterial Lifeline</p>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-medium text-slate-200">{selectedRegion.road}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    selectedRegion.roadStatus === 'CLOSED' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {selectedRegion.roadStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (4 cols): Weather Forecast & Donut Breakdown */}
          <div className="col-span-4 flex flex-col gap-3">
            
            {/* Weather Line Chart Card */}
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">
                  Weather & Risk Forecast
                </span>
                <span className="text-[10px] text-cyan-400 font-mono bg-[#0f1a2e] px-2 py-0.5 rounded border border-slate-800">
                  {selectedRegion.name}, {selectedRegion.state.slice(0, 2).toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-1.5 my-2 text-center">
                <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                  <p className="text-[9px] text-slate-400">Rainfall</p>
                  <p className="font-bold text-cyan-400">{liveRain} mm</p>
                </div>
                <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                  <p className="text-[9px] text-slate-400">Saturation</p>
                  <p className="font-bold text-amber-400">{liveMoisture}%</p>
                </div>
                <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                  <p className="text-[9px] text-slate-400">Slope</p>
                  <p className="font-bold text-slate-200">{selectedRegion.slope}°</p>
                </div>
                <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                  <p className="text-[9px] text-slate-400">Threat</p>
                  <p className="font-bold text-red-500">{calculatedRisk}/100</p>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={FORECAST_DATA}>
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} domain={[0, 150]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                    <Line type="monotone" dataKey="threat" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="rain" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Factor Contribution Donut */}
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Risk Factors Contribution</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="w-28 h-28 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskFactors}
                        cx="50%"
                        cy="50%"
                        innerRadius={28}
                        outerRadius={42}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {riskFactors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-black text-white">{calculatedRisk}%</span>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  {riskFactors.map(f => (
                    <div key={f.name} className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }}></span>
                        {f.name}
                      </span>
                      <span className="font-mono text-slate-200 font-bold">{f.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 3 (3 cols): Active Alerts, Geophone Telemetry, & Emergency Response */}
          <div className="col-span-3 flex flex-col gap-3">
            
            {/* Active Alerts List */}
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-red-400" /> Active Alerts
                </span>
                <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-800">4 Critical</span>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[160px]">
                <div className="p-2 bg-[#0f1a2e] border-l-2 border-red-500 rounded text-[11px]">
                  <p className="font-bold text-red-400">West Kameng, AP</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Severe mudflow threat. Evacuate downstream valley camps.</p>
                </div>
                <div className="p-2 bg-[#0f1a2e] border-l-2 border-amber-500 rounded text-[11px]">
                  <p className="font-bold text-amber-400">East Khasi Hills, Meghalaya</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Heavy rainfall warning; minor slope fractures along NH-6.</p>
                </div>
                <div className="p-2 bg-[#0f1a2e] border-l-2 border-amber-500 rounded text-[11px]">
                  <p className="font-bold text-amber-400">Kohima, Nagaland</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">Continuous slope creep near Dimapur corridor.</p>
                </div>
              </div>
            </div>

            {/* Ground Geophone Telemetry Stream */}
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-300 text-[10px]">
                  Ground Geophone Telemetry
                </span>
                <span className="text-[9px] text-emerald-400 font-mono animate-pulse">● LIVE 10Hz</span>
              </div>
              
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                  <span className="text-slate-400">Pore Pressure (Piezo-04)</span>
                  <span className="text-cyan-400 font-mono font-bold">142.4 kPa</span>
                </div>
                <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                  <span className="text-slate-400">Tilt Angle (Inclinometer-2)</span>
                  <span className="text-amber-400 font-mono font-bold">+1.84° / hr</span>
                </div>
                <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                  <span className="text-slate-400">Acoustic Vibration (Geo-01)</span>
                  <span className="text-emerald-400 font-mono font-bold">0.042 mm/s²</span>
                </div>
              </div>
            </div>

            {/* Emergency Quick Action Buttons */}
            <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <p className="font-bold text-slate-400 uppercase text-[9px]">Emergency Response</p>
              
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button 
                  onClick={() => speakNotice("Emergency siren triggered for West Kameng region. Evacuate immediately.")}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Siren
                </button>
                <button 
                  onClick={() => alert("Dispatching SMS payload to local NDRF Unit 12.")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> NDRF
                </button>
                <button 
                  onClick={() => alert("Safe corridors highlighted leading to designated community shelter.")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Shelters
                </button>
              </div>

              {/* Multi-Lingual Box */}
              <div className="bg-[#0f1a2e] border border-slate-800 p-2 rounded text-[10px] text-slate-400 leading-tight">
                <span className="font-bold text-cyan-400">हिन्दी चेतावनी:</span> पश्चिम कामेंग में भारी बारिश के कारण भूस्खलन का अलर्ट जारी किया गया है।
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}