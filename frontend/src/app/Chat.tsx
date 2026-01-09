"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Feather, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- VISUAL COMPONENTS ---

const LotusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="currentColor">
    <path d="M100 10 Q110 50 100 90 Q90 50 100 10 Z" />
    <path d="M100 90 Q120 60 130 30 Q115 45 100 90 Z" />
    <path d="M100 90 Q80 60 70 30 Q85 45 100 90 Z" />
    <path d="M100 90 Q140 70 160 40 Q130 70 100 90 Z" />
    <path d="M100 90 Q60 70 40 40 Q70 70 100 90 Z" />
  </svg>
);

const BreathingLotus = () => (
  <div className="relative flex items-center justify-center">
    <motion.div 
      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute w-64 h-64 bg-sanctuary-gold/20 dark:bg-sanctuary-gold/10 rounded-full blur-3xl"
    />
    <LotusIcon className="w-32 h-32 text-sanctuary-gold animate-[spin_60s_linear_infinite]" />
  </div>
);

// --- MAIN COMPONENT ---

export default function Chat() {
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Radhe Radhe. I am here. Let us find stillness together." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  
  // Audio State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true);
  const [isListening, setIsListening] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSentenceCountRef = useRef(0);

  // --- THEME & INIT ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
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

  // --- LOGIC HELPERS ---
  const holyPatterns = ["krishna", "krsna", "ram", "rama", "hare", "hari", "govinda", "om", "shiva", "narayana"];

  const countNamesInString = (text: string) => {
    const lowerText = text.toLowerCase();
    const pattern = new RegExp(holyPatterns.join("|"), "g");
    const matches = lowerText.match(pattern);
    return matches ? matches.length : 0;
  };

  // --- VOICE ENGINE ---
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
              if (navigator.vibrate) navigator.vibrate(50);
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

  const playServerAudio = (base64Audio: string) => {
    if (!isAudioEnabledRef.current) return;
    const src = `data:audio/mp3;base64,${base64Audio}`;
    if (audioPlayerRef.current) {
        audioPlayerRef.current.src = src;
        audioPlayerRef.current.play().catch(e => console.error(e));
    } else {
        const audio = new Audio(src);
        audioPlayerRef.current = audio;
        audio.play().catch(e => console.error(e));
    }
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
      if (data.audio) playServerAudio(data.audio);
    } catch (e) { setMessages(prev => [...prev, { role: "ai", text: "Peace. The connection is faint." }]); }
    finally { setLoading(false); }
  };

  // --- RENDER: WELCOME SCREEN ---
  if (!hasStarted) {
    return (
      <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-sanctuary-midnight flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000">
        <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
        
        <div className="absolute top-6 right-6 z-20">
           <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={toggleTheme} 
             className="w-10 h-10 flex items-center justify-center rounded-full bg-sanctuary-stone dark:bg-sanctuary-obsidian text-sanctuary-charcoal dark:text-sanctuary-gold shadow-sm border border-black/5 dark:border-white/10"
           >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center space-y-8 p-6"
        >
          <BreathingLotus />
          
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl md:text-5xl font-serif text-sanctuary-charcoal dark:text-sanctuary-starlight tracking-wide drop-shadow-sm">
              Krishna AI
            </h1>
            <p className="text-sanctuary-charcoal/70 dark:text-sanctuary-starlight/70 font-sans text-base leading-relaxed">
              A digital sanctuary for your soul.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setHasStarted(true)}
            className="mt-8 px-10 py-4 bg-sanctuary-charcoal dark:bg-sanctuary-gold text-sanctuary-white dark:text-sanctuary-midnight font-serif text-sm tracking-[0.2em] uppercase rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            Enter Temple
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // --- RENDER: SANCTUARY ---
  return (
    <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-sanctuary-midnight flex flex-col font-sans relative transition-colors duration-700">
       <div className="absolute inset-0 opacity-15 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
       
       <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
          <LotusIcon className="w-48 h-48 text-sanctuary-gold animate-[spin_120s_linear_infinite]" />
       </div>

       {/* HEADER */}
       <header className="flex-none z-20 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center bg-sanctuary-white/80 dark:bg-sanctuary-midnight/80 backdrop-blur-xl sticky top-0 border-b border-black/5 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-2 md:gap-3">
            <LotusIcon className="w-6 h-6 md:w-8 md:h-8 text-sanctuary-gold" />
            <span className="text-sm md:text-lg font-serif font-bold tracking-widest text-sanctuary-charcoal dark:text-sanctuary-starlight">KRISHNA</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             <div className="flex bg-sanctuary-stone dark:bg-sanctuary-obsidian rounded-full p-1 border border-black/5 dark:border-white/5">
                <button 
                   onClick={() => setMode('reflection')} 
                   className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase transition-all duration-300 ${mode === 'reflection' ? 'bg-white dark:bg-sanctuary-midnight shadow-md text-sanctuary-charcoal dark:text-sanctuary-starlight scale-105' : 'text-sanctuary-charcoal/50 dark:text-sanctuary-starlight/50 hover:text-sanctuary-gold'}`}
                >
                   <span className="hidden md:inline">Reflection</span><span className="md:hidden">Chat</span>
                </button>
                <button 
                   onClick={() => setMode('mantra')} 
                   className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase transition-all duration-300 ${mode === 'mantra' ? 'bg-white dark:bg-sanctuary-midnight shadow-md text-sanctuary-gold scale-105' : 'text-sanctuary-charcoal/50 dark:text-sanctuary-starlight/50 hover:text-sanctuary-gold'}`}
                >
                   <span className="hidden md:inline">Mantra</span><span className="md:hidden">Chant</span>
                </button>
             </div>
             
             <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full bg-sanctuary-stone dark:bg-sanctuary-obsidian text-sanctuary-charcoal dark:text-sanctuary-gold border border-black/5 dark:border-white/5 shadow-sm">
               {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
             </motion.button>
          </div>
       </header>

       {/* CONTENT - ANIMATED SWITCHING */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div 
               key="reflection"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               transition={{ duration: 0.3 }}
               className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6"
             >
               {messages.map((m, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div className={`max-w-[85%] md:max-w-[80%] leading-relaxed transition-colors ${
                     m.role === 'user' 
                       ? 'bg-sanctuary-mist dark:bg-sanctuary-obsidian px-5 py-3 rounded-2xl rounded-br-none text-sanctuary-charcoal dark:text-sanctuary-starlight text-sm md:text-base shadow-sm border border-black/5 dark:border-white/5' 
                       : 'text-sanctuary-charcoal dark:text-sanctuary-starlight font-serif text-lg md:text-xl border-l-2 border-sanctuary-gold pl-4 py-2'
                   }`}>
                     {m.text}
                   </div>
                 </motion.div>
               ))}
               {loading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sanctuary-gold text-xs uppercase tracking-widest pl-4 font-bold">
                   <Feather size={12} className="animate-bounce" /> Contemplating...
                 </motion.div>
               )}
               <div ref={messagesEndRef} className="h-4" />
             </motion.div>
           ) : (
             <motion.div 
               key="mantra"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
               className="h-full flex flex-col items-center justify-center text-center space-y-12"
             >
                <div className="relative">
                   <div className={`w-64 h-64 md:w-80 md:h-80 rounded-full border border-sanctuary-gold/20 flex items-center justify-center relative transition-all duration-700 ${isListening ? 'shadow-[0_0_60px_rgba(184,134,11,0.4)] scale-105' : 'scale-100'}`}>
                      <div className="absolute inset-0 rounded-full border border-dotted border-sanctuary-gold/40 animate-[spin_60s_linear_infinite]" />
                      <span className="font-serif text-6xl md:text-8xl text-sanctuary-gold tabular-nums">{japaCount}</span>
                   </div>
                </div>
                <div className="space-y-3">
                   <p className="text-sanctuary-charcoal/50 dark:text-sanctuary-starlight/50 text-xs tracking-widest uppercase font-bold animate-pulse">
                      {isListening ? "Listening to your prayer..." : "Tap mic to chant"}
                   </p>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
       </main>

       {/* FOOTER */}
       <footer className="flex-none z-20 p-4 md:p-6 bg-gradient-to-t from-sanctuary-white dark:from-sanctuary-midnight via-sanctuary-white dark:via-sanctuary-midnight to-transparent transition-colors">
         <div className="max-w-2xl mx-auto flex items-center gap-3">
           <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={toggleMic}
             className={`p-3 rounded-full transition-all duration-300 shadow-md ${
               isListening 
                 ? 'bg-red-500 text-white shadow-red-500/30' 
                 : 'bg-sanctuary-stone dark:bg-sanctuary-obsidian text-sanctuary-charcoal dark:text-sanctuary-starlight border border-black/5 dark:border-white/5 hover:bg-sanctuary-gold/10'
             }`}
           >
             {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
           </motion.button>

           {mode === 'reflection' && (
             <div className="flex-1 relative group">
               <input 
                 className="w-full bg-sanctuary-stone/50 dark:bg-sanctuary-obsidian/50 rounded-full border-none py-3 px-4 text-sanctuary-charcoal dark:text-sanctuary-starlight focus:ring-1 focus:ring-sanctuary-gold/50 transition-all placeholder:text-sanctuary-charcoal/30 dark:placeholder:text-sanctuary-starlight/30 font-sans text-sm md:text-base shadow-inner"
                 placeholder="Share your heart..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
               />
               <motion.button 
                 whileTap={{ scale: 0.9 }}
                 onClick={sendMessage}
                 disabled={loading || !input.trim()}
                 className="absolute right-2 top-2 p-1.5 bg-sanctuary-charcoal dark:bg-sanctuary-gold text-white dark:text-sanctuary-midnight rounded-full disabled:opacity-0 transition-all shadow-sm"
               >
                 <Send size={16} />
               </motion.button>
             </div>
           )}
         </div>
       </footer>
    </div>
  );
}