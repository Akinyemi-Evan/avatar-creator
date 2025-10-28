import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { BodyMeasurements } from '@/lib/bodyMeasurements';

interface Avatar3DProps {
  measurements: BodyMeasurements;
  clothingTextureUrl?: string;
}

function AvatarModel({ measurements, clothingTextureUrl }: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [clothingTexture, setClothingTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (clothingTextureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        clothingTextureUrl,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          setClothingTexture(texture);
        },
        undefined,
        (error) => {
          console.error('Error loading clothing texture:', error);
        }
      );
    }
  }, [clothingTextureUrl]);

  // Gentle idle animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    }
  });

  const { height, shoulderWidth, torsoLength, armLength, legLength } = measurements;

  // Material for skin
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4c2a0,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Material for clothing (torso)
  const clothingMaterial = clothingTexture
    ? new THREE.MeshStandardMaterial({
        map: clothingTexture,
        roughness: 0.6,
        metalness: 0.2,
      })
    : new THREE.MeshStandardMaterial({
        color: 0x4477ff,
        roughness: 0.6,
        metalness: 0.2,
      });

  // Material for pants
  const pantsMaterial = new THREE.MeshStandardMaterial({
    color: 0x333355,
    roughness: 0.7,
    metalness: 0.1,
  });

  return (
    <group ref={groupRef} position={[0, -1.5, 0]} scale={height}>
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 1.1, 0]} scale={[shoulderWidth, torsoLength, 1]}>
        <boxGeometry args={[0.5, 0.7, 0.25]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.3 * shoulderWidth, 1.3, 0]}>
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1, armLength, 1]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.6 * armLength, 0]} scale={[1, armLength, 1]}>
          <cylinderGeometry args={[0.05, 0.04, 0.45, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.3 * shoulderWidth, 1.3, 0]}>
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1, armLength, 1]}>
          <cylinderGeometry args={[0.06, 0.05, 0.5, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.6 * armLength, 0]} scale={[1, armLength, 1]}>
          <cylinderGeometry args={[0.05, 0.04, 0.45, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* Hips */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.25, 0.2, 0.2, 16]} />
        <primitive object={pantsMaterial} attach="material" />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.12, 0.6, 0]}>
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1, legLength, 1]}>
          <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.65 * legLength, 0]} scale={[1, legLength, 1]}>
          <cylinderGeometry args={[0.07, 0.06, 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.12, 0.6, 0]}>
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1, legLength, 1]}>
          <cylinderGeometry args={[0.09, 0.08, 0.55, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.65 * legLength, 0]} scale={[1, legLength, 1]}>
          <cylinderGeometry args={[0.07, 0.06, 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

export function Avatar3D({ measurements, clothingTextureUrl }: Avatar3DProps) {
  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gradient-to-b from-background/50 to-background border border-border">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0.5, 4]} />
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 6}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 2, 2]} intensity={0.5} />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>

        <AvatarModel measurements={measurements} clothingTextureUrl={clothingTextureUrl} />
      </Canvas>
    </div>
  );
}
