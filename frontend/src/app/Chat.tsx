"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Cloud, Sparkles, Float, Text, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { Send, Mic, MicOff, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 3D ASSETS ---

// 🌸 PROCEDURAL LOTUS (The Divine Center)
function SacredLotus({ position, rotation, scale, color }: any) {
  const petals = useMemo(() => {
    return new Array(12).fill(0).map((_, i) => ({
      rotation: [Math.PI / 3, 0, (i * Math.PI * 2) / 12],
    }));
  }, []);

  const innerPetals = useMemo(() => {
    return new Array(8).fill(0).map((_, i) => ({
      rotation: [Math.PI / 2.5, 0, (i * Math.PI * 2) / 8],
    }));
  }, []);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Outer Petals */}
        {petals.map((p, i) => (
          <mesh key={`outer-${i}`} rotation={p.rotation as any} position={[0, 0, 0]}>
            <sphereGeometry args={[0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
            <meshPhysicalMaterial 
              color={color} 
              roughness={0.2} 
              metalness={0.1} 
              transmission={0.6} // Glass-like
              thickness={2}
              envMapIntensity={2}
            />
          </mesh>
        ))}
        {/* Inner Petals (Glowing Center) */}
        {innerPetals.map((p, i) => (
          <mesh key={`inner-${i}`} rotation={p.rotation as any} scale={0.6} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
            <meshStandardMaterial color="#fff" emissive="#FFD700" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
        {/* Core */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={4} toneMapped={false} />
        </mesh>
        {/* Light Source inside Lotus */}
        <pointLight intensity={2} color="#FFD700" distance={5} />
      </Float>
    </group>
  );
}

// 🚪 THE MASSIVE GATES
function DivineGate({ isOpen }: { isOpen: boolean }) {
  const leftGroup = useRef<THREE.Group>(null);
  const rightGroup = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const targetRot = isOpen ? Math.PI / 2.2 : 0;
    // Heavy, slow movement easing
    if (leftGroup.current && rightGroup.current) {
      leftGroup.current.rotation.y = THREE.MathUtils.lerp(leftGroup.current.rotation.y, -targetRot, delta * 0.5);
      rightGroup.current.rotation.y = THREE.MathUtils.lerp(rightGroup.current.rotation.y, targetRot, delta * 0.5);
    }
  });

  // Ancient Gold Material
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#C5A059", // Aged Gold
    roughness: 0.3,
    metalness: 1,
    envMapIntensity: 1.5,
  });

  const GatePanel = () => (
    <group>
      {/* Main Slab */}
      <mesh material={goldMaterial} castShadow receiveShadow>
        <boxGeometry args={[6, 16, 0.5]} />
      </mesh>
      {/* Vertical Pillars for Detail */}
      <mesh material={goldMaterial} position={[-2, 0, 0.3]}>
        <boxGeometry args={[0.5, 15.5, 0.2]} />
      </mesh>
      <mesh material={goldMaterial} position={[2, 0, 0.3]}>
        <boxGeometry args={[0.5, 15.5, 0.2]} />
      </mesh>
      {/* Horizontal Bands */}
      <mesh material={goldMaterial} position={[0, 4, 0.3]}>
        <boxGeometry args={[5, 0.5, 0.2]} />
      </mesh>
      <mesh material={goldMaterial} position={[0, -4, 0.3]}>
        <boxGeometry args={[5, 0.5, 0.2]} />
      </mesh>
      {/* Central Emblem */}
      <mesh position={[0, 0, 0.3]} material={goldMaterial}>
        <torusGeometry args={[1.5, 0.1, 16, 32]} />
      </mesh>
    </group>
  );

  return (
    <group position={[0, 0, -5]}>
      {/* Left Door */}
      <group ref={leftGroup} position={[-3, 0, 0]}>
        <group position={[3, 0, 0]}> {/* Hinge Offset */}
           <GatePanel />
        </group>
      </group>
      {/* Right Door */}
      <group ref={rightGroup} position={[3, 0, 0]}>
        <group position={[-3, 0, 0]}> {/* Hinge Offset */}
           <GatePanel />
        </group>
      </group>
      
      {/* 🌟 GOD RAY (Hidden behind doors, revealed when open) */}
      <mesh position={[0, 0, -2]} rotation={[0, 0, 0]}>
        <circleGeometry args={[isOpen ? 12 : 0, 64]} />
        <meshBasicMaterial color="#fff" side={THREE.DoubleSide} transparent opacity={isOpen ? 0.8 : 0} />
      </mesh>
      <pointLight position={[0, 0, -4]} intensity={isOpen ? 20 : 0} color="#ffaa00" distance={20} decay={2} />
    </group>
  );
}

