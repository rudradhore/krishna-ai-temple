"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Volume2, VolumeX, Menu } from "lucide-react";

export default function Chat() {
  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Jai Shri Krishna. I am here to reflect on your path. How may I serve your heart today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true); 
  
  // --- REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AUTO-SCROLL ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // --- VOICE LOGIC ---
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
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      speakText(data.reply);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "My connection to the divine is faint. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN CONTAINER: 100% Height, Fixed to Viewport
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] overflow-hidden font-sans">
      
      {/* 🪷 RESPONSIVE LOTUS WATERMARK */}
      {/* Centered, but scales down on mobile (w-full) and up on desktop (max-w-2xl) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <svg 
            viewBox="0 0 200 200" 
            className="w-[120%] md:w-[600px] h-auto text-yellow-600 opacity-[0.08]" 
            fill="currentColor"
        >
          <path d="M100 10 Q110 50 100 90 Q90 50 100 10 Z" />
          <path d="M100 90 Q120 60 130 30 Q115 45 100 90 Z" />
          <path d="M100 90 Q80 60 70 30 Q85 45 100 90 Z" />
          <path d="M100 90 Q140 70 160 40 Q130 70 100 90 Z" />
          <path d="M100 90 Q60 70 40 40 Q70 70 100 90 Z" />
          <path d="M100 90 Q160 90 180 70 Q140 100 100 90 Z" />
          <path d="M100 90 Q40 90 20 70 Q60 100 100 90 Z" />
          <path d="M100 90 Q130 110 150 130 Q100 120 100 90 Z" />
          <path d="M100 90 Q70 110 50 130 Q100 120 100 90 Z" />
          <path d="M100 90 Q120 130 100 160 Q80 130 100 90 Z" />
        </svg>
      </div>

      {/* HEADER: Responsive Padding & Text Size */}
      <header className="flex-none z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 p-3 md:p-4 shadow-sm flex justify-between items-center sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-50 rounded-full flex items-center justify-center border border-yellow-200">
                <span className="text-lg md:text-xl">🪷</span>
            </div>
            
            {/* Title Text */}
            <div>
                <h1 className="text-lg md:text-2xl font-semibold text-gray-800 tracking-wide">
                    Krishna AI
                </h1>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest hidden sm:block">
                    Wisdom • Compassion • Dharma
                </p>
            </div>
        </div>

        {/* Audio Toggle - Touch Friendly Area */}
        <button 
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-2 md:p-3 rounded-full transition-all active:scale-95 ${
                isAudioEnabled 
                ? 'text-yellow-700 bg-yellow-100/50 border border-yellow-200' 
                : 'text-gray-400 bg-gray-50 border border-transparent'
            }`}
        >
            {isAudioEnabled ? <Volume2 size={20} className="md:w-6 md:h-6" /> : <VolumeX size={20} className="md:w-6 md:h-6" />}
        </button>
      </header>
      
      {/* CHAT AREA: Responsive Padding */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 z-10 scroll-smooth relative">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-3 md:p-5 rounded-2xl shadow-sm relative leading-relaxed text-sm md:text-base
              ${m.role === 'user' 
                ? 'bg-[#E6D0A1] text-gray-900 rounded-br-none' 
                : 'bg-white/95 border border-yellow-100 text-gray-800 rounded-bl-none backdrop-blur-sm'
              }`}>
              {m.text}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
             <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50/50 px-4 py-2 rounded-full border border-yellow-100/50 text-xs md:text-sm animate-pulse">
                <Sparkles size={14} />
                <span className="uppercase tracking-widest font-medium">Contemplating...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* INPUT AREA: Fixed Bottom, Safe Area for Mobiles */}
      <div className="flex-none z-50 bg-white/90 backdrop-blur-lg border-t border-yellow-100 pb-safe">
        <div className="max-w-4xl mx-auto w-full p-3 md:p-4">
            <div className="flex gap-2 md:gap-3 items-center bg-[#F9F7F2] p-1.5 md:p-2 rounded-full border border-yellow-200 focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-100 transition-all shadow-inner">
            
            <input 
                className="flex-1 bg-transparent px-3 md:px-5 py-2 md:py-3 outline-none text-gray-700 placeholder-gray-400 text-sm md:text-base min-w-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your journey..."
            />
            
            <button 
                onClick={sendMessage}
                disabled={loading}
                className="flex-none p-3 md:p-3.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-all shadow-md disabled:opacity-50 disabled:grayscale transform active:scale-95"
            >
                <Send size={18} className="md:w-5 md:h-5" />
            </button>
            </div>
            
            <div className="text-center mt-2 opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-gray-500 font-serif">
                सर्वं श्रीकृष्णार्पणमस्तु
            </p>
            </div>
        </div>
      </div>
    </div>
  );
}