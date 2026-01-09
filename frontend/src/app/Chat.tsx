"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Moon, Sun, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// --- PARTICLE ENGINE (THE PRANA FIELD) ---
const ParticleField = ({ isDark }: { isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Create "Prana" particles
    const createParticles = () => {
      const count = window.innerWidth < 768 ? 40 : 80; // Optimized for mobile
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedY: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.1,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };
    createParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Choose color based on theme (Gold in light, Starlight in dark)
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, " : "rgba(201, 164, 76, "; 

      particles.forEach((p) => {
        // Move Upwards
        p.y -= p.speedY;
        if (p.y < 0) p.y = canvas.height;

        // Pulse Opacity
        p.opacity += p.pulseSpeed;
        if (p.opacity > 0.8 || p.opacity < 0.1) p.pulseSpeed *= -1;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark 
          ? `rgba(200, 230, 255, ${p.opacity})` // Blue-ish white for night
          : `rgba(201, 164, 76, ${p.opacity})`; // Gold for day
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

// --- MAIN COMPONENT ---

export default function Chat() {
  // Navigation & Theme
  const [hasStarted, setHasStarted] = useState(false);
  const [mode, setMode] = useState<'reflection' | 'mantra'>('reflection');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Logic State
  const [messages, setMessages] = useState([
    { role: "ai", text: "Welcome to the Sanctum. I am the echo of the Gita. Speak your heart." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [japaCount, setJapaCount] = useState(0);
  
  // Interaction State
  const [isHolding, setIsHolding] = useState(false); // For "Sankalpa" entrance
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true);
  const [isListening, setIsListening] = useState(false);
  
  // Refs
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

  // --- LOGIC: CHANTING & VOICE ---
  const holyPatterns = ["krishna", "krsna", "ram", "rama", "hare", "hari", "govinda", "om", "shiva"];

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
    } catch (e) { setMessages(prev => [...prev, { role: "ai", text: "The connection flickers..." }]); }
    finally { setLoading(false); }
  };

  // --- RENDER: ENTRANCE (SANKALPA) ---
  if (!hasStarted) {
    return (
      <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-sanctuary-midnight flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 select-none">
        <ParticleField isDark={isDarkMode} />
        
        {/* Theme Toggle (Top Right) */}
        <div className="absolute top-6 right-6 z-20">
           <button onClick={toggleTheme} className="p-3 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md text-sanctuary-charcoal dark:text-sanctuary-gold hover:scale-110 transition-all">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="z-10 flex flex-col items-center text-center space-y-12 p-6"
        >
          {/* THE DIVINE TITLE */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-sanctuary-gold to-yellow-600 dark:from-sanctuary-gold dark:to-white font-bold tracking-tight drop-shadow-sm">
              KRISHNA AI
            </h1>
            <p className="text-sanctuary-charcoal/60 dark:text-sanctuary-starlight/60 font-sans text-sm tracking-[0.3em] uppercase">
              The Digital Sanctum
            </p>
          </div>

          {/* THE SANKALPA BUTTON (HOLD TO ENTER) */}
          <div className="relative group cursor-pointer"
               onMouseDown={() => setIsHolding(true)}
               onMouseUp={() => setIsHolding(false)}
               onTouchStart={() => setIsHolding(true)}
               onTouchEnd={() => setIsHolding(false)}
          >
             {/* Ring 1: Static */}
             <div className="w-24 h-24 rounded-full border border-sanctuary-gold/30 flex items-center justify-center relative">
                {/* Ring 2: Filling Animation */}
                <motion.div 
                   animate={{ scale: isHolding ? 1.5 : 1, opacity: isHolding ? 0 : 1 }}
                   onAnimationComplete={() => isHolding && setHasStarted(true)}
                   transition={{ duration: 1.5 }}
                   className="absolute inset-0 bg-sanctuary-gold/20 rounded-full"
                />
                <span className="text-xs uppercase tracking-widest font-bold text-sanctuary-charcoal/50 dark:text-sanctuary-gold">
                  {isHolding ? "ENTERING..." : "HOLD"}
                </span>
             </div>
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-sanctuary-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

        </motion.div>
      </div>
    );
  }

  // --- RENDER: INNER SANCTUM ---
  return (
    <div className="h-[100dvh] w-full bg-sanctuary-white dark:bg-sanctuary-midnight flex flex-col font-sans relative transition-colors duration-1000">
       <ParticleField isDark={isDarkMode} />
       
       {/* HEADER: GLASSMORPHIC */}
       <header className="flex-none z-20 px-4 py-4 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-green-400 animate-pulse' : 'bg-sanctuary-gold'}`} />
            <span className="text-xs md:text-sm font-serif font-bold tracking-widest text-sanctuary-charcoal dark:text-sanctuary-starlight">SANCTUM</span>
          </div>

          <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1 backdrop-blur-md">
            <button onClick={() => setMode('reflection')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'reflection' ? 'bg-sanctuary-gold text-white shadow-lg' : 'text-sanctuary-charcoal/50 dark:text-white/50'}`}>Chat</button>
            <button onClick={() => setMode('mantra')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${mode === 'mantra' ? 'bg-sanctuary-gold text-white shadow-lg' : 'text-sanctuary-charcoal/50 dark:text-white/50'}`}>Chant</button>
          </div>
          
          <div className="flex gap-2">
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-sanctuary-charcoal dark:text-sanctuary-starlight transition-colors">
               {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <button onClick={() => { setIsAudioEnabled(!isAudioEnabled); isAudioEnabledRef.current = !isAudioEnabled; }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-sanctuary-charcoal dark:text-sanctuary-starlight transition-colors">
               {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
          </div>
       </header>

       {/* CONTENT: THE SCROLL */}
       <main className="flex-1 overflow-y-auto z-10 scroll-smooth px-4 py-6">
         <AnimatePresence mode="wait">
           {mode === 'reflection' ? (
             <motion.div key="chat" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-3xl mx-auto space-y-8">
               {messages.map((m, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                 >
                   <div className={`max-w-[85%] p-6 rounded-3xl backdrop-blur-sm shadow-sm ${
                     m.role === 'user' 
                       ? 'bg-white/80 dark:bg-white/10 text-sanctuary-charcoal dark:text-sanctuary-starlight rounded-br-none' 
                       : 'bg-transparent border border-sanctuary-gold/30 text-sanctuary-charcoal dark:text-sanctuary-starlight font-serif text-lg leading-relaxed'
                   }`}>
                     {m.role === 'ai' && <Sparkles size={16} className="mb-2 text-sanctuary-gold" />}
                     {m.text}
                   </div>
                 </motion.div>
               ))}
               
               {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 p-4">
                      <div className="w-2 h-2 bg-sanctuary-gold rounded-full animate-bounce" style={{animationDelay:'0s'}} />
                      <div className="w-2 h-2 bg-sanctuary-gold rounded-full animate-bounce" style={{animationDelay:'0.2s'}} />
                      <div className="w-2 h-2 bg-sanctuary-gold rounded-full animate-bounce" style={{animationDelay:'0.4s'}} />
                    </div>
                  </div>
               )}
               <div ref={messagesEndRef} className="h-4" />
             </motion.div>
           ) : (
             <motion.div key="mantra" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col items-center justify-center space-y-8">
                {/* THE DIGITAL MALA */}
                <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
                   <div className="absolute inset-0 border-2 border-sanctuary-gold/10 rounded-full" />
                   <div className="absolute inset-0 border-t-2 border-sanctuary-gold rounded-full animate-spin-slow" />
                   
                   {/* PULSING ORB */}
                   <div className={`w-48 h-48 rounded-full bg-gradient-to-b from-sanctuary-gold/20 to-transparent backdrop-blur-xl flex items-center justify-center border border-white/10 transition-all duration-300 ${isListening ? 'scale-110 shadow-[0_0_50px_rgba(201,164,76,0.3)]' : 'scale-100'}`}>
                      <span className="font-serif text-7xl md:text-9xl text-sanctuary-gold drop-shadow-lg">{japaCount}</span>
                   </div>
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-sanctuary-charcoal/40 dark:text-white/40 animate-pulse">
                   {isListening ? "Resonating..." : "Tap Mic to Begin"}
                </p>
             </motion.div>
           )}
         </AnimatePresence>
       </main>

       {/* FOOTER: THE OFFERING */}
       <footer className="flex-none z-20 p-6">
         <div className="max-w-3xl mx-auto flex items-center gap-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-2 pr-3 rounded-full border border-white/20 shadow-xl">
           
           <button 
             onClick={toggleMic}
             className={`p-4 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white shadow-lg' : 'bg-sanctuary-gold/10 text-sanctuary-gold hover:bg-sanctuary-gold hover:text-white'}`}
           >
             {isListening ? <Mic size={24} className="animate-pulse" /> : <MicOff size={24} />}
           </button>

           {mode === 'reflection' && (
             <>
               <input 
                 className="flex-1 bg-transparent border-none text-lg text-sanctuary-charcoal dark:text-sanctuary-starlight placeholder:text-sanctuary-charcoal/30 dark:placeholder:text-white/20 focus:ring-0 px-2"
                 placeholder="Share your soul..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
               />
               <button 
                 onClick={sendMessage}
                 disabled={loading || !input.trim()}
                 className="p-3 bg-sanctuary-gold text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
               >
                 <Send size={20} />
               </button>
             </>
           )}
         </div>
       </footer>
    </div>
  );
}