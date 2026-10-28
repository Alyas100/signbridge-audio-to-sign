"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";

interface HumanAvatarProps {
  gloss: string;
}

export function HumanAvatar({ gloss }: HumanAvatarProps) {
  const group = useRef<Group>(null);
  
  // Try to load a human avatar model if available
  // For now, create a more human-like placeholder structure
  useFrame((state) => {
    if (group.current && gloss) {
      // Simple idle animation
      group.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]} scale={1.2}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
        <meshStandardMaterial color="#4f46e5" />
      </mesh>
      
      {/* Left Arm */}
      <group position={[-0.25, 1.1, 0]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.05, 0.35, 4, 8]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <mesh position={[-0.15, -0.35, 0]} rotation={[0, 0, -0.6]} castShadow>
          <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group position={[0.25, 1.1, 0]} rotation={gloss ? [0.3, 0, 0.3] : [0, 0, 0.3]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.05, 0.35, 4, 8]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
        <mesh position={[0.15, -0.35, 0]} rotation={[0, 0, 0.6]} castShadow>
          <capsuleGeometry args={[0.04, 0.3, 4, 8]} />
          <meshStandardMaterial color="#d4a574" />
        </mesh>
      </group>
      
      {/* Legs */}
      <mesh position={[-0.08, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.08, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}
