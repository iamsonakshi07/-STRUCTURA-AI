import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { BridgeModel } from './BridgeModel';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const BridgeCanvas = ({
  viewLayer,
  selectedComponent,
  onSelectComponent,
  selectedMarker,
  onSelectMarker,
}) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        className="w-full h-full bg-[#0a121e]"
        camera={{ position: [14, 8, 16], fov: 45 }}
      >
        <PerspectiveCamera makeDefault position={[14, 8, 16]} fov={45} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05} // Do not dip below water
          minDistance={6}
          maxDistance={35}
        />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[12, 18, 10]} intensity={1.2} castShadow />
        <directionalLight position={[-12, -8, -10]} intensity={0.3} color="#00C2D1" />
        <pointLight position={[0, 6, 0]} intensity={0.5} color="#00C2D1" distance={20} />

        {/* Subtle Starfield */}
        <Stars radius={50} depth={40} count={800} factor={3} saturation={0.5} fade speed={1} />

        {/* 3D Bridge Asset */}
        <Suspense fallback={null}>
          <BridgeModel
            viewLayer={viewLayer}
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
            selectedMarker={selectedMarker}
            onSelectMarker={onSelectMarker}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
