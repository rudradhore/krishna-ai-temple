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
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. I am here to guide you. Speak your heart." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Audio State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true); 
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. LOAD PREFERENCE ---
  useEffect(() => {
    const savedAudio = localStorage.getItem("krishna_audio");
    if (savedAudio !== null) {
      const isEnabled = savedAudio === "true";
      setIsAudioEnabled(isEnabled);
      isAudioEnabledRef.current = isEnabled;
    }
  }, []);

  // --- 2. TOGGLE AUDIO ---
  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    isAudioEnabledRef.current = newState;
    localStorage.setItem("krishna_audio", String(newState));
    if (!newState) window.speechSynthesis.cancel();
  };

  // --- AUTO-SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- VOICE INPUT SETUP ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US'; 
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
        };
        recognition.onerror = (event: any) => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Browser does not support voice.");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  // --- 🆕 HELPER: DETECT HINDI ---
  const isHindiText = (text: string) => {
    // Checks for Devanagari characters (Hindi/Sanskrit range)
    const devanagariPattern = /[\u0900-\u097F]/;
    return devanagariPattern.test(text);
  };

  // --- 3. SMART SPEAK LOGIC ---
  const speakText = (text: string) => {
    if (!isAudioEnabledRef.current) return;

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // 🕵️‍♂️ Detect Language
    if (isHindiText(text)) {
      // --- HINDI MODE ---
      speech.lang = 'hi-IN'; // Force browser to use Hindi Engine
      
      // Try to find a specific Hindi Voice
      const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('HI'));
      if (hindiVoice) {
        speech.voice = hindiVoice;
      }
      // (If no Hindi voice is found, the browser will try its best with the 'lang' setting)
      
    } else {
      // --- ENGLISH MODE ---
      speech.lang = 'en-US';
      const indianEnglishVoice = voices.find(v => v.lang.includes('IN') && v.lang.includes('en'));
      if (indianEnglishVoice) speech.voice = indianEnglishVoice;
    }

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
      setMessages(prev => [...prev, { role: "ai", text: "Connection faint..." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] font-sans">
      {/* HEADER */}
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 p-3 md:p-4 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center border border-yellow-200">
                <span className="text-xl">🪷</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Krishna AI</h1>
        </div>
        <button 
            onClick={toggleAudio}
            className={`p-2 rounded-full transition-all border ${isAudioEnabled ? 'text-yellow-700 bg-yellow-100 border-yellow-200' : 'text-gray-400 bg-gray-50 border-gray-200'}`}
        >
            {isAudioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </header>
      
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm md:text-base
              ${m.role === 'user' ? 'bg-[#E6D0A1] text-gray-900 rounded-br-none' : 'bg-white border border-yellow-100 text-gray-800 rounded-bl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-yellow-600 text-sm animate-pulse px-4">Contemplating...</div>}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* INPUT AREA */}
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
    </div>
  );
}