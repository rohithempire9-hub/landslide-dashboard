import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Polygon } from 'react-leaflet';
import { 
  AlertTriangle, ShieldCheck, CloudRain, Droplets, 
  MapPin, Radio, Bell, Send, CheckCircle2,
  Navigation, Volume2, Box, Layers, Settings, PhoneCall, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import Terrain3D from './Terrain3D';
import FieldReporter from './FieldReporter';

// Real-world Northeast Sector Data
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
    roadStatus: "CLOSED",
    polygon: [
      [27.28, 92.38], [27.30, 92.44], [27.24, 92.46], [27.23, 92.39]
    ]
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
    roadStatus: "RESTRICTED",
    polygon: [
      [25.32, 91.55], [25.33, 91.62], [25.27, 91.60], [25.26, 91.54]
    ]
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
    roadStatus: "RESTRICTED",
    polygon: [
      [25.70, 94.08], [25.71, 94.14], [25.65, 94.13], [25.64, 94.07]
    ]
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
    map.flyTo(center, 9, { duration: 1.2 });
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
  const [modalState, setModalState] = useState(null); // 'NDRF' | 'SHELTERS' | null
  const [sirenActive, setSirenActive] = useState(false);

  const calculatedRisk = Math.min(
    100,
    Math.round(
      selectedRegion.baseSusceptibility * 0.40 +
      Math.min(liveRain * 0.8, 50) * 0.35 +
      (liveMoisture * 0.4) * 0.15 +
      (selectedRegion.slope * 0.8) * 0.10
    )
  );

  const triggerSiren = () => {
    setSirenActive(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Critical Alert. High landslide probability detected in ${selectedRegion.name}. Evacuation protocols initiated.`
      );
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setSirenActive(false), 6000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d18] text-slate-200 font-sans text-xs select-none">
      
      {/* Field Mobile PWA Overlay */}
      {showFieldView && (
        <FieldReporter 
          onBack={() => setShowFieldView(false)} 
          onReportSubmitted={(report) => {
            alert(`Ground report verified: ${report.name} added to GIS layer.`);
            setShowFieldView(false);
          }} 
        />
      )}

      {/* Modal Dialogs for NDRF and Shelters */}
      {modalState && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1426] border border-cyan-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {modalState === 'NDRF' ? <PhoneCall className="w-4 h-4 text-cyan-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {modalState === 'NDRF' ? "Automated NDRF Tactical Dispatch" : "Active Evacuation Shelters & Corridors"}
              </h3>
              <button onClick={() => setModalState(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalState === 'NDRF' ? (
              <div className="space-y-3 text-slate-300 text-[11px]">
                <p>Generating priority telemetry payload for <strong>NDRF 12th Battalion</strong>:</p>
                <div className="bg-[#070d18] p-2.5 rounded font-mono text-[10px] space-y-1 text-cyan-300 border border-slate-800">
                  <p>• SECTOR: {selectedRegion.name} ({selectedRegion.state})</p>
                  <p>• COORDINATES: {selectedRegion.lat.toFixed(4)}°N, {selectedRegion.lng.toFixed(4)}°E</p>
                  <p>• CALCULATED RISK: {calculatedRisk}/100 (CRITICAL)</p>
                  <p>• ACCESS ROAD: {selectedRegion.road} ({selectedRegion.roadStatus})</p>
                </div>
                <button 
                  onClick={() => { alert("Encrypted packet transmitted via CAP Protocol to District Collector & NDRF."); setModalState(null); }}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
                >
                  Confirm & Broadcast Dispatch
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-slate-300 text-[11px]">
                <p>Designated relief camps within safe geomorphic zones:</p>
                <div className="space-y-1.5">
                  <div className="p-2 bg-[#070d18] rounded border border-emerald-900/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Dirang Base High School Ground</p>
                      <p className="text-[9px] text-slate-400">Distance: 4.2 km • Elevation: 1,560m</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">CAP: 450 / 800</span>
                  </div>
                  <div className="p-2 bg-[#070d18] rounded border border-emerald-900/60 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Community Hall Banderdewa</p>
                      <p className="text-[9px] text-slate-400">Distance: 8.7 km • Elevation: 820m</p>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">CAP: 120 / 300</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. LEFT NAVIGATION BAR */}
      <aside className="w-56 bg-[#0a1120] border-r border-slate-800 flex flex-col justify-between p-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/80">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wider uppercase text-white">BHUSAKTHI AI</h1>
              <p className="text-[10px] text-slate-400">Early Warning System - QGIS</p>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {[
              { label: 'Dashboard', key: 'DASHBOARD', icon: MapPin },
              { label: 'Road Connectivity', key: 'ROADS', icon: Navigation },
              { label: 'Response Planner', key: 'RESPONSE', icon: ShieldCheck }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition text-left ${
                  activeTab === item.key 
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

        <div className="bg-[#0f1a2e] border border-slate-800 p-2.5 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">QGIS Ingestion</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Synced
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">100m ILSM susceptibility raster and highway shapefile layers active.</p>
        </div>
      </aside>

      {/* 2. MAIN CENTER & RIGHT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Alert Notification Banner */}
        {sirenActive && (
          <div className="bg-red-600 text-white px-4 py-2 font-bold flex items-center justify-between animate-pulse shrink-0">
            <span className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4" /> EVACUATION SIREN TRANSMITTING TO CITIZEN CELL BROADCAST
            </span>
            <button onClick={() => setSirenActive(false)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Top Status Bar & KPIs */}
        <div className="p-3 border-b border-slate-800/80 bg-[#0a1222] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> HIGH RISK ALERT
            </span>
            <span className="text-slate-400 text-[11px]">Active monitoring sector: {selectedRegion.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#0f1a2e] border border-red-900/50 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
              <p className="text-sm font-black text-red-500">23</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">High Risk</p>
            </div>
            <div className="bg-[#0f1a2e] border border-amber-900/50 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
              <p className="text-sm font-black text-amber-500">47</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Moderate</p>
            </div>
            <div className="bg-[#0f1a2e] border border-emerald-900/50 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
              <p className="text-sm font-black text-emerald-500">12</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Safe Areas</p>
            </div>
            <button
              onClick={() => setShowFieldView(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1.5 transition ml-1"
            >
              <MapPin className="w-3.5 h-3.5" /> Field App (GPS)
            </button>
          </div>
        </div>

        {/* WORKSPACE CONTENT ROUTER */}
        {activeTab === 'ROADS' ? (
          <div className="p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strategic Arterial Corridor Status</h2>
            <div className="grid grid-cols-3 gap-3">
              {REGIONS_DATA.map(r => (
                <div key={r.id} className="bg-[#0a1222] border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{r.road}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      r.roadStatus === 'CLOSED' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>{r.roadStatus}</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">Terrain Sector: {r.name}, {r.state}</p>
                  <button 
                    onClick={() => { setSelectedRegion(r); setActiveTab('DASHBOARD'); }}
                    className="w-full py-1 bg-[#14233c] hover:bg-cyan-600 hover:text-white rounded text-[10px] transition"
                  >
                    Locate on Spatial Grid
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'RESPONSE' ? (
          <div className="p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Automated Evacuation Logistics & Drone Grid</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a1222] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="font-bold text-cyan-400">Autonomous UAV Recon Patrol</p>
                <p className="text-slate-400 text-[11px]">Fleet Drone-03 dispatched over NH-415 to verify fracture width along shear plane.</p>
                <div className="p-2 bg-[#070d18] font-mono text-[10px] text-emerald-400 rounded">
                  Status: FLIGHT ACTIVE • Altitude: 450m • Sensor: Optical LiDAR
                </div>
              </div>
              <div className="bg-[#0a1222] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="font-bold text-emerald-400">Emergency Shelter Quotas</p>
                <p className="text-slate-400 text-[11px]">Estimated displaced population within high-slope drainage basin: 1,240 people.</p>
                <button 
                  onClick={() => setModalState('SHELTERS')}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-[10px]"
                >
                  View Route Allocations
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD DASHBOARD VIEW */
          <div className="flex-1 p-3 grid grid-cols-12 gap-3 min-h-0">
            
            {/* Column 1: Map & GIS Polygonal Overlays */}
            <div className="col-span-5 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Geospatial Susceptibility (QGIS)
                  </span>
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
                      className="bg-[#14233c] border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5"
                    >
                      {REGIONS_DATA.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.state})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative flex-1 rounded-lg overflow-hidden border border-slate-800 bg-[#050912] min-h-[280px]">
                  {view3D ? (
                    <Terrain3D riskScore={calculatedRisk} slopeAngle={selectedRegion.slope} />
                  ) : (
                    <MapContainer 
                      center={[selectedRegion.lat, selectedRegion.lng]} 
                      zoom={9} 
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
                      
                      {/* QGIS Vector Boundary Layer Simulation */}
                      {REGIONS_DATA.map(r => (
                        <Polygon 
                          key={`poly-${r.id}`}
                          positions={r.polygon}
                          pathOptions={{
                            color: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                            fillColor: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.35,
                            weight: 1.5,
                            dashArray: '3, 4'
                          }}
                        />
                      ))}

                      {REGIONS_DATA.map((r) => {
                        const isTarget = r.id === selectedRegion.id;
                        return (
                          <CircleMarker
                            key={r.id}
                            center={[r.lat, r.lng]}
                            radius={isTarget ? 10 : 6}
                            pathOptions={{
                              color: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                              fillColor: r.baseSusceptibility > 70 ? '#ef4444' : '#f59e0b',
                              fillOpacity: 0.9
                            }}
                            eventHandlers={{ click: () => setSelectedRegion(r) }}
                          >
                            <Popup>
                              <div className="text-slate-900 text-[11px] font-sans">
                                <p className="font-bold">{r.name}</p>
                                <p>Slope: {r.slope}° • Elevation: {r.elevation}m</p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  )}
                </div>

                <div className="mt-2 bg-[#0f1a2e] border border-slate-800 p-2 rounded-lg flex justify-between items-center text-[11px]">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Lifeline Corridor</p>
                    <p className="font-medium text-slate-200">{selectedRegion.road}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    selectedRegion.roadStatus === 'CLOSED' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {selectedRegion.roadStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Meteorological & Hazard Breakdown */}
            <div className="col-span-4 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Weather & Trigger Forecast</span>
                  <span className="text-[10px] text-cyan-400 font-mono bg-[#0f1a2e] px-2 py-0.5 rounded border border-slate-800">
                    {selectedRegion.name}
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

              {/* Dynamic Factors Donut */}
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
                <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Hazard Score Components</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="w-24 h-24 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Rainfall', value: 42, color: '#06b6d4' },
                            { name: 'Moisture', value: 28, color: '#f59e0b' },
                            { name: 'Slope', value: 18, color: '#ef4444' },
                            { name: 'Lithology', value: 12, color: '#8b5cf6' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={24}
                          outerRadius={38}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#06b6d4" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs font-black text-white">{calculatedRisk}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-400"><span>Precipitation Impact</span><span className="font-bold text-cyan-400">42%</span></div>
                    <div className="flex justify-between text-slate-400"><span>Subsurface Pore Pressure</span><span className="font-bold text-amber-400">28%</span></div>
                    <div className="flex justify-between text-slate-400"><span>Topographic Gradient</span><span className="font-bold text-red-400">18%</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Telemetry & Interactive Actions */}
            <div className="col-span-3 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[10px]">Ground Geophone Telemetry</span>
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
                    <span className="text-slate-400">Acoustic Vibration</span>
                    <span className="text-emerald-400 font-mono font-bold">0.042 mm/s²</span>
                  </div>
                </div>
              </div>

              {/* Working Emergency Action Center */}
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                <p className="font-bold text-slate-400 uppercase text-[9px]">Emergency Response Actions</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button 
                    onClick={triggerSiren}
                    className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-red-950/50"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Siren
                  </button>
                  <button 
                    onClick={() => setModalState('NDRF')}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-cyan-950/50"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> NDRF
                  </button>
                  <button 
                    onClick={() => setModalState('SHELTERS')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-emerald-950/50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Shelters
                  </button>
                </div>
                <div className="bg-[#0f1a2e] border border-slate-800 p-2 rounded text-[10px] text-slate-400 leading-tight">
                  <span className="font-bold text-cyan-400">हिन्दी चेतावनी:</span> {selectedRegion.name} में अत्यधिक वर्षा के कारण त्वरित निकासी योजना सक्रिय है।
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}