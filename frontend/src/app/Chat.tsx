"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Feather, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

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
      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute w-64 h-64 bg-sanctuary-gold/10 dark:bg-sanctuary-gold/5 rounded-full blur-3xl"
    />
    <LotusIcon className="w-24 h-24 text-sanctuary-gold/80" />
  </div>
);

// --- MAIN COMPONENT ---

export default function Chat() {
  // Navigation State
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Radhe Radhe. I am here. Let us find stillness together." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  
  // Audio/Voice State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true);
  const [isListening, setIsListening] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSentenceCountRef = useRef(0);

  // --- THEME ENGINE ---
  useEffect(() => {
    // Check local storage or system preference on load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Load Japa count
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

  // --- LOGIC ---
  const holyPatterns = ["krishna", "krsna", "ram", "rama", "hare", "hari", "govinda", "om", "shiva", "narayana"];

  const countNamesInString = (text: string) => {
    const lowerText = text.toLowerCase();
    const pattern = new RegExp(holyPatterns.join("|"), "g");
    const matches = lowerText.match(pattern);
    return matches ? matches.length : 0;
  };

  // Voice Engine
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
        {/* Background Texture (Inverted for Dark Mode) */}
        <div className="absolute inset-0 opacity-20 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
        
        <div className="absolute top-6 right-6 z-20">
           <button onClick={toggleTheme} className="p-2 rounded-full text-sanctuary-charcoal dark:text-sanctuary-gold hover:bg-black/5 dark:hover:bg-white/10 transition-all">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="z-10 flex flex-col items-center text-center space-y-8 p-6"
        >
          <BreathingLotus />
          
          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl md:text-4xl font-serif text-sanctuary-charcoal dark:text-sanctuary-starlight tracking-wide">
              Jai Shri Krishna
            </h1>
            <p className="text-sanctuary-charcoal/60 dark:text-sanctuary-starlight/60 font-sans text-sm md:text-base leading-relaxed">
              This is a quiet space for reflection. <br/>
              It is not a replacement for a Guru, but a companion on your path.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setHasStarted(true)}
            className="mt-8 px-8 py-3 bg-sanctuary-charcoal dark:bg-sanctuary-gold text-sanctuary-white dark:text-sanctuary-midnight font-serif text-sm tracking-widest uppercase rounded-full shadow-lg shadow-stone-200 dark:shadow-none hover:opacity-90 transition-all duration-500"
          >
            Begin Reflection
          </motion.button>
        </motion.div>

        <div className="absolute bottom-6 text-[10px] text-sanctuary-charcoal/30 dark:text-sanctuary-starlight/20 font-sans tracking-[0.2em] uppercase">
          Sarvam Shri Krishnarpanam Astu
        </div>
      </div>
    );
  }

  // --- RENDER: SANCTUARY (CHAT/JAPA) ---
  return (
    <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-sanctuary-midnight flex flex-col font-sans relative transition-colors duration-700">
       {/* Background */}
       <div className="absolute inset-0 opacity-30 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />
       
       {/* Watermark */}
       <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
          <LotusIcon className="w-48 h-48 text-sanctuary-gold" />
       </div>

       {/* HEADER */}
       <header className="flex-none z-20 px-6 py-4 flex justify-between items-center bg-sanctuary-white/80 dark:bg-sanctuary-midnight/80 backdrop-blur-sm sticky top-0 border-b border-transparent dark:border-sanctuary-obsidian transition-colors duration-700">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <LotusIcon className="w-6 h-6 text-sanctuary-gold" />
            <span className="text-sm font-serif font-semibold tracking-wider text-sanctuary-charcoal dark:text-sanctuary-starlight">KRISHNA AI</span>
          </div>

          <div className="flex items-center gap-4">
             {/* Mode Toggles */}
             <div className="flex bg-sanctuary-mist dark:bg-sanctuary-obsidian rounded-full p-1 transition-colors">
                <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === 'reflection' ? 'bg-white dark:bg-sanctuary-midnight shadow-sm text-sanctuary-charcoal dark:text-sanctuary-starlight' : 'text-sanctuary-charcoal/40 dark:text-sanctuary-starlight/40'}`}>Reflection</button>
                <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === 'mantra' ? 'bg-white dark:bg-sanctuary-midnight shadow-sm text-sanctuary-gold' : 'text-sanctuary-charcoal/40 dark:text-sanctuary-starlight/40'}`}>Mantra</button>
             </div>
             
             {/* Theme Toggle */}
             <button onClick={toggleTheme} className="text-sanctuary-charcoal/40 dark:text-sanctuary-starlight/40 hover:text-sanctuary-gold transition-colors">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             {/* Audio */}
             <button 
               onClick={() => { setIsAudioEnabled(!isAudioEnabled); isAudioEnabledRef.current = !isAudioEnabled; }}
               className="text-sanctuary-charcoal/40 dark:text-sanctuary-starlight/40 hover:text-sanctuary-gold transition-colors"
             >
               {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
          </div>
       </header>

       {/* CONTENT AREA */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth">
         {mode === 'reflection' ? (
           <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
             {messages.map((m, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6 }}
                 className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`max-w-[85%] leading-relaxed transition-colors ${
                   m.role === 'user' 
                     ? 'bg-sanctuary-mist dark:bg-sanctuary-obsidian px-6 py-4 rounded-2xl rounded-br-none text-sanctuary-charcoal dark:text-sanctuary-starlight text-sm shadow-sm' 
                     : 'text-sanctuary-charcoal dark:text-sanctuary-starlight font-serif text-lg md:text-xl border-l-2 border-sanctuary-gold pl-4 py-2'
                 }`}>
                   {m.text}
                 </div>
               </motion.div>
             ))}
             {loading && (
               <div className="flex items-center gap-2 text-sanctuary-gold text-xs uppercase tracking-widest pl-4 animate-pulse">
                 <Feather size={12} /> Contemplating...
               </div>
             )}
             <div ref={messagesEndRef} className="h-4" />
           </div>
         ) : (
           /* MANTRA MODE */
           <div className="h-full flex flex-col items-center justify-center text-center space-y-12">
              <div className="relative">
                 {/* Glowing Ring */}
                 <div className={`w-64 h-64 rounded-full border border-sanctuary-gold/20 flex items-center justify-center relative ${isListening ? 'animate-pulse shadow-[0_0_40px_rgba(201,164,76,0.2)]' : ''}`}>
                    <div className="absolute inset-0 rounded-full border border-dotted border-sanctuary-gold/40 animate-[spin_60s_linear_infinite]" />
                    <span className="font-serif text-6xl text-sanctuary-gold">{japaCount}</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-sanctuary-charcoal/50 dark:text-sanctuary-starlight/50 text-xs tracking-widest uppercase">
                    {isListening ? "Listening to your chant..." : "Tap mic to begin"}
                 </p>
              </div>
           </div>
         )}
       </main>

       {/* FOOTER / INPUT */}
       <footer className="flex-none z-20 p-6 bg-gradient-to-t from-sanctuary-white dark:from-sanctuary-midnight via-sanctuary-white dark:via-sanctuary-midnight to-transparent transition-colors duration-700">
         <div className="max-w-2xl mx-auto flex items-center gap-4">
           
           {/* Mic Button (Minimal) */}
           <button 
             onClick={toggleMic}
             className={`p-3 rounded-full transition-all duration-500 ${
               isListening 
                 ? 'bg-sanctuary-gold/10 text-sanctuary-gold ring-1 ring-sanctuary-gold/50' 
                 : 'text-sanctuary-charcoal/30 dark:text-sanctuary-starlight/30 hover:text-sanctuary-gold'
             }`}
           >
             {isListening ? <Mic size={20} /> : <MicOff size={20} />}
           </button>

           {mode === 'reflection' && (
             <div className="flex-1 relative">
               <input 
                 className="w-full bg-transparent border-b border-sanctuary-charcoal/10 dark:border-sanctuary-starlight/10 py-3 px-2 text-sanctuary-charcoal dark:text-sanctuary-starlight focus:outline-none focus:border-sanctuary-gold/50 transition-colors placeholder:text-sanctuary-charcoal/20 dark:placeholder:text-sanctuary-starlight/20 font-sans"
                 placeholder="Share your burden..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
               />
               <button 
                 onClick={sendMessage}
                 disabled={loading || !input.trim()}
                 className="absolute right-0 top-3 text-sanctuary-charcoal/30 dark:text-sanctuary-starlight/30 hover:text-sanctuary-gold disabled:opacity-0 transition-all"
               >
                 <Send size={18} />
               </button>
             </div>
           )}
         </div>
       </footer>
    </div>
  );
}