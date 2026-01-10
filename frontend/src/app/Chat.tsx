"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Cloud, Sparkles, Float, useTexture, Text } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Send, Mic, MicOff, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 3D COMPONENTS ---

// 🚪 THE GOLDEN GATES
function Gate({ isOpen }: { isOpen: boolean }) {
  const leftDoorRef = useRef<THREE.Group>(null);
  const rightDoorRef = useRef<THREE.Group>(null);
  
  // Audio for the heavy rumble
  useEffect(() => {
    if (isOpen) {
        // Simple vibration pattern
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }, [isOpen]);

  useFrame((state, delta) => {
    // ⚙️ PHYSICS ANIMATION: Smooth, Heavy Opening
    const targetRotation = isOpen ? Math.PI / 2.5 : 0; // Open to ~70 degrees
    const speed = 0.8 * delta; // Slow, heavy speed

    if (leftDoorRef.current && rightDoorRef.current) {
        // Interpolate rotation for "weight" feel
        leftDoorRef.current.rotation.y = THREE.MathUtils.lerp(leftDoorRef.current.rotation.y, -targetRotation, speed);
        rightDoorRef.current.rotation.y = THREE.MathUtils.lerp(rightDoorRef.current.rotation.y, targetRotation, speed);
    }
  });

  // Material: Ancient Gold
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#FFD700",
    roughness: 0.15,
    metalness: 1,
    envMapIntensity: 2,
  });

  // Detail Material: Darker Bronze for carvings
  const detailMaterial = new THREE.MeshStandardMaterial({
    color: "#B8860B",
    roughness: 0.3,
    metalness: 0.8,
  });

  const DoorPanel = ({ side }: { side: 'left' | 'right' }) => (
    <group>
        {/* Main Slab */}
        <mesh material={goldMaterial} castShadow receiveShadow>
            <boxGeometry args={[4, 12, 0.5]} />
        </mesh>
        
        {/* Inner Bevels (The "Design") */}
        <mesh material={detailMaterial} position={[0, 0, 0.3]}>
            <boxGeometry args={[3, 10, 0.1]} />
        </mesh>
        
        {/* The Chakra / Mandala Carving (Torus) */}
        <mesh material={goldMaterial} position={[0, 2, 0.35]}>
            <torusGeometry args={[1, 0.1, 16, 100]} />
        </mesh>
        
        {/* The Handle (Heavy Ring) */}
        <group position={[side === 'left' ? 1.5 : -1.5, -1, 0.4]}>
            <mesh material={detailMaterial}>
                <ringGeometry args={[0.3, 0.4, 32]} />
            </mesh>
             <mesh material={goldMaterial} position={[0, -0.3, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.3, 0.05, 16, 32]} />
            </mesh>
        </group>
    </group>
  );

  return (
    <group position={[0, -2, 0]}>
        {/* Left Door Pivot */}
        <group ref={leftDoorRef} position={[-2, 0, 0]}>
            <group position={[2, 0, 0]}> {/* Offset for hinge */}
                <DoorPanel side="left" />
            </group>
        </group>
        
        {/* Right Door Pivot */}
        <group ref={rightDoorRef} position={[2, 0, 0]}>
            <group position={[-2, 0, 0]}> {/* Offset for hinge */}
                <DoorPanel side="right" />
            </group>
        </group>

        {/* The Divine Light Source (Behind Doors) */}
        <mesh position={[0, 2, -5]}>
            <circleGeometry args={[4, 32]} />
            <meshBasicMaterial color="#fff" toneMapped={false} />
        </mesh>
    </group>
  );
}

// ☁️ THE HEAVENLY ATMOSPHERE
function Atmosphere({ isOpen }: { isOpen: boolean }) {
  return (
    <group>
        {/* HDRI Environment for Reflections */}
        <Environment preset="sunset" />
        
        {/* Floating Clouds */}
        <Cloud opacity={0.5} speed={0.4} width={20} depth={5} segments={20} position={[0, 5, -10]} color="#fff8e7" />
        <Cloud opacity={0.3} speed={0.2} width={10} depth={2} segments={10} position={[-8, 0, -5]} color="#ffd700" />
        <Cloud opacity={0.3} speed={0.2} width={10} depth={2} segments={10} position={[8, 0, -5]} color="#ffd700" />

        {/* Gold Dust Particles */}
        <Sparkles count={500} scale={15} size={4} speed={0.4} opacity={0.6} color="#FFD700" />

        {/* Floor Reflection (Cloud Floor) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#000" roughness={0} metalness={0.8} opacity={0.5} transparent />
        </mesh>

        {/* Cinematic Lights */}
        <ambientLight intensity={0.5} color="#ffd700" />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow color="#fff" />
        <pointLight position={[0, 5, -2]} intensity={isOpen ? 5 : 0} color="#ffaa00" distance={10} />
    </group>
  );
}

