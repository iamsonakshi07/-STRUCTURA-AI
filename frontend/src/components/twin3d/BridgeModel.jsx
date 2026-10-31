import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export const BridgeModel = ({
  viewLayer = 'normal', // 'normal' | 'heatmap' | 'health' | 'component'
  selectedComponent,
  onSelectComponent,
  selectedMarker,
  onSelectMarker,
}) => {
  const groupRef = useRef();

  // Color mapper based on inspection layer
  const getMaterialProps = (componentId, defaultColor, healthColor, heatmapColor) => {
    const isSelected = selectedComponent === componentId;
    if (isSelected) {
      return {
        color: '#00C2D1',
        emissive: '#00C2D1',
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      };
    }

    if (viewLayer === 'heatmap') {
      return {
        color: heatmapColor,
        emissive: heatmapColor,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.5,
      };
    }

    if (viewLayer === 'health') {
      return {
        color: healthColor,
        emissive: healthColor,
        emissiveIntensity: 0.25,
        roughness: 0.5,
        metalness: 0.3,
      };
    }

    if (viewLayer === 'component') {
      return {
        color: defaultColor,
        wireframe: false,
        roughness: 0.3,
        metalness: 0.7,
      };
    }

    // Normal view
    return {
      color: defaultColor,
      roughness: 0.6,
      metalness: 0.4,
    };
  };

  // Defect markers on the bridge
  const defectMarkers = [
    {
      id: 'marker-1',
      componentName: 'South Concrete Pier (Foundation 02)',
      defectCategory: 'Severe Surface Corrosion',
      severity: 'HIGH',
      confidence: 0.93,
      inspectionDate: '2026-10-24',
      healthScore: 68.5,
      position: [-5, 0.5, 0.8],
      image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=600&q=80',
      description: 'Saline moisture infiltration caused localized rebar oxidation and concrete spalling along the tidal splash zone.',
    },
    {
      id: 'marker-2',
      componentName: 'Main Concrete Span Deck (Mid-Span)',
      defectCategory: 'Structural Flexure Crack',
      severity: 'CRITICAL',
      confidence: 0.96,
      inspectionDate: '2026-10-29',
      healthScore: 52.0,
      position: [0, 2.2, 0.4],
      image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
      description: 'Longitudinal hairline shear crack propagated to 3.8mm width across load-bearing asphalt transition zone.',
    },
    {
      id: 'marker-3',
      componentName: 'North Cable Anchorage Cluster',
      defectCategory: 'Fatigue Micro-Strain',
      severity: 'MODERATE',
      confidence: 0.89,
      inspectionDate: '2026-10-18',
      healthScore: 78.0,
      position: [5, 4.2, -0.6],
      image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
      description: 'High-frequency cyclic vibration anomalies recorded under peak rush-hour heavy freight loading cycles.',
    },
  ];

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* 1. Main Deck */}
      <mesh
        position={[0, 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('deck');
        }}
      >
        <boxGeometry args={[22, 0.4, 3.6]} />
        <meshStandardMaterial {...getMaterialProps('deck', '#2a3b50', '#F59E0B', '#F59E0B')} />
      </mesh>

      {/* Deck Roadway Markings */}
      <mesh position={[0, 2.21, 0]}>
        <boxGeometry args={[21.8, 0.02, 0.1]} />
        <meshStandardMaterial color="#F1F5F9" roughness={0.3} />
      </mesh>

      {/* Deck Guardrails */}
      <mesh position={[0, 2.45, 1.7]}>
        <boxGeometry args={[22, 0.5, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.45, -1.7]}>
        <boxGeometry args={[22, 0.5, 0.1]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 2. Main Towers / Supporting Pillars */}
      {/* South Tower */}
      <group
        position={[-5, 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('south_tower');
        }}
      >
        {/* Left Column */}
        <mesh position={[0, 0, 1.3]}>
          <boxGeometry args={[0.8, 8, 0.8]} />
          <meshStandardMaterial {...getMaterialProps('south_tower', '#334155', '#22C55E', '#22C55E')} />
        </mesh>
        {/* Right Column */}
        <mesh position={[0, 0, -1.3]}>
          <boxGeometry args={[0.8, 8, 0.8]} />
          <meshStandardMaterial {...getMaterialProps('south_tower', '#334155', '#22C55E', '#22C55E')} />
        </mesh>
        {/* Tower Crossbeam Top */}
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[0.85, 0.6, 3.2]} />
          <meshStandardMaterial {...getMaterialProps('south_tower', '#334155', '#22C55E', '#22C55E')} />
        </mesh>
        {/* Tower Crossbeam Mid */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.85, 0.5, 3.2]} />
          <meshStandardMaterial {...getMaterialProps('south_tower', '#334155', '#22C55E', '#22C55E')} />
        </mesh>
      </group>

      {/* North Tower */}
      <group
        position={[5, 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('north_tower');
        }}
      >
        <mesh position={[0, 0, 1.3]}>
          <boxGeometry args={[0.8, 8, 0.8]} />
          <meshStandardMaterial {...getMaterialProps('north_tower', '#334155', '#22C55E', '#F59E0B')} />
        </mesh>
        <mesh position={[0, 0, -1.3]}>
          <boxGeometry args={[0.8, 8, 0.8]} />
          <meshStandardMaterial {...getMaterialProps('north_tower', '#334155', '#22C55E', '#F59E0B')} />
        </mesh>
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[0.85, 0.6, 3.2]} />
          <meshStandardMaterial {...getMaterialProps('north_tower', '#334155', '#22C55E', '#F59E0B')} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.85, 0.5, 3.2]} />
          <meshStandardMaterial {...getMaterialProps('north_tower', '#334155', '#22C55E', '#F59E0B')} />
        </mesh>
      </group>

      {/* 3. Foundation Piers / Caissons */}
      <mesh
        position={[-5, -0.6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('south_foundation');
        }}
      >
        <cylinderGeometry args={[1.6, 1.9, 2.5, 16]} />
        <meshStandardMaterial {...getMaterialProps('south_foundation', '#1e293b', '#EF4444', '#EF4444')} />
      </mesh>

      <mesh
        position={[5, -0.6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('north_foundation');
        }}
      >
        <cylinderGeometry args={[1.6, 1.9, 2.5, 16]} />
        <meshStandardMaterial {...getMaterialProps('north_foundation', '#1e293b', '#22C55E', '#22C55E')} />
      </mesh>

      {/* 4. Suspension Cables (Catenary curves stylized) */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectComponent('cables');
        }}
      >
        {/* Main Cable South-Mid-North (Left side z = 1.3) */}
        <mesh position={[0, 4.8, 1.3]}>
          <cylinderGeometry args={[0.06, 0.06, 10.2, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#F59E0B')} />
        </mesh>
        {/* Main Cable South-Mid-North (Right side z = -1.3) */}
        <mesh position={[0, 4.8, -1.3]}>
          <cylinderGeometry args={[0.06, 0.06, 10.2, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#F59E0B')} />
        </mesh>

        {/* Outer Cable Anchor Stays Left */}
        <mesh position={[-8, 4.8, 1.3]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 6.8, 8]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#22C55E')} />
        </mesh>
        <mesh position={[-8, 4.8, -1.3]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 6.8, 8]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#22C55E')} />
        </mesh>

        {/* Outer Cable Anchor Stays Right */}
        <mesh position={[8, 4.8, 1.3]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 6.8, 8]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#22C55E')} />
        </mesh>
        <mesh position={[8, 4.8, -1.3]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.06, 0.06, 6.8, 8]} />
          <meshStandardMaterial {...getMaterialProps('cables', '#64748b', '#22C55E', '#22C55E')} />
        </mesh>

        {/* Vertical Hangers */}
        {[-3.5, -2, -0.5, 1, 2.5, 4].map((xPos, idx) => (
          <React.Fragment key={idx}>
            <mesh position={[xPos, 3.4, 1.3]}>
              <cylinderGeometry args={[0.02, 0.02, 2.7, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[xPos, 3.4, -1.3]}>
              <cylinderGeometry args={[0.02, 0.02, 2.7, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 5. Water Plane & Grid Horizon */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial
          color="#0b1726"
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* 6. Clickable Defect Hotspot Markers */}
      {defectMarkers.map((marker) => {
        const isMarkerSelected = selectedMarker?.id === marker.id;
        const color =
          marker.severity === 'CRITICAL' ? '#EF4444' : marker.severity === 'HIGH' ? '#F59E0B' : '#00C2D1';

        return (
          <group
            key={marker.id}
            position={marker.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelectMarker(marker);
            }}
          >
            {/* Glowing outer sphere */}
            <mesh>
              <sphereGeometry args={[isMarkerSelected ? 0.32 : 0.22, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
                wireframe={false}
              />
            </mesh>
            {/* Pulsing ring indicator */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.26, 0.34, 16]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>

            {/* Floating 3D label */}
            <Html distanceFactor={14} position={[0, 0.45, 0]} center>
              <div
                className={`cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider shadow-lg whitespace-nowrap transition-transform hover:scale-110 ${
                  marker.severity === 'CRITICAL'
                    ? 'bg-critical/90 text-white border border-critical shadow-red-glow'
                    : marker.severity === 'HIGH'
                    ? 'bg-warning/90 text-navy-950 border border-warning shadow-orange-glow'
                    : 'bg-cyan/90 text-navy-950 border border-cyan shadow-cyan-glow'
                }`}
              >
                ● {marker.defectCategory.split(' ')[0]}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
