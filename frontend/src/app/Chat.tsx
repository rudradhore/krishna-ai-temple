"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Sun, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- VISUAL ASSETS: THE DOOR TEXTURE ---
// We use CSS gradients to simulate heavy gold metal with depth
const DoorPanel = ({ side }: { side: 'left' | 'right' }) => (
  <div className={`relative w-full h-full bg-[#1a160e] overflow-hidden border-${side === 'left' ? 'r' : 'l'} border-[#4a3b22]`}>
    {/* Base Metal Texture */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37] via-[#996515] to-[#422e0f] opacity-100" />
    
    {/* Noise Texture for Realism */}
    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

    {/* Inner Bevel (The Frame) */}
    <div className="absolute inset-4 border-[12px] border-[#d4af37]/40 border-t-[#ffe57f]/60 border-b-[#422e0f]/80 rounded-lg shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />

    {/* The Middle Carvings */}
    <div className="absolute inset-[15%] flex flex-col justify-between py-10 items-center opacity-30 mix-blend-overlay">
       <Mandala className="w-64 h-64 text-[#3e2706]" />
       <Mandala className="w-64 h-64 text-[#3e2706]" />
    </div>

    {/* The Handle Area */}
    <div className={`absolute top-1/2 ${side === 'left' ? 'right-8' : 'left-8'} -translate-y-1/2`}>
      <div className="w-6 h-32 bg-[#2a1d0d] rounded-full blur-md opacity-50 absolute top-2 left-2" /> {/* Shadow */}
      <div className="w-4 h-32 bg-gradient-to-r from-[#ffe57f] via-[#d4af37] to-[#805b10] rounded-full shadow-2xl flex flex-col items-center justify-center border border-[#422e0f]">
         <div className="w-16 h-16 rounded-full border-4 border-[#d4af37] absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 bg-[#1a1205] shadow-[inset_0_0_10px_black] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ffe57f] to-[#996515]" />
         </div>
      </div>
    </div>
    
    {/* Vertical sheen (Lighting) */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffe57f]/10 to-transparent transform skew-x-12 translate-x-[-100%] animate-[shine_8s_infinite]" />
  </div>
);

// --- SACRED GEOMETRY (THE MANDALA) ---
const Mandala = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="1" />
    <path d="M50 5 L50 95 M5 50 L95 50" strokeWidth="0.5" />
    <path d="M18 18 L82 82 M82 18 L18 82" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="25" strokeWidth="1" strokeDasharray="2 2" />
    <rect x="35" y="35" width="30" height="30" transform="rotate(45 50 50)" strokeWidth="0.5" />
  </svg>
);

