"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Volume2, VolumeX, Mic, MicOff } from "lucide-react";

// --- TYPE DEFINITION ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. I am here to guide you with the wisdom of the Gita. Speak your heart, my friend." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // --- REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- AUTO-SCROLL ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // --- INITIALIZE SPEECH (SAFE MODE) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; 
        recognition.lang = 'en-US'; 
        recognition.interimResults = false;

        recognition.onstart = () => {
          console.log("Mic started");
          setIsListening(true);
        };

        recognition.onend = () => {
          console.log("Mic stopped");
          setIsListening(false);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log("Heard:", transcript);
          setInput(transcript); 
        };

        // 🚨 ERROR HANDLING
        recognition.onerror = (event: any) => {
          console.error("Speech Error:", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert("⚠️ Microphone access denied. Please allow microphone permissions in your browser settings.");
          } else if (event.error === 'no-speech') {
            alert("⚠️ I didn't hear anything. Please try speaking closer to the mic.");
          } else {
            alert("⚠️ Voice Error: " + event.error);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("⚠️ Your browser does not support Voice Input. Please try Google Chrome or MS Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        // Sometimes it fails if already started, just reset
        recognitionRef.current.stop(); 
      }
    }
  };

  // --- VOICE LOGIC (OUTPUT) ---
  const speakText = (text: string) => {
    if (!isAudioEnabled) return;
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi'));
    if (indianVoice) speech.voice = indianVoice;
    speech.pitch = 0.9; 
    speech.rate = 0.9;  
    window.speechSynthesis.speak(speech);
  };

  // --- SEND MESSAGE ---
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
      setMessages(prev => [...prev, { role: "ai", text: "My connection is faint. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] overflow-hidden font-sans">
      
      {/* 🪷 LOTUS WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 200 200" className="w-[120%] md:w-[600px] h-auto text-yellow-600 opacity-[0.08]" fill="currentColor">
          <path d="M100 10 Q110 50 100 90 Q90 50 100 10 Z" />
          <path d="M100 90 Q120 60 130 30 Q115 45 100 90 Z" />
          <path d="M100 90 Q80 60 70 30 Q85 45 100 90 Z" />
          <path d="M100 90 Q140 70 160 40 Q130 70 100 90 Z" />
          <path d="M100 90 Q60 70 40 40 Q70 70 100 90 Z" />
        </svg>
      </div>

      {/* HEADER */}
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 p-3 md:p-4 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-50 rounded-full flex items-center justify-center border border-yellow-200">
                <span className="text-lg md:text-xl">🪷</span>
            </div>
            <div>
                <h1 className="text-lg md:text-2xl font-semibold text-gray-800 tracking-wide">Krishna AI</h1>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest hidden sm:block">Wisdom • Compassion • Dharma</p>
            </div>
        </div>
        <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-2 rounded-full transition-all ${isAudioEnabled ? 'text-yellow-700 bg-yellow-100/50' : 'text-gray-400'}`}
        >
            {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>
      
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 z-10 scroll-smooth relative">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-5 rounded-2xl shadow-sm leading-relaxed text-sm md:text-base
              ${m.role === 'user' 
                ? 'bg-[#E6D0A1] text-gray-900 rounded-br-none' 
                : 'bg-white/95 border border-yellow-100 text-gray-800 rounded-bl-none'
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50/50 px-4 py-2 rounded-full border border-yellow-100/50 text-xs animate-pulse">
                <Sparkles size={14} />
                <span className="uppercase tracking-widest font-medium">Contemplating...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* INPUT AREA */}
      <div className="flex-none z-50 bg-white/90 backdrop-blur-lg border-t border-yellow-100 pb-safe">
        <div className="max-w-4xl mx-auto w-full p-3 md:p-4">
            <div className="flex gap-2 items-center bg-[#F9F7F2] p-2 rounded-full border border-yellow-200 focus-within:ring-2 focus-within:ring-yellow-100 transition-all shadow-inner">
            
            {/* 🎙️ UPDATED MIC BUTTON */}
            <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-all ${
                    isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg ring-2 ring-red-200' 
                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                }`}
                title="Speak to Krishna"
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input 
                className="flex-1 bg-transparent px-2 py-2 outline-none text-gray-700 placeholder-gray-400 text-sm md:text-base min-w-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={isListening ? "Listening..." : "Ask or Speak..."}
            />
            
            <button 
                onClick={sendMessage}
                disabled={loading}
                className="flex-none p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-all shadow-md disabled:opacity-50"
            >
                <Send size={18} />
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}