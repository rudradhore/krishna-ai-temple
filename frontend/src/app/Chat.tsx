"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Mic, MicOff, Hand, Sparkles } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  const [mode, setMode] = useState<'chat' | 'japa'>('chat');

  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. I am Krishna. How may I guide your soul today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- JAPA STATE ---
  const [japaCount, setJapaCount] = useState(0);
  const [lastChant, setLastChant] = useState("");
  const [debugTranscript, setDebugTranscript] = useState("");
  const currentSentenceCountRef = useRef(0);

  // --- AUDIO STATE ---
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true); 
  const [isListening, setIsListening] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 📿 HOLY NAMES ---
  const holyPatterns = [
    "krishna", "krsna", "chris", "kris", "christ", "trishna", "krish",
    "ram", "rama", "rum", "run", "wrong", "rom", "raam", "drum", "arm",
    "hare", "hari", "hairy", "harry", "hurry", "hay", 
    "govinda", "om", "home", "shiva", "shiver", "narayana"
  ];

  useEffect(() => {
    const savedAudio = localStorage.getItem("krishna_audio");
    if (savedAudio !== null) {
      setIsAudioEnabled(savedAudio === "true");
      isAudioEnabledRef.current = (savedAudio === "true");
    }
    const savedCount = localStorage.getItem("japa_count");
    if (savedCount) setJapaCount(parseInt(savedCount));
  }, []);

  // --- HELPER FUNCTIONS ---
  const countNamesInString = (text: string) => {
    const lowerText = text.toLowerCase();
    const pattern = new RegExp(holyPatterns.join("|"), "g");
    const matches = lowerText.match(pattern);
    return matches ? matches.length : 0;
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    isAudioEnabledRef.current = newState;
    localStorage.setItem("krishna_audio", String(newState));
    if (!newState && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
    }
  };

  // --- VOICE ENGINE ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = mode === 'japa'; 
        recognition.lang = 'en-US'; 
        recognition.interimResults = true;
        
        recognition.onstart = () => { setIsListening(true); currentSentenceCountRef.current = 0; };
        recognition.onend = () => {
          if (mode === 'japa' && isListening) try { recognition.start(); } catch (e) { setIsListening(false); }
          else setIsListening(false);
          currentSentenceCountRef.current = 0;
        };

        recognition.onresult = (event: any) => {
          const results = event.results;
          const latestResult = results[results.length - 1];
          const transcript = latestResult[0].transcript;
          
          if (mode === 'chat') {
            if (latestResult.isFinal) setInput(transcript);
          } else {
            setDebugTranscript(transcript); 
            const totalInCurrentStream = countNamesInString(transcript);
            const newNames = totalInCurrentStream - currentSentenceCountRef.current;
            if (newNames > 0) {
              setJapaCount(prev => {
                const newTotal = prev + newNames;
                localStorage.setItem("japa_count", String(newTotal));
                return newTotal;
              });
              const words = transcript.trim().split(" ");
              setLastChant(words[words.length - 1]);
              if (navigator.vibrate) navigator.vibrate(50);
              currentSentenceCountRef.current = totalInCurrentStream;
            }
            if (latestResult.isFinal) currentSentenceCountRef.current = 0;
          }
        };
        recognitionRef.current = recognition;
      }
    }
  }, [mode]); 

  const toggleMic = () => {
    if (audioPlayerRef.current) audioPlayerRef.current.play().catch(() => {}); 
    if (!recognitionRef.current) return alert("Browser does not support voice.");
    if (isListening) { setIsListening(false); recognitionRef.current.stop(); } 
    else { setIsListening(true); try { recognitionRef.current.start(); } catch(e) {} }
  };

  const playServerAudio = (base64Audio: string) => {
    if (!isAudioEnabledRef.current) return;
    const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
    if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioSrc;
        audioPlayerRef.current.play().catch(e => console.error("Audio play failed:", e));
    } else {
        const audio = new Audio(audioSrc);
        audioPlayerRef.current = audio;
        audio.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("https://krishna-ai-temple.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      if (data.audio) playServerAudio(data.audio);
    } catch (error) { setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]); } 
    finally { setLoading(false); }
  };

  const manualCount = () => {
    setJapaCount(prev => {
      const newTotal = prev + 1;
      localStorage.setItem("japa_count", String(newTotal));
      return newTotal;
    });
    setLastChant("Tap");
    if (navigator.vibrate) navigator.vibrate(30);
  };

  // --- RENDER ---
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FAF9F6] font-[family-name:var(--font-lato)] text-stone-800 overflow-hidden">
      
      {/* 🌫️ BACKGROUND TEXTURE */}
      <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none mix-blend-multiply"></div>
      
      {/* 🪷 LOTUS WATERMARK (Subtle & Golden) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <svg viewBox="0 0 200 200" className="w-[150%] md:w-[700px] h-auto text-amber-500/10 animate-spin-slow" style={{animationDuration: '60s'}} fill="currentColor">
          <path d="M100 10 Q110 50 100 90 Q90 50 100 10 Z" />
          <path d="M100 90 Q120 60 130 30 Q115 45 100 90 Z" />
          <path d="M100 90 Q80 60 70 30 Q85 45 100 90 Z" />
          <path d="M100 90 Q140 70 160 40 Q130 70 100 90 Z" />
          <path d="M100 90 Q60 70 40 40 Q70 70 100 90 Z" />
        </svg>
      </div>

      {/* 🏛️ HEADER (Glassmorphism) */}
      <header className="flex-none z-50 bg-white/70 backdrop-blur-xl border-b border-amber-100 p-4 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
                <span className="text-xl">🪷</span>
            </div>
            <div>
                <h1 className="text-xl font-[family-name:var(--font-cinzel)] font-bold text-amber-900 tracking-wide">Krishna AI</h1>
                <p className="text-[10px] uppercase tracking-widest text-amber-700/60 font-bold hidden sm:block">Digital Temple</p>
            </div>
        </div>
        <div className="flex gap-2">
             {/* MODE SWITCHER PILL */}
            <div className="flex bg-stone-100 rounded-full p-1 border border-stone-200 shadow-inner">
                <button 
                    onClick={() => setMode('chat')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'chat' ? 'bg-white text-amber-800 shadow-sm border border-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Chat
                </button>
                <button 
                    onClick={() => setMode('japa')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'japa' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    Japa
                </button>
            </div>
            {/* AUDIO TOGGLE */}
            <button onClick={toggleAudio} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isAudioEnabled ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
        </div>
      </header>

      {/* === JAPA MODE (MANDALA DESIGN) === */}
      {mode === 'japa' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-10 z-10 relative">
            
            {/* The Glowing Ring */}
            <div className="relative group">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full animate-pulse"></div>
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-[1px] border-orange-200 bg-white/50 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Inner Decorative Ring */}
                    <div className="absolute inset-2 rounded-full border border-dashed border-orange-300/50 opacity-50 animate-spin-slow"></div>
                    
                    <h2 className="text-amber-900/40 text-xs font-[family-name:var(--font-cinzel)] uppercase tracking-[0.3em] mb-4">Mantra Count</h2>
                    <div className="text-7xl md:text-8xl font-[family-name:var(--font-cinzel)] font-bold text-orange-600 drop-shadow-sm transition-all duration-300 transform scale-100">
                        {japaCount}
                    </div>
                    {lastChant && <div className="text-orange-500 font-bold mt-2 animate-bounce uppercase tracking-wider text-sm">{lastChant}</div>}
                </div>
            </div>

            {/* Debug & Status */}
            <div className="space-y-2">
                <div className="h-6 flex items-center justify-center text-sm font-medium">
                    {isListening 
                        ? <span className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Listening...</span> 
                        : <span className="text-stone-400">Mic is Off</span>}
                </div>
                <div className="text-xs text-stone-400 font-mono bg-white/50 px-2 py-1 rounded border border-stone-100 inline-block min-w-[150px]">
                    {debugTranscript || "Say 'Krishna'..."}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-8 items-center">
                <button 
                    onClick={toggleMic}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 ${isListening ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-200 ring-4 ring-red-100' : 'bg-white text-stone-600 border border-stone-200'}`}
                >
                    {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                
                <button 
                    onClick={manualCount}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
                >
                    <Hand size={28} />
                </button>
            </div>
            
            <button onClick={() => { setJapaCount(0); localStorage.setItem("japa_count", "0"); }} className="text-[10px] text-stone-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                Reset Counter
            </button>
        </div>
      ) : (
        /* === CHAT MODE (PREMIUM UI) === */
        <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 scroll-smooth">
                {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                    
                    {/* AVATAR FOR KRISHNA */}
                    {m.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 mr-3 flex items-center justify-center border border-amber-200 text-sm mt-1">🪷</div>
                    )}

                    <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed relative
                        ${m.role === 'user' 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-none shadow-orange-100' 
                            : 'bg-white border border-stone-100 text-stone-800 rounded-bl-none shadow-stone-100'
                        }`}>
                        {m.text}
                    </div>
                </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start ml-11">
                        <div className="flex items-center gap-2 text-amber-600/60 bg-white/50 px-4 py-2 rounded-full border border-amber-100 text-xs animate-pulse">
                            <Sparkles size={14} />
                            <span className="uppercase tracking-widest font-bold">Contemplating...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* FLOATING INPUT BAR */}
            <div className="p-4 z-50 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent">
                <div className="max-w-3xl mx-auto flex gap-2 items-center bg-white/80 backdrop-blur-md p-2 rounded-full border border-stone-200 shadow-xl shadow-stone-200/50 hover:shadow-2xl transition-all">
                    <button onClick={toggleMic} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'}`}>
                         <Mic size={20} />
                    </button>
                    
                    <input 
                        className="flex-1 bg-transparent px-3 py-2 outline-none text-stone-800 placeholder-stone-400 font-medium" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                        placeholder="Ask Krishna..." 
                    />
                    
                    <button 
                        onClick={sendMessage} 
                        disabled={loading} 
                        className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}