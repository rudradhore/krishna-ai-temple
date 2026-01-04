"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Volume2, VolumeX, Mic, MicOff } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  // --- MODES ---
  const [mode, setMode] = useState<'chat' | 'japa'>('chat');

  // --- CHAT STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. I am here to guide you. Speak your heart." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- JAPA STATE ---
  const [japaCount, setJapaCount] = useState(0);
  const [lastChant, setLastChant] = useState("");
  
  // --- AUDIO STATE ---
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true); 
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 📿 HOLY NAMES LIST ---
  // We use this to scan the text
  const holyNames = ["krishna", "krsna", "ram", "rama", "hare", "hari", "govinda", "om", "shiva", "narayana", "radha", "vitthala"];

  // --- 1. LOAD SAVED DATA ---
  useEffect(() => {
    const savedAudio = localStorage.getItem("krishna_audio");
    if (savedAudio !== null) {
      const isEnabled = savedAudio === "true";
      setIsAudioEnabled(isEnabled);
      isAudioEnabledRef.current = isEnabled;
    }
    const savedCount = localStorage.getItem("japa_count");
    if (savedCount) setJapaCount(parseInt(savedCount));
  }, []);

  // --- 2. TOGGLE MODES ---
  const toggleMode = (newMode: 'chat' | 'japa') => {
    setMode(newMode);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop(); // Restart mic with new settings
    }
  };

  // --- 3. 🧠 SMART JAPA LOGIC (THE FIX) ---
  const processJapaSpeech = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // 1. Create a pattern to find ALL holy names in the string
    // This creates a regex like: /krishna|ram|hare/g
    const pattern = new RegExp(holyNames.join("|"), "g");
    
    // 2. Find all matches
    const matches = lowerText.match(pattern);
    
    // 3. If matches found, add the EXACT NUMBER of matches
    if (matches && matches.length > 0) {
      const countToAdd = matches.length;
      
      setJapaCount(prev => {
        const newTotal = prev + countToAdd;
        localStorage.setItem("japa_count", String(newTotal));
        return newTotal;
      });

      setLastChant(`+${countToAdd} (${matches[0].toUpperCase()}...)`);
      
      // Haptic Feedback (Vibrate phone)
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  // --- 4. VOICE SETUP ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Japa Mode: Continuous listening
        // Chat Mode: One sentence then stop
        recognition.continuous = mode === 'japa'; 
        recognition.lang = 'en-US'; 
        recognition.interimResults = false; // Stick to final results to prevent double counting
        
        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => {
          // If in Japa mode, auto-restart immediately
          if (mode === 'japa' && isListening) {
             try { recognition.start(); } catch (e) { setIsListening(false); }
          } else {
             setIsListening(false);
          }
        };

        recognition.onresult = (event: any) => {
          // Get the LATEST sentence spoken
          const latestResultIndex = event.results.length - 1;
          const transcript = event.results[latestResultIndex][0].transcript;
          
          if (mode === 'chat') {
            setInput(transcript);
          } else {
            // JAPA MODE
            processJapaSpeech(transcript);
          }
        };

        recognition.onerror = (event: any) => {
          // Ignore "no-speech" errors in Japa mode, just keep listening
          if (event.error !== 'no-speech') {
             setIsListening(false);
          }
        };
        recognitionRef.current = recognition;
      }
    }
  }, [mode]); 

  const toggleMic = () => {
    if (!recognitionRef.current) return alert("Browser does not support voice.");
    
    // Manual Toggle
    if (isListening) {
      setIsListening(false); // Update state to stop auto-restart loop
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      try { recognitionRef.current.start(); } catch(e) {}
    }
  };

  // --- 5. CHAT LOGIC ---
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
      const hindiVoice = voices.find(v => v.lang.includes('hi'));
      if (hindiVoice) speech.voice = hindiVoice;
    } else {
      speech.lang = 'en-US';
      const indianVoice = voices.find(v => v.lang.includes('IN'));
      if (indianVoice) speech.voice = indianVoice;
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
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] font-sans">
      
      {/* HEADER */}
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 p-3 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <span className="text-2xl">🪷</span>
            <h1 className="text-lg font-bold text-gray-800">Krishna AI</h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => toggleMode(mode === 'chat' ? 'japa' : 'chat')}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${mode === 'japa' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-100 text-gray-600'}`}
            >
                {mode === 'chat' ? 'Switch to Japa' : 'Back to Chat'}
            </button>
            <button onClick={toggleAudio} className={`p-2 rounded-full border ${isAudioEnabled ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400'}`}>
                {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>
      </header>

      {/* === JAPA MODE UI === */}
      {mode === 'japa' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h2 className="text-gray-500 text-sm uppercase tracking-widest mb-2">Mantra Counter</h2>
                <div className="text-8xl font-bold text-orange-600 drop-shadow-sm font-mono">
                    {japaCount}
                </div>
            </div>
            
            <div className="h-16 flex items-center justify-center text-xl text-gray-700 font-medium">
                {isListening ? (
                    <span className="animate-pulse">listening... chant freely</span>
                ) : (
                    <span className="text-gray-400">Tap mic to start</span>
                )}
            </div>

            {lastChant && (
                <div className="text-orange-400 text-lg font-bold animate-bounce">
                    {lastChant}
                </div>
            )}

            <button 
                onClick={toggleMic}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                    isListening 
                    ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse' 
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
            >
                {isListening ? <MicOff size={40} /> : <Mic size={40} />}
            </button>

            <button onClick={() => { setJapaCount(0); localStorage.setItem("japa_count", "0"); }} className="text-xs text-gray-400 underline mt-8">
                Reset Counter
            </button>
        </div>
      ) : (
        /* === CHAT MODE UI === */
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
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <input 
                        className="flex-1 bg-transparent px-2 outline-none text-gray-700"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask Krishna..."
                    />
                    <button onClick={sendMessage} disabled={loading} className="p-3 bg-yellow-500 text-white rounded-full shadow-md">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}