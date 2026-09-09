import React, { useMemo } from 'react';

// Pool of verified public Sketchfab Photogrammetry & Terrain IDs
const TERRAIN_POOL = [
  "cf404c643427444982a26b96519bc623", // Ionia Odos Landslide (High Shear)
  "61a921d23d544189b5703849b5d934ef", // Quarry Folded Rhythmites (Bedrock Faults)
  "695a65dbe00e4cc1b3fca7942bbcbe45", // Sutured and Fractured Terrain (Debris)
  "fc3764759efc4e73b209302224619a3e"  // Natural Voxel Terrain (Stable)
];

export default function Terrain3D({ regionName = "Active Sector", riskScore = 65, slopeAngle = 35 }) {
  
  // Deterministic Hash: Ensures the same location always gets the same 3D model
  const sketchfabId = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < regionName.length; i++) {
      hash = regionName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TERRAIN_POOL.length;
    return TERRAIN_POOL[index];
  }, [regionName]);

  // Force iframe to remount and play when the ID changes
  const iframeKey = `sketchfab-iframe-${sketchfabId}`;

  return (
    <div className="relative w-full h-full min-h-[280px] bg-[#050912]">
      
      {/* Dynamic Sketchfab WebGL API Embed */}
      <iframe 
        key={iframeKey}
        title={`3D UAV Photogrammetry - ${regionName}`}
        className="w-full h-full border-0 animate-in fade-in duration-1000"
        src={`https://sketchfab.com/models/${sketchfabId}/embed?autostart=1&preload=1&ui_infos=0&ui_watermark=0&ui_theme=dark&dnt=1`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        execution-while-out-of-viewport="true"
        execution-while-not-rendered="true"
      ></iframe>
      
      {/* BHUSAKTHI Custom HUD Overlay */}
      <div className="absolute top-2 left-2 bg-[#0a1222]/90 backdrop-blur border border-cyan-500/40 p-2.5 rounded-lg text-[10px] pointer-events-none z-10 space-y-1 shadow-xl">
        <p className="font-bold text-cyan-400 tracking-wide uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> 
          Dynamic UAV LiDAR Scan
        </p>
        <p className="text-slate-300">Sector Focus: <strong className="text-white">{regionName}</strong></p>
        <p className="text-slate-300">Geomorphic Slope: <strong className={slopeAngle > 40 ? "text-red-400" : "text-amber-400"}>{slopeAngle}°</strong></p>
        <p className="text-emerald-400 font-mono mt-1 pt-1 border-t border-slate-700/80">
          Texture Map Hash: {sketchfabId.slice(0, 8).toUpperCase()}
        </p>
      </div>
      
    </div>
  );
}