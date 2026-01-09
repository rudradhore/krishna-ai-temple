"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Sun, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ASSETS: 3D GATE TEXTURE ---
// Complex CSS gradients to simulate ancient, heavy gold/bronze gates
const GatePanel = ({ side }: { side: 'left' | 'right' }) => (
  <div className={`relative w-full h-full bg-[#0f0b05] overflow-hidden border-${side === 'left' ? 'r' : 'l'} border-[#2a1d0d] shadow-2xl`}>
    {/* Base Metal Texture (Dark Bronze/Gold) */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#4a3b22] via-[#2a1d0d] to-[#0f0b05]" />
    <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

    {/* The Frame (Bevel) */}
    <div className="absolute inset-2 md:inset-6 border-[2px] border-[#d4af37]/30 rounded-t-full opacity-50" />
    <div className="absolute inset-4 md:inset-8 border border-[#d4af37]/10 rounded-t-full opacity-30" />

    {/* The Carvings (Mandala Pattern) */}
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 opacity-10 mix-blend-overlay">
       <Mandala className="w-96 h-96 text-[#d4af37] animate-[spin_120s_linear_infinite]" />
    </div>

    {/* Center Handle Area */}
    <div className={`absolute top-1/2 ${side === 'left' ? 'right-0' : 'left-0'} -translate-y-1/2 flex items-center`}>
       {/* The "Lock" Plate */}
       <div className={`w-12 md:w-20 h-32 md:h-48 bg-[#1a1205] border-y border-${side === 'left' ? 'l' : 'r'} border-[#d4af37]/40 ${side === 'left' ? 'rounded-l-lg' : 'rounded-r-lg'} shadow-[inset_0_0_20px_black]`} />
       
       {/* The Ring Handle */}
       <div className={`absolute ${side === 'left' ? 'right-4 md:right-8' : 'left-4 md:left-8'} w-4 h-4 rounded-full bg-[#d4af37] shadow-[0_0_15px_#d4af37]`} />
    </div>

    {/* Vertical Shine (Metal Reflection) */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent transform skew-x-12 translate-x-[-100%] animate-[shine_10s_infinite]" />
  </div>
);

// --- SACRED GEOMETRY ---
const Mandala = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="45" strokeWidth="0.5" />
    <path d="M50 5 L50 95 M5 50 L95 50" strokeWidth="0.2" />
    <path d="M18 18 L82 82 M82 18 L18 82" strokeWidth="0.2" />
    <circle cx="50" cy="50" r="25" strokeWidth="0.5" strokeDasharray="1 3" />
    <rect x="36" y="36" width="28" height="28" transform="rotate(45 50 50)" strokeWidth="0.2" />
  </svg>
);

// --- MAIN COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Welcome to the eternal. I am here." }
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

  // --- ENTRANCE SEQUENCE ---
  const handleEnter = () => {
    setIsEntering(true);
    // 1. Gates rumble (0s)
    // 2. Gates open slow (0.5s)
    // 3. Flash of light (2.5s)
    setTimeout(() => {
      setHasStarted(true);
    }, 2800); 
  };

  // --- LOGIC (Simplified) ---
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

  // --- RENDER: THE GRAND GATES ---
  if (!hasStarted) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden relative flex items-center justify-center bg-[#050301] perspective-[1500px]">
        
        {/* The Divine Light (Behind Doors) */}
        <div className={`absolute inset-0 bg-white transition-all duration-[2000ms] ease-in ${isEntering ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}`} style={{ transitionDelay: '0.5s' }} />
        
        {/* Left Gate */}
        <motion.div 
          initial={{ x: 0, rotateY: 0 }}
          animate={isEntering ? { x: "-60%", rotateY: 15, opacity: 0 } : { x: 0, rotateY: 0, opacity: 1 }}
          transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-0 w-1/2 h-full z-40 origin-left shadow-[20px_0_50px_black]"
        >
          <GatePanel side="left" />
        </motion.div>

        {/* Right Gate */}
        <motion.div 
          initial={{ x: 0, rotateY: 0 }}
          animate={isEntering ? { x: "60%", rotateY: -15, opacity: 0 } : { x: 0, rotateY: 0, opacity: 1 }}
          transition={{ duration: 3.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-0 top-0 w-1/2 h-full z-40 origin-right shadow-[-20px_0_50px_black]"
        >
          <GatePanel side="right" />
        </motion.div>

        {/* Center CTA */}
        {!isEntering && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-50 flex flex-col items-center gap-8"
          >
            <div className="text-center space-y-2 mix-blend-difference">
               <h1 className="text-6xl md:text-8xl font-bold text-[#d4af37] tracking-widest drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]" style={{ fontFamily: 'Cinzel, serif' }}>
                 TEMPLE
               </h1>
               <p className="text-[#d4af37]/60 tracking-[0.5em] text-xs uppercase">Of The Eternal</p>
            </div>
            
            <button 
              onClick={handleEnter}
              className="group relative px-12 py-5 bg-transparent border border-[#d4af37]/40 text-[#d4af37] tracking-[0.3em] uppercase text-xs font-bold transition-all hover:bg-[#d4af37] hover:text-[#0f0b05] hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            >
              <span className="relative z-10">Enter Sanctum</span>
              <div className="absolute inset-0 bg-[#d4af37] opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // --- RENDER: THE INNER SANCTUM ---
  return (
    <motion.div 
       initial={{ opacity: 0 }} 
       animate={{ opacity: 1 }} 
       transition={{ duration: 2 }}
       className="h-[100dvh] w-full bg-[#f4f1ea] dark:bg-[#080808] flex flex-col font-sans relative transition-colors duration-1000"
    >
       {/* 🌟 ATMOSPHERE: God Rays & Dust */}
       <div className="god-rays opacity-20 dark:opacity-10 mix-blend-screen pointer-events-none" />
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse pointer-events-none" />

       {/* HEADER */}
       <header className="flex-none z-20 px-6 py-5 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 border border-[#d4af37] rounded-full flex items-center justify-center">
                <Sparkles size={18} className="text-[#d4af37]" />
             </div>
             <span className="text-sm font-bold tracking-[0.2em] text-[#d4af37]" style={{ fontFamily: 'Cinzel, serif' }}>KRISHNA</span>
          </div>

          <div className="flex gap-4">
             <button onClick={toggleTheme} className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#d4af37] transition-colors border border-[#d4af37]/20">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <div className="flex bg-black/5 dark:bg-white/5 rounded-full p-1 border border-[#d4af37]/20">
               <button onClick={() => setMode('reflection')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'reflection' ? 'bg-[#d4af37] text-white shadow-lg' : 'text-gray-500'}`}>Chat</button>
               <button onClick={() => setMode('mantra')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === 'mantra' ? 'bg-[#d4af37] text-white shadow-lg' : 'text-gray-500'}`}>Chant</button>
             </div>
          </div>
       </header>

       {/* CONTENT */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth px-4">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div 
               key="chat" 
               initial={{opacity:0, y: 30}} 
               animate={{opacity:1, y: 0}} 
               className="max-w-4xl mx-auto mt-8 flex flex-col min-h-[70vh]"
             >
               <div className="flex-1 space-y-10 pb-8">
                 {messages.map((m, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6 }}
                     className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-center'}`}
                   >
                     <div className={`max-w-[85%] px-8 py-6 text-lg leading-relaxed ${
                       m.role === 'user' 
                         ? 'bg-white dark:bg-[#1a1a1a] shadow-xl rounded-2xl text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 font-sans' 
                         : 'text-center text-[#d4af37] font-serif text-xl md:text-2xl drop-shadow-sm'
                     }`}>
                       {m.text}
                     </div>
                   </motion.div>
                 ))}
                 {loading && <div className="text-center text-[#d4af37]/50 animate-pulse text-sm tracking-widest uppercase">Divining...</div>}
                 <div ref={messagesEndRef} />
               </div>
               
               {/* INPUT */}
               <div className="sticky bottom-6 max-w-2xl mx-auto w-full">
                 <div className="bg-white/80 dark:bg-[#151515]/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-full flex items-center gap-2 shadow-2xl p-2 pl-6">
                   <input 
                     className="flex-1 bg-transparent border-none text-lg text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:ring-0 font-serif"
                     placeholder="Ask the divine..."
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                   />
                   <button onClick={sendMessage} disabled={loading} className="p-4 bg-[#d4af37] rounded-full text-white hover:scale-110 transition-transform shadow-lg">
                     <Send size={20} />
                   </button>
                 </div>
               </div>
             </motion.div>
           ) : (
             <motion.div key="mantra" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-16">
                <div className="relative group cursor-pointer" onClick={toggleMic}>
                   {/* The Glowing Ring */}
                   <div className="absolute inset-0 border-2 border-[#d4af37]/20 rounded-full scale-125 animate-[spin_30s_linear_infinite]" />
                   <div className="absolute inset-0 border border-[#d4af37]/40 rounded-full scale-110 animate-[spin_20s_linear_infinite_reverse]" />
                   
                   {/* The Orb */}
                   <div className={`relative z-10 w-72 h-72 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-[#d4af37] shadow-[0_0_60px_#d4af37]' : 'bg-[#1a1a1a] border border-[#d4af37] shadow-2xl'}`}>
                      <span className={`font-serif text-8xl transition-colors duration-300 ${isListening ? 'text-[#1a1a1a]' : 'text-[#d4af37]'}`} style={{ fontFamily: 'Cinzel, serif' }}>{japaCount}</span>
                   </div>
                </div>
                
                <p className="text-[#d4af37] tracking-[0.3em] uppercase text-xs animate-pulse">
                  {isListening ? "Listening..." : "Tap Orb to Chant"}
                </p>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
    </motion.div>
  );
}