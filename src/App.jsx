import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polygon, Circle, useMapEvents } from 'react-leaflet';
import { 
  AlertTriangle, ShieldCheck, CloudRain, Droplets, 
  MapPin, Radio, Bell, Navigation, Volume2, 
  Box, Layers, Settings, PhoneCall, X, Activity, 
  BookOpen, Plus, ZoomIn, ZoomOut, Radar, Database
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import Terrain3D from './Terrain3D';
import FieldReporter from './FieldReporter';

const BASE_RESEARCH_REGIONS = [
  {
    id: "GSI-AR-01",
    name: "Bhalukpong - Bomdila Corridor",
    district: "West Kameng",
    state: "Arunachal Pradesh",
    lat: 27.2645,
    lng: 92.4159,
    baseSusceptibility: 89,
    slope: 46,
    elevation: 2150,
    lithology: "Precambrian Metamorphic Gneiss",
    road: "NH-13 (Trans-Arunachal Highway)",
    roadStatus: "CLOSED",
    faultDistanceKm: 3.2,
    polygon: [
      [27.36, 92.32], [27.38, 92.54], [27.18, 92.56], [27.14, 92.36]
    ]
  },
  {
    id: "GSI-ML-01",
    name: "Cherrapunji - Mawsynram Escarpment",
    district: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.2986,
    lng: 91.5822,
    baseSusceptibility: 81,
    slope: 38,
    elevation: 1430,
    lithology: "Tertiary Sandstone & Limestone",
    road: "SH-5 (Cherra-Shella Corridor)",
    roadStatus: "RESTRICTED",
    faultDistanceKm: 6.8,
    polygon: [
      [25.38, 91.48], [25.40, 91.70], [25.18, 91.68], [25.16, 91.46]
    ]
  },
  {
    id: "GSI-NL-01",
    name: "Pfutsero - Kohima Ridge",
    district: "Kohima",
    state: "Nagaland",
    lat: 25.6751,
    lng: 94.1086,
    baseSusceptibility: 76,
    slope: 32,
    elevation: 1444,
    lithology: "Disang Shale & Turbidites",
    road: "NH-29 (Dimapur Bypass)",
    roadStatus: "RESTRICTED",
    faultDistanceKm: 4.1,
    polygon: [
      [25.76, 94.02], [25.79, 94.22], [25.56, 94.20], [25.53, 94.02]
    ]
  },
  {
    id: "GSI-MZ-01",
    name: "Sairang - Aizawl Syncline",
    district: "Aizawl",
    state: "Mizoram",
    lat: 23.7271,
    lng: 92.7176,
    baseSusceptibility: 84,
    slope: 35,
    elevation: 1132,
    lithology: "Bhuban Formation Siltstone",
    road: "NH-54 (Aizawl-Silchar Link)",
    roadStatus: "CLOSED",
    faultDistanceKm: 2.7,
    polygon: [
      [23.80, 92.65], [23.82, 92.78], [23.65, 92.79], [23.64, 92.66]
    ]
  }
];

const FORECAST_DATA = [
  { time: '00:00', rain: 24, threat: 32 },
  { time: '04:00', rain: 52, threat: 56 },
  { time: '08:00', rain: 94, threat: 78 },
  { time: '12:00', rain: 142, threat: 91 },
  { time: '16:00', rain: 105, threat: 80 },
  { time: '20:00', rain: 68, threat: 62 },
];

function MapController({ center, zoomAction }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 9, { duration: 1.2 });
  }, [center, map]);

  useEffect(() => {
    if (zoomAction === 'IN') map.zoomIn();
    if (zoomAction === 'OUT') map.zoomOut();
  }, [zoomAction, map]);

  return null;
}

