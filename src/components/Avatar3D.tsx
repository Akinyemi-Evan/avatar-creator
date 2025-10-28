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

  // Shoe material
  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.4,
    metalness: 0.3,
  });

  // Create fingers for a hand
  const createFingers = (handPosition: [number, number, number], side: 'left' | 'right') => {
    const fingers = [];
    const fingerSpacing = 0.025;
    const startX = side === 'left' ? -0.04 : -0.04;
    
    for (let i = 0; i < 5; i++) {
      const xOffset = startX + (i * fingerSpacing);
      fingers.push(
        <group key={i} position={[handPosition[0] + xOffset, handPosition[1], handPosition[2] + 0.03]}>
          {/* Finger segment 1 */}
          <mesh position={[0, -0.02, 0]}>
            <capsuleGeometry args={[0.008, 0.025, 8, 8]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
          {/* Finger segment 2 */}
          <mesh position={[0, -0.045, 0]}>
            <capsuleGeometry args={[0.007, 0.02, 8, 8]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>
        </group>
      );
    }
    return fingers;
  };

  return (
    <group ref={groupRef} position={[0, -1.5, 0]} scale={height}>
      {/* Hair - more detailed */}
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.17, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
        <primitive object={hairMaterial} attach="material" />
      </mesh>

      {/* Head with face texture - more oval shape */}
      <mesh position={[0, 1.7, 0]} scale={[0.95, 1.1, 1]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <primitive object={faceMaterial} attach="material" />
      </mesh>

      {/* Left Eye with detail */}
      <mesh position={[-0.05, 1.72, 0.13]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>

      {/* Right Eye with detail */}
      <mesh position={[0.05, 1.72, 0.13]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <primitive object={eyeMaterial} attach="material" />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.05, 1.76, 0.13]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <primitive object={hairMaterial} attach="material" />
      </mesh>
      <mesh position={[0.05, 1.76, 0.13]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.04, 0.008, 0.01]} />
        <primitive object={hairMaterial} attach="material" />
      </mesh>

      {/* Nose - more realistic */}
      <mesh position={[0, 1.68, 0.14]}>
        <coneGeometry args={[0.025, 0.06, 8]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 1.62, 0.14]}>
        <capsuleGeometry args={[0.002, 0.04, 8, 8]} />
        <meshStandardMaterial color={0x8b4545} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Ears - more detailed */}
      <mesh position={[-0.15, 1.7, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>
      <mesh position={[0.15, 1.7, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 0.4]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Neck - muscular */}
      <mesh position={[0, 1.5, 0]} scale={[1, 1, 0.95]}>
        <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* Torso - anatomical with muscle definition */}
      <group position={[0, 1.1, 0]} scale={[shoulderWidth, torsoLength, 1]}>
        {/* Main torso */}
        <mesh>
          <capsuleGeometry args={[0.2, 0.5, 32, 32]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        {/* Chest muscles outline */}
        <mesh position={[-0.08, 0.15, 0.19]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        <mesh position={[0.08, 0.15, 0.19]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
      </group>

      {/* Abs definition */}
      <mesh position={[0, 0.95, 0.2]}>
        <boxGeometry args={[0.15 * shoulderWidth, 0.25 * torsoLength, 0.05]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Left Shoulder - muscular */}
      <mesh position={[-0.28 * shoulderWidth, 1.35, 0]} scale={[1.1, 1, 1]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Right Shoulder - muscular */}
      <mesh position={[0.28 * shoulderWidth, 1.35, 0]} scale={[1.1, 1, 1]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <primitive object={clothingMaterial} attach="material" />
      </mesh>

      {/* Left Arm with muscle definition */}
      <group position={[-0.3 * shoulderWidth, 1.3, 0]}>
        {/* Upper arm - bicep */}
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1.1, armLength, 1.1]}>
          <capsuleGeometry args={[0.055, 0.4, 16, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.55 * armLength, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.75 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.045, 0.35, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Wrist */}
        <mesh position={[0, -0.93 * armLength, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Hand palm */}
        <mesh position={[0, -1.0 * armLength, 0]} scale={[1.4, 1, 0.6]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Fingers */}
        {createFingers([0, -1.0 * armLength, 0], 'left')}
      </group>

      {/* Right Arm with muscle definition */}
      <group position={[0.3 * shoulderWidth, 1.3, 0]}>
        {/* Upper arm - bicep */}
        <mesh position={[0, -0.25 * armLength, 0]} scale={[1.1, armLength, 1.1]}>
          <capsuleGeometry args={[0.055, 0.4, 16, 16]} />
          <primitive object={clothingMaterial} attach="material" />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.55 * armLength, 0]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.75 * armLength, 0]} scale={[1, armLength, 1]}>
          <capsuleGeometry args={[0.045, 0.35, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Wrist */}
        <mesh position={[0, -0.93 * armLength, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Hand palm */}
        <mesh position={[0, -1.0 * armLength, 0]} scale={[1.4, 1, 0.6]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Fingers */}
        {createFingers([0, -1.0 * armLength, 0], 'right')}
      </group>

      {/* Hips - more anatomical */}
      <mesh position={[0, 0.7, 0]} scale={[1.1, 1, 1]}>
        <capsuleGeometry args={[0.18, 0.15, 20, 20]} />
        <primitive object={pantsMaterial} attach="material" />
      </mesh>

      {/* Left Leg with muscle definition */}
      <group position={[-0.12, 0.6, 0]}>
        {/* Thigh - muscular */}
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1.15, legLength, 1.1]}>
          <capsuleGeometry args={[0.085, 0.45, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Knee joint - visible */}
        <mesh position={[0, -0.6 * legLength, 0]} scale={[1.1, 1, 1.2]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Calf - muscular */}
        <mesh position={[0, -0.8 * legLength, 0]} scale={[0.95, legLength, 1]}>
          <capsuleGeometry args={[0.075, 0.4, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -1.0 * legLength, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Realistic shoe */}
        <group position={[0, -1.05 * legLength, 0.05]}>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.11, 0.08, 0.22]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
          {/* Shoe sole */}
          <mesh position={[0, -0.045, 0.05]}>
            <boxGeometry args={[0.12, 0.01, 0.24]} />
            <meshStandardMaterial color={0x4a4a4a} roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Shoe laces */}
          <mesh position={[0, 0.03, 0.12]}>
            <boxGeometry args={[0.08, 0.01, 0.1]} />
            <meshStandardMaterial color={0xffffff} roughness={0.7} metalness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Right Leg with muscle definition */}
      <group position={[0.12, 0.6, 0]}>
        {/* Thigh - muscular */}
        <mesh position={[0, -0.3 * legLength, 0]} scale={[1.15, legLength, 1.1]}>
          <capsuleGeometry args={[0.085, 0.45, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Knee joint - visible */}
        <mesh position={[0, -0.6 * legLength, 0]} scale={[1.1, 1, 1.2]}>
          <sphereGeometry args={[0.09, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Calf - muscular */}
        <mesh position={[0, -0.8 * legLength, 0]} scale={[0.95, legLength, 1]}>
          <capsuleGeometry args={[0.075, 0.4, 20, 20]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -1.0 * legLength, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
        {/* Realistic shoe */}
        <group position={[0, -1.05 * legLength, 0.05]}>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.11, 0.08, 0.22]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
          {/* Shoe sole */}
          <mesh position={[0, -0.045, 0.05]}>
            <boxGeometry args={[0.12, 0.01, 0.24]} />
            <meshStandardMaterial color={0x4a4a4a} roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Shoe laces */}
          <mesh position={[0, 0.03, 0.12]}>
            <boxGeometry args={[0.08, 0.01, 0.1]} />
            <meshStandardMaterial color={0xffffff} roughness={0.7} metalness={0.1} />
          </mesh>
        </group>
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
