import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Bot, User, Mic, MicOff, Volume2, VolumeX, ShieldAlert, 
  HelpCircle, ThumbsUp, ThumbsDown, Star, Globe, Compass, 
  Terminal, Search, MessageSquare, ArrowRight, CornerDownRight, Check,
  Server, Activity, Sparkles, BookOpen, ChevronRight, RefreshCw, Cpu, Brain, CheckCircle,
  Copy, Share2, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, Category } from "../types";

interface ChatInterfaceProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onNotificationTriggered: () => void;
  darkMode?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi (हिंदी)", flag: "🇮🇳" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ta", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "fr", name: "French (Français)", flag: "🇫🇷" },
  { code: "es", name: "Spanish (Español)", flag: "🇪🇸" }
];

export default function ChatInterface({ 
  categories, 
  activeCategory, 
  onSelectCategory,
  onNotificationTriggered,
  darkMode = true
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      role: "assistant",
      content: "Hello! I am your Enterprise AI Assistant. I can resolve questions regarding account billing, technical API setup, policies, and more in multiple languages. How may I assist you today?",
      timestamp: new Date().toISOString(),
      language: "en",
      suggestions: [
        "How do I secure my API keys?",
        "What are your refund policies?",
        "Do you support HIPAA compliance?"
      ]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [nlpInspectId, setNlpInspectId] = useState<string | null>(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketQuery, setTicketQuery] = useState("");
  const [ticketCreated, setTicketCreated] = useState(false);
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [ratingComments, setRatingComments] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [audioProgressId, setAudioProgressId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sharedMessageId, setSharedMessageId] = useState<string | null>(null);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Auto scroll on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Quick Recommendations Click
  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  // Web Speech API Microphone handling
  const startVoiceRecognition = () => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang === "hi" ? "hi-IN" : selectedLang === "es" ? "es-ES" : selectedLang === "fr" ? "fr-FR" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // Play assistant voice using /api/tts Gemini model OR falling back to HTML5 Web Speech
  const playTTS = async (text: string, messageId: string, lang: string) => {
    if (!ttsEnabled) return;
    setAudioProgressId(messageId);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          // Decode and play base64 audio chunk via raw PCM
          const binaryStr = atob(data.audio);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }

          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const ctx = audioContextRef.current;

          // Convert 16-bit PCM bytes to Float32 sample format
          const buffer = new ArrayBuffer(bytes.length);
          const view = new DataView(buffer);
          for (let i = 0; i < bytes.length; i++) {
            view.setUint8(i, bytes[i]);
          }
          const int16Array = new Int16Array(buffer);
          const float32Array = new Float32Array(int16Array.length);
          for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
          }

          const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
          audioBuffer.getChannelData(0).set(float32Array);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
            setAudioProgressId(null);
          };
          source.start();
          return;
        }
      } else if (response.status === 503 || response.status === 404) {
        // TTS service unavailable - fall back to browser speech
        console.log("TTS service not available, using browser Web Speech API");
      }
    } catch (e) {
      console.warn("TTS offline, falling back to browser Web Speech Synthesis.", e);
    }

    // Fallback: browser Speech synthesis implementation
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === "es") utterance.lang = "es-ES";
      else if (lang === "fr") utterance.lang = "fr-FR";
      else if (lang === "hi") utterance.lang = "hi-IN";
      else utterance.lang = "en-US";

      utterance.onend = () => setAudioProgressId(null);
      utterance.onerror = () => setAudioProgressId(null);
      speechSynthesis.speak(utterance);
    } else {
      setAudioProgressId(null);
    }
  };

  // Submit main chat query API
  const sendMessage = async (textToSend?: string) => {
    const rawVal = textToSend || inputText;
    if (!rawVal.trim() || isLoading) return;

    if (!textToSend) setInputText("");
    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: rawVal,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawVal,
          conversationId,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversationId);
        
        const botMsg: Message = data.message;
        setMessages(prev => [...prev, botMsg]);

        // Auto play TTS voice responses for optimal accessibility loop
        if (ttsEnabled && botMsg.content) {
          playTTS(botMsg.content, botMsg.id, botMsg.language || "en");
        }

        if (botMsg.escalated) {
          onNotificationTriggered();
        }
      }
    } catch (e) {
      console.error("Chat communication failure", e);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: "Sorry, I am facing temporary service connection limits. Let me retry soon or contact administrator.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Thumbs votes feedback API Call
  const handleMessageFeedback = async (messageId: string, status: "helpful" | "not_helpful") => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedbackRecorded: status } : m));
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId, status })
      });
    } catch (e) {
      console.error("Failed recording feedback feedback", e);
    }
  };

  // Escalation support ticketing API call
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail) return;

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userEmail: ticketEmail,
          userQuery: ticketQuery || messages[messages.length - 2]?.content || "Help request"
        })
      });

      if (res.ok) {
        setTicketCreated(true);
        onNotificationTriggered();
        setTimeout(() => {
          setTicketModal(false);
          setTicketCreated(false);
          setTicketEmail("");
          setTicketQuery("");
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Star CSAT overall rating submit
  const handleRatingSubmit = async () => {
    if (!overallRating) return;
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          rating: overallRating,
          comments: ratingComments
        })
      });
      if (res.ok) {
        setRatingSubmitted(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");

  return (
    <div id="chat-section-container" className={`flex flex-col h-full relative transition-colors duration-200 ${darkMode ? "bg-transparent text-[#FFFFFF]" : "bg-slate-100 text-slate-800"}`}>
      {/* Top Banner Control Section */}
      <div id="chat-header" className={`border-b px-6 py-4 flex flex-wrap justify-between items-center gap-4 transition-all duration-300 ${darkMode ? "bg-[#0F172A]/40 border-white/8 backdrop-blur-md" : "bg-white border-slate-202"}`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className={`text-[10px] uppercase tracking-widest font-mono font-black ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Cognitive Client Session Active</span>
        </div>

        {/* Global Toolbar Options */}
        <div className="flex items-center gap-3.5">
          {/* TTS Audio toggle */}
          <button 
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg transition-all border ${ttsEnabled 
              ? (darkMode ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100") 
              : (darkMode ? "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400" : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-150")}`}
            title={ttsEnabled ? "Click to disable Speech synthesizer outputs" : "Click to enable Speech synthesizer outputs"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Multilingual Selector banner */}
          <div className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 shadow-sm transition-colors ${darkMode ? "bg-slate-900 border-slate-800 text-indigo-400" : "bg-white border-slate-200 text-slate-700"}`}>
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={selectedLang} 
              onChange={(e) => setSelectedLang(e.target.value)}
              className={`text-xs bg-transparent border-none py-0 pl-0 pr-6 font-medium focus:ring-0 outline-none cursor-pointer ${darkMode ? "text-slate-200 [color-scheme:dark]" : "text-slate-700"}`}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => {
              setTicketQuery(messages[messages.length - 2]?.content || "");
              setTicketModal(true);
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border shadow-sm ${
              darkMode 
                ? "bg-emerald-950/45 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40" 
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Escalate to Human
          </button>
        </div>
      </div>

      {/* Main Grid-based Bento Layout Container */}
      <div className={`flex-1 grid grid-cols-12 gap-5 p-5 min-h-0 overflow-y-auto ${darkMode ? "bg-transparent" : "bg-slate-100"}`}>
        
        {/* LEFT COLUMN: Categories & System Health Scorecard (Bento Cards) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 reveal-hidden-slide">
          
          {/* Card 1: Knowledge Base Directory */}
          <div className={`rounded-xl border p-4.5 flex flex-col gap-3 shadow-lg transition-all flex-1 min-h-[220px] ${
            darkMode ? "bg-slate-900/50 border-slate-800/80 hover:border-slate-700/60" : "bg-white border-slate-200 hover:border-slate-300"}`}
          >
            <div className="flex items-center gap-2 border-b pb-2.5 border-slate-800/60">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className={`font-bold text-xs tracking-tight uppercase ${darkMode ? "text-white" : "text-slate-800"}`}>Knowledge Directory</h3>
            </div>
            
            <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-550"}`}>
              Select a specialized query segment to filter context guidelines or test relevant quick replies.
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {/* Default fallback list to ensure full, interactive Directory Grid */}
              {[
                { id: "platform", name: "Core Account Setup", desc: "API configurations & setup logs", iconName: "Server", color: "text-blue-500" },
                { id: "billing", name: "Billing & Subscriptions", desc: "Refund parameters policies", iconName: "CreditCard", color: "text-emerald-500" },
                { id: "security", name: "Security & HIPAA Compliance", desc: "Encryption standards guidelines", iconName: "ShieldAlert", color: "text-amber-500" }
              ].map((fallbackCat) => {
                const isSelected = activeCategory === fallbackCat.id;
                return (
                  <button
                    key={fallbackCat.id}
                    onClick={() => onSelectCategory(activeCategory === fallbackCat.id ? null : fallbackCat.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/10" 
                        : (darkMode ? "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100")}`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? "text-white" : fallbackCat.color}`} />
                    <div className="min-w-0">
                      <p className="font-bold tracking-tight text-[11px] truncate">{fallbackCat.name}</p>
                      <p className={`text-[9px] truncate ${isSelected ? "text-indigo-200" : (darkMode ? "text-slate-500" : "text-slate-450")}`}>{fallbackCat.desc}</p>
                    </div>
                  </button>
                );
              })}

              {/* Server loaded categories */}
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? "bg-indigo-700 text-white border-indigo-600 shadow-md" 
                        : (darkMode ? "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60" : "bg-slate-50 border-slate-205 hover:bg-slate-100")}`}
                  >
                    <Cpu className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? "text-white" : "text-indigo-400"}`} />
                    <div className="min-w-0">
                      <p className="font-bold tracking-tight text-[11px] truncate">{cat.name}</p>
                      <p className={`text-[9px] truncate ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Platform Engine Telemetry Status */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 shadow-2xl transition-all ${
            darkMode ? "bg-[#0F172A]/75 border-white/5 backdrop-blur-md hover:border-cyan-500/20" : "bg-white border-slate-200"}`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <h3 className={`font-bold text-[10px] uppercase tracking-wider ${darkMode ? "text-white" : "text-slate-800"}`}>System Health</h3>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">Active</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className={darkMode ? "text-slate-550" : "text-slate-450"}>SLA Accuracy Indicator</span>
                  <span className="text-emerald-400 font-bold">96.8%</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-slate-950" : "bg-slate-100"}`}>
                  <div className="bg-emerald-500 h-full w-[96.8%]"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                <div className={`p-2 rounded-lg border ${darkMode ? "bg-slate-950/50 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                  <span className="block text-[8px] uppercase font-bold text-slate-500">ML Engine</span>
                  <span className={`font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>gemini-3.5</span>
                </div>
                <div className={`p-2 rounded-lg border ${darkMode ? "bg-slate-950/50 border-slate-800/60" : "bg-slate-50 border-slate-200"}`}>
                  <span className="block text-[8px] uppercase font-bold text-slate-500">Latency Peak</span>
                  <span className={`font-bold ${darkMode ? "text-amber-400" : "text-amber-600"}`}>&lt; 145ms</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: Interactive Chat Terminal Console (Bento Console) */}
        <div className="col-span-12 lg:col-span-6 flex flex-col h-full min-h-[480px] border rounded-2xl overflow-hidden shadow-2xl relative bg-[#0F172A]/75 border-white/5 backdrop-blur-md hover:border-violet-500/10 transition-all duration-300 reveal-hidden">
          
          {/* Action Header Menu */}
          <div className={`px-4 py-3.5 border-b flex justify-between items-center text-xs shrink-0 ${darkMode ? "bg-slate-950/40 border-white/5 text-slate-300" : "bg-slate-105 border-slate-202"}`}>
            <span className="font-mono flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Session Feed & Diagnostics
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `chat_session_${conversationId || 'new'}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                disabled={messages.length <= 1}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors border shadow-xs ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 hover:bg-slate-900 text-slate-350 disabled:opacity-40" 
                    : "bg-white border-slate-205 hover:bg-slate-50 text-slate-600 disabled:opacity-40"
                }`}
                title="Export active conversation transcript as a JSON file"
              >
                <FileText className="w-3 h-3 text-indigo-500" />
                Export JSON
              </button>
              <button 
                onClick={() => {
                  setMessages([
                    {
                      id: `msg-init-${Date.now()}`,
                      role: "assistant",
                      content: "Hello! I am your Enterprise AI Assistant. How can I assist you today?",
                      timestamp: new Date().toISOString(),
                      language: selectedLang,
                      suggestions: [
                        "How do I secure my API keys?",
                        "What are your refund policies?",
                        "Do you support HIPAA compliance?"
                      ]
                    }
                  ]);
                  setConversationId(null);
                }}
                disabled={messages.length <= 1}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg transition-colors border shadow-xs ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 hover:bg-slate-900 text-rose-400 hover:border-rose-900/40 disabled:opacity-40" 
                    : "bg-white border-slate-205 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                }`}
                title="Clear conversation panel"
              >
                <RefreshCw className="w-3 h-3 text-rose-500" />
                Reset Chat
              </button>
            </div>
          </div>

          {/* Main chat log output */}
          <div id="chat-messages-scroller" className={`flex-1 overflow-y-auto px-5 py-6 space-y-5 ${darkMode ? "bg-slate-950/20" : "bg-slate-50"}`}>
            {messages.map((msg, index) => {
              const isBot = msg.role === "assistant";
              return (
                <motion.div 
                  key={msg.id || index} 
                  initial={{ opacity: 0, y: 15, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 310, 
                    damping: 23,
                    mass: 0.8
                  }}
                  className="flex flex-col max-w-2xl mx-auto space-y-1"
                >
                  <div className={`flex gap-3 items-start ${isBot ? "" : "flex-row-reverse"}`}>
                    {/* User or Bot Avatar Icon - Pulsing Glass Orb design */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      {isBot && (
                        <>
                          <span className="absolute inset-0 rounded-full bg-violet-500/10 blur-[3px] scale-125 animate-pulse"></span>
                          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-violet-600 with-cyan-500 animate-pulse opacity-40"></span>
                        </>
                      )}
                      <div className={`w-8 h-8 rounded-full text-white shadow-xl flex items-center justify-center relative z-10 transition-transform hover:scale-105 active:scale-95 cursor-default ${
                        isBot 
                          ? "bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_12px_rgba(124,58,237,0.35)]" 
                          : "bg-gradient-to-tr from-[#06B6D4] to-[#14B8A6]"
                      }`}>
                        {isBot ? <Bot className="w-4.5 h-4.5 text-cyan-200" /> : <User className="w-4.5 h-4.5 text-slate-100" />}
                      </div>
                    </div>

                    {/* Message body structure */}
                    <div className="flex flex-col space-y-1.5 max-w-[85%]">
                      <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-xs transition-all ${
                        isBot 
                          ? (darkMode ? "bg-[#0F172A]/75 border-white/5 text-slate-200 rounded-tl-none hover:border-violet-500/20" : "bg-white border-slate-202 text-slate-800 rounded-tl-none") 
                          : (darkMode ? "bg-gradient-to-tr from-[#7C3AED]/15 to-[#0F172A]/90 border-[#7C3AED]/25 text-white rounded-tr-none hover:border-[#7C3AED]/40" : "bg-slate-800 border-slate-705 text-white rounded-tr-none")
                        }`}
                      >
                        {/* Render Content */}
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {/* Interactive NLP inspection badge for administrators */}
                        {isBot && (msg.tokens || msg.sentiment) && (
                          <div className={`mt-3 pt-2.5 border-t flex justify-between items-center px-2 py-1.5 rounded-lg ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-slate-50"}`}>
                            <span className="text-[9px] font-mono font-medium text-slate-400">Confidence: {msg.confidence ? Math.round(msg.confidence * 100) : "N/A"}%</span>
                            <button 
                              onClick={() => setNlpInspectId(nlpInspectId === msg.id ? null : msg.id)}
                              className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 font-mono hover:underline"
                            >
                              <Terminal className="w-3 h-3" />
                              {nlpInspectId === msg.id ? "Close NLP HUD" : "Inspect Intent Metrics"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* NLP HUD Inspector panel drawer */}
                      {isBot && nlpInspectId === msg.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-xl border border-slate-800 shadow-md space-y-2 leading-relaxed"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-900 text-slate-400">
                            <span className="text-[10px] font-semibold text-white flex items-center gap-1">
                              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                              Local SpaCy Engine Output
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                            <p><span className="text-slate-500 font-semibold">Matched Intent:</span> <span className="text-sky-400">{msg.intent || "general_help"}</span></p>
                            <p><span className="text-slate-500 font-semibold">Language Detected:</span> <span className="text-sky-400">{msg.language?.toUpperCase() || "EN"}</span></p>
                            <p><span className="text-slate-500 font-semibold">Sentiment Category:</span> <span className={`font-semibold ${msg.sentiment === "positive" ? "text-emerald-400" : msg.sentiment === "negative" ? "text-rose-400" : "text-amber-400"}`}>{msg.sentiment?.toUpperCase() || "NEUTRAL"}</span></p>
                            <p><span className="text-slate-500 font-semibold">Cosine Vector Score:</span> <span className="text-yellow-400">{msg.confidence || "0.00"}</span></p>
                          </div>
                        </motion.div>
                      )}

                      {/* Feedback response rating stars & tags */}
                      {isBot && (
                        <div className="flex flex-wrap items-center gap-2 px-1 text-[10px]">
                          <span className="text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-slate-700">|</span>
                          
                          {/* Volume Speech synthesis trigger */}
                          <button 
                            onClick={() => playTTS(msg.content, msg.id, msg.language || "en")}
                            className={`text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 ${audioProgressId === msg.id ? "animate-pulse font-bold text-indigo-400" : ""}`}
                            title="Say response aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                            {audioProgressId === msg.id ? "Speaking..." : "Listen"}
                          </button>

                          <span className="text-slate-700">|</span>

                          {/* Copy Content and Clipboard integration */}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedMessageId(msg.id);
                              setTimeout(() => setCopiedMessageId(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 font-semibold"
                            title="Copy message to clipboard"
                          >
                            <Copy className="w-3 h-3 text-indigo-500 shrink-0" />
                            {copiedMessageId === msg.id ? "Copied!" : "Copy"}
                          </button>

                          <span className="text-slate-700">|</span>

                          {/* Share Content */}
                          <button 
                            onClick={() => {
                              const shareUrl = `${window.location.origin}?msg=${msg.id}&query=${encodeURIComponent(msg.content.substring(0, 50))}`;
                              navigator.clipboard.writeText(shareUrl);
                              setSharedMessageId(msg.id);
                              setTimeout(() => setSharedMessageId(null), 2000);
                            }}
                            className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 font-semibold"
                            title="Generate a dynamic URL to share this verified FAQ answer"
                          >
                            <Share2 className="w-3 h-3 text-sky-500 shrink-0" />
                            {sharedMessageId === msg.id ? "Shared!" : "Share"}
                          </button>

                          <span className="text-slate-700">|</span>

                          {msg.feedbackRecorded ? (
                            <span className={`text-[10px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded ${darkMode ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                              <Check className="w-3 h-3 text-emerald-500" />
                              Recorded ({msg.feedbackRecorded === "helpful" ? "Helpful" : "Unhelpful"})
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">Helpful?</span>
                              <button 
                                onClick={() => handleMessageFeedback(msg.id, "helpful")}
                                className="text-slate-400 hover:text-emerald-400 transition-colors"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleMessageFeedback(msg.id, "not_helpful")}
                                className="text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggestions quick replies below assistance messages */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pl-11 flex flex-wrap gap-2 pt-1.5">
                      {msg.suggestions.map((sug, sIndex) => (
                        <button
                          key={sIndex}
                          onClick={() => handleSuggestionClick(sug)}
                          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all text-left shadow-2xs flex items-center gap-1 ${
                            darkMode 
                              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        >
                          <Compass className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{sug}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 ml-0.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Dynamic loading state typing animation visual */}
            {isLoading && (
              <div className="flex gap-3 items-start max-w-2xl mx-auto">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className={`px-4 py-3 rounded-2xl rounded-tl-none font-medium text-xs flex items-center gap-2 shadow-sm border ${
                  darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-400"}`}>
                  <span className="flex space-x-1 items-center pb-0.5">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </span>
                  Intent matching analysis...
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Star CSAT bottom Rating Drawer at completion list */}
          {conversationId && messages.length >= 4 && (
            <div className="w-full px-5 pb-3">
              <div className={`rounded-xl p-4.5 border shadow-xl ${
                darkMode ? "bg-gradient-to-r from-slate-900 to-indigo-950 border-indigo-900/60" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                {ratingSubmitted ? (
                  <div className="text-center py-1 space-y-1">
                    <p className="font-semibold text-emerald-400 text-xs">CSAT Evaluation Signal Registered!</p>
                    <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Cognitive systems updated using this session history feedback.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold flex items-center gap-1.5 ${darkMode ? "text-white" : "text-slate-800"}`}>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        Session Rating Evaluation
                      </h4>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Assessment System</span>
                    </div>
                    
                    <div className="flex gap-2.5 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setOverallRating(star)}
                          className={`p-1 px-2.5 rounded-lg border transition-colors ${darkMode ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-white border-slate-205 hover:border-slate-300"}`}
                        >
                          <Star className={`w-5 h-5 ${(overallRating || 0) >= star ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Provide optional diagnostic commentary on precision..."
                        value={ratingComments}
                        onChange={(e) => setRatingComments(e.target.value)}
                        className={`w-full text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          darkMode ? "bg-slate-950 border border-slate-800 text-white placeholder-slate-600" : "bg-white border border-slate-200 text-slate-800"}`}
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleRatingSubmit}
                          disabled={!overallRating}
                          className="text-[10px] font-bold bg-[#7C3AED] hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
                        >
                          File Diagnostics Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main chat input panel bar */}
          <div id="chat-composer" className={`p-4 border-t transition-colors ${darkMode ? "bg-slate-950/40 backdrop-blur-md border-white/5" : "bg-white border-slate-202"}`}>
            <div className="relative flex gap-3 items-center">
              {/* Audio recording microphone control trigger */}
              {speechSupported && (
                <button 
                  onClick={startVoiceRecognition}
                  className={`p-3 rounded-xl transition-all shadow-sm shrink-0 border cursor-pointer ${
                    isRecording 
                      ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse border-rose-650" 
                      : (darkMode ? "bg-slate-900/60 border-white/5 text-slate-400 hover:text-white" : "bg-slate-100 border-slate-202 text-slate-500 hover:bg-slate-150")}`}
                  title={isRecording ? "Recording active. Speak now..." : "Trigger Speech-to-Text inputs"}
                >
                  {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Text area input bar wrapper */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={isRecording ? "Transcribing speech signals..." : "Ask questions or describe your issues..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isRecording}
                  className={`w-full pl-4.5 pr-12 py-3 bg-slate-900 focus:outline-none rounded-xl text-xs sm:text-sm transition-all font-medium disabled:opacity-75 ${
                    darkMode 
                      ? "bg-[#0F172A]/70 border border-white/10 text-white focus:border-violet-500/80 focus:bg-[#0F172A]/90 placeholder-slate-500" 
                      : "bg-slate-50 border border-slate-205 text-slate-850 focus:border-indigo-600 focus:bg-white placeholder-slate-400"}`}
                />
                
                <button 
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim()}
                  className={`absolute right-1.5 top-1.5 p-2 rounded-lg transition-all cursor-pointer ${
                    inputText.trim() 
                      ? "bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white shadow-md transform active:scale-95" 
                      : "text-slate-550 bg-transparent opacity-30 cursor-not-allowed"}`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-center text-[9px] text-slate-500 mt-2">
              Semantic Similarity Vector Engine active • NLP AI Coordinator: <b>gemini-3.5-flash</b>
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Intent & Metadata Telemetry HUD (Bento Cards) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 reveal-hidden-simple">
          
          {/* Card 3: Neural Vector Telemetry HUD */}
          <div className={`rounded-xl border p-4.5 flex flex-col gap-3.5 shadow-2x transition-all flex-1 min-h-[220px] ${
            darkMode ? "bg-[#0F172A]/75 border-white/5 backdrop-blur-md hover:border-violet-500/20 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]" : "bg-white border-slate-202 hover:border-slate-300"}`}
          >
            <div className="flex items-center gap-2 border-b pb-2.5 border-slate-800/60">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className={`font-bold text-xs tracking-tight uppercase ${darkMode ? "text-white" : "text-slate-800"}`}>Intent Parser HUD</h3>
            </div>

            {lastAssistantMsg ? (
              <div className="space-y-3.5 text-xs">
                <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-550"}`}>
                  Real-time cognitive metrics obtained from the previous query parsing:
                </p>

                <div className="space-y-2">
                  <div className={`p-2.5 rounded-lg border flex justify-between items-center ${darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-mono text-slate-500">Detected Intent</span>
                    <span className="font-bold text-sky-400 text-[10px] font-mono">{lastAssistantMsg.intent || "general_help"}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex justify-between items-center ${darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-mono text-slate-500">Language Signature</span>
                    <span className="font-bold text-emerald-400 text-[10px] font-mono">{lastAssistantMsg.language?.toUpperCase() || "EN"}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex justify-between items-center ${darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-[10px] font-mono text-slate-500">Embedding Score</span>
                    <span className="font-bold text-amber-400 text-[10px] font-mono">{lastAssistantMsg.confidence || "0.925"}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Matched Lexical Lemmas</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(lastAssistantMsg.lemmas || lastAssistantMsg.tokens || ["api", "key", "secur", "billing", "policy"]).map((tok, ti) => (
                      <span key={ti} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        darkMode ? "bg-slate-950 border-slate-800 text-purple-400" : "bg-slate-105 border-slate-205 text-indigo-700"}`}>
                        {tok}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-3 space-y-2.5">
                <Terminal className="w-7 h-7 text-slate-700 animate-pulse" />
                <div>
                  <p className={`font-bold text-[11px] ${darkMode ? "text-slate-300" : "text-slate-700"}`}>Awaiting Query Trigger</p>
                  <p className="text-[9px] text-slate-500 leading-snug mt-1">Enter an inquiry in the middle console to fire and visualize NLP metrics parsing graphs.</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Escalation Support Prompt Block */}
          <div className={`rounded-xl border p-4.5 flex flex-col gap-3 shadow-2xl transition-all ${
            darkMode ? "bg-[#0F172A]/75 border-white/5 backdrop-blur-md hover:border-emerald-500/20" : "bg-white border-slate-202"}`}
          >
            <div className="flex items-center gap-1.5 border-b pb-2 border-slate-850/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className={`font-bold text-[10px] uppercase tracking-wider ${darkMode ? "text-white" : "text-slate-850"}`}>CRM Escalation</h3>
            </div>

            <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-550"}`}>
              Unable to locate correct operational parameters? Submit an official compliance ticket to managers instantly.
            </p>

            <button
              onClick={() => {
                setTicketQuery(messages[messages.length - 2]?.content || "");
                setTicketModal(true);
              }}
              className="w-full text-center text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5" />
              File SLA Support Ticket
            </button>
          </div>

        </div>

      </div>

      {/* Support Ticketing Modal escalation panel */}
      {ticketModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-801"} space-y-4 text-xs`}
          >
            {ticketCreated ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/20">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold">Support Ticket Created Successfully!</h3>
                <p className={`text-[11px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-650"}`}>
                  Ticket <b>#tkt-{Date.now()}</b> has been routed into administrative panels. Support will follow up inside your registered email details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicketSubmit} className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-extrabold">Generate SLA CRM Escalation</h3>
                    <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Logs diagnostic data records inside administration zone.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setTicketModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-405 mb-1">Your Registered Corporate Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. support-manager@enterprise.com"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      className={`w-full text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        darkMode ? "bg-slate-950 border border-slate-850 text-white placeholder-slate-600" : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-405 mb-1">Inquiry Context & Details</label>
                    <textarea
                      required
                      placeholder="Explain the technical or operations limits..."
                      value={ticketQuery}
                      onChange={(e) => setTicketQuery(e.target.value)}
                      rows={4}
                      className={`w-full text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed ${
                        darkMode ? "bg-slate-950 border border-slate-850 text-white placeholder-slate-600" : "bg-slate-50 border border-slate-205 text-slate-805 placeholder-slate-400"}`}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setTicketModal(false)}
                    className={`flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors ${
                      darkMode ? "bg-slate-800 hover:bg-slate-750 text-slate-350" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold py-2.5 rounded-lg shadow-md transition-all"
                  >
                    Submit Ticket Escalation
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