// 🎥 CAMERA CONTROLLER
function CameraRig({ isOpen }: { isOpen: boolean }) {
    useFrame((state, delta) => {
        // Idle Float
        const t = state.clock.getElapsedTime();
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, isOpen ? 1 : Math.sin(t / 2) * 0.2, 0.05);
        
        // Fly Through Transition
        const targetZ = isOpen ? -6 : 8; // Start at 8, Fly into -6 (Through doors)
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, isOpen ? 1.5 * delta : 0.05);
        
        state.camera.lookAt(0, 0, 0);
    });
    return null;
}

// --- MAIN UI COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false); // Controls Door Open State
  const [showUI, setShowUI] = useState(false); // Controls Chat UI fade-in
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  
  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "I am the taste of water, the light of the sun and the moon. Ask, Arjuna." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Trigger Entrance
  const enterSanctum = () => {
    setHasStarted(true);
    // Wait for fly-through animation (2s) then show UI
    setTimeout(() => setShowUI(true), 2500);
  };

  // --- STANDARD CHAT FUNCTIONS (Send/Audio) ---
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
    <div className="h-[100dvh] w-full bg-black relative overflow-hidden">
      
      {/* 🌌 THE 3D WORLD */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${showUI ? 'opacity-20' : 'opacity-100'}`}>
          <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 45 }}>
            <Suspense fallback={null}>
                <Atmosphere isOpen={hasStarted} />
                <Gate isOpen={hasStarted} />
                <CameraRig isOpen={hasStarted} />
                <EffectComposer>
                    <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={1.5} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Suspense>
          </Canvas>
      </div>

      {/* 🔘 ENTRANCE UI (Before Open) */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                className="text-center space-y-6 pointer-events-auto"
            >
                <h1 className="text-6xl md:text-8xl font-serif text-[#FFD700] tracking-widest drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]" style={{ fontFamily: 'Cinzel, serif' }}>
                    VAIKUNTHA
                </h1>
                <p className="text-white/60 tracking-[0.5em] text-xs uppercase">The Eternal Gate</p>
                <button 
                    onClick={enterSanctum}
                    className="group relative px-12 py-4 bg-transparent border border-[#FFD700]/50 text-[#FFD700] uppercase tracking-[0.2em] text-sm font-bold transition-all hover:bg-[#FFD700] hover:text-black hover:shadow-[0_0_50px_#FFD700]"
                >
                    Open Gates
                </button>
            </motion.div>
        </div>
      )}

      {/* 📜 CHAT INTERFACE (Fade In After 3D Flythrough) */}
      {showUI && (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="absolute inset-0 z-50 flex flex-col font-sans"
        >
            {/* Header */}
            <header className="flex-none p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
                    <span className="text-[#FFD700] font-bold tracking-[0.2em]">KRISHNA AI</span>
                </div>
                <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-[#FFD700] text-black' : 'text-white/50'}`}>Chat</button>
                    <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-[#FFD700] text-black' : 'text-white/50'}`}>Chant</button>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                {mode === 'reflection' ? (
                    <div className="max-w-3xl mx-auto mt-10 space-y-8 pb-10">
                        {messages.map((m, i) => (
                            <motion.div 
                                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-center'}`}
                            >
                                <div className={`max-w-[85%] px-8 py-6 text-lg leading-relaxed ${
                                    m.role === 'user' 
                                        ? 'bg-[#FFD700] text-black rounded-2xl shadow-lg' 
                                        : 'text-center text-[#FFD700] font-serif text-xl drop-shadow-sm'
                                }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                        {loading && <div className="text-center text-[#FFD700]/50 animate-pulse text-sm tracking-widest uppercase">The Divine Listens...</div>}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="relative w-80 h-80 flex items-center justify-center">
                             <div className="absolute inset-0 border border-[#FFD700]/30 rounded-full animate-[spin_30s_linear_infinite]" />
                             <span className="text-8xl font-serif text-[#FFD700]">{japaCount}</span>
                        </div>
                    </div>
                )}
            </main>

            {/* Input */}
            {mode === 'reflection' && (
                <div className="p-6 max-w-2xl mx-auto w-full">
                    <div className="bg-black/50 backdrop-blur-xl border border-[#FFD700]/30 rounded-full flex items-center gap-2 p-2 pl-6">
                        <input 
                            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-white/30 focus:ring-0"
                            placeholder="Speak to the eternal..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button onClick={sendMessage} className="p-3 bg-[#FFD700] rounded-full text-black hover:scale-110 transition-transform">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
      )}
    </div>
  );
}