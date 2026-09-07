import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Terrain3D({ riskScore, slopeAngle }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, -28, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    // Dynamic 3D Mountain Mesh Geometry
    const width = 28;
    const height = 28;
    const segments = 32;
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);

    // Height displacement calculation
    const pos = geometry.attributes.position;
    const peakHeight = (slopeAngle / 10) * 1.6;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const z = Math.sin(u * 0.3) * Math.cos(v * 0.3) * peakHeight + Math.sin(u * 0.7) * 0.8;
      pos.setZ(i, z);
    }
    geometry.computeVertexNormals();

    // Shader / Wireframe coloring based on Threat
    const meshColor = riskScore > 70 ? 0xef4444 : riskScore > 45 ? 0xf59e0b : 0x10b981;
    const material = new THREE.MeshStandardMaterial({
      color: meshColor,
      wireframe: true,
      roughness: 0.4,
      metalness: 0.8
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    scene.add(terrainMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0x38bdf8, 2, 50);
    pointLight.position.set(10, 10, 20);
    scene.add(pointLight);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      terrainMesh.rotation.z += 0.003;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Resize listener
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [riskScore, slopeAngle]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing" />;
}