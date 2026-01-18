"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Cloud, Sparkles, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import { Send, Mic, MicOff, Volume2, VolumeX, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- 3D ASSETS (VAIKUNTHA GATES) ---

function SacredLotus({ position, scale, color }: any) {
  const petals = useMemo(() => new Array(12).fill(0).map((_, i) => ({ rotation: [Math.PI / 3, 0, (i * Math.PI * 2) / 12] })), []);
  return (
    <group position={position} scale={scale}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {petals.map((p, i) => (
          <mesh key={`outer-${i}`} rotation={p.rotation as any}>
            <sphereGeometry args={[0.8, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
            <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.1} transmission={0.6} thickness={2} />
          </mesh>
        ))}
        <pointLight intensity={2} color="#FFD700" distance={5} />
      </Float>
    </group>
  );
}

function DivineGate({ isOpen }: { isOpen: boolean }) {
  const leftGroup = useRef<THREE.Group>(null);
  const rightGroup = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const targetRot = isOpen ? Math.PI / 2.2 : 0;
    if (leftGroup.current && rightGroup.current) {
      leftGroup.current.rotation.y = THREE.MathUtils.lerp(leftGroup.current.rotation.y, -targetRot, delta * 0.5);
      rightGroup.current.rotation.y = THREE.MathUtils.lerp(rightGroup.current.rotation.y, targetRot, delta * 0.5);
    }
  });

  const goldMaterial = new THREE.MeshStandardMaterial({ color: "#C5A059", roughness: 0.3, metalness: 1 });

  const GatePanel = () => (
    <mesh material={goldMaterial} castShadow receiveShadow>
       <boxGeometry args={[6, 16, 0.5]} />
    </mesh>
  );

  return (
    <group position={[0, 0, -5]}>
      <group ref={leftGroup} position={[-3, 0, 0]}><group position={[3, 0, 0]}><GatePanel /></group></group>
      <group ref={rightGroup} position={[3, 0, 0]}><group position={[-3, 0, 0]}><GatePanel /></group></group>
      <mesh position={[0, 0, -2]}>
        <circleGeometry args={[isOpen ? 12 : 0, 64]} />
        <meshBasicMaterial color="#fff" side={THREE.DoubleSide} transparent opacity={isOpen ? 0.8 : 0} />
      </mesh>
      <pointLight position={[0, 0, -4]} intensity={isOpen ? 20 : 0} color="#ffaa00" distance={20} />
    </group>
  );
}

function SceneController({ isOpen }: { isOpen: boolean }) {
  useFrame((state, delta) => {
    const targetZ = isOpen ? -8 : 12;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, isOpen ? 2 * delta : 0.5 * delta);
    state.camera.lookAt(0, 0, -10);
  });

  return (
    <>
      <ambientLight intensity={0.2} color="#ffd700" />
      <spotLight position={[10, 20, 10]} intensity={2} color="#ffebd6" />
      <Cloud opacity={0.5} speed={0.2} width={20} depth={10} segments={40} position={[0, -5, -5]} color="#fff0d6" />
      <Sparkles count={300} scale={12} size={3} speed={0.2} opacity={0.6} color="#FFD700" />
      <group position={[0, -2, -15]}><SacredLotus scale={2} color="#fff" /></group>
      <Environment preset="sunset" />
    </>
  );
}

