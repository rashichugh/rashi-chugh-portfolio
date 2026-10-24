"use client";

import { ContactShadows, Decal, Environment, Html, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { RigidBodyType } from "@dimforge/rapier3d-compat";
import { BallCollider, CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { stickerTextureUrl, type StickerId } from "@/components/toybox-stickers";

export type CapsuleCommand = { id: number; type: "dispense" | "shake"; variants?: StickerId[] };

type SceneProps = {
  active: boolean;
  reducedMotion: boolean;
  command: CapsuleCommand | null;
  onReady: () => void;
  onCrank: () => void;
  onReveal: (variants: StickerId[]) => void;
};

type Drop = { id: number; color: string; accent: string; index: number };
type DragState = { pointerId: number; plane: THREE.Plane; lastPoint: THREE.Vector3; lastTime: number; velocity: THREE.Vector3 };
const capsuleColors = ["#DDF48B", "#FF805C", "#AFC8FF", "#F3BAD1", "#FFCF54", "#B9A7F9"];
const floatingCapsules: Array<{ position: [number, number, number]; rotation: [number, number, number]; color: string; accent: string }> = [
  { position: [-0.72, 2.35, 0.2], rotation: [0.4, 0.2, -0.5], color: "#DDF48B", accent: "#FF805C" },
  { position: [0.55, 2.18, 0.55], rotation: [-0.2, 0.4, 0.7], color: "#AFC8FF", accent: "#F3BAD1" },
  { position: [0.1, 2.82, -0.62], rotation: [0.6, -0.4, 0.2], color: "#FFCF54", accent: "#B9A7F9" },
  { position: [-0.5, 3.1, 0.25], rotation: [0.1, 0.7, -0.8], color: "#F3BAD1", accent: "#DDF48B" },
  { position: [0.72, 2.95, 0.1], rotation: [-0.4, 0.1, 0.6], color: "#FF805C", accent: "#FFCF54" },
  { position: [0.1, 2.25, -0.45], rotation: [0.4, -0.6, 0.4], color: "#B9A7F9", accent: "#AFC8FF" },
  { position: [-0.82, 2.75, -0.4], rotation: [0.7, 0.1, -0.2], color: "#AFC8FF", accent: "#DDF48B" },
  { position: [0.4, 3.35, 0.4], rotation: [0.1, 0.6, 0.8], color: "#DDF48B", accent: "#F3BAD1" },
  { position: [0.75, 2.52, -0.45], rotation: [-0.5, 0.4, 0.1], color: "#FFCF54", accent: "#FF805C" },
];

function Capsule({ color, accent, radius = 0.31 }: { color: string; accent: string; radius?: number }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[radius, 24, 18]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={0.85} clearcoatRoughness={0.16} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[radius * 0.98, radius * 0.12, 10, 32]} />
        <meshStandardMaterial color={accent} roughness={0.35} />
      </mesh>
      <mesh position={[0, radius * 0.45, 0]} scale={[0.93, 0.52, 0.93]}>
        <sphereGeometry args={[radius, 20, 12]} />
        <meshPhysicalMaterial color={accent} roughness={0.22} clearcoat={0.7} transparent opacity={0.78} />
      </mesh>
    </group>
  );
}

function MachineSticker({ id, position, rotation = [0, 0, 0], scale = 0.62 }: { id: StickerId; position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const texture = useTexture(stickerTextureUrl(id), (loaded) => { loaded.colorSpace = THREE.SRGBColorSpace; loaded.anisotropy = 4; });
  return <Decal position={position} rotation={rotation} scale={scale} renderOrder={3}><meshBasicMaterial map={texture} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-12} toneMapped={false} /></Decal>;
}

function Crank({ onDispense, spinRef }: { onDispense: () => void; spinRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current || spinRef.current <= 0) return;
    const step = Math.min(delta * 8, spinRef.current);
    group.current.rotation.x += step;
    spinRef.current -= step;
  });
  const activate = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onDispense(); };
  return (
    <group position={[1.72, 0.62, 0.12]} onClick={activate} onPointerDown={(event) => event.stopPropagation()} data-cursor="CRANK">
      <mesh rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.28, 32]} />
        <meshPhysicalMaterial color="#FFCF54" metalness={0.35} roughness={0.25} clearcoat={0.8} />
      </mesh>
      <group ref={group} rotation={[0, 0, Math.PI / 2]}>
        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.13, 1.05, 0.13]} /><meshStandardMaterial color="#F5F0E6" metalness={0.65} roughness={0.25} /></mesh>
        <mesh position={[0, 1.06, 0]} castShadow><sphereGeometry args={[0.25, 24, 18]} /><meshPhysicalMaterial color="#DDF48B" roughness={0.2} clearcoat={0.8} /></mesh>
      </group>
    </group>
  );
}

function JarColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[1.12, 0.08, 1.12]} position={[0, 1.46, 0]} />
      <CuboidCollider args={[1.02, 0.08, 1.02]} position={[0, 3.68, 0]} />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = index / 12 * Math.PI * 2;
        return <CuboidCollider key={index} args={[0.34, 1.06, 0.07]} position={[Math.sin(angle) * 1.18, 2.56, Math.cos(angle) * 1.18]} rotation={[0, angle, 0]} />;
      })}
    </RigidBody>
  );
}

function InsideCapsules({ bodies }: { bodies: React.MutableRefObject<Array<RapierRigidBody | null>> }) {
  return floatingCapsules.map((capsule, index) => (
    <RigidBody
      key={index}
      ref={(body) => { bodies.current[index] = body; }}
      position={capsule.position}
      rotation={capsule.rotation}
      colliders={false}
      gravityScale={1}
      restitution={0.62}
      friction={0.52}
      linearDamping={0.24}
      angularDamping={0.3}
      ccd
    >
      <BallCollider args={[0.3]} />
      <Capsule color={capsule.color} accent={capsule.accent} radius={0.3} />
    </RigidBody>
  ));
}

function DroppedCapsule({ id, index, color, accent }: Drop) {
  const body = useRef<RapierRigidBody>(null);
  const drag = useRef<DragState | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!body.current) return;
    body.current.setLinvel({ x: (index - 1.5) * 0.42 + (Math.random() - 0.5) * 0.35, y: 0.8 + index * 0.18, z: 1.7 + Math.random() * 0.5 }, true);
    body.current.setAngvel({ x: 2.2 + index * 0.3, y: 1.4, z: -1.3 }, true);
  }, [index]);


  const pointerOnPlane = (event: ReactPointerEvent<HTMLButtonElement>, plane: THREE.Plane) => {
    const bounds = gl.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.current.setFromCamera(pointer, camera);
    return raycaster.current.ray.intersectPlane(plane, new THREE.Vector3());
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !body.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = body.current.translation();
    const normal = camera.getWorldDirection(new THREE.Vector3());
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(position.x, position.y, position.z));
    drag.current = { pointerId: event.pointerId, plane, lastPoint: new THREE.Vector3(position.x, position.y, position.z), lastTime: performance.now(), velocity: new THREE.Vector3() };
    body.current.setBodyType(RigidBodyType.KinematicPositionBased, true);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    event.currentTarget.style.cursor = "grabbing";
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId || !body.current) return;
    event.preventDefault();
    const point = pointerOnPlane(event, current.plane);
    if (!point) return;
    point.set(THREE.MathUtils.clamp(point.x, -3, 3), THREE.MathUtils.clamp(point.y, -0.15, 4.4), THREE.MathUtils.clamp(point.z, 0.85, 3.85));
    const now = performance.now();
    const delta = Math.max(0.008, (now - current.lastTime) / 1000);
    current.velocity.copy(point).sub(current.lastPoint).divideScalar(delta);
    if (current.velocity.length() > 12) current.velocity.setLength(12);
    current.lastPoint.copy(point);
    current.lastTime = now;
    body.current.setNextKinematicTranslation(point);
  };
  const finish = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId || !body.current) return;
    drag.current = null;
    const velocity = current.velocity.clone().multiplyScalar(0.58);
    if (velocity.length() > 7) velocity.setLength(7);
    body.current.setBodyType(RigidBodyType.Dynamic, true);
    body.current.setLinvel(velocity, true);
    body.current.setAngvel({ x: velocity.z * 0.7, y: velocity.x * 0.5, z: -velocity.x * 0.7 }, true);
    event.currentTarget.style.cursor = "grab";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <RigidBody ref={body} position={[(index - 1.5) * 0.12, 0.95 + index * 0.08, 1.45]} colliders={false} restitution={0.64} friction={0.68} linearDamping={0.5} angularDamping={0.72} ccd>
      <BallCollider args={[0.32]} />
      <Capsule color={color} accent={accent} radius={0.32} />
      <Html center zIndexRange={[18, 0]} style={{ pointerEvents: "auto" }}>
        <button
          type="button"
          className="capsule-grab-handle"
          aria-label={`Grab and throw capsule ${id}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
      </Html>
    </RigidBody>
  );
}

function Machine({ onDispense, spinRef, reducedMotion }: { onDispense: () => void; spinRef: React.MutableRefObject<number>; reducedMotion: boolean }) {
  return (
    <group>
      <RoundedBox args={[3.5, 0.34, 2.55]} radius={0.13} smoothness={4} position={[0, -0.36, 0]} castShadow receiveShadow><meshPhysicalMaterial color="#DDF48B" roughness={0.28} clearcoat={0.65} /></RoundedBox>
      <RoundedBox args={[3.18, 1.55, 2.25]} radius={0.24} smoothness={5} position={[0, 0.48, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#FF805C" roughness={0.25} clearcoat={0.85} clearcoatRoughness={0.18} />
        <MachineSticker id="party" position={[-0.9, 0.18, 1.135]} scale={0.65} />
        <MachineSticker id="hello" position={[0.82, -0.22, 1.135]} scale={0.62} />
      </RoundedBox>
      <RoundedBox args={[1.38, 0.64, 0.28]} radius={0.16} smoothness={4} position={[0, 0.38, 1.22]} castShadow><meshPhysicalMaterial color="#1D2923" roughness={0.32} clearcoat={0.4} /></RoundedBox>
      <RoundedBox args={[1.03, 0.28, 0.08]} radius={0.08} smoothness={3} position={[0, 0.32, 1.38]}><meshStandardMaterial color="#080D0A" roughness={0.85} /></RoundedBox>
      <mesh position={[0, 1.36, 0]} castShadow><cylinderGeometry args={[1.47, 1.47, 0.28, 48]} /><meshPhysicalMaterial color="#B9A7F9" roughness={0.24} clearcoat={0.75} /></mesh>
      <mesh position={[0, 2.55, 0]} castShadow><sphereGeometry args={[1.43, 56, 40]} /><meshPhysicalMaterial color="#E9F3FF" roughness={0.04} transmission={reducedMotion ? 0 : 1} transparent={reducedMotion} opacity={reducedMotion ? 0.24 : 1} thickness={0.32} ior={1.46} clearcoat={1} envMapIntensity={1.2} attenuationColor="#AFC8FF" attenuationDistance={3} /></mesh>
      <mesh position={[0, 3.88, 0]} castShadow><cylinderGeometry args={[1.18, 1.28, 0.25, 48]} /><meshPhysicalMaterial color="#B9A7F9" roughness={0.24} clearcoat={0.8} /></mesh>
      <mesh position={[0, 4.08, 0]} castShadow><sphereGeometry args={[0.23, 24, 18]} /><meshPhysicalMaterial color="#FFCF54" roughness={0.2} clearcoat={0.8} /></mesh>
      <Crank onDispense={onDispense} spinRef={spinRef} />
    </group>
  );
}

function SceneContent({ running, reducedMotion, command, onCrank, onReveal }: Omit<SceneProps, "onReady" | "active"> & { running: boolean }) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const spinRef = useRef(0);
  const insideBodies = useRef<Array<RapierRigidBody | null>>([]);
  const lastCommand = useRef(0);
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);

  useEffect(() => {
    const position: [number, number, number] = size.width < 600 ? [5.8, 4.1, 9.4] : [5.1, 3.7, 7.7];
    camera.position.set(...position);
    camera.lookAt(0, 1.45, 0.2);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  useEffect(() => {
    if (!command || command.id === lastCommand.current) return;
    lastCommand.current = command.id;
    const strength = reducedMotion ? 0.35 : 1;
    const shaking = command.type === "shake";
    insideBodies.current.forEach((body, index) => {
      if (!body) return;
      const mass = body.mass();
      const direction = index % 2 ? 1 : -1;
      body.applyImpulse({
        x: (shaking ? direction * (2.1 + Math.random() * 1.3) : (Math.random() - 0.5) * 2.2) * mass * strength,
        y: (shaking ? 1.5 + Math.random() * 1.2 : 2.7 + Math.random() * 1.9) * mass * strength,
        z: (shaking ? (Math.random() - 0.5) * 4.2 : (Math.random() - 0.5) * 2.2) * mass * strength,
      }, true);
      body.applyTorqueImpulse({ x: (Math.random() - 0.5) * 0.045 * strength, y: direction * (0.025 + Math.random() * 0.035) * strength, z: (Math.random() - 0.5) * 0.045 * strength }, true);
    });
    if (shaking) return;
    spinRef.current = reducedMotion ? 0 : Math.PI * 4;
    const variants = command.variants ?? [];
    const frame = requestAnimationFrame(() => setDrops((current) => {
      const incoming = variants.map((_, index): Drop => {
        const colorIndex = (command.id + index) % capsuleColors.length;
        return { id: command.id * 10 + index, color: capsuleColors[colorIndex], accent: capsuleColors[(colorIndex + 2) % capsuleColors.length], index };
      });
      return [...current, ...incoming].slice(-8);
    }));
    const timer = window.setTimeout(() => { if (variants.length) onReveal(variants); }, reducedMotion ? 250 : 1500);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [command, onReveal, reducedMotion]);

  return (
    <>
      <color attach="background" args={["#B9A7F9"]} />
      <fog attach="fog" args={["#B9A7F9", 10, 23]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#FFF8E8", "#514277", 1.1]} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} color="#FFF1DC" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-5, 3, 2]} intensity={0.7} color="#AFC8FF" />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} color="#FFFFFF" position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[7, 7, 1]} />
          <Lightformer form="rect" intensity={2} color="#DDF48B" position={[-4, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 4, 1]} />
          <Lightformer form="circle" intensity={2} color="#F3BAD1" position={[4, 2, 1]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
        </Environment>
        <group position={[0, -0.45, 0]}>
          <Machine onDispense={onCrank} spinRef={spinRef} reducedMotion={reducedMotion} />
          <Physics gravity={[0, -9.81, 0]} paused={!running} timeStep={1 / 60}>
            <JarColliders />
            <InsideCapsules bodies={insideBodies} />
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider args={[3.2, 0.12, 3]} position={[0, -0.56, 1.25]} />
              <CuboidCollider args={[0.1, 1.8, 3]} position={[-3.2, 1.1, 1.25]} />
              <CuboidCollider args={[0.1, 1.8, 3]} position={[3.2, 1.1, 1.25]} />
              <CuboidCollider args={[3.2, 1.8, 0.1]} position={[0, 1.1, 4.2]} />
              <CuboidCollider args={[3.2, 0.1, 3]} position={[0, 4.85, 1.25]} />
            </RigidBody>
            {drops.map((drop) => <DroppedCapsule key={drop.id} {...drop} />)}
          </Physics>
        </group>
        <ContactShadows position={[0, -1.03, 0.6]} opacity={0.34} scale={11} blur={2.4} far={6} resolution={256} frames={1} color="#3E2C62" />
      </Suspense>
    </>
  );
}

export default function CapsuleScene(props: SceneProps) {
  const [awake, setAwake] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const sleepTimer = useRef(0);
  const running = props.active && (awake || interacting);

  const wake = useCallback((duration = 3200) => {
    setAwake(true);
    window.clearTimeout(sleepTimer.current);
    sleepTimer.current = window.setTimeout(() => setAwake(false), duration);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => wake(props.reducedMotion ? 1800 : 3600));
    return () => cancelAnimationFrame(frame);
  }, [props.command, props.active, props.reducedMotion, wake]);

  useEffect(() => {
    if (!interacting) return;
    const finish = () => { setInteracting(false); wake(props.reducedMotion ? 1200 : 2600); };
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [interacting, props.reducedMotion, wake]);

  useEffect(() => () => window.clearTimeout(sleepTimer.current), []);

  return (
    <div className="capsule-simulation" onPointerDownCapture={() => { setInteracting(true); wake(props.reducedMotion ? 1500 : 5000); }} onPointerUp={() => { setInteracting(false); wake(props.reducedMotion ? 1200 : 2600); }} onPointerCancel={() => { setInteracting(false); wake(props.reducedMotion ? 1200 : 2600); }}>
      <Canvas
        className="capsule-canvas"
        dpr={[1, 1.5]}
        shadows={!props.reducedMotion}
        frameloop={running ? "always" : "never"}
        camera={{ position: [5.1, 3.7, 7.7], fov: 38, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl, camera }) => {
          camera.lookAt(0, 1.45, 0.2);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.03;
          gl.transmissionResolutionScale = props.reducedMotion ? 0.3 : 0.65;
          props.onReady();
        }}
      >
        <SceneContent {...props} running={running} />
      </Canvas>
    </div>
  );
}