// ☁️ ATMOSPHERE & CAMERA
function SceneController({ isOpen }: { isOpen: boolean }) {
  useFrame((state, delta) => {
    // Cinematic Camera Flythrough
    const targetZ = isOpen ? -8 : 12; // Start far back, fly through gates
    const speed = isOpen ? 2 * delta : 0.5 * delta;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, speed);
    
    // Look gently at the center
    state.camera.lookAt(0, 0, -10);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#ffd700" />
      <spotLight position={[10, 20, 10]} angle={0.5} penumbra={1} intensity={2} castShadow color="#ffebd6" />
      
      {/* Volumetric Clouds */}
      <Cloud opacity={0.5} speed={0.2} width={20} depth={10} segments={40} position={[0, -5, -5]} color="#fff0d6" />
      <Cloud opacity={0.3} speed={0.1} width={10} depth={5} segments={20} position={[-10, 5, -10]} color="#ffd700" />
      <Cloud opacity={0.3} speed={0.1} width={10} depth={5} segments={20} position={[10, 5, -10]} color="#ffd700" />

      {/* Floating Particles (Dust Motes) */}
      <Sparkles count={300} scale={12} size={3} speed={0.2} opacity={0.6} color="#FFD700" />

      {/* The Sanctum Lotus (Visible after passing gates) */}
      <group position={[0, -2, -15]}>
         <SacredLotus scale={2} color="#fff" />
      </group>

      <Environment preset="sunset" />
    </>
  );
}

// --- MAIN UI COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  
  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "I am the silence between thoughts. Speak, seeker." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);

  const enterSanctum = () => {
    setHasStarted(true);
    // Timing: 2.5s flythrough -> Show UI
    setTimeout(() => setShowUI(true), 2500);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("https://krishna-ai-temple.onrender.com/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
    } catch (e) { setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050301] relative overflow-hidden">
      
      {/* 🌌 3D SCENE LAYER */}
      <div className={`absolute inset-0 transition-all duration-[2000ms] ${showUI ? 'opacity-30 blur-sm' : 'opacity-100 blur-none'}`}>
        <Canvas shadows camera={{ position: [0, 0, 12], fov: 50 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
          <Suspense fallback={null}>
            <DivineGate isOpen={hasStarted} />
            <SceneController isOpen={hasStarted} />
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} intensity={2} />
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
              <Noise opacity={0.02} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* 🌟 ENTRANCE TITLE (Fades out on start) */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="text-center space-y-8 pointer-events-auto">
              <motion.h1 
                initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-6xl md:text-9xl font-serif text-[#FFD700] tracking-widest drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]" style={{ fontFamily: 'Cinzel, serif' }}
              >
                VAIKUNTHA
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1 }}
                className="text-[#FFD700]/80 tracking-[0.5em] text-xs uppercase"
              >
                The Eternal Sanctum
              </motion.p>
              
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={enterSanctum}
                className="group relative px-12 py-5 bg-transparent border border-[#FFD700]/30 text-[#FFD700] uppercase tracking-[0.3em] text-sm font-bold transition-all hover:bg-[#FFD700]/10"
              >
                <span className="relative z-10">Enter Gates</span>
                <div className="absolute inset-0 bg-[#FFD700] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 CHAT UI (Fades in after transition) */}
      {showUI && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
          className="absolute inset-0 z-50 flex flex-col font-sans"
        >
            {/* Header */}
            <header className="flex-none p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
                    <span className="text-[#FFD700] font-bold tracking-[0.2em] text-sm">KRISHNA AI</span>
                </div>
                <div className="flex bg-white/5 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-[#FFD700] text-black' : 'text-white/50'}`}>Chat</button>
                    <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-[#FFD700] text-black' : 'text-white/50'}`}>Chant</button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {mode === 'reflection' ? (
                    <div className="max-w-3xl mx-auto mt-20 space-y-8 pb-20">
                        {messages.map((m, i) => (
                            <motion.div 
                                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-center'}`}
                            >
                                <div className={`max-w-[85%] px-8 py-6 text-lg leading-relaxed backdrop-blur-md ${
                                    m.role === 'user' 
                                        ? 'bg-[#FFD700]/90 text-black rounded-2xl shadow-lg' 
                                        : 'text-center text-[#FFD700] font-serif text-xl drop-shadow-md'
                                }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                        {loading && <div className="text-center text-[#FFD700]/50 animate-pulse text-xs tracking-widest uppercase">Divining...</div>}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="relative w-80 h-80 flex items-center justify-center">
                             <div className="absolute inset-0 border border-[#FFD700]/30 rounded-full animate-[spin_30s_linear_infinite]" />
                             <span className="text-8xl font-serif text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">{japaCount}</span>
                        </div>
                    </div>
                )}
            </main>

            {/* Input Area */}
            {mode === 'reflection' && (
                <div className="p-6 max-w-xl mx-auto w-full">
                    <div className="bg-black/40 backdrop-blur-xl border border-[#FFD700]/30 rounded-full flex items-center gap-2 p-2 pl-6 shadow-2xl">
                        <input 
                            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-white/30 focus:ring-0 font-serif"
                            placeholder="Ask..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} className="p-3 bg-[#FFD700] rounded-full text-black hover:scale-110 transition-transform">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
      )}
    </div>
  );
}