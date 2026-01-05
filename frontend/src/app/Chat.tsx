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

  // --- STATE ---
  const [messages, setMessages] = useState([
    { role: "ai", text: "🌸 Namaste. Speak your heart." }
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

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#FDFBF7] font-sans">
      
      {/* 🌸 1. THE MISSING LOTUS BACKGROUND (RESTORED) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 200 200" className="w-[120%] md:w-[600px] h-auto text-yellow-600 opacity-[0.08]" fill="currentColor">
          <path d="M100 10 Q110 50 100 90 Q90 50 100 10 Z" />
          <path d="M100 90 Q120 60 130 30 Q115 45 100 90 Z" />
          <path d="M100 90 Q80 60 70 30 Q85 45 100 90 Z" />
          <path d="M100 90 Q140 70 160 40 Q130 70 100 90 Z" />
          <path d="M100 90 Q60 70 40 40 Q70 70 100 90 Z" />
        </svg>
      </div>

      <header className="flex-none z-50 bg-white/90 backdrop-blur-md border-b border-yellow-200 p-3 shadow-sm flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-3">
            <span className="text-2xl">🪷</span>
            <h1 className="text-lg font-bold text-black">Krishna AI</h1>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setMode(mode === 'chat' ? 'japa' : 'chat')} className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${mode === 'japa' ? 'bg-orange-100 text-orange-900 border-orange-300' : 'bg-white text-gray-900 border-gray-300'}`}>{mode === 'chat' ? 'Japa Mode' : 'Chat'}</button>
            <button onClick={toggleAudio} className={`p-2 rounded-full border shadow-sm ${isAudioEnabled ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
        </div>
      </header>

      {mode === 'japa' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500 z-10">
            <div><h2 className="text-gray-600 text-sm uppercase tracking-widest mb-2 font-semibold">Mantra Counter</h2><div className="text-8xl font-bold text-orange-600 drop-shadow-sm font-mono">{japaCount}</div></div>
            <div className="h-8 flex items-center justify-center text-lg font-medium">{isListening ? <span className="animate-pulse text-green-700 font-bold">Listening...</span> : <span className="text-gray-500">Mic Off</span>}</div>
            <div className="w-full max-w-xs h-16 bg-gray-200 rounded p-2 text-xs text-gray-800 overflow-hidden text-center mx-auto border border-gray-300">{debugTranscript || "Say 'Ram', 'Krishna', 'Hari'..."}</div>
            <div className="flex gap-6 items-center">
                <button onClick={toggleMic} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 ${isListening ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>{isListening ? <MicOff size={32} /> : <Mic size={32} />}</button>
                <button onClick={manualCount} className="w-20 h-20 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-xl active:scale-90 hover:bg-orange-600 transition-all border-2 border-orange-400"><Hand size={32} /></button>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">Tap Hand to count manually</p>
            <button onClick={() => { setJapaCount(0); localStorage.setItem("japa_count", "0"); }} className="text-xs text-gray-500 underline mt-4 hover:text-red-500">Reset Counter</button>
        </div>
      ) : (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
                {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-md text-sm md:text-base font-medium ${m.role === 'user' ? 'bg-[#E6D0A1] text-gray-900 border border-yellow-300 rounded-br-none' : 'bg-white text-gray-900 border border-yellow-200 rounded-bl-none'}`}>{m.text}</div>
                </div>
                ))}
                {loading && <div className="text-yellow-700 text-sm animate-pulse px-4 font-semibold">Contemplating...</div>}
                <div ref={messagesEndRef} className="h-2" />
            </div>
            <div className="p-3 bg-white border-t border-yellow-200 shadow-lg z-50">
                <div className="flex gap-2 items-center bg-[#F9F7F2] p-2 rounded-full border border-yellow-300 shadow-inner">
                    <button onClick={toggleMic} className={`p-3 rounded-full shadow-sm ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-gray-600 border border-gray-200'}`}><Mic size={20} /></button>
                    <input className="flex-1 bg-transparent px-2 outline-none text-black placeholder-gray-500 font-medium" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask Krishna..." />
                    <button onClick={sendMessage} disabled={loading} className="p-3 bg-yellow-500 text-white rounded-full shadow-md hover:bg-yellow-600 border border-yellow-600"><Send size={18} /></button>
                </div>
            </div>
        </>
      )}
    </div>
  );
}