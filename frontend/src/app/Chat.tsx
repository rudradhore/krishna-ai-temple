"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Sun, Moon, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ASSETS: 3D BOOK COMPONENTS ---

const GoldText = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h1 className={`font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#ffe57f] via-[#d4af37] to-[#805b10] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${className}`} style={{ fontFamily: 'Cinzel, serif' }}>
    {children}
  </h1>
);

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
  const [stage, setStage] = useState<'closed' | 'opening' | 'open'>('closed');
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic
  const [messages, setMessages] = useState([
    { role: "ai", text: "I am the taste of water, the light of the sun and the moon, the syllable Om in the Vedic mantras. Ask, Arjuna." }
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

  // --- BOOK OPENING SEQUENCE ---
  const handleOpenBook = () => {
    setStage('opening');
    // 1.5s for cover to open, then 1s to zoom in
    setTimeout(() => {
      setStage('open');
    }, 2000); 
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

  // --- RENDER: THE 3D BOOK (CLOSED/OPENING) ---
  if (stage !== 'open') {
    return (
      <div className="h-[100dvh] w-full bg-[#120a0a] flex items-center justify-center overflow-hidden perspective-[2000px]">
        
        {/* Ambient Light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ffae00]/10 via-transparent to-black" />

        {/* THE BOOK WRAPPER */}
        <motion.div 
          className="relative w-[300px] h-[450px] md:w-[400px] md:h-[600px] preserve-3d cursor-pointer"
          onClick={stage === 'closed' ? handleOpenBook : undefined}
          initial={{ rotateY: 0, rotateX: 10, scale: 0.9 }}
          animate={stage === 'opening' 
            ? { rotateY: 0, rotateX: 0, scale: 3, x: 100 } // Zoom into the book
            : { rotateY: -15, rotateX: 10, scale: 1 }      // Hover state
          }
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* --- BACK COVER (Static Base) --- */}
          <div className="absolute inset-0 bg-[#3d0e0e] rounded-r-lg shadow-2xl border-l-[20px] border-[#2a0505]" 
               style={{ transform: 'translateZ(-40px)' }} />

          {/* --- PAGES (The Block) --- */}
          <div className="absolute inset-0 right-2 top-2 bottom-2 bg-[#f4f1ea] rounded-r-sm shadow-inner border-l-[18px] border-[#e6e2d6]" 
               style={{ transform: 'translateZ(-20px)', width: '98%' }}>
               {/* Page Texture (Lines) */}
               <div className="absolute right-0 top-0 bottom-0 w-8 bg-[repeating-linear-gradient(90deg,#e6e2d6,#e6e2d6_1px,transparent_1px,transparent_4px)] opacity-50" />
               
               {/* INNER CONTENT REVEAL (Pre-load) */}
               <div className="absolute inset-0 p-12 flex flex-col items-center justify-center opacity-0 animate-[fadeIn_2s_delay-1s_forwards]">
                  <div className="w-full h-full border border-[#d4af37]/30 p-4">
                     <h2 className="text-[#2a0505] font-serif text-center mt-20">Chapter 1</h2>
                  </div>
               </div>
          </div>

          {/* --- FRONT COVER (The Moving Part) --- */}
          <motion.div 
            className="absolute inset-0 origin-left preserve-3d"
            style={{ transformStyle: 'preserve-3d' }}
            animate={stage === 'opening' ? { rotateY: -160 } : { rotateY: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          >
            {/* FRONT FACE (Outer Cover) */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#5c0e0e] to-[#2e0404] rounded-r-lg border-l-[20px] border-[#2a0505] shadow-2xl flex flex-col items-center justify-between p-8 overflow-hidden">
               {/* Leather Texture */}
               <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')]" />
               
               {/* Gold Border */}
               <div className="absolute inset-4 border-2 border-[#d4af37] rounded-sm opacity-70" />
               <div className="absolute inset-6 border border-[#d4af37] rounded-sm opacity-40" />

               {/* Corner Ornaments */}
               <Mandala className="absolute top-8 left-8 w-16 h-16 text-[#d4af37] opacity-60" />
               <Mandala className="absolute bottom-8 right-8 w-16 h-16 text-[#d4af37] opacity-60" />

               {/* Center Title */}
               <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-10">
                  <GoldText className="text-4xl md:text-6xl text-center leading-tight">
                     BHAGAVAD<br/>GITA
                  </GoldText>
                  <div className="w-32 h-32 rounded-full border-2 border-[#d4af37]/50 flex items-center justify-center">
                     <Sun className="w-20 h-20 text-[#ffe57f] animate-[spin_60s_linear_infinite]" />
                  </div>
                  <p className="text-[#d4af37] tracking-[0.4em] text-xs font-serif mt-4">THE DIVINE SONG</p>
               </div>

               {/* Shine Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>

            {/* BACK FACE (Inside Cover) */}
            <div className="absolute inset-0 backface-hidden bg-[#2a0505] rotate-y-180 rounded-l-lg border-r-[20px] border-[#1a0202]" 
                 style={{ transform: 'rotateY(180deg)' }}>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
               <div className="absolute bottom-10 left-10 text-[#d4af37]/40 font-serif text-sm">
                  Library of the Soul
               </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Helper Text */}
        {stage === 'closed' && (
           <motion.p 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ delay: 1 }}
             className="absolute bottom-12 text-[#d4af37]/60 tracking-[0.2em] text-xs uppercase animate-pulse"
           >
             Tap to Open Wisdom
           </motion.p>
        )}
      </div>
    );
  }

  // --- RENDER: OPENED BOOK (THE APP INTERFACE) ---
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1 }}
      className="h-[100dvh] w-full bg-[#f4f1ea] dark:bg-[#0c0c0c] flex flex-col font-sans relative transition-colors duration-1000"
    >
       {/* 🌟 PAPER TEXTURE OVERLAY */}
       <div className="absolute inset-0 opacity-40 dark:opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
       <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 via-transparent to-transparent pointer-events-none" />

       {/* HEADER */}
       <header className="flex-none z-20 px-6 py-4 flex justify-between items-center border-b border-[#d4af37]/20">
          <div className="flex items-center gap-3">
             <BookOpen className="text-sanctuary-gold w-6 h-6" />
             <GoldText className="text-xl font-bold tracking-widest">GITA AI</GoldText>
          </div>

          <div className="flex gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#5c0e0e] dark:text-[#d4af37] transition-colors">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex bg-[#e6e2d6] dark:bg-[#1f1f1f] rounded-full p-1 border border-[#d4af37]/20">
               <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-[#5c0e0e] text-[#ffe57f] shadow-lg' : 'text-gray-500'}`}>Read</button>
               <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-[#5c0e0e] text-[#ffe57f] shadow-lg' : 'text-gray-500'}`}>Chant</button>
            </div>
          </div>
       </header>

       {/* CONTENT: THE PAGE */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth px-2 md:px-0">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div 
               key="chat" 
               initial={{opacity:0, y: 20}} 
               animate={{opacity:1, y: 0}} 
               className="max-w-3xl mx-auto mt-4 min-h-[80vh] flex flex-col"
             >
               {/* The Scroll Container */}
               <div className="flex-1 space-y-6 p-4 md:p-8">
                 {messages.map((m, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div className={`max-w-[85%] px-6 py-4 rounded-xl relative ${
                       m.role === 'user' 
                         ? 'bg-[#5c0e0e] text-[#ffe57f] font-sans shadow-md rounded-br-none' 
                         : 'bg-transparent border-l-4 border-[#d4af37] pl-6 text-[#2a0505] dark:text-[#ffe57f] font-serif text-lg leading-relaxed'
                     }`}>
                       {m.text}
                     </div>
                   </motion.div>
                 ))}
                 {loading && <div className="pl-6 text-[#d4af37] font-serif italic text-sm animate-pulse">Turning pages...</div>}
                 <div ref={messagesEndRef} />
               </div>
               
               {/* INPUT */}
               <div className="p-4 md:p-6 sticky bottom-0 bg-gradient-to-t from-[#f4f1ea] dark:from-[#0c0c0c] to-transparent">
                 <div className="bg-white dark:bg-[#1a1a1a] border border-[#d4af37]/40 rounded-full flex items-center gap-2 shadow-xl p-2">
                   <input 
                     className="flex-1 bg-transparent border-none text-lg px-6 text-[#2a0505] dark:text-[#ffe57f] placeholder:text-gray-400 focus:ring-0 font-serif"
                     placeholder="Ask Krishna..."
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                   />
                   <button onClick={sendMessage} disabled={loading} className="p-3 bg-[#5c0e0e] rounded-full text-[#ffe57f] hover:scale-105 transition-all shadow-lg">
                     <Send size={20} />
                   </button>
                 </div>
               </div>
             </motion.div>
           ) : (
             <motion.div key="mantra" initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col items-center justify-center space-y-12">
                {/* Japa Counter on Paper */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                   <div className="absolute inset-0 border-[1px] border-[#d4af37] rounded-full opacity-30 animate-[spin_60s_linear_infinite]" />
                   <div className="absolute inset-4 border-[1px] border-[#d4af37] rounded-full opacity-20 animate-[spin_40s_linear_infinite_reverse]" />
                   
                   <div className={`relative z-10 w-64 h-64 rounded-full bg-[#5c0e0e] flex items-center justify-center shadow-2xl transition-transform duration-300 ${isListening ? 'scale-105' : ''}`}>
                      <span className="font-serif text-8xl text-[#ffe57f] drop-shadow-md" style={{ fontFamily: 'Cinzel, serif' }}>{japaCount}</span>
                   </div>
                </div>
                
                <button 
                  onClick={toggleMic}
                  className={`px-10 py-3 rounded-full font-bold tracking-widest uppercase transition-all shadow-lg ${
                    isListening 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-[#d4af37] text-[#2a0505] hover:bg-[#ffe57f]'
                  }`}
                >
                  {isListening ? "Listening..." : "Begin Chant"}
                </button>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
    </motion.div>
  );
}