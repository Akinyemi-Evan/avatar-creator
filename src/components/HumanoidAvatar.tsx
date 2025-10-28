import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BodyMeasurements } from "@/lib/bodyMeasurements";

interface HumanoidAvatarProps {
  measurements: BodyMeasurements;
  clothingTextureUrl?: string | null;
  personImageUrl: string; // can be original or enhanced
}

function HumanoidModel({ measurements, clothingTextureUrl, personImageUrl }: HumanoidAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/cesium-man.glb");

  const [faceTexture, setFaceTexture] = useState<THREE.Texture | null>(null);
  const [clothingTexture, setClothingTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!personImageUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      personImageUrl,
      (tex) => {
        tex.flipY = false; // GLTF uses UV origin at top-left
        setFaceTexture(tex);
      },
      undefined,
      (err) => console.error("Failed to load face texture", err)
    );
  }, [personImageUrl]);

  useEffect(() => {
    if (!clothingTextureUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      clothingTextureUrl,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        setClothingTexture(tex);
      },
      undefined,
      (err) => console.error("Failed to load clothing texture", err)
    );
  }, [clothingTextureUrl]);

  // Apply simple idle motion
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      if (group.current) {
        group.current.rotation.y = Math.sin(t * 0.3) * 0.05;
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  // Assign materials: try to detect head/face and torso meshes heuristically by name
  useMemo(() => {
    scene.traverse((obj) => {
      if ((obj as any).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.Material) || new THREE.MeshStandardMaterial();

        // Ensure PBR for better realism
        const std = mat instanceof THREE.MeshStandardMaterial ? mat : new THREE.MeshStandardMaterial({ color: 0xffffff });
        std.roughness = 0.6;
        std.metalness = 0.1;
        mesh.material = std;

        const name = (mesh.name || "").toLowerCase();
        const matName = ((mesh.material as THREE.MeshStandardMaterial).name || "").toLowerCase();

        // Very rough heuristic: apply face texture to head-like meshes
        if (faceTexture && (name.includes("head") || name.includes("face") || matName.includes("head") || matName.includes("face"))) {
          std.map = faceTexture;
          std.needsUpdate = true;
        }

        // Apply clothing texture to torso-like meshes if provided
        if (clothingTexture && (name.includes("torso") || name.includes("shirt") || name.includes("body") || name.includes("chest") || matName.includes("shirt"))) {
          std.map = clothingTexture;
          std.color = new THREE.Color(0xffffff);
          std.needsUpdate = true;
        }
      }
    });
  }, [scene, faceTexture, clothingTexture]);

  // Scale model by height and shoulder width as a coarse approximation
  const scaleVec = useMemo(() => new THREE.Vector3(1 * measurements.shoulderWidth, 1 * measurements.height, 1), [measurements]);

  return <primitive ref={group} object={scene} scale={scaleVec} position={[0, -1.5, 0]} />;
}

export function HumanoidAvatar({ measurements, clothingTextureUrl, personImageUrl }: HumanoidAvatarProps) {
  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gradient-to-b from-background/50 to-background border border-border">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0.5, 4]} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={6} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 6} />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 2, 2]} intensity={0.5} />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.2} />
        </mesh>

        <HumanoidModel measurements={measurements} clothingTextureUrl={clothingTextureUrl || undefined} personImageUrl={personImageUrl} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/cesium-man.glb");
