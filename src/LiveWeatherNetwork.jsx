import React,{useEffect,useState} from 'react';
import {CloudRain,Droplets,RefreshCw,Wind,Thermometer} from 'lucide-react';

const API=import.meta.env.VITE_API_URL||'https://bhushakti-backend.onrender.com';
const ZONES=[
['GSI-AR-01','Bhalukpong - Bomdila Corridor','West Kameng','Arunachal Pradesh',27.2645,92.4159,89,46],
['GSI-AR-02','Tawang - Bomdila Corridor','Tawang','Arunachal Pradesh',27.5867,91.859,86,43],
['GSI-AR-03','Itanagar - Naharlagun Corridor','Papum Pare','Arunachal Pradesh',27.102,93.695,72,29],
['GSI-AS-01','Haflong - Silchar Corridor','Dima Hasao','Assam',25.164,93.0176,79,34],
['GSI-ML-01','Cherrapunji - Mawsynram Escarpment','East Khasi Hills','Meghalaya',25.2986,91.5822,81,38],
['GSI-ML-02','Shillong - Jowai Corridor','East Khasi Hills / West Jaintia Hills','Meghalaya',25.467,92.203,74,33],
['GSI-MZ-01','Sairang - Aizawl Syncline','Aizawl','Mizoram',23.7271,92.7176,84,35],
['GSI-MZ-02','Lunglei Corridor','Lunglei','Mizoram',22.8877,92.738,78,37],
['GSI-NL-01','Pfutsero - Kohima Ridge','Kohima','Nagaland',25.6751,94.1086,76,32],
['GSI-MN-01','Ukhrul - Imphal Corridor','Ukhrul / Imphal East','Manipur',24.75,94.01,77,36],
['GSI-SK-01','Gangtok - Rangpo Corridor','Gangtok / Pakyong','Sikkim',27.3389,88.6065,88,44]
];
const level=n=>n>=75?'CRITICAL':n>=55?'HIGH':n>=35?'WATCH':'LOW';
const levelClass=l=>l==='CRITICAL'?'text-red-400':l==='HIGH'?'text-amber-400':l==='WATCH'?'text-yellow-300':'text-emerald-400';
const borderClass=l=>l==='CRITICAL'?'border-red-500/40':l==='HIGH'?'border-amber-500/40':l==='WATCH'?'border-yellow-500/30':'border-emerald-500/30';
const makeUrl=()=>{const lat=ZONES.map(z=>z[4]).join(',');const lng=ZONES.map(z=>z[5]).join(',');return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,precipitation,wind_speed_10m&hourly=rain,precipitation,soil_moisture_0_to_1cm&past_hours=24&forecast_hours=1&timezone=auto`};
const loadLive=async()=>{const res=await fetch(makeUrl(),{cache:'no-store'});if(!res.ok)throw Error('Live weather request failed');const raw=await res.json();const data=Array.isArray(raw)?raw:[raw];return ZONES.map((z,i)=>{const w=data[i]||{},c=w.current||{},h=w.hourly||{};const rains=(h.rain||[]).slice(-24);const rain24=Math.round(rains.reduce((a,v)=>a+Number(v||0),0)*10)/10;const soilArr=h.soil_moisture_0_to_1cm||[];const soilValue=soilArr.length?Number(soilArr[soilArr.length-1])*100:null;const structural=Math.min(28,z[6]*.18+(z[7]/50*100)*.10);const risk=soilValue==null?Math.round(Math.min(100,structural+Math.min(45,rain24/180*45))):Math.round(Math.min(100,structural+Math.min(45,rain24/180*45)+Math.min(27,soilValue/100*27)));return {id:z[0],name:z[1],district:z[2],state:z[3],lat:z[4],lng:z[5],slope:z[7],susceptibility:z[6],temperature_c:c.temperature_2m,humidity_pct:c.relative_humidity_2m,wind_kmh:c.wind_speed_10m,rainfall_mm:rain24,rain_1h_mm:Number(c.rain||0),soil_moisture_pct:soilValue,risk_score:risk,risk_level:level(risk),data_status:soilValue==null?'WEATHER_LIVE_SOIL_UNAVAILABLE':'LIVE_WEATHER',weather_source:'Open-Meteo LIVE'};});};

export default function LiveWeatherNetwork(){
 const[regions,setRegions]=useState([]),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[updated,setUpdated]=useState('');
 const load=async()=>{setLoading(true);setError('');try{const d=await loadLive();setRegions(d);setUpdated(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}));window.dispatchEvent(new CustomEvent('bhusakthi-live-weather',{detail:d}));}catch(e){try{const r=await fetch(API+'/api/regions',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();if(Array.isArray(d)&&d.length){setRegions(d);setUpdated(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}));window.dispatchEvent(new CustomEvent('bhusakthi-live-weather',{detail:d}));setError('DIRECT WEATHER UNAVAILABLE · BACKEND LIVE FEED');}else throw Error();}catch{setError('LIVE WEATHER UNAVAILABLE');}}finally{setLoading(false)}};
 useEffect(()=>{load();const id=setInterval(load,60000);return()=>clearInterval(id)},[]);
 if(!regions.length)return null;
 const live=regions.filter(r=>r.data_status==='LIVE_WEATHER').length;
 return <>
  <button onClick={()=>setOpen(v=>!v)} className="fixed right-4 top-4 z-[3000] flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-[#07101e]/95 px-3 py-2 shadow-lg backdrop-blur hover:bg-cyan-500/10">
   <CloudRain size={14} className="text-cyan-400"/><span className="text-[8px] font-black tracking-widest text-slate-400">11-ZONE WEATHER</span><span className={`text-[8px] font-black ${live===11?'text-emerald-400':'text-amber-400'}`}>● {live}/11 LIVE</span>{loading&&<RefreshCw size={11} className="animate-spin text-cyan-400"/>}
  </button>
  {open&&<div className="fixed left-4 right-4 top-[68px] z-[2999] max-h-[calc(100vh-85px)] overflow-auto rounded-2xl border border-cyan-500/20 bg-[#07101e]/98 p-4 shadow-2xl backdrop-blur-xl">
   <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#07101e]/95 py-1 z-10"><div><div className="flex items-center gap-2"><CloudRain size={18} className="text-cyan-400"/><b className="text-white tracking-widest">LIVE WEATHER NETWORK</b><span className={`rounded-full px-2 py-1 text-[8px] font-black ${live===11?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400'}`}>{live}/11 LIVE</span></div><p className="text-[9px] text-slate-500 mt-1">Direct live weather feed for all 11 NER zones · automatic refresh every 60 seconds{updated&&` · updated ${updated}`}</p>{error&&<p className="text-[9px] text-amber-400 mt-1">{error}</p>}</div><div className="flex gap-2"><button onClick={load} className="action"><RefreshCw size={13} className={loading?'animate-spin':''}/>REFRESH NOW</button><button onClick={()=>setOpen(false)} className="action">CLOSE</button></div></div>
   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{regions.map(r=>{const liveNow=r.data_status==='LIVE_WEATHER';const rain24=r.rainfall_mm==null?null:Number(r.rainfall_mm);const rain1=r.rain_1h_mm==null?null:Number(r.rain_1h_mm);const soil=r.soil_moisture_pct==null?null:Number(r.soil_moisture_pct);return <div key={r.id} className={`rounded-xl border ${borderClass(r.risk_level)} bg-slate-950/80 p-4`}>
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-white text-sm">{r.name}</b><span className="text-[9px] text-slate-500">{r.district} · {r.state}</span></div><span className={`text-[9px] font-black ${levelClass(r.risk_level)}`}>{r.risk_score ?? '--'} · {r.risk_level||'--'}</span></div>
    <div className="mt-4 grid grid-cols-4 gap-2"><div className="rounded-lg bg-slate-900 p-2"><Thermometer size={13} className="text-cyan-400 mb-1"/><b className="text-white">{r.temperature_c!=null?`${Math.round(Number(r.temperature_c))}°`:'--'}</b><span className="block text-[7px] text-slate-600">TEMP</span></div><div className="rounded-lg bg-slate-900 p-2"><CloudRain size={13} className="text-cyan-400 mb-1"/><b className="text-white">{rain24==null?'--':rain24.toFixed(1)}</b><span className="block text-[7px] text-slate-600">RAIN 24H mm</span></div><div className="rounded-lg bg-slate-900 p-2"><CloudRain size={13} className="text-blue-400 mb-1"/><b className="text-white">{rain1==null?'--':rain1.toFixed(1)}</b><span className="block text-[7px] text-slate-600">RAIN 1H mm</span></div><div className="rounded-lg bg-slate-900 p-2"><Droplets size={13} className="text-blue-300 mb-1"/><b className="text-white">{soil==null?'--':`${soil.toFixed(1)}%`}</b><span className="block text-[7px] text-slate-600">SOIL</span></div></div>
    <div className="mt-3 flex items-center justify-between text-[8px] text-slate-500"><span><Wind size={11} className="inline mr-1 text-cyan-400"/>{r.wind_kmh!=null?`${Math.round(Number(r.wind_kmh))} km/h`:'--'} wind</span><span className={liveNow?'text-emerald-400':'text-amber-400'}>{liveNow?'● LIVE':'● LIVE WEATHER · SOIL N/A'}</span></div>
   </div>})}</div>
  </div>}
 </>;
}
