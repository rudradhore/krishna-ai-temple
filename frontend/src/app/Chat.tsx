"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Volume2, VolumeX, Mic, MicOff, Hand } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  const [mode, setMode] = useState<'chat' | 'japa'>('chat');

  // --- CHAT STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. Speak your heart." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- JAPA STATE ---
  const [japaCount, setJapaCount] = useState(0);
  const [lastChant, setLastChant] = useState("");
  const [debugTranscript, setDebugTranscript] = useState(""); // 🔍 See what computer hears
  const currentSentenceCountRef = useRef(0);

  // --- AUDIO STATE ---
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true); 
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 📿 EXPANDED VOCABULARY (SOUND-ALIKES) ---
  // We accept these "wrong" words as counts because they sound like the names
  const holyPatterns = [
    // Krishna variations
    "krishna", "krsna", "chris", "kris", "christ", "trishna", "krish",
    // Ram variations
    "ram", "rama", "rum", "run", "wrong", "rom", "raam", "drum", "arm",
    // Hare variations
    "hare", "hari", "hairy", "harry", "hurry", "hay", 
    // Others
    "govinda", "om", "home", "shiva", "shiver", "narayana"
  ];

  // --- 1. LOAD SAVED DATA ---
  useEffect(() => {
    const savedAudio = localStorage.getItem("krishna_audio");
    if (savedAudio !== null) {
      setIsAudioEnabled(savedAudio === "true");
      isAudioEnabledRef.current = (savedAudio === "true");
    }
    const savedCount = localStorage.getItem("japa_count");
    if (savedCount) setJapaCount(parseInt(savedCount));
  }, []);

  // --- 2. COUNTING LOGIC ---
  const countNamesInString = (text: string) => {
    const lowerText = text.toLowerCase();
    const pattern = new RegExp(holyPatterns.join("|"), "g");
    const matches = lowerText.match(pattern);
    return matches ? matches.length : 0;
  };

  // --- 3. VOICE SETUP ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = mode === 'japa'; 
        recognition.lang = 'en-US'; 
        recognition.interimResults = true; // ⚡ Real-time speed
        
        recognition.onstart = () => {
          setIsListening(true);
          currentSentenceCountRef.current = 0;
        };
        
        recognition.onend = () => {
          if (mode === 'japa' && isListening) {
             try { recognition.start(); } catch (e) { setIsListening(false); }
          } else {
             setIsListening(false);
          }
          currentSentenceCountRef.current = 0;
        };

        recognition.onresult = (event: any) => {
          const results = event.results;
          const latestResult = results[results.length - 1];
          const transcript = latestResult[0].transcript;
          
          if (mode === 'chat') {
            if (latestResult.isFinal) setInput(transcript);
          } else {
            // === JAPA MODE ===
            setDebugTranscript(transcript); // Show user what we hear
            
            const totalInCurrentStream = countNamesInString(transcript);
            const newNames = totalInCurrentStream - currentSentenceCountRef.current;
            
            if (newNames > 0) {
              setJapaCount(prev => {
                const newTotal = prev + newNames;
                localStorage.setItem("japa_count", String(newTotal));
                return newTotal;
              });
              
              // Find the last word heard for display
              const words = transcript.trim().split(" ");
              setLastChant(words[words.length - 1]);

              if (navigator.vibrate) navigator.vibrate(50);
              
              currentSentenceCountRef.current = totalInCurrentStream;
            }

            if (latestResult.isFinal) {
              currentSentenceCountRef.current = 0;
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') setIsListening(false);
        };
        recognitionRef.current = recognition;
      }
    }
  }, [mode]); 

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Browser does not support voice.");
    if (isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  // --- MANUAL COUNT (BACKUP) ---
  const manualCount = () => {
      setJapaCount(prev => {
        const newTotal = prev + 1;
        localStorage.setItem("japa_count", String(newTotal));
        return newTotal;
      });
      setLastChant("Tap");
      if (navigator.vibrate) navigator.vibrate(30);
  };

  // --- STANDARD CHAT HELPERS ---
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    isAudioEnabledRef.current = newState;
    localStorage.setItem("krishna_audio", String(newState));
    if (!newState) window.speechSynthesis.cancel();
  };
  const isHindiText = (text: string) => /[\u0900-\u097F]/.test(text);
  const speakText = (text: string) => {
    if (!isAudioEnabledRef.current) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (isHindiText(text)) {
      speech.lang = 'hi-IN';
      const v = voices.find(v => v.lang.includes('hi'));
      if (v) speech.voice = v;
    } else {
      speech.lang = 'en-US';
      const v = voices.find(v => v.lang.includes('IN'));
      if (v) speech.voice = v;
    }
    speech.pitch = 0.9; speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
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
      speakText(data.reply);
    } catch (error) { setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]); } 
    finally { setLoading(false); }
  };

  // --- RENDER ---
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] font-sans">
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 p-3 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <span className="text-2xl">🪷</span>
            <h1 className="text-lg font-bold text-gray-800">Krishna AI</h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setMode(mode === 'chat' ? 'japa' : 'chat')}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${mode === 'japa' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-100 text-gray-600'}`}
            >
                {mode === 'chat' ? 'Japa Mode' : 'Chat'}
            </button>
            <button onClick={toggleAudio} className={`p-2 rounded-full border ${isAudioEnabled ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400'}`}>
                {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>
      </header>

      {mode === 'japa' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div>
                <h2 className="text-gray-500 text-sm uppercase tracking-widest mb-2">Mantra Counter</h2>
                <div className="text-8xl font-bold text-orange-600 drop-shadow-sm font-mono">{japaCount}</div>
            </div>
            
            <div className="h-8 flex items-center justify-center text-lg text-gray-700 font-medium">
                {isListening ? <span className="animate-pulse text-green-600">Listening...</span> : <span className="text-gray-400">Mic Off</span>}
            </div>

            {/* 🔍 DEBUG VIEW: SHOWS WHAT COMPUTER HEARS */}
            <div className="w-full max-w-xs h-16 bg-gray-100 rounded p-2 text-xs text-gray-500 overflow-hidden text-center mx-auto">
                {debugTranscript || "Say 'Ram', 'Krishna', 'Hari'..."}
            </div>

            {/* CONTROLS */}
            <div className="flex gap-6 items-center">
                <button 
                    onClick={toggleMic}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isListening ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse' : 'bg-gray-200 text-gray-600'}`}
                >
                    {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                
                {/* MANUAL TAP BUTTON (BACKUP) */}
                <button 
                    onClick={manualCount}
                    className="w-20 h-20 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-90 hover:bg-orange-600 transition-all"
                >
                    <Hand size={32} />
                </button>
            </div>
            <p className="text-[10px] text-gray-400">Tap Hand to count manually</p>

            <button onClick={() => { setJapaCount(0); localStorage.setItem("japa_count", "0"); }} className="text-xs text-gray-400 underline mt-4">
                Reset Counter
            </button>
        </div>
      ) : (
        /* CHAT UI */
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm md:text-base ${m.role === 'user' ? 'bg-[#E6D0A1] rounded-br-none' : 'bg-white border border-yellow-100 rounded-bl-none'}`}>
                        {m.text}
                    </div>
                </div>
                ))}
                {loading && <div className="text-yellow-600 text-sm animate-pulse px-4">Contemplating...</div>}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            <div className="p-3 bg-white border-t border-yellow-100">
                <div className="flex gap-2 items-center bg-[#F9F7F2] p-2 rounded-full border border-yellow-200">
                    <button onClick={toggleMic} className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400'}`}>
                         <Mic size={20} />
                    </button>
                    <input className="flex-1 bg-transparent px-2 outline-none text-gray-700" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask Krishna..." />
                    <button onClick={sendMessage} disabled={loading} className="p-3 bg-yellow-500 text-white rounded-full shadow-md"><Send size={18} /></button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}