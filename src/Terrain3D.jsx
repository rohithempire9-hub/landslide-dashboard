import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Terrain3D({ regionName = "Active Sector", riskScore = 65, slopeAngle = 35 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 35, 45);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Dynamic Topographical Elevation Mesh
    const gridSegments = 48;
    const planeGeo = new THREE.PlaneGeometry(36, 36, gridSegments, gridSegments);
    planeGeo.rotateX(-Math.PI / 2);

    const pos = planeGeo.attributes.position;
    const colors = [];
    const colorHigh = new THREE.Color(riskScore > 75 ? 0xef4444 : 0xf59e0b);
    const colorMid = new THREE.Color(0x10b981);
    const colorLow = new THREE.Color(0x0284c7);

    // Generate realistic mountain ridge elevation based on slope
    const elevationScale = Math.max(4, slopeAngle * 0.22);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-octave sinusoidal mountain ridges
      const dist = Math.sqrt(x * x + z * z);
      const ridge1 = Math.sin(x * 0.25) * Math.cos(z * 0.25);
      const ridge2 = Math.sin(x * 0.6) * Math.cos(z * 0.5) * 0.4;
      const y = Math.max(0, (ridge1 + ridge2 + 0.5) * elevationScale - (dist * 0.15));
      pos.setY(i, y);

      // Elevation-based gradient coloring
      const lerpFactor = Math.min(1, Math.max(0, y / (elevationScale * 1.3)));
      const vertexColor = lerpFactor > 0.55 
        ? colorMid.clone().lerp(colorHigh, (lerpFactor - 0.55) * 2.2) 
        : colorLow.clone().lerp(colorMid, lerpFactor * 1.8);

      colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
    }
    planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    planeGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(planeGeo, terrainMat);
    scene.add(terrainMesh);

    // Wireframe Overlay for Geotechnical Contour lines
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const wireframeMesh = new THREE.Mesh(planeGeo, wireframeMat);
    wireframeMesh.position.y += 0.05;
    scene.add(wireframeMesh);

    // Fault Line Shear Plane indicator
    const faultGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, 0.5, -14),
      new THREE.Vector3(14, 0.5, 14)
    ]);
    const faultMat = new THREE.LineDashedMaterial({
      color: 0xff0055,
      dashSize: 1,
      gapSize: 0.5,
      linewidth: 2
    });
    const faultLine = new THREE.Line(faultGeo, faultMat);
    faultLine.computeLineDistances();
    scene.add(faultLine);

    // Camera Orbit Animation Loop
    let angle = 0;
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      angle += 0.005;
      camera.position.x = Math.sin(angle) * 45;
      camera.position.z = Math.cos(angle) * 45;
      camera.lookAt(0, 4, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      planeGeo.dispose();
      terrainMat.dispose();
      renderer.dispose();
    };
  }, [riskScore, slopeAngle, regionName]);

  return (
    <div className="relative w-full h-full min-h-[280px]">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 bg-[#0a1222]/90 backdrop-blur border border-cyan-500/40 p-2 rounded text-[10px] pointer-events-none z-10 space-y-0.5">
        <p className="font-bold text-cyan-400">● 3D Geotechnical Elevation Model</p>
        <p className="text-slate-300">Sector: {regionName} ({slopeAngle}° Slope)</p>
        <p className="text-red-400 font-mono">Red: High Shear Risk • Cyan: Topo Grid</p>
      </div>
    </div>
  );
}