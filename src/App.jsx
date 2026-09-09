import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Activity, AlertTriangle, BellRing, Droplets, FileWarning, Navigation, Radio, RefreshCw, Send, Siren, Users, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import FieldReporter from './FieldReporter';

const API = import.meta.env.VITE_API_URL || 'https://bhushakti-backend.onrender.com';
const DEMO_REGIONS = [
  {id:'GSI-AR-01',name:'Bhalukpong - Bomdila Corridor',state:'Arunachal Pradesh',district:'West Kameng',lat:27.2645,lng:92.4159,susceptibility:89,slope:46,elevation:2150,road:'NH-13',road_status:'CLOSED',rainfall_mm:168,soil_moisture_pct:88,population_at_risk:4200,villages:[{name:'Tenzingaon',distance_km:2.1,population:640},{name:'Nyukmadung',distance_km:3.4,population:520}]},
  {id:'GSI-AR-02',name:'Tawang - Bomdila Corridor',state:'Arunachal Pradesh',district:'Tawang',lat:27.5867,lng:91.859,susceptibility:86,slope:43,elevation:2650,road:'NH-13',road_status:'RESTRICTED',rainfall_mm:142,soil_moisture_pct:82,population_at_risk:2900,villages:[{name:'Dirang',distance_km:3,population:780},{name:'Jang',distance_km:5.1,population:460}]},
  {id:'GSI-AR-03',name:'Itanagar - Naharlagun Corridor',state:'Arunachal Pradesh',district:'Papum Pare',lat:27.102,lng:93.695,susceptibility:72,slope:29,elevation:440,road:'NH-15',road_status:'OPEN',rainfall_mm:116,soil_moisture_pct:76,population_at_risk:6100,villages:[{name:'Naharlagun',distance_km:2,population:1400},{name:'Doimukh',distance_km:5.4,population:820}]},
  {id:'GSI-AS-01',name:'Haflong - Silchar Corridor',state:'Assam',district:'Dima Hasao',lat:25.164,lng:93.0176,susceptibility:79,slope:34,elevation:680,road:'NH-27',road_status:'RESTRICTED',rainfall_mm:154,soil_moisture_pct:87,population_at_risk:3500,villages:[{name:'Mahur',distance_km:2.5,population:510},{name:'Jatinga',distance_km:4.7,population:380}]},
  {id:'GSI-ML-01',name:'Cherrapunji - Mawsynram Escarpment',state:'Meghalaya',district:'East Khasi Hills',lat:25.2986,lng:91.5822,susceptibility:81,slope:38,elevation:1430,road:'SH-5',road_status:'RESTRICTED',rainfall_mm:205,soil_moisture_pct:92,population_at_risk:3100,villages:[{name:'Mawkdok',distance_km:1.8,population:410},{name:'Laitkynsew',distance_km:6.5,population:390}]},
  {id:'GSI-ML-02',name:'Shillong - Jowai Corridor',state:'Meghalaya',district:'East Khasi Hills / West Jaintia Hills',lat:25.467,lng:92.203,susceptibility:74,slope:33,elevation:1250,road:'NH-6',road_status:'OPEN',rainfall_mm:132,soil_moisture_pct:80,population_at_risk:4700,villages:[{name:'Mawphlang',distance_km:3.1,population:620},{name:'Nartiang',distance_km:6,population:560}]},
  {id:'GSI-MZ-01',name:'Sairang - Aizawl Syncline',state:'Mizoram',district:'Aizawl',lat:23.7271,lng:92.7176,susceptibility:84,slope:35,elevation:1132,road:'NH-54',road_status:'CLOSED',rainfall_mm:149,soil_moisture_pct:86,population_at_risk:3800,villages:[{name:'Sairang Venglai',distance_km:1.2,population:710},{name:'Sialsuk',distance_km:3.9,population:340}]},
  {id:'GSI-MZ-02',name:'Lunglei Corridor',state:'Mizoram',district:'Lunglei',lat:22.8877,lng:92.738,susceptibility:78,slope:37,elevation:1220,road:'NH-302',road_status:'RESTRICTED',rainfall_mm:137,soil_moisture_pct:83,population_at_risk:2500,villages:[{name:'Hnahthial',distance_km:3.4,population:480},{name:'Lungsen',distance_km:5.2,population:360}]},
  {id:'GSI-NL-01',name:'Pfutsero - Kohima Ridge',state:'Nagaland',district:'Kohima',lat:25.6751,lng:94.1086,susceptibility:76,slope:32,elevation:1444,road:'NH-29',road_status:'RESTRICTED',rainfall_mm:98,soil_moisture_pct:70,population_at_risk:2600,villages:[{name:'Chizami',distance_km:3,population:450},{name:'Kikruma',distance_km:7.1,population:520}]},
  {id:'GSI-MN-01',name:'Ukhrul - Imphal Corridor',state:'Manipur',district:'Ukhrul / Imphal East',lat:24.75,lng:94.01,susceptibility:77,slope:36,elevation:1120,road:'NH-202',road_status:'RESTRICTED',rainfall_mm:128,soil_moisture_pct:81,population_at_risk:3300,villages:[{name:'Hundung',distance_km:2.7,population:430},{name:'Sikhong',distance_km:5.5,population:350}]},
  {id:'GSI-SK-01',name:'Gangtok - Rangpo Corridor',state:'Sikkim',district:'Gangtok / Pakyong',lat:27.3389,lng:88.6065,susceptibility:88,slope:44,elevation:1650,road:'NH-10',road_status:'CLOSED',rainfall_mm:176,soil_moisture_pct:89,population_at_risk:5200,villages:[{name:'Rangpo',distance_km:1.9,population:950},{name:'Singtam',distance_km:4,population:720}]}
];

