import React,{useEffect,useState} from 'react';
import {CloudRain,Droplets,RefreshCw,Wind,Thermometer} from 'lucide-react';

const API=import.meta.env.VITE_API_URL||'https://bhushakti-backend.onrender.com';
const levelClass=l=>l==='CRITICAL'?'text-red-400':l==='HIGH'?'text-amber-400':l==='WATCH'?'text-yellow-300':'text-emerald-400';
const borderClass=l=>l==='CRITICAL'?'border-red-500/40':l==='HIGH'?'border-amber-500/40':l==='WATCH'?'border-yellow-500/30':'border-emerald-500/30';

export default function LiveWeatherNetwork(){
  const[regions,setRegions]=useState([]),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[updated,setUpdated]=useState('');
  const load=async()=>{setLoading(true);try{const r=await fetch(API+'/api/regions');if(!r.ok)throw Error();const d=await r.json();if(Array.isArray(d)){setRegions(d);setUpdated(new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}));}}catch{}finally{setLoading(false)}};
  useEffect(()=>{load();const id=setInterval(load,60000);return()=>clearInterval(id)},[]);
  if(!regions.length)return null;
  const live=regions.filter(r=>r.data_status==='LIVE_WEATHER').length;
  return <>
    <button onClick={()=>setOpen(v=>!v)} className="fixed right-4 top-4 z-[3000] flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-[#07101e]/95 px-3 py-2 shadow-lg backdrop-blur hover:bg-cyan-500/10">
      <CloudRain size={14} className="text-cyan-400"/>
      <span className="text-[8px] font-black tracking-widest text-slate-400">11-ZONE WEATHER</span>
      <span className="text-[8px] font-black text-emerald-400">● {live}/11 LIVE</span>
      {loading&&<RefreshCw size={11} className="animate-spin text-cyan-400"/>}
    </button>
    {open&&<div className="fixed left-4 right-4 top-[68px] z-[2999] max-h-[calc(100vh-85px)] overflow-auto rounded-2xl border border-cyan-500/20 bg-[#07101e]/98 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#07101e]/95 py-1 z-10">
        <div><div className="flex items-center gap-2"><CloudRain size={18} className="text-cyan-400"/><b className="text-white tracking-widest">LIVE WEATHER NETWORK</b><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-black text-emerald-400">{live}/11 LIVE</span></div><p className="text-[9px] text-slate-500 mt-1">Automatic weather, rainfall and soil-moisture readings for all NER pilot zones · refreshed every 60 seconds{updated&&` · updated ${updated}`}</p></div>
        <div className="flex gap-2"><button onClick={load} className="action"><RefreshCw size={13} className={loading?'animate-spin':''}/>REFRESH NOW</button><button onClick={()=>setOpen(false)} className="action">CLOSE</button></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {regions.map(r=>{const liveNow=r.data_status==='LIVE_WEATHER';const rain24=Number(r.rainfall_mm||0);const rain1=Number(r.rain_1h_mm||0);const soil=Number(r.soil_moisture_pct||0);return <div key={r.id} className={`rounded-xl border ${borderClass(r.risk_level)} bg-slate-950/80 p-4`}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b className="block truncate text-white text-sm">{r.name}</b><span className="text-[9px] text-slate-500">{r.district} · {r.state}</span></div><span className={`text-[9px] font-black ${levelClass(r.risk_level)}`}>{r.risk_score ?? '--'} · {r.risk_level||'--'}</span></div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-slate-900 p-2"><Thermometer size={13} className="text-cyan-400 mb-1"/><b className="text-white">{r.temperature_c!=null?`${Math.round(Number(r.temperature_c))}°`:'--'}</b><span className="block text-[7px] text-slate-600">TEMP</span></div>
            <div className="rounded-lg bg-slate-900 p-2"><CloudRain size={13} className="text-cyan-400 mb-1"/><b className="text-white">{rain24.toFixed(1)}</b><span className="block text-[7px] text-slate-600">RAIN 24H mm</span></div>
            <div className="rounded-lg bg-slate-900 p-2"><CloudRain size={13} className="text-blue-400 mb-1"/><b className="text-white">{rain1.toFixed(1)}</b><span className="block text-[7px] text-slate-600">RAIN 1H mm</span></div>
            <div className="rounded-lg bg-slate-900 p-2"><Droplets size={13} className="text-blue-300 mb-1"/><b className="text-white">{soil.toFixed(1)}%</b><span className="block text-[7px] text-slate-600">SOIL</span></div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] text-slate-500"><span><Wind size={11} className="inline mr-1 text-cyan-400"/>{r.wind_kmh!=null?`${Math.round(Number(r.wind_kmh))} km/h`:'--'} wind</span><span className={liveNow?'text-emerald-400':'text-amber-400'}>{liveNow?'● LIVE':'● FALLBACK'}</span></div>
        </div>})}
      </div>
    </div>}
  </>;
}