// --- MAIN COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  
  // Settings
  const [language, setLanguage] = useState<'en' | 'hi'>('en'); // 'en' for English, 'hi' for Hindi
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Namaste. I am here. Speak your heart." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const enterSanctum = () => {
    setHasStarted(true);
    setTimeout(() => setShowUI(true), 2500);
  };

  // --- VOICE ENGINE (ROBUST FIX) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        // 1. Kill any existing instance first
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        // 2. Create new instance
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        // 3. Set Language Explicitly
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US'; 
        console.log("Voice Language set to:", recognition.lang);

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (event.results[event.results.length - 1].isFinal) {
            setInput(transcript);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]); // This dependency ensures it re-runs when 'language' changes

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Browser does not support voice.");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    }
  };

  const playAudio = (base64Audio: string) => {
    if (!isAudioEnabled) return;
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioPlayerRef.current = audio;
      audio.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
    } catch (e) { console.error("Audio error", e); }
  };

  // --- API CONNECTION (CONNECTED TO RENDER) ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      // ✅ CORRECT RENDER BACKEND URL
      const res = await fetch("https://krishna-ai-temple.onrender.com/chat", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        // Sending Language to Backend so it knows which voice to generate
        body: JSON.stringify({ text, language }), 
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      if (data.audio) playAudio(data.audio);
    } catch (e) { 
        console.error(e);
        setMessages(prev => [...prev, { role: "ai", text: "Peace. Connection faint." }]); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050301] relative overflow-hidden">
      
      {/* 🌌 3D BACKGROUND */}
      <div className={`absolute inset-0 transition-all duration-[2000ms] ${showUI ? 'opacity-40 blur-sm' : 'opacity-100 blur-none'}`}>
        <Canvas shadows camera={{ position: [0, 0, 12], fov: 50 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
          <Suspense fallback={null}>
            <DivineGate isOpen={hasStarted} />
            <SceneController isOpen={hasStarted} />
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} intensity={1.5} />
              <Vignette eskil={false} offset={0.1} darkness={1.1} />
              <Noise opacity={0.02} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>

      {/* 🌟 ENTRANCE SCREEN */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="text-center space-y-8">
              <h1 className="text-6xl md:text-8xl font-serif text-[#FFD700] tracking-widest drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]" style={{ fontFamily: 'Cinzel, serif' }}>
                VAIKUNTHA
              </h1>
              <button onClick={enterSanctum} className="px-12 py-5 border border-[#FFD700]/50 text-[#FFD700] uppercase tracking-[0.3em] font-bold hover:bg-[#FFD700]/10 transition-all">
                Enter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 CHAT UI */}
      {showUI && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="absolute inset-0 z-50 flex flex-col font-sans">
            
            {/* HEADER CONTROLS */}
            <header className="flex-none p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <span className="text-[#FFD700] font-bold tracking-widest">KRISHNA AI</span>
                </div>
                
                <div className="flex gap-3">
                   {/* Language Toggle */}
                   <button 
                     onClick={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
                     className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#FFD700] text-xs font-bold uppercase hover:bg-white/20 transition-all"
                   >
                     <Languages size={14} />
                     {language === 'en' ? "English" : "हिंदी"}
                   </button>
                   
                   {/* Audio Toggle */}
                   <button onClick={() => setIsAudioEnabled(!isAudioEnabled)} className="p-2 rounded-full text-[#FFD700] hover:bg-white/10">
                     {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                   </button>
                </div>
            </header>

            {/* MESSAGES */}
            <main className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                {mode === 'reflection' ? (
                    <div className="max-w-2xl mx-auto space-y-6 pb-24">
                        {messages.map((m, i) => (
                            <motion.div 
                                key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] px-6 py-4 text-lg leading-relaxed backdrop-blur-xl border border-white/10 ${
                                    m.role === 'user' 
                                        ? 'bg-[#FFD700]/80 text-black rounded-2xl rounded-br-none shadow-lg font-medium' 
                                        : 'bg-black/40 text-[#FFD700] rounded-2xl rounded-bl-none font-serif text-xl shadow-inner'
                                }`}>
                                    {m.text}
                                </div>
                            </motion.div>
                        ))}
                        {loading && <div className="text-center text-[#FFD700]/50 animate-pulse text-xs tracking-widest uppercase">Divining...</div>}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-[#FFD700] text-6xl font-serif">
                       {japaCount}
                    </div>
                )}
            </main>

            {/* INPUT BAR (Fixed at bottom) */}
            {mode === 'reflection' && (
                <div className="p-4 max-w-2xl mx-auto w-full">
                    <div className="bg-black/60 backdrop-blur-xl border border-[#FFD700]/30 rounded-full flex items-center gap-2 p-2 shadow-2xl">
                        
                        {/* MIC BUTTON */}
                        <button 
                          onClick={toggleMic}
                          className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-[#FFD700] hover:bg-white/10'}`}
                        >
                           {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>

                        <input 
                            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-white/30 focus:ring-0 font-serif px-2"
                            placeholder={language === 'en' ? "Ask Krishna..." : "कृष्णा से पूछें..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        
                        {/* SEND BUTTON */}
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