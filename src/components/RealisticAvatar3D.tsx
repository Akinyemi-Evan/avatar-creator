import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import { AVATAR_CONFIG, ANIMATION_CONFIG, LIGHTING_CONFIG, CAMERA_CONFIG } from '@/lib/constants/avatar3d';

interface RealisticAvatar3DProps {
  faceMeshUrl?: string;
  bodyMeshUrl?: string;
  faceTextureUrl?: string | null;
  clothingTextureUrl?: string | null;
  meshUrl?: string; // Legacy support
}

function AvatarModel({ faceMeshUrl, bodyMeshUrl, faceTextureUrl, clothingTextureUrl }: Omit<RealisticAvatar3DProps, 'meshUrl'>) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle idle animation using constants
  useFrame((state) => {
    if (groupRef.current) {
      const { speed, amplitude } = ANIMATION_CONFIG.idleRotation;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * speed * 300) * amplitude * 2.5;
    }
  });

  // Load face and body meshes with error handling
  let faceGltf, bodyGltf;
  try {
    faceGltf = useGLTF(faceMeshUrl!);
    bodyGltf = useGLTF(bodyMeshUrl!);
  } catch (error) {
    console.error('Failed to load GLTF meshes:', error);
    throw new Error('Failed to load 3D model files');
  }

  // Apply textures
  useEffect(() => {
    const loadTextures = async () => {
      const textureLoader = new THREE.TextureLoader();

      // Apply face texture
      if (faceTextureUrl && faceGltf) {
        try {
          const texture = await textureLoader.loadAsync(faceTextureUrl);
          faceGltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              (mesh.material as THREE.MeshStandardMaterial).map = texture;
              (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          });
        } catch (error) {
          console.error('Error loading face texture:', error);
        }
      }

      // Apply clothing texture
      if (clothingTextureUrl && bodyGltf) {
        try {
          const texture = await textureLoader.loadAsync(clothingTextureUrl);
          bodyGltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              (mesh.material as THREE.MeshStandardMaterial).map = texture;
              (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          });
        } catch (error) {
          console.error('Error loading clothing texture:', error);
        }
      }
    };

    loadTextures();
  }, [faceTextureUrl, clothingTextureUrl, faceGltf, bodyGltf]);

  return (
    <group ref={groupRef}>
      {/* Render body mesh using config constants */}
      <primitive 
        object={bodyGltf.scene} 
        scale={AVATAR_CONFIG.body.scale} 
        position={AVATAR_CONFIG.body.position} 
      />
      
      {/* Render face mesh using config constants */}
      <primitive 
        object={faceGltf.scene} 
        scale={AVATAR_CONFIG.face.scale} 
        position={AVATAR_CONFIG.face.position} 
      />
    </group>
  );
}

// Legacy support for single mesh
function AvatarModelLegacy({ meshUrl, clothingTextureUrl }: { meshUrl: string; clothingTextureUrl?: string | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(meshUrl);

  useFrame((state) => {
    if (groupRef.current) {
      const { speed, amplitude } = ANIMATION_CONFIG.idleRotation;
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * speed * 300) * amplitude * 2.5;
    }
  });

  useEffect(() => {
    if (clothingTextureUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(clothingTextureUrl, (texture) => {
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            (mesh.material as THREE.MeshStandardMaterial).map = texture;
            (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        });
      });
    }
  }, [clothingTextureUrl, gltf]);

  return (
    <group ref={groupRef}>
      <primitive 
        object={gltf.scene} 
        scale={AVATAR_CONFIG.legacy.scale} 
        position={AVATAR_CONFIG.legacy.position} 
      />
    </group>
  );
}

export function RealisticAvatar3D({ faceMeshUrl, bodyMeshUrl, faceTextureUrl, clothingTextureUrl, meshUrl }: RealisticAvatar3DProps) {
  const isLegacyMode = !!meshUrl && (!faceMeshUrl || !bodyMeshUrl);

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gradient-to-b from-background/50 to-background border border-border">
      <ThreeErrorBoundary>
        <Canvas shadows camera={{ 
          fov: CAMERA_CONFIG.fov, 
          near: CAMERA_CONFIG.near, 
          far: CAMERA_CONFIG.far,
          position: CAMERA_CONFIG.position 
        }}>
          <OrbitControls 
            enablePan={false}
            minDistance={2}
            maxDistance={8}
          />
          
          {/* Lighting using constants */}
          <ambientLight intensity={LIGHTING_CONFIG.ambient.intensity} />
          <directionalLight 
            position={LIGHTING_CONFIG.directional.position} 
            intensity={LIGHTING_CONFIG.directional.intensity} 
            castShadow 
          />
          <directionalLight position={[-5, 3, -5]} intensity={0.4} />
          <pointLight position={[0, 2, 2]} intensity={0.5} />
          
          {isLegacyMode ? (
            <AvatarModelLegacy meshUrl={meshUrl!} clothingTextureUrl={clothingTextureUrl} />
          ) : (
            <AvatarModel
              faceMeshUrl={faceMeshUrl!}
              bodyMeshUrl={bodyMeshUrl!}
              faceTextureUrl={faceTextureUrl}
              clothingTextureUrl={clothingTextureUrl}
            />
          )}
        </Canvas>
      </ThreeErrorBoundary>
      
      {!isLegacyMode && (!faceMeshUrl || !bodyMeshUrl) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
    </div>
  );
}