// --- MAIN COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic
  const [messages, setMessages] = useState([
    { role: "ai", text: "Welcome, seeker. The inner sanctum is open." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  
  // Audio/Mic
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true);
  const [isListening, setIsListening] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSentenceCountRef = useRef(0);

  // --- THEME INIT ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    const savedCount = localStorage.getItem("japa_count");
    if (savedCount) setJapaCount(parseInt(savedCount));
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // --- HEAVY ENTRANCE SEQUENCE ---
  const handleEnter = () => {
    setIsEntering(true);
    // Timing: Rumble first, then open
    setTimeout(() => {
      setHasStarted(true);
    }, 2500); 
  };

  // --- LOGIC HELPERS ---
  const holyPatterns = ["krishna", "krsna", "ram", "rama", "hare", "hari", "govinda", "om"];
  const countNamesInString = (text: string) => {
    const lowerText = text.toLowerCase();
    const pattern = new RegExp(holyPatterns.join("|"), "g");
    const matches = lowerText.match(pattern);
    return matches ? matches.length : 0;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = mode === 'mantra';
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.onstart = () => { setIsListening(true); currentSentenceCountRef.current = 0; };
        recognition.onend = () => {
          if (mode === 'mantra' && isListening) try { recognition.start(); } catch (e) { setIsListening(false); }
          else setIsListening(false);
          currentSentenceCountRef.current = 0;
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (mode === 'reflection') {
            if (event.results[event.results.length - 1].isFinal) setInput(transcript);
          } else {
            const total = countNamesInString(transcript);
            const newNames = total - currentSentenceCountRef.current;
            if (newNames > 0) {
              setJapaCount(prev => {
                const newVal = prev + newNames;
                localStorage.setItem("japa_count", String(newVal));
                return newVal;
              });
              currentSentenceCountRef.current = total;
            }
            if (event.results[event.results.length - 1].isFinal) currentSentenceCountRef.current = 0;
          }
        };
        recognitionRef.current = recognition;
      }
    }
  }, [mode]);

  const toggleMic = () => {
    if (audioPlayerRef.current) audioPlayerRef.current.play().catch(() => {});
    if (!recognitionRef.current) return alert("Voice not supported.");
    if (isListening) { setIsListening(false); recognitionRef.current.stop(); }
    else { setIsListening(true); try { recognitionRef.current.start(); } catch (e) {} }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("https://krishna-ai-temple.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      if (data.audio && isAudioEnabledRef.current) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioPlayerRef.current = audio;
        audio.play().catch(e => console.error(e));
      }
    } catch (e) { setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]); }
    finally { setLoading(false); }
  };

  // --- RENDER: THE GOLDEN GATES ---
  if (!hasStarted) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden relative flex items-center justify-center bg-black perspective-[1000px]">
        {/* Background Glow (Visible through crack) */}
        <div className={`absolute inset-0 bg-sanctuary-gold transition-opacity duration-[3000ms] ${isEntering ? 'opacity-100' : 'opacity-0'}`} />

        {/* LEFT DOOR */}
        <motion.div 
          initial={{ x: 0, rotateY: 0 }}
          animate={isEntering ? { x: "-95%", rotateY: 10 } : { x: 0, rotateY: 0 }}
          transition={{ duration: 3, ease: [0.4, 0, 0.2, 1], delay: 0.5 }} // Heavy Ease
          className="absolute left-0 top-0 w-1/2 h-full z-50 origin-left shadow-[10px_0_50px_rgba(0,0,0,0.8)]"
        >
          <DoorPanel side="left" />
        </motion.div>

        {/* RIGHT DOOR */}
        <motion.div 
          initial={{ x: 0, rotateY: 0 }}
          animate={isEntering ? { x: "95%", rotateY: -10 } : { x: 0, rotateY: 0 }}
          transition={{ duration: 3, ease: [0.4, 0, 0.2, 1], delay: 0.5 }} // Heavy Ease
          className="absolute right-0 top-0 w-1/2 h-full z-50 origin-right shadow-[-10px_0_50px_rgba(0,0,0,0.8)]"
        >
          <DoorPanel side="right" />
        </motion.div>

        {/* CENTER CRACK GLOW */}
        <motion.div 
            animate={isEntering ? { opacity: 1, scaleX: 10 } : { opacity: 0.5, scaleX: 1 }}
            className="absolute top-0 bottom-0 left-1/2 w-1 -translate-x-1/2 bg-white blur-xl z-40 transition-all duration-[2000ms]"
        />

        {/* CENTER CTA */}
        {!isEntering && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-[60] flex flex-col items-center gap-8 p-12 bg-black/40 backdrop-blur-md rounded-full border border-sanctuary-gold/30 shadow-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-serif text-[#ffe57f] tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Cinzel, serif' }}>
              DWARKA
            </h1>
            <p className="text-sanctuary-gold/80 uppercase tracking-[0.4em] text-xs">The Eternal Gateway</p>
            <button 
              onClick={handleEnter}
              className="px-12 py-4 bg-gradient-to-r from-[#996515] to-[#d4af37] text-[#2a1d0d] hover:brightness-110 transition-all duration-500 rounded-sm tracking-[0.3em] uppercase text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#ffe57f]/50"
            >
              Open Gates
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // --- RENDER: SANCTUM ---
  return (
    <div className="h-[100dvh] w-full bg-[#f4f1ea] dark:bg-[#050505] flex flex-col font-sans relative transition-colors duration-1000 overflow-hidden">
       
       {/* 🌟 GOD RAYS & ATMOSPHERE */}
       <div className="god-rays opacity-40 dark:opacity-20 mix-blend-soft-light" />
       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-sanctuary-gold/5 pointer-events-none" />
       
       {/* 🌀 MANDALA BACKGROUND */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 dark:opacity-10">
          <Mandala className="w-[120vh] h-[120vh] text-sanctuary-gold animate-[spin_180s_linear_infinite]" />
       </div>

       {/* HEADER */}
       <header className="flex-none z-20 px-6 py-5 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-3 bg-white/40 dark:bg-black/40 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 shadow-sm">
            <Sparkles size={16} className="text-sanctuary-gold" />
            <span className="text-sm font-bold tracking-widest text-sanctuary-charcoal dark:text-sanctuary-starlight" style={{ fontFamily: 'Cinzel, serif' }}>KRISHNA AI</span>
          </div>

          <div className="flex gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl text-sanctuary-charcoal dark:text-sanctuary-gold hover:bg-white/60 transition-all border border-white/10">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10">
               <button onClick={() => setMode('reflection')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-sanctuary-gold text-[#2a1d0d] shadow-lg' : 'text-sanctuary-charcoal/60 dark:text-white/60'}`}>Chat</button>
               <button onClick={() => setMode('mantra')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-sanctuary-gold text-[#2a1d0d] shadow-lg' : 'text-sanctuary-charcoal/60 dark:text-white/60'}`}>Chant</button>
            </div>
          </div>
       </header>

       {/* CONTENT: THE ALTAR */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth px-4 pb-4">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div 
               key="chat" 
               initial={{opacity:0, y: 20}} 
               animate={{opacity:1, y: 0}} 
               exit={{opacity:0, scale: 0.95}} 
               className="max-w-4xl mx-auto mt-2 h-[80vh] flex flex-col"
             >
               {/* Messages Container - The Scroll */}
               <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar mask-image-gradient">
                 {messages.map((m, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div className={`max-w-[85%] px-8 py-6 rounded-3xl relative overflow-hidden ${
                       m.role === 'user' 
                         ? 'bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-[#2a1d0d] shadow-lg rounded-br-none font-medium' 
                         : 'bg-white/60 dark:bg-[#151515]/80 backdrop-blur-md text-sanctuary-charcoal dark:text-sanctuary-starlight font-serif text-lg leading-relaxed shadow-sm border border-sanctuary-gold/20'
                     }`}>
                       {/* Subtle texture overlay for messages */}
                       <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
                       <span className="relative z-10">{m.text}</span>
                     </div>
                   </motion.div>
                 ))}
                 {loading && <div className="text-center text-sanctuary-gold animate-pulse text-xs tracking-widest uppercase font-bold">The Divine Listens...</div>}
                 <div ref={messagesEndRef} />
               </div>
               
               {/* INPUT AREA */}
               <div className="mt-4 p-2 bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full flex items-center gap-2 shadow-2xl">
                 <input 
                   className="flex-1 bg-transparent border-none text-lg px-6 text-sanctuary-charcoal dark:text-white placeholder:text-sanctuary-charcoal/40 focus:ring-0 font-serif"
                   placeholder="Ask, and it shall be given..."
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                 />
                 <button onClick={sendMessage} disabled={loading} className="p-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full text-[#2a1d0d] hover:scale-105 active:scale-95 transition-all shadow-lg">
                   <Send size={20} />
                 </button>
               </div>
             </motion.div>
           ) : (
             <motion.div key="mantra" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col items-center justify-center space-y-16">
                <div className="relative z-10 group cursor-pointer" onClick={toggleMic}>
                   {/* The Glowing Aura */}
                   <div className={`absolute inset-0 bg-sanctuary-gold/20 rounded-full blur-3xl transition-all duration-1000 ${isListening ? 'scale-150 opacity-100' : 'scale-50 opacity-0'}`} />
                   
                   {/* The Orb */}
                   <div className={`w-80 h-80 rounded-full border border-sanctuary-gold/30 flex items-center justify-center relative backdrop-blur-sm bg-gradient-to-b from-white/10 to-transparent shadow-2xl transition-all duration-500 ${isListening ? 'scale-105 border-sanctuary-gold' : ''}`}>
                      <Mandala className={`absolute inset-0 w-full h-full text-sanctuary-gold opacity-40 transition-all duration-[2000ms] ${isListening ? 'animate-[spin_20s_linear_infinite]' : 'animate-none'}`} />
                      <span className="font-serif text-9xl text-sanctuary-gold drop-shadow-[0_2px_10px_rgba(212,175,55,0.5)] z-10" style={{ fontFamily: 'Cinzel, serif' }}>{japaCount}</span>
                   </div>
                </div>
                
                <div className="text-center space-y-4">
                  <p className="text-sanctuary-gold uppercase tracking-[0.4em] text-xs font-bold animate-pulse">
                    {isListening ? "Chanting in Progress..." : "Touch the Orb to Begin"}
                  </p>
                  <p className="text-xs text-sanctuary-charcoal/40 dark:text-white/30 font-serif italic">
                    "Hare Krishna, Hare Krishna..."
                  </p>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
    </div>
  );
}