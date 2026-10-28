"use client";

import { Button } from "@/components/ui/button";
import { OrbitControls, useFBX } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

interface AvatarProps {
  glossOutput: string;
  isPlaying: boolean;
  speed: number;
  visualMode: "realistic" | "contrast";
}

interface AnimationSelection {
  gloss: string;
  animation: string;
}

function AnimationAvatar({
  glossOutput,
  isPlaying,
  speed,
  visualMode,
}: AvatarProps) {
  const leonard = useFBX("/models/Leonard.fbx");
  const [selections, setSelections] = useState<AnimationSelection[]>([]);
  const animationUrls = selections.length
    ? selections.map(
        ({ animation }) =>
          `/api/animations/file/${encodeURIComponent(animation)}`,
      )
    : ["/api/animations/file/Idle.fbx"];
  const animationAssets = useLoader(FBXLoader, animationUrls) as THREE.Group[];
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const originalMaterialsRef = useRef(
    new Map<string, THREE.Material | THREE.Material[]>(),
  );
  const contrastMaterialsRef = useRef(
    new Map<string, THREE.MeshBasicMaterial>(),
  );

  useEffect(() => {
    const originalMaterials = originalMaterialsRef.current;
    const contrastMaterials = contrastMaterialsRef.current;

    leonard.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || originalMaterials.has(mesh.uuid)) return;

      originalMaterials.set(mesh.uuid, mesh.material);
      contrastMaterials.set(
        mesh.uuid,
        new THREE.MeshBasicMaterial({ color: 0x000000 }),
      );
    });

    return () => {
      contrastMaterials.forEach((material) => material.dispose());
      contrastMaterials.clear();
      originalMaterials.clear();
    };
  }, [leonard]);

  useEffect(() => {
    leonard.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const originalMaterial = originalMaterialsRef.current.get(mesh.uuid);
      const contrastMaterial = contrastMaterialsRef.current.get(mesh.uuid);
      if (!originalMaterial || !contrastMaterial) return;

      mesh.material =
        visualMode === "contrast" ? contrastMaterial : originalMaterial;
    });
  }, [leonard, visualMode]);

  useEffect(() => {
    let cancelled = false;
    if (!glossOutput) {
      return;
    }

    fetch("/api/animations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gloss: glossOutput }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Animation selection failed");
        return response.json() as Promise<{
          selections?: AnimationSelection[];
        }>;
      })
      .then((data) => {
        if (!cancelled) setSelections(data.selections ?? []);
      })
      .catch(() => {
        if (!cancelled) setSelections([]);
      });

    return () => {
      cancelled = true;
    };
  }, [glossOutput]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(leonard);
    mixerRef.current = mixer;
    const clips = animationAssets.flatMap((asset) => asset.animations);
    let clipIndex = 0;

    const playNext = () => {
      const clip = clips[clipIndex % clips.length];
      if (!clip) return;
      const action = mixer.clipAction(clip);
      action
        .reset()
        .setLoop(
          selections.length ? THREE.LoopOnce : THREE.LoopRepeat,
          selections.length ? 1 : Infinity,
        );
      action.clampWhenFinished = selections.length > 0;
      action.play();
      clipIndex += 1;
    };

    if (clips.length > 0) {
      mixer.addEventListener("finished", playNext);
      playNext();
    }

    return () => {
      mixer.stopAllAction();
      mixer.removeEventListener("finished", playNext);
      mixerRef.current = null;
    };
  }, [animationAssets, leonard, selections.length]);

  useFrame((_, delta) => {
    if (isPlaying) mixerRef.current?.update(delta * speed);
  });

  return <primitive object={leonard} scale={0.012} position={[0, 0.05, 0]} />;
}

export function AvatarViewport() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewAngle, setViewAngle] = useState<"front" | "45">("front");
  const [avatar, setAvatar] = useState<"realistic" | "contrast">("realistic");
  const [speed, setSpeed] = useState(1.0);
  const [gloss, setGloss] = useState("");
  const [currentSign, setCurrentSign] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleGlossUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const glossText = customEvent.detail.gloss || "";
      setGloss(glossText);
      if (glossText) {
        const tokens = glossText.split(/\s+/).filter(Boolean);
        setCurrentSign(tokens[0] || "");
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }
    };

    window.addEventListener("glossUpdate", handleGlossUpdate);
    return () => window.removeEventListener("glossUpdate", handleGlossUpdate);
  }, []);

  return (
    <div className="h-full flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold mb-3">VISUAL SIGN OUTPUT</h2>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Avatar View:</span>
          <select
            value={avatar}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "realistic" || value === "contrast") {
                setAvatar(value);
              }
            }}
            className="text-xs px-2 py-1 bg-background border border-input rounded-md"
          >
            <option value="realistic">Realistic Human</option>
            <option value="contrast">High-Contrast Visual</option>
          </select>
        </div>
      </div>

      <div className="flex-1 border border-border rounded-md overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 relative">
        <Canvas camera={{ position: [0, 0.65, 3.2], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <AnimationAvatar
            key={gloss || "idle"}
            glossOutput={gloss}
            isPlaying={isPlaying}
            speed={speed}
            visualMode={avatar}
          />
          <OrbitControls enableZoom={false} target={[0, 1, 0]} />
        </Canvas>
        {gloss && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded text-center font-mono">
            {isAnimating ? "Rendering animation..." : "Signing: " + gloss}
            {currentSign && isAnimating && (
              <div className="text-cyan-300">Current: {currentSign}</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">View Angle:</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewAngle === "front" ? "default" : "outline"}
              onClick={() => setViewAngle("front")}
              className="text-xs h-7"
            >
              Front
            </Button>
            <Button
              size="sm"
              variant={viewAngle === "45" ? "default" : "outline"}
              onClick={() => setViewAngle("45")}
              className="text-xs h-7"
            >
              45°
            </Button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              Speed: {speed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Adjust how quickly the avatar plays each sign animation.
          </p>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <SkipBack className="h-3 w-3" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <SkipForward className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
