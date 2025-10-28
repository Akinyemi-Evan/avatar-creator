import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { BodyMeasurements } from '@/lib/bodyMeasurements';

interface Avatar3DProps {
  measurements: BodyMeasurements;
  clothingTextureUrl?: string;
  personImageUrl: string;
}

function AvatarModel({ measurements, clothingTextureUrl, personImageUrl }: Avatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [clothingTexture, setClothingTexture] = useState<THREE.Texture | null>(null);
  const [faceTexture, setFaceTexture] = useState<THREE.Texture | null>(null);

  // Load face texture from person image
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      personImageUrl,
      (texture) => {
        setFaceTexture(texture);
      },
      undefined,
      (error) => {
        console.error('Error loading face texture:', error);
      }
    );
  }, [personImageUrl]);

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

  // Face material with texture
  const faceMaterial = faceTexture
    ? new THREE.MeshStandardMaterial({
        map: faceTexture,
        roughness: 0.6,
        metalness: 0.1,
      })
    : skinMaterial;

  // Hair material
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1f1a,
    roughness: 0.9,
    metalness: 0,
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

  // Eye material
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.1,
    metalness: 0.8,
  });

  return (
    <group ref={groupRef} position={[0, -1.5, 0]} scale={height}>
      {/* Hair */}
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.17, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <primitive object={hairMaterial} attach="material" />
      </mesh>

      {/* Head with face texture */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <primitive object={faceMaterial} attach="material" />
      </mesh>

      {/* Left Eye */}
      <mesh position={[-0.05, 1.72, 0.13]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>

      {/* Right Eye */}
      <mesh position={[0.05, 1.72, 0.13]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.68, 0.14]}>
        <coneGeometry args={[0.02, 0.05, 8]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.15, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      <mesh position={[0.15, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Torso - more anatomical shape */}
      <mesh position={[0, 1.1, 0]} scale={[shoulderWidth, torsoLength, 1]}>
        <capsuleGeometry args={[0.2, 0.5, 16, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Left Shoulder */}
      <mesh position={[-0.28 * shoulderWidth, 1.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Right Shoulder */}
      <mesh position={[0.28 * shoulderWidth, 1.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.3 * shoulderWidth, 1.3, 0]}>
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.05, 0.4, 12, 12]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.55 * armLength, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.75 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.04, 0.35, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.95 * armLength, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.3 * shoulderWidth, 1.3, 0]}>
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.05, 0.4, 12, 12]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.55 * armLength, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.75 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.04, 0.35, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.95 * armLength, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* Hips */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.18, 0.15, 16, 16]} />
        <primitive object={pantsMaterial} attach="material" />
      </mesh>

      {/* Left Leg */}
      <group position={[-0.12, 0.6, 0]}>
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1, legLength, 1]}>
          <capsuleGeometry args={[0.08, 0.45, 14, 14]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.6 * legLength, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.8 * legLength, 0]} scale={[1, legLength, 1]}>
          <capsuleGeometry args={[0.07, 0.4, 14, 14]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -1.0 * legLength, 0.05]}>
          <boxGeometry args={[0.09, 0.06, 0.15]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.12, 0.6, 0]}>
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1, legLength, 1]}>
          <capsuleGeometry args={[0.08, 0.45, 14, 14]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.6 * legLength, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        <mesh position={[0, -0.8 * legLength, 0]} scale={[1, legLength, 1]}>
          <capsuleGeometry args={[0.07, 0.4, 14, 14]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -1.0 * legLength, 0.05]}>
          <boxGeometry args={[0.09, 0.06, 0.15]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

export function Avatar3D({ measurements, clothingTextureUrl, personImageUrl }: Avatar3DProps) {
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

        <AvatarModel measurements={measurements} clothingTextureUrl={clothingTextureUrl} personImageUrl={personImageUrl} />
      </Canvas>
    </div>
  );
}
