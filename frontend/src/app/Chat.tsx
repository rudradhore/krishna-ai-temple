"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Sun, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- SACRED GEOMETRY (THE MANDALA) ---
const Mandala = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="48" strokeWidth="0.5" opacity="0.3" />
    <circle cx="50" cy="50" r="38" strokeWidth="0.5" opacity="0.2" />
    <path d="M50 2 L50 98 M2 50 L98 50" strokeWidth="0.2" opacity="0.2" />
    <path d="M16 16 L84 84 M84 16 L16 84" strokeWidth="0.2" opacity="0.2" />
    <circle cx="50" cy="50" r="20" strokeWidth="0.5" opacity="0.4" strokeDasharray="1 2" />
  </svg>
);

// --- MAIN COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isEntering, setIsEntering] = useState(false); // For Door Animation
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

  // --- ENTER SEQUENCE ---
  const handleEnter = () => {
    setIsEntering(true);
    setTimeout(() => {
      setHasStarted(true);
    }, 1500); // Wait for doors to open
  };

  // --- LOGIC (Simplified for brevity) ---
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

  // --- RENDER: GOLDEN GATES (ENTRANCE) ---
  if (!hasStarted) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden relative flex items-center justify-center bg-black">
        {/* LEFT DOOR */}
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: isEntering ? "-100%" : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute left-0 top-0 w-1/2 h-full bg-sanctuary-white dark:bg-[#1a1a1a] z-50 border-r-4 border-sanctuary-gold flex items-center justify-end pr-8 shadow-2xl"
        >
          <div className="opacity-20">
             <Mandala className="w-96 h-96 text-sanctuary-gold" />
          </div>
        </motion.div>

        {/* RIGHT DOOR */}
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: isEntering ? "100%" : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute right-0 top-0 w-1/2 h-full bg-sanctuary-white dark:bg-[#1a1a1a] z-50 border-l-4 border-sanctuary-gold flex items-center justify-start pl-8 shadow-2xl"
        >
          <div className="opacity-20">
             <Mandala className="w-96 h-96 text-sanctuary-gold" />
          </div>
        </motion.div>

        {/* CENTER CTA (Visible before doors open) */}
        {!isEntering && (
          <div className="z-[60] flex flex-col items-center gap-8">
            <h1 className="text-6xl md:text-8xl font-serif text-sanctuary-gold tracking-widest drop-shadow-lg" style={{ fontFamily: 'Cinzel, serif' }}>
              TEMPLE
            </h1>
            <button 
              onClick={handleEnter}
              className="px-10 py-4 border border-sanctuary-gold text-sanctuary-gold hover:bg-sanctuary-gold hover:text-white transition-all duration-500 rounded-full tracking-[0.3em] uppercase text-sm font-bold"
            >
              Enter Sanctum
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: HEAVENLY SANCTUM ---
  return (
    <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-[#0a0a0a] flex flex-col font-sans relative transition-colors duration-1000 overflow-hidden">
       
       {/* 🌟 GOD RAYS BACKGROUND */}
       <div className="god-rays" />
       
       {/* 🌀 ROTATING MANDALA BACKGROUND */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 dark:opacity-5">
          <Mandala className="w-[150vh] h-[150vh] text-sanctuary-gold animate-[spin_120s_linear_infinite]" />
       </div>

       {/* HEADER: FLOATING */}
       <header className="flex-none z-20 px-6 py-5 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-3 bg-white/30 dark:bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <Sparkles size={16} className="text-sanctuary-gold" />
            <span className="text-sm font-bold tracking-widest text-sanctuary-charcoal dark:text-sanctuary-starlight" style={{ fontFamily: 'Cinzel, serif' }}>KRISHNA AI</span>
          </div>

          <div className="flex gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md text-sanctuary-charcoal dark:text-sanctuary-gold hover:bg-white/50 transition-all">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-full p-1">
               <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-sanctuary-gold text-white' : 'text-sanctuary-charcoal/60 dark:text-white/60'}`}>Chat</button>
               <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-sanctuary-gold text-white' : 'text-sanctuary-charcoal/60 dark:text-white/60'}`}>Chant</button>
            </div>
          </div>
       </header>

       {/* CONTENT: THE ALTAR */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth px-4">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div 
               key="chat" 
               initial={{opacity:0, scale: 0.95}} 
               animate={{opacity:1, scale: 1}} 
               exit={{opacity:0, scale: 1.05}} 
               className="max-w-4xl mx-auto mt-4 min-h-[60vh] bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl overflow-hidden flex flex-col"
             >
               <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
                 {messages.map((m, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div className={`max-w-[85%] px-8 py-6 rounded-3xl ${
                       m.role === 'user' 
                         ? 'bg-sanctuary-gold text-white shadow-lg rounded-br-none' 
                         : 'bg-white/80 dark:bg-white/5 text-sanctuary-charcoal dark:text-sanctuary-starlight font-serif text-lg leading-relaxed shadow-sm'
                     }`}>
                       {m.text}
                     </div>
                   </motion.div>
                 ))}
                 {loading && <div className="text-center text-sanctuary-gold animate-pulse text-xs tracking-widest uppercase">Divining...</div>}
                 <div ref={messagesEndRef} />
               </div>
               
               {/* INPUT AREA INSIDE THE ALTAR */}
               <div className="p-6 bg-white/20 dark:bg-black/20 border-t border-white/10 flex items-center gap-4">
                 <input 
                   className="flex-1 bg-transparent border-none text-lg px-4 text-sanctuary-charcoal dark:text-white placeholder:text-sanctuary-charcoal/40 focus:ring-0 font-serif"
                   placeholder="Speak to the divine..."
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                 />
                 <button onClick={sendMessage} disabled={loading} className="p-4 bg-sanctuary-charcoal dark:bg-sanctuary-gold rounded-full text-white hover:scale-105 transition-transform">
                   <Send size={20} />
                 </button>
               </div>
             </motion.div>
           ) : (
             <motion.div key="mantra" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col items-center justify-center space-y-12">
                <div className="relative z-10">
                   <div className={`w-80 h-80 rounded-full border border-sanctuary-gold/20 flex items-center justify-center relative backdrop-blur-sm bg-white/5 ${isListening ? 'shadow-[0_0_100px_rgba(201,164,76,0.4)]' : ''}`}>
                      <Mandala className="absolute inset-0 w-full h-full text-sanctuary-gold animate-[spin_60s_linear_infinite] opacity-50" />
                      <span className="font-serif text-8xl text-sanctuary-gold drop-shadow-2xl" style={{ fontFamily: 'Cinzel, serif' }}>{japaCount}</span>
                   </div>
                </div>
                
                <button 
                  onClick={toggleMic}
                  className={`relative z-20 px-12 py-4 rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-500 ${
                    isListening 
                      ? 'bg-red-500/80 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                      : 'bg-sanctuary-gold text-white hover:bg-white hover:text-sanctuary-gold shadow-lg'
                  }`}
                >
                  {isListening ? "Listening..." : "Start Mantra"}
                </button>
             </motion.div>
           )}
         </AnimatePresence>
       </main>
    </div>
  );
}