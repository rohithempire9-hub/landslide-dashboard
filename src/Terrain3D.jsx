import React from 'react';

export default function Terrain3D({ regionName = "Active Sector", riskScore = 65, slopeAngle = 35 }) {
  // Verified public photogrammetry landslide model ID (UAV Scan)
  const sketchfabId = "cf404c643427444982a26b96519bc623";

  return (
    <div className="relative w-full h-full min-h-[280px] bg-[#050912]">
      
      {/* Native Sketchfab WebGL API Embed */}
      <iframe 
        title={`3D UAV Photogrammetry - ${regionName}`}
        className="w-full h-full border-0"
        src={`https://sketchfab.com/models/${sketchfabId}/embed?autostart=1&preload=1&ui_infos=0&ui_watermark=0&ui_theme=dark&dnt=1`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        execution-while-out-of-viewport="true"
        execution-while-not-rendered="true"
      ></iframe>
      
      {/* BHUSAKTHI Custom Data Overlay */}
      <div className="absolute top-2 left-2 bg-[#0a1222]/90 backdrop-blur border border-cyan-500/40 p-2.5 rounded-lg text-[10px] pointer-events-none z-10 space-y-1 shadow-xl">
        <p className="font-bold text-cyan-400 tracking-wide uppercase">● High-Res UAV Photogrammetry</p>
        <p className="text-slate-300">Sector Focus: <strong className="text-white">{regionName}</strong></p>
        <p className="text-slate-300">Geomorphic Slope: <strong className="text-red-400">{slopeAngle}°</strong></p>
        <p className="text-emerald-400 font-mono mt-1 pt-1 border-t border-slate-700/80">LiDAR & Optical Textures Live</p>
      </div>

    </div>
  );
}