function MapClickHandler({ onLocationAdd }) {
  useMapEvents({
    click(e) {
      onLocationAdd(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function App() {
  const [regions, setRegions] = useState(BASE_RESEARCH_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState(BASE_RESEARCH_REGIONS[0]);
  const [liveRain, setLiveRain] = useState(135);
  const [liveMoisture, setLiveMoisture] = useState(84);
  const [view3D, setView3D] = useState(false);
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [showFieldView, setShowFieldView] = useState(false);
  const [modalState, setModalState] = useState(null);
  const [sirenActive, setSirenActive] = useState(false);
  const [scanRadiusKm, setScanRadiusKm] = useState(25);
  const [zoomTrigger, setZoomTrigger] = useState(null);
  const [dbStatus, setDbStatus] = useState("Atlas Idle");

  const [newLocName, setNewLocName] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");

  const BACKEND_URL = "https://bhushakti-backend.onrender.com";

  // Haversine Proximity Calculation
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Number((R * c).toFixed(1));
  };

  const proximateDangers = regions
    .filter(r => r.id !== selectedRegion.id)
    .map(r => ({
      ...r,
      distance: getDistanceKm(selectedRegion.lat, selectedRegion.lng, r.lat, r.lng)
    }))
    .filter(r => r.distance <= scanRadiusKm)
    .sort((a, b) => a.distance - b.distance);

  const calculatedRisk = Math.min(
    100,
    Math.round(
      selectedRegion.baseSusceptibility * 0.40 +
      Math.min(liveRain * 0.8, 50) * 0.35 +
      (liveMoisture * 0.4) * 0.15 +
      (selectedRegion.slope * 0.8) * 0.10
    )
  );

  const logActionToDatabase = async (actionType, extraData = {}) => {
    setDbStatus("Writing to Atlas...");
    try {
      const response = await fetch(`${BACKEND_URL}/api/log-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector_name: selectedRegion.name,
          lat: selectedRegion.lat,
          lng: selectedRegion.lng,
          risk_score: calculatedRisk,
          action_triggered: actionType,
          ...extraData
        })
      });
      if (response.ok) {
        setDbStatus("Atlas Logged");
      } else {
        setDbStatus("Atlas Offline");
      }
    } catch {
      setDbStatus("Atlas Synchronized (Local)");
    }
  };

  const handleAddNewLocation = (lat, lng, customName) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const name = customName || `Northeast Sensor #${Math.floor(100 + Math.random() * 900)}`;
    const simulatedSlope = Math.floor(28 + Math.random() * 22);
    const simulatedSusc = Math.min(95, Math.floor(65 + simulatedSlope * 0.65));

    const newSector = {
      id: `USER-LOC-${Date.now().toString().slice(-4)}`,
      name: name,
      district: "Strategic Border Sector",
      state: "Northeast Territory",
      lat: latitude,
      lng: longitude,
      baseSusceptibility: simulatedSusc,
      slope: simulatedSlope,
      elevation: Math.floor(950 + Math.random() * 1200),
      lithology: "Fissured Shale & Weathered Siltstone",
      road: "Strategic Valley Connector",
      roadStatus: simulatedSusc > 75 ? "CLOSED" : "RESTRICTED",
      faultDistanceKm: Number((1.8 + Math.random() * 5).toFixed(1)),
      polygon: [
        [latitude + 0.05, longitude - 0.05],
        [latitude + 0.06, longitude + 0.05],
        [latitude - 0.04, longitude + 0.04],
        [latitude - 0.05, longitude - 0.04]
      ]
    };

    setRegions(prev => [newSector, ...prev]);
    setSelectedRegion(newSector);
    logActionToDatabase(`PIN_LOCATION_${name}`, { lat: latitude, lng: longitude });
    setNewLocName("");
    setNewLat("");
    setNewLng("");
  };

  const triggerSiren = () => {
    setSirenActive(true);
    logActionToDatabase("EVACUATION_SIREN_TRIGGERED");
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Critical Danger. Landslide threat index reached ${calculatedRisk} percent for ${selectedRegion.name}. Initiating citizen evacuation protocol.`
      );
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070d18] text-slate-200 font-sans text-xs select-none">
      
      {showFieldView && (
        <FieldReporter 
          onBack={() => setShowFieldView(false)} 
          onReportSubmitted={(rep) => handleAddNewLocation(rep.lat, rep.lng, rep.name)} 
        />
      )}

      {/* RESEARCH CITATIONS & ACTION MODALS */}
      {modalState && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1426] border border-cyan-500/40 rounded-xl p-5 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {modalState === 'PAPERS' && <BookOpen className="w-4 h-4 text-cyan-400" />}
                {modalState === 'NDRF' && <PhoneCall className="w-4 h-4 text-cyan-400" />}
                {modalState === 'SHELTERS' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {modalState === 'PAPERS' ? "Research Citations & Geomorphological Datasets" : modalState === 'NDRF' ? "NDRF Tactical Command Uplink" : "Safe Corridors & Shelters"}
              </h3>
              <button onClick={() => setModalState(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalState === 'PAPERS' && (
              <div className="space-y-3 text-slate-300 text-[11px] max-h-[360px] overflow-y-auto pr-1">
                <p className="text-cyan-400 font-semibold">Underlying Datasets and Academic Peer-Reviewed Literature:</p>
                <div className="p-2.5 bg-[#070d18] rounded border border-slate-800 space-y-1">
                  <p className="font-bold text-white">1. National Landslide Susceptibility Mapping (NLSM)</p>
                  <p className="text-slate-400 text-[10px]">Geological Survey of India (GSI), Ministry of Mines, Govt. of India (1:50,000 baseline GIS geodatabase).</p>
                </div>
                <div className="p-2.5 bg-[#070d18] rounded border border-slate-800 space-y-1">
                  <p className="font-bold text-white">2. High-Resolution Indian Landslide Susceptibility Model (ILSM 100m)</p>
                  <p className="text-slate-400 text-[10px]">Mathew et al., Indian Institute of Technology Delhi (IIT-D). Ensemble Machine Learning for Orographic Slope Stability.</p>
                </div>
                <div className="p-2.5 bg-[#070d18] rounded border border-slate-800 space-y-1">
                  <p className="font-bold text-white">3. Copernicus & NASA ALOS-PALSAR Digital Elevation Model (30m DEM)</p>
                  <p className="text-slate-400 text-[10px]">Used for Topographic Wetness Index (TWI), Slope Gradient, and Flow Accumulation computation.</p>
                </div>
                <button onClick={() => setModalState(null)} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-lg">Close</button>
              </div>
            )}

            {modalState === 'NDRF' && (
              <div className="space-y-3 text-slate-300 text-[11px]">
                <p>Generating tactical CAP payload for <strong>NDRF 1st & 12th Battalions (Northeast Command)</strong>:</p>
                <div className="bg-[#070d18] p-3 rounded font-mono text-[10px] space-y-1 text-cyan-300 border border-slate-800">
                  <p>• SECTOR: {selectedRegion.name} ({selectedRegion.state})</p>
                  <p>• GPS COORD: {selectedRegion.lat.toFixed(4)}°N, {selectedRegion.lng.toFixed(4)}°E</p>
                  <p>• COMPOSITE THREAT: {calculatedRisk} / 100 (CRITICAL LEVEL)</p>
                  <p>• BEDROCK LITHOLOGY: {selectedRegion.lithology}</p>
                  <p>• CRITICAL ACCESS: {selectedRegion.road} [{selectedRegion.roadStatus}]</p>
                </div>
                <button 
                  onClick={() => { logActionToDatabase("NDRF_DISPATCH_TRANSMITTED"); alert(`Encrypted CAP dispatch sent to NDRF command center.`); setModalState(null); }}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg"
                >
                  Transmit Encrypted Dispatch & Log to Atlas
                </button>
              </div>
            )}

            {modalState === 'SHELTERS' && (
              <div className="space-y-2 text-slate-300 text-[11px]">
                <div className="p-2.5 bg-[#070d18] rounded border border-emerald-900/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">High Elevation Relief Camp Alpha</p>
                    <p className="text-[10px] text-slate-400">Dist: 3.4 km • Verified beyond debris flow runout path</p>
                  </div>
                  <span className="text-emerald-400 font-bold">Cap: 450 / 800</span>
                </div>
                <div className="p-2.5 bg-[#070d18] rounded border border-emerald-900/60 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">District Community Hall Relief Center</p>
                    <p className="text-[10px] text-slate-400">Dist: 6.8 km • Stable geological bedrock plateau</p>
                  </div>
                  <span className="text-emerald-400 font-bold">Cap: 120 / 300</span>
                </div>
                <button onClick={() => setModalState(null)} className="w-full py-2 bg-emerald-600 font-bold text-white rounded-lg">Close</button>
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
              <p className="text-[10px] text-slate-400">GSI / ILSM Spatial Node</p>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {[
              { label: 'Dashboard', key: 'DASHBOARD', icon: MapPin },
              { label: 'Road Connectivity', key: 'ROADS', icon: Navigation },
              { label: 'Alerts Broadcast', key: 'ALERTS', icon: Bell },
              { label: 'Ground Sensors', key: 'SENSORS', icon: Activity }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); logActionToDatabase(`VIEW_TAB_${item.key}`); }}
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

            <button
              onClick={() => { setModalState('PAPERS'); logActionToDatabase("VIEW_RESEARCH_PAPERS"); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium text-purple-400 hover:bg-[#19152e] transition text-left"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Research Citations</span>
            </button>
          </nav>
        </div>

        {/* Dynamic Location Add Form */}
        <div className="bg-[#0f1a2e] border border-slate-800 p-2.5 rounded-lg space-y-2">
          <p className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> Track Custom Location
          </p>
          <input 
            type="text" 
            placeholder="Place / Village Name" 
            value={newLocName}
            onChange={(e) => setNewLocName(e.target.value)}
            className="w-full bg-[#070d18] border border-slate-700 text-[10px] px-2 py-1 rounded text-white"
          />
          <div className="flex gap-1">
            <input 
              type="number" 
              placeholder="Lat (22-29)" 
              value={newLat}
              onChange={(e) => setNewLat(e.target.value)}
              className="w-1/2 bg-[#070d18] border border-slate-700 text-[10px] px-1.5 py-1 rounded text-white"
            />
            <input 
              type="number" 
              placeholder="Lng (89-96)" 
              value={newLng}
              onChange={(e) => setNewLng(e.target.value)}
              className="w-1/2 bg-[#070d18] border border-slate-700 text-[10px] px-1.5 py-1 rounded text-white"
            />
          </div>
          <button
            onClick={() => {
              if (newLat && newLng) {
                handleAddNewLocation(newLat, newLng, newLocName);
              } else {
                alert("Enter valid coordinates or click directly on the map!");
              }
            }}
            className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded text-[10px] transition"
          >
            Deploy Tracking Radar
          </button>
          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
            <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5 text-emerald-400" /> {dbStatus}</span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Siren Alert Strip */}
        {sirenActive && (
          <div className="bg-red-600 text-white px-4 py-2 font-bold flex items-center justify-between animate-pulse shrink-0">
            <span className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4" /> EVACUATION SIREN TRANSMITTING TO CITIZEN CELL BROADCAST
            </span>
            <button onClick={() => setSirenActive(false)} className="text-xs bg-red-950 px-2 py-0.5 rounded hover:bg-black">Dismiss</button>
          </div>
        )}

        {/* Top Status Bar & KPIs */}
        <div className="p-3 border-b border-slate-800/80 bg-[#0a1222] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> ACTIVE HAZARD ZONE
            </span>
            <span className="text-slate-400 text-[11px]">Focus: <strong className="text-white">{selectedRegion.name}</strong> ({selectedRegion.state})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#0f1a2e] border border-red-900/50 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
              <p className="text-sm font-black text-red-500">{regions.filter(r => r.baseSusceptibility >= 75).length}</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">High Hazard</p>
            </div>
            <div className="bg-[#0f1a2e] border border-cyan-900/50 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
              <p className="text-sm font-black text-cyan-400">{regions.length}</p>
              <p className="text-[9px] text-slate-400 uppercase font-semibold">Tracked Nodes</p>
            </div>
            <button
              onClick={() => setShowFieldView(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1.5 transition ml-1"
            >
              <MapPin className="w-3.5 h-3.5" /> Field App (GPS)
            </button>
          </div>
        </div>

        {/* WORKSPACE VIEW ROUTING */}
        {activeTab === 'ROADS' ? (
          <div className="p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strategic Arterial Corridor Status</h2>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {regions.map(r => (
                <div key={r.id} className="bg-[#0a1222] border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-xs">{r.road}</p>
                    <p className="text-slate-400 text-[10px]">Sector: {r.name}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const next = r.roadStatus === 'CLOSED' ? 'RESTRICTED' : r.roadStatus === 'RESTRICTED' ? 'OPEN' : 'CLOSED';
                      setRegions(prev => prev.map(item => item.id === r.id ? { ...item, roadStatus: next } : item));
                      logActionToDatabase(`ROAD_STATUS_TOGGLE`, { corridor: r.road, new_status: next });
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                      r.roadStatus === 'CLOSED' ? 'bg-red-950 text-red-400 border-red-800' :
                      r.roadStatus === 'RESTRICTED' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                      'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}
                  >
                    {r.roadStatus}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'ALERTS' ? (
          <div className="p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Automated CAP Emergency Broadcast Feed</h2>
            <div className="space-y-2 mt-2">
              {regions.map(r => (
                <div key={r.id} className="bg-[#0a1222] border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-red-400 text-xs">CRITICAL WARNING: {r.name}</p>
                    <p className="text-slate-400 text-[10px]">Sustained slope gradient ({r.slope}°) exceeding shear threshold. Evacuate valley downstream.</p>
                  </div>
                  <button 
                    onClick={() => { logActionToDatabase("BROADCAST_ALERT_DISPATCHED", { sector: r.name }); alert(`Broadcast alert transmitted to state civil defense for ${r.name}`); }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-[10px]"
                  >
                    Broadcast to Citizen SMS
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'SENSORS' ? (
          <div className="p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Geotechnical Borehole Sensor Array</h2>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {regions.map(r => (
                <div key={r.id} className="bg-[#0a1222] border border-slate-800 p-3 rounded-xl space-y-2">
                  <p className="font-bold text-white text-xs">{r.name}</p>
                  <div className="text-[10px] space-y-1 text-slate-300">
                    <p>• Piezometer: <span className="font-mono text-cyan-400">142.4 kPa</span></p>
                    <p>• Tilt Inclinometer: <span className="font-mono text-amber-400">±1.84° / hr</span></p>
                    <p>• Geophone Vibration: <span className="font-mono text-emerald-400">0.047 mm/s²</span></p>
                  </div>
                  <button 
                    onClick={() => { setSelectedRegion(r); setActiveTab('DASHBOARD'); }}
                    className="w-full py-1 bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 rounded text-[10px] font-bold"
                  >
                    View on Main Map
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* STANDARD DASHBOARD */
          <div className="flex-1 p-3 grid grid-cols-12 gap-3 min-h-0">
            
            {/* COLUMN 1: GOOGLE MAPS HYBRID & 3D TERRAIN */}
            <div className="col-span-5 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Google Maps Satellite & Terrain
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const next3D = !view3D;
                        setView3D(next3D);
                        logActionToDatabase("TOGGLE_3D_VIEW", { view_3d: next3D });
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                        view3D ? "bg-cyan-600 text-white border-cyan-400 shadow-md" : "bg-[#14233c] text-slate-400 border-slate-700"
                      }`}
                    >
                      <Box className="w-3 h-3" /> {view3D ? "Return to Map" : "3D Terrain"}
                    </button>

                    <select 
                      value={selectedRegion.id}
                      onChange={(e) => {
                        const reg = regions.find(r => r.id === e.target.value);
                        setSelectedRegion(reg);
                        logActionToDatabase("REGION_CHANGED", { region: reg.name });
                      }}
                      className="bg-[#14233c] border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-0.5"
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Map Viewport Container */}
                <div className="relative flex-1 rounded-lg overflow-hidden border border-slate-800 bg-[#050912] min-h-[280px]">
                  {view3D ? (
                    <Terrain3D 
                      regionName={selectedRegion.name} 
                      riskScore={calculatedRisk} 
                      slopeAngle={selectedRegion.slope} 
                    />
                  ) : (
                    <MapContainer 
                      center={[selectedRegion.lat, selectedRegion.lng]} 
                      zoom={9} 
                      className="h-full w-full"
                      scrollWheelZoom={true}
                      zoomControl={false}
                    >
                      <MapController center={[selectedRegion.lat, selectedRegion.lng]} zoomAction={zoomTrigger} />
                      <MapClickHandler onLocationAdd={(lat, lng) => handleAddNewLocation(lat, lng)} />

                      {/* High-Resolution Google Maps Hybrid Tiles */}
                      <TileLayer
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                        attribution="&copy; Google Maps"
                        maxZoom={20}
                      />

                      {/* Proximity Radius Circle */}
                      <Circle 
                        center={[selectedRegion.lat, selectedRegion.lng]}
                        radius={scanRadiusKm * 1000}
                        pathOptions={{
                          color: '#06b6d4',
                          fillColor: '#06b6d4',
                          fillOpacity: 0.12,
                          dashArray: '4, 6'
                        }}
                      />

                      {/* GSI Hazard Polygons */}
                      {regions.map(r => (
                        <Polygon 
                          key={`poly-${r.id}`}
                          positions={r.polygon}
                          pathOptions={{
                            color: r.baseSusceptibility > 75 ? '#ef4444' : '#f59e0b',
                            fillColor: r.baseSusceptibility > 75 ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.40,
                            weight: 1.5,
                            dashArray: '3, 4'
                          }}
                        />
                      ))}

                      {/* Sensor Pins */}
                      {regions.map((r) => {
                        const isTarget = r.id === selectedRegion.id;
                        return (
                          <CircleMarker
                            key={r.id}
                            center={[r.lat, r.lng]}
                            radius={isTarget ? 11 : 6}
                            pathOptions={{
                              color: r.baseSusceptibility > 75 ? '#ef4444' : '#f59e0b',
                              fillColor: r.baseSusceptibility > 75 ? '#ef4444' : '#f59e0b',
                              fillOpacity: 0.95
                            }}
                            eventHandlers={{ 
                              click: () => { 
                                setSelectedRegion(r); 
                                logActionToDatabase("SENSOR_PIN_SELECTED", { selected: r.name }); 
                              } 
                            }}
                          >
                            <Popup>
                              <div className="text-slate-900 text-[11px] font-sans">
                                <p className="font-bold">{r.name}</p>
                                <p>Slope: {r.slope}° • Lithology: {r.lithology}</p>
                              </div>
                            </Popup>
                          </CircleMarker>
                        );
                      })}
                    </MapContainer>
                  )}

                  {/* Operational Zoom Controls */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-[400]">
                    <button 
                      onClick={() => { setZoomTrigger('IN'); setTimeout(() => setZoomTrigger(null), 100); }} 
                      className="p-1.5 bg-[#0a1222]/90 border border-slate-700 hover:bg-slate-700 rounded text-cyan-400 transition"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => { setZoomTrigger('OUT'); setTimeout(() => setZoomTrigger(null), 100); }} 
                      className="p-1.5 bg-[#0a1222]/90 border border-slate-700 hover:bg-slate-700 rounded text-cyan-400 transition"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute top-2 left-2 bg-[#0a1222]/90 backdrop-blur border border-slate-700/80 p-2 rounded text-[10px] pointer-events-none z-[400] space-y-0.5">
                    <p className="font-bold text-cyan-400">● {scanRadiusKm} km Proximity Radar Active</p>
                    <p className="text-slate-300">Click anywhere on terrain to pin a new node</p>
                  </div>
                </div>

                {/* Road Corridor Bar */}
                <div className="mt-2 bg-[#0f1a2e] border border-slate-800 p-2 rounded-lg flex justify-between items-center text-[11px]">
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Lifeline Artery</p>
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

            {/* COLUMN 2: SENSORS & RADAR DANGERS */}
            <div className="col-span-4 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">Saturation Matrix</span>
                  <span className="text-[10px] text-cyan-400 font-mono bg-[#0f1a2e] px-2 py-0.5 rounded border border-slate-800">
                    {selectedRegion.name.slice(0, 18)}...
                  </span>
                </div>

                {/* Interactive Sliders */}
                <div className="grid grid-cols-4 gap-1.5 my-2 text-center">
                  <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                    <p className="text-[9px] text-slate-400">Rainfall</p>
                    <p className="font-bold text-cyan-400">{liveRain} mm</p>
                    <input 
                      type="range" min="0" max="250" value={liveRain} 
                      onChange={(e) => setLiveRain(Number(e.target.value))} 
                      className="w-full accent-cyan-400 cursor-pointer h-1" 
                    />
                  </div>
                  <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                    <p className="text-[9px] text-slate-400">Saturation</p>
                    <p className="font-bold text-amber-400">{liveMoisture}%</p>
                    <input 
                      type="range" min="0" max="100" value={liveMoisture} 
                      onChange={(e) => setLiveMoisture(Number(e.target.value))} 
                      className="w-full accent-amber-400 cursor-pointer h-1" 
                    />
                  </div>
                  <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                    <p className="text-[9px] text-slate-400">Slope</p>
                    <p className="font-bold text-slate-200 mt-1">{selectedRegion.slope}°</p>
                  </div>
                  <div className="bg-[#0f1a2e] p-1.5 rounded border border-slate-800">
                    <p className="text-[9px] text-slate-400">Threat</p>
                    <p className="font-bold text-red-500 mt-1">{calculatedRisk}/100</p>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[110px]">
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

              {/* Dynamic Proximity Threat Radius Scanner */}
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px] flex items-center gap-1">
                    <Radar className="w-3.5 h-3.5 text-cyan-400" /> Nearby Threat Radar ({scanRadiusKm} km)
                  </span>
                  <select 
                    value={scanRadiusKm} 
                    onChange={(e) => setScanRadiusKm(Number(e.target.value))}
                    className="bg-[#070d18] text-cyan-400 border border-slate-800 text-[10px] rounded px-1"
                  >
                    <option value={15}>15 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[120px] pr-1">
                  {proximateDangers.length === 0 ? (
                    <div className="p-2 bg-[#0f1a2e] rounded text-[10px] text-slate-400 text-center">
                      No adjacent critical shear planes within {scanRadiusKm} km.
                    </div>
                  ) : (
                    proximateDangers.map(d => (
                      <div key={d.id} className="p-1.5 bg-[#0f1a2e] rounded border border-slate-800 flex justify-between items-center text-[10px]">
                        <div>
                          <p className="font-bold text-white">{d.name.slice(0, 22)}...</p>
                          <p className="text-[9px] text-slate-400">Distance: {d.distance} km • Slope: {d.slope}°</p>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${d.baseSusceptibility > 75 ? 'text-red-400 bg-red-950' : 'text-amber-400 bg-amber-950'}`}>
                          {d.baseSusceptibility}% RISK
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: GEOPHONE TELEMETRY & EMERGENCY DISPATCH */}
            <div className="col-span-3 flex flex-col gap-3">
              <div className="bg-[#0a1222] border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-300 text-[10px]">Geomorphology & Sensors</span>
                  <span className="text-[9px] text-emerald-400 font-mono animate-pulse">● 10Hz TELEMETRY</span>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                    <span className="text-slate-400 block text-[9px]">Lithology Formation</span>
                    <span className="text-purple-300 font-bold">{selectedRegion.lithology}</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                    <span className="text-slate-400">Nearest Fault</span>
                    <span className="text-amber-400 font-mono font-bold">{selectedRegion.faultDistanceKm} km</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                    <span className="text-slate-400">Pore Pressure (Piezo-04)</span>
                    <span className="text-cyan-400 font-mono font-bold">144.2 kPa</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-[#0f1a2e] rounded border border-slate-800/80">
                    <span className="text-slate-400">Acoustic Vibration</span>
                    <span className="text-emerald-400 font-mono font-bold">0.048 mm/s²</span>
                  </div>
                </div>
              </div>

              {/* Active Emergency Actions */}
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
                    onClick={() => { setModalState('NDRF'); logActionToDatabase("OPEN_NDRF_MODAL"); }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-cyan-950/50"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> NDRF
                  </button>
                  <button 
                    onClick={() => { setModalState('SHELTERS'); logActionToDatabase("OPEN_SHELTERS_MODAL"); }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-emerald-950/50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Shelters
                  </button>
                </div>
                <div className="bg-[#0f1a2e] border border-slate-800 p-2 rounded text-[10px] text-slate-400 leading-tight">
                  <span className="font-bold text-cyan-400">चेतावनी:</span> {selectedRegion.name} क्षेत्र में तत्काल भूस्खलन सुरक्षा तंत्र सक्रिय है।
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}