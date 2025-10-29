import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

interface RealisticAvatar3DProps {
  faceMeshUrl?: string;
  bodyMeshUrl?: string;
  faceTextureUrl?: string | null;
  clothingTextureUrl?: string | null;
  meshUrl?: string; // Legacy support
}

function AvatarModel({ faceMeshUrl, bodyMeshUrl, faceTextureUrl, clothingTextureUrl, meshUrl }: RealisticAvatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load face and body meshes separately, or fall back to single mesh
  const faceGltf = faceMeshUrl ? useGLTF(faceMeshUrl) : null;
  const bodyGltf = bodyMeshUrl ? useGLTF(bodyMeshUrl) : null;
  const legacyGltf = meshUrl ? useGLTF(meshUrl) : null;

  useEffect(() => {
    const loadTextures = async () => {
      const textureLoader = new THREE.TextureLoader();
      
      // Apply face texture to face mesh
      if (faceGltf && faceTextureUrl) {
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
          console.error("Error loading face texture:", error);
        }
      }
      
      // Apply clothing texture to body mesh
      if (bodyGltf && clothingTextureUrl) {
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
          console.error("Error loading clothing texture:", error);
        }
      }
      
      // Legacy: Apply clothing texture to single mesh
      if (legacyGltf && clothingTextureUrl) {
        try {
          const texture = await textureLoader.loadAsync(clothingTextureUrl);
          legacyGltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (mesh.name.toLowerCase().includes('body') || 
                  mesh.name.toLowerCase().includes('torso') ||
                  mesh.name.toLowerCase().includes('shirt')) {
                (mesh.material as THREE.MeshStandardMaterial).map = texture;
                (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
              }
            }
          });
        } catch (error) {
          console.error("Error loading clothing texture:", error);
        }
      }
      
      setIsLoading(false);
    };
    
    if (faceGltf || bodyGltf || legacyGltf) {
      loadTextures();
    }
  }, [faceGltf, bodyGltf, legacyGltf, faceTextureUrl, clothingTextureUrl]);

  // Gentle idle animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  if (isLoading) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {bodyGltf && <primitive object={bodyGltf.scene} scale={1.5} position={[0, -1, 0]} />}
      {faceGltf && <primitive object={faceGltf.scene} scale={0.15} position={[0, 0.6, 0]} />}
      {legacyGltf && !bodyGltf && !faceGltf && <primitive object={legacyGltf.scene} scale={1.5} position={[0, -1, 0]} />}
    </group>
  );
}

export function RealisticAvatar3D({ faceMeshUrl, bodyMeshUrl, faceTextureUrl, clothingTextureUrl, meshUrl }: RealisticAvatar3DProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-[600px] relative rounded-lg overflow-hidden" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading 3D model...</p>
          </div>
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        onCreated={() => setIsLoading(false)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        <AvatarModel 
          faceMeshUrl={faceMeshUrl}
          bodyMeshUrl={bodyMeshUrl}
          faceTextureUrl={faceTextureUrl}
          clothingTextureUrl={clothingTextureUrl}
          meshUrl={meshUrl}
        />
        
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