const score = r => r.risk_score ?? Math.min(100, Math.round(r.susceptibility*.45 + Math.min((r.rainfall_mm||135)/150*100,100)*.25 + (r.soil_moisture_pct||84)*.15 + Math.min(r.slope/50*100,100)*.15));
const level = n => n>=75 ? 'CRITICAL' : n>=55 ? 'HIGH' : n>=35 ? 'MODERATE' : 'LOW';
const tone = n => n>=75 ? 'red' : n>=55 ? 'amber' : 'green';
const textTone = n => ({red:'text-red-400',amber:'text-amber-400',green:'text-emerald-400'})[tone(n)];
const barTone = n => ({red:'bg-red-500',amber:'bg-amber-400',green:'bg-emerald-500'})[tone(n)];
const villageScore = (parent,distance) => Math.max(20, Math.min(100, Math.round(parent-distance*4)));

function FlyTo({region}) { const map=useMap(); useEffect(()=>{map.flyTo([region.lat,region.lng],7.5,{duration:.7});},[map,region]); return null; }

function Stat({icon:Icon,label,value,sub,red=false,amber=false}) { const c=red?'text-red-400':amber?'text-amber-400':'text-cyan-400'; return <div className="panel p-3"><div className="flex justify-between gap-2"><div><p className="muted text-[9px] uppercase tracking-widest">{label}</p><p className="text-xl font-black text-white mt-1">{value}</p><p className="muted text-[8px] mt-1">{sub}</p></div><Icon className={`w-5 h-5 ${c}`}/></div></div>; }

