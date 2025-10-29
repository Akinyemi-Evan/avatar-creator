import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

interface RealisticAvatar3DProps {
  meshUrl: string;
  clothingTextureUrl?: string | null;
}

function AvatarModel({ meshUrl, clothingTextureUrl }: RealisticAvatar3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { scene } = useGLTF(meshUrl);

  useEffect(() => {
    if (scene) {
      setIsLoading(false);
      
      // Apply clothing texture if provided
      if (clothingTextureUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(clothingTextureUrl, (texture) => {
          scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              // Apply clothing texture to body meshes
              if (mesh.name.toLowerCase().includes('body') || 
                  mesh.name.toLowerCase().includes('torso') ||
                  mesh.name.toLowerCase().includes('shirt')) {
                (mesh.material as THREE.MeshStandardMaterial).map = texture;
                (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
              }
            }
          });
        });
      }
    }
  }, [scene, clothingTextureUrl]);

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
      <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
    </group>
  );
}

export function RealisticAvatar3D({ meshUrl, clothingTextureUrl }: RealisticAvatar3DProps) {
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
        
        <AvatarModel meshUrl={meshUrl} clothingTextureUrl={clothingTextureUrl} />
        
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