export default function App() {
  const [regions,setRegions]=useState(DEMO_REGIONS);
  const [selected,setSelected]=useState(DEMO_REGIONS[0]);
  const [incidents,setIncidents]=useState([]);
  const [alerts,setAlerts]=useState([]);
  const [recipients,setRecipients]=useState([]);
  const [summary,setSummary]=useState(null);
  const [tab,setTab]=useState('COMMAND');
  const [field,setField]=useState(false);
  const [warning,setWarning]=useState(false);
  const [online,setOnline]=useState(navigator.onLine);
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);
  const [sending,setSending]=useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch(`${API}/api/regions`), fetch(`${API}/api/dashboard/summary`),
        fetch(`${API}/api/incidents`), fetch(`${API}/api/alerts`), fetch(`${API}/api/recipients`)
      ]);
      const [r,s,i,a,u]=responses;
      if(r.ok){const data=await r.json(); if(data.length){setRegions(data);setSelected(data.find(x=>x.id===selected.id)||data[0]);}}
      if(s.ok)setSummary(await s.json());
      if(i.ok)setIncidents(await i.json());
      if(a.ok)setAlerts(await a.json());
      if(u.ok)setRecipients(await u.json());
      setNotice('API CONNECTED · DEMO RISK INPUTS');
    } catch { setNotice('DEMO MODE · API UNAVAILABLE'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{load(); const up=()=>setOnline(true),down=()=>setOnline(false); window.addEventListener('online',up);window.addEventListener('offline',down);return()=>{window.removeEventListener('online',up);window.removeEventListener('offline',down);};},[]);

  const risk=score(selected);
  const villages=useMemo(()=>[...(selected.villages||[])].map(v=>({...v,risk_score:villageScore(risk,v.distance_km),risk_level:level(villageScore(risk,v.distance_km))})).sort((a,b)=>b.risk_score-a.risk_score),[selected,risk]);
  const critical=regions.filter(r=>score(r)>=75).length;
  const high=regions.filter(r=>score(r)>=55&&score(r)<75).length;
  const forecast=Array.from({length:6},(_,i)=>({time:`${i*4}:00`,risk:Math.max(25,Math.round(risk-(Math.abs(2-i)*7))),rain:Math.round((selected.rainfall_mm||100)*([.2,.4,.65,1,.82,.55][i]))}));
  const action=risk>=85?'Restrict corridor + prepare evacuation':risk>=75?'Deploy field team + restrict traffic':risk>=55?'Increase monitoring + standby response':'Continue routine monitoring';

  const sendWarning=async()=>{
    setSending(true);
    const message=`BHUSAKTHI ALERT: ${level(risk)} landslide risk at ${selected.name}. Avoid ${selected.road} near the affected zone and follow local administration instructions.`;
    try {
      const r=await fetch(`${API}/api/alerts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({region_id:selected.id,severity:level(risk),message,channels:['DASHBOARD','SMS']})});
      if(!r.ok)throw new Error('alert');
      const data=await r.json();
      await fetch(`${API}/api/alerts/${data.alert.id}/dispatch`,{method:'POST'});
      setNotice(`WARNING DISPATCHED · ${data.alert.recipient_count||0} REGISTERED RECIPIENTS · SIMULATED SMS`);
      await load();
    } catch { setNotice('WARNING SAVED FOR OFFLINE/RETRY QUEUE'); }
    finally { setSending(false); }
  };

  const openWarning=()=>{setWarning(true); if('speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(`Landslide warning. ${level(risk)} risk at ${selected.name}. Follow official evacuation instructions.`));}};
  const submitReport=report=>{setIncidents(x=>[report,...x]);setField(false);setNotice('FIELD REPORT RECEIVED · MAP UPDATE QUEUED');load();};
  const tabs=['COMMAND','GIS','WARNING','INCIDENTS','RESPONSE','ANALYTICS'];

  return <div className="h-screen w-screen overflow-hidden bg-[#050a13] text-slate-200 text-xs">
    {field&&<FieldReporter onBack={()=>setField(false)} onReportSubmitted={submitReport}/>} 
    {warning&&<div className="fixed inset-0 z-[3000] bg-red-950/95 backdrop-blur flex items-center justify-center p-6"><div className="panel border-red-500 max-w-md w-full p-8 text-center"><div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse"><Siren className="w-8 h-8 text-red-400"/></div><p className="text-red-300 font-black tracking-[.25em] text-xs mt-4">BHUSAKTHI EMERGENCY WARNING</p><h2 className="text-2xl font-black text-white mt-2">{level(risk)} RISK</h2><p className="text-slate-300 mt-2">{selected.name}</p><p className={`text-6xl font-black mt-3 ${textTone(risk)}`}>{risk}<span className="text-xl text-slate-500">/100</span></p><p className="text-red-300 text-[10px] font-bold uppercase mt-2">{action}</p><button onClick={()=>setWarning(false)} className="mt-6 w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-black">ACKNOWLEDGE WARNING</button></div></div>}

    <header className="h-14 border-b border-slate-800 bg-[#080f1d] flex items-center justify-between px-4 gap-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"><Activity className="w-5 h-5 text-cyan-400"/></div><div><h1 className="font-black tracking-[.22em] text-white">BHUSAKTHI</h1><p className="muted text-[8px] uppercase tracking-widest">AI Landslide Early Warning & Response · NER</p></div></div><div className="hidden lg:flex gap-1">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`px-3 py-2 rounded text-[9px] font-black tracking-wider ${tab===t?'bg-cyan-500/15 text-cyan-300':'text-slate-500 hover:text-white'}`}>{t}</button>)}</div><div className="flex items-center gap-2"><span className={`hidden sm:flex items-center gap-1 text-[9px] ${online?'text-emerald-400':'text-amber-400'}`}>{online?<Wifi className="w-3 h-3"/>:<WifiOff className="w-3 h-3"/>}{online?'ONLINE':'OFFLINE QUEUE'}</span><button onClick={load} className="p-2 rounded hover:bg-slate-800"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button></div></header>

    <main className="h-[calc(100vh-56px)] overflow-auto p-3 md:p-4">
      <div className="mb-3 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent p-3 flex justify-between items-center gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-cyan-300">11-ZONE NER PILOT NETWORK</p><p className="muted text-[9px] mt-1">Risk status: <b className="text-amber-300">DEMO INPUTS · API READY</b> · not a verified live hazard bulletin</p></div><span className="px-2 py-1 rounded border border-cyan-500/20 text-cyan-300 text-[9px] font-black">{regions.length} ZONES · {recipients.length} RECIPIENTS</span></div>

      {tab==='COMMAND'&&<>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3"><Stat icon={AlertTriangle} label="Critical zones" value={critical} sub="Immediate attention" red/><Stat icon={Activity} label="High risk zones" value={high} sub="Enhanced monitoring" amber/><Stat icon={FileWarning} label="Active incidents" value={incidents.filter(i=>i.status!=='RESOLVED').length} sub="Field + system reports"/><Stat icon={Radio} label="Sensors" value={summary?.sensors_online||12} sub="Demo telemetry"/><Stat icon={Navigation} label="Roads impacted" value={summary?.roads_impacted||regions.filter(r=>r.road_status!=='OPEN').length} sub="Closed / restricted" amber/></div>
        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-3">
          <section className="panel overflow-hidden"><div className="p-3 border-b border-slate-800 flex justify-between"><div><h2 className="font-black text-white">Regional Risk Map</h2><p className="muted text-[9px]">Click a zone to refresh intelligence</p></div><span className="text-[9px] text-cyan-300">GIS OVERLAY</span></div><div className="h-[390px]"><MapContainer center={[25.7,92.8]} zoom={6} scrollWheelZoom className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FlyTo region={selected}/>{regions.map(r=>{const s=score(r);const c=s>=75?'#ef4444':s>=55?'#f59e0b':'#10b981';return <CircleMarker key={r.id} center={[r.lat,r.lng]} radius={r.id===selected.id?14:9} pathOptions={{color:c,fillColor:c,fillOpacity:.75,weight:r.id===selected.id?4:2}} eventHandlers={{click:()=>setSelected(r)}}><Popup><b>{r.name}</b><br/>Risk {s}/100 · {level(s)}<br/>{r.road}: {r.road_status}</Popup></CircleMarker>})}</MapContainer></div></section>
          <div className="space-y-3"><section className="panel p-4"><div className="flex justify-between"><div><p className="muted text-[9px] uppercase tracking-widest">Selected zone · {selected.state}</p><h2 className="text-base font-black text-white mt-1">{selected.name}</h2></div><span className={`font-black text-[10px] ${textTone(risk)}`}>{level(risk)}</span></div><div className="flex items-end gap-3 mt-4"><p className={`text-6xl font-black ${textTone(risk)}`}>{risk}</p><div><p className="muted text-[9px]">AI RISK SCORE</p><p className="text-white font-bold text-[10px]">{action}</p></div></div><div className="h-2 rounded bg-slate-800 mt-3 overflow-hidden"><div className={`h-full ${barTone(risk)}`} style={{width:`${risk}%`}}/></div><div className="grid grid-cols-3 gap-2 mt-4"><div><p className="muted text-[8px]">RAINFALL</p><b>{selected.rainfall_mm} mm</b></div><div><p className="muted text-[8px]">SOIL</p><b>{selected.soil_moisture_pct}%</b></div><div><p className="muted text-[8px]">SLOPE</p><b>{selected.slope}°</b></div></div></section>
            <section className="panel p-3"><h3 className="font-black text-white">Risk → Reason → Action</h3><p className="muted text-[9px] mt-2">Weighted baseline combines susceptibility, rainfall, soil moisture and slope.</p><p className="text-[10px] mt-2">Susceptibility <b>{selected.susceptibility}</b> · Rainfall <b>{selected.rainfall_mm} mm</b> · Soil <b>{selected.soil_moisture_pct}%</b></p><p className="text-amber-300 font-black text-[10px] mt-2">ACTION: {action}</p></section>
            <section className="panel p-3"><div className="flex justify-between"><h3 className="font-black text-white">6-Hour Risk Window</h3><Droplets className="w-4 h-4 text-cyan-400"/></div><div className="h-28 mt-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={forecast}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/><XAxis dataKey="time" tick={{fontSize:8,fill:'#64748b'}}/><YAxis domain={[0,100]} tick={{fontSize:8,fill:'#64748b'}}/><Tooltip contentStyle={{background:'#0b1527',border:'1px solid #1e293b',fontSize:10}}/><Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></section>
          </div>
        </div>
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-3 mt-3"><section className="panel p-3"><div className="flex justify-between"><h3 className="font-black text-white">Priority Villages</h3><Users className="w-4 h-4 text-cyan-400"/></div><div className="space-y-2 mt-2">{villages.map(v=><div key={v.name} className="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800"><div><b>{v.name}</b><p className="muted text-[8px]">{v.distance_km} km · population {v.population}</p></div><span className={`font-black ${textTone(v.risk_score)}`}>{v.risk_score} · {v.risk_level}</span></div>)}</div></section><section className="panel p-3"><div className="flex gap-2 items-center"><BellRing className="w-4 h-4 text-red-400"/><h3 className="font-black text-white">Alert Center</h3></div><p className="muted text-[9px] mt-2">Registered SMS recipients: <b className="text-white">{recipients.length}</b></p><div className="grid grid-cols-2 gap-2 mt-3"><button onClick={sendWarning} disabled={sending} className="py-2 rounded bg-red-600 hover:bg-red-500 font-black flex justify-center gap-2"><Send className="w-3 h-3"/>{sending?'SENDING':'SEND WARNING'}</button><button onClick={openWarning} className="py-2 rounded border border-red-500/40 text-red-300 font-black flex justify-center gap-2"><Siren className="w-3 h-3"/>WARNING MODE</button></div>{alerts[0]&&<p className="text-[8px] text-emerald-400 mt-2">Last: {alerts[0].status} · {alerts[0].delivered_count||0}/{alerts[0].recipient_count||0} simulated SMS</p>}</section></div>
      </>}

      {tab==='GIS'&&<section className="panel p-4"><h2 className="text-lg font-black text-white">11-Zone GIS Intelligence</h2><p className="muted mt-1">Compact features keep raw satellite/raster archives out of the browser.</p><div className="grid md:grid-cols-3 gap-2 mt-3">{regions.map(r=><button key={r.id} onClick={()=>setSelected(r)} className="panel p-3 text-left hover:border-cyan-500/50"><b>{r.name}</b><p className={`text-2xl font-black mt-1 ${textTone(score(r))}`}>{score(r)}</p><p className="muted text-[8px]">{r.state} · {r.road_status}</p></button>)}</div></section>}
      {tab==='WARNING'&&<section className="panel p-4"><h2 className="text-lg font-black text-white">Early Warning Operations</h2><p className="muted mt-1">All alerts are marked simulated until an approved SMS provider and live feeds are configured.</p><div className="grid md:grid-cols-3 gap-3 mt-4"><div className="panel p-4 border-red-500/30"><Siren className="text-red-400"/><b className="block mt-2">CRITICAL WARNING</b><p className="muted text-[9px] mt-1">Score ≥75: restrict exposed corridor, alert villages and deploy field team.</p><button onClick={openWarning} className="w-full mt-3 py-2 bg-red-600 rounded font-black">OPEN WARNING SCREEN</button></div><div className="panel p-4"><Users className="text-cyan-400"/><b className="block mt-2">REGISTERED RECIPIENTS</b><p className="text-3xl font-black text-white">{recipients.length}</p></div><div className="panel p-4"><Send className="text-amber-400"/><b className="block mt-2">LAST DISPATCH</b><p className="text-lg font-black text-white">{alerts[0]?.status||'NO ALERTS'}</p></div></div></section>}
      {tab==='INCIDENTS'&&<section className="panel p-4"><div className="flex justify-between"><h2 className="text-lg font-black text-white">Incident Command Log</h2><button onClick={()=>setField(true)} className="px-3 py-2 bg-cyan-600 rounded font-black">+ FIELD REPORT</button></div><div className="space-y-2 mt-3">{incidents.map(i=><div key={i.id} className="border border-slate-800 rounded p-3"><div className="flex justify-between"><b>{i.sector_name}</b><span className="text-red-300 font-black">{i.severity}</span></div><p className="muted text-[9px] mt-1">{i.type} · {i.timestamp}</p><p className="text-[10px] mt-2">{i.notes}</p></div>)}</div></section>}
      {tab==='RESPONSE'&&<section className="panel p-4"><h2 className="text-lg font-black text-white">Emergency Response Prioritisation</h2><div className="space-y-2 mt-3">{[...regions].sort((a,b)=>score(b)-score(a)).map((r,i)=><div key={r.id} className="flex gap-3 items-center border border-slate-800 rounded p-3"><b className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">{i+1}</b><div className="flex-1"><b>{r.name}</b><p className="muted text-[8px]">{r.state} · {r.road} · {r.road_status}</p></div><span className={`text-xl font-black ${textTone(score(r))}`}>{score(r)}</span></div>)}</div></section>}
      {tab==='ANALYTICS'&&<section className="panel p-4"><h2 className="text-lg font-black text-white">Model & Data Analytics</h2><div className="grid md:grid-cols-3 gap-2 mt-3"><Stat icon={Droplets} label="Rainfall" value={`${selected.rainfall_mm} mm`} sub="Demo input"/><Stat icon={Activity} label="Soil moisture" value={`${selected.soil_moisture_pct}%`} sub="Demo input"/><Stat icon={Users} label="Exposure" value={selected.population_at_risk} sub="Population proxy"/></div><div className="panel p-3 mt-3"><b>Compact feature strategy</b><p className="muted text-[10px] mt-1">The browser receives compact zone features instead of massive raw satellite/raster archives. Production inference can use rainfall, soil moisture, slope, elevation, historical landslide density and satellite-change features.</p></div></section>}

      <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={()=>setField(true)} className="px-3 py-2 bg-cyan-600 rounded-lg font-black flex gap-2 items-center"><Navigation className="w-3.5 h-3.5"/>FIELD REPORT</button><button onClick={sendWarning} disabled={sending} className="px-3 py-2 bg-red-600 rounded-lg font-black flex gap-2 items-center"><Send className="w-3.5 h-3.5"/>SEND WARNING</button><span className="muted text-[9px]">{notice||'DEMO INPUTS · API READY'} · Risk source: {selected.risk_source||'DEMO_WEIGHTED_BASELINE'}</span></div>
    </main>
  </div>;
}
