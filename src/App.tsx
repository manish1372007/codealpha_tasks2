import React, { useState, useEffect } from "react";
import { 
  Bot, Shield, Moon, Sun, MessageSquare, ShieldAlert, Check, LogIn,
  Bell, HelpCircle, FileText, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ChatInterface from "./components/ChatInterface";
import AdminPanel from "./components/AdminPanel";
import FAQSection from "./components/FAQSection";
import QuantumBackground from "./components/QuantumBackground";
import { Category, AdminNotification } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"user_chat" | "faq_portal" | "admin_portal">("faq_portal");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // Real-time notification counters
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Authentication states
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");

  // Load basic configurations
  const loadCategoriesAndNotifications = async () => {
    try {
      const [catRes, notRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/notifications")
      ]);

      if (catRes.ok) {
        setCategories(await catRes.json());
      }
      if (notRes.ok) {
        const nots = await notRes.json();
        setNotifications(nots);
        if (nots.some((n: any) => !n.read)) {
          setHasNewAlert(true);
        }
      }
    } catch (e) {
      console.error("Server connection is loading...", e);
    }
  };

  useEffect(() => {
    loadCategoriesAndNotifications();
    
    // Poll alerts every 10 seconds for real-time notification capability!
    const timer = setInterval(() => {
      loadCategoriesAndNotifications();
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Custom Intersection Observer & Dynamic Scroll Parallax Trigger Script
  useEffect(() => {
    // 1. Set up intersection observer for aesthetic scrolling elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    }, {
      root: null,
      threshold: 0.08,
      rootMargin: "0px"
    });

    // Helper to query all potential hidden state layout indicators
    const observeHiddenNodes = () => {
      const hiddenNodes = document.querySelectorAll(".reveal-hidden, .reveal-hidden-simple, .reveal-hidden-slide");
      hiddenNodes.forEach((node) => {
        observer.observe(node);
      });
    };

    // Run first scanning loop immediately
    observeHiddenNodes();

    // Set up a MutationObserver to watch for dynamic DOM modifications (e.g. tabs swap, loaded content, etc.)
    const domMutationObserver = new MutationObserver(() => {
      observeHiddenNodes();
    });

    domMutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 2. Set up smooth scroll-parallax handlers for elements with the .hero descriptor class
    const handleScrollParallax = () => {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop;
      const heroNodes = document.querySelectorAll(".hero");
      heroNodes.forEach((heroNode) => {
        (heroNode as HTMLElement).style.transform = `translateY(${scrolled * 0.5}px)`;
      });
    };

    window.addEventListener("scroll", handleScrollParallax, { passive: true });

    return () => {
      observer.disconnect();
      domMutationObserver.disconnect();
      window.removeEventListener("scroll", handleScrollParallax);
    };
  }, []);

  const triggerNotificationAlert = () => {
    setHasNewAlert(true);
    loadCategoriesAndNotifications();
  };

  // Submit Admin authentication logging API
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPass })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user.role === "admin") {
          setAdminLoggedIn(true);
          setAuthModal(false);
          setActiveTab("admin_portal");
          setAuthEmail("");
          setAuthPass("");
        } else {
          setAuthError("Unauthorized email or administrative limits applied.");
        }
      }
    } catch (e) {
      setAuthError("Failed authentication pipeline check.");
    }
  };

  // Mark notifications as read API
  const handleMarkNotificationsRead = async () => {
    setHasNewAlert(false);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="application-layout-root" className={`min-h-screen flex flex-col font-sans transition-colors duration-200 relative ${darkMode ? "bg-[#050816] text-[#FFFFFF]" : "bg-slate-100 text-slate-800"}`}>
      
      {/* 5-Layer immersive animated Quantum background */}
      {darkMode && <QuantumBackground />}
      
      {/* Top Application Header Navigation Bar */}
      <header className={`px-6 py-4 border-b flex justify-between items-center z-20 transition-all duration-300 ${darkMode ? "bg-[#0F172A]/30 border-white/8 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]" : "bg-white border-slate-200"} shadow-xs`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#7C3AED] via-indigo-600 to-[#06B6D4] rounded-xl text-white shadow-lg shadow-violet-950/40 shrink-0 relative overflow-hidden group">
            <Bot className="w-5.5 h-5.5 relative z-10 animate-pulse text-cyan-200" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-widest flex items-center gap-2 cursor-default text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-100 uppercase">
              FAQ chatbox <span className="text-violet-400 font-extrabold text-[12px] font-mono lowercase tracking-normal">- m7</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider font-mono">Semantic Intent & Learning Intelligence Engine</p>
          </div>
        </div>

        {/* Tab Selector Options */}
        <div className="flex items-center gap-4">
          <div className={`p-1 rounded-xl flex items-center gap-1 border transition-all ${darkMode ? "bg-[#0F172A]/50 border-white/5 backdrop-blur-md" : "bg-slate-50 border-slate-200"}`}>
            <button
              onClick={() => setActiveTab("user_chat")}
              className={`flex items-center gap-2 text-2xs sm:text-xs font-black py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === "user_chat" 
                  ? darkMode 
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] font-extrabold" 
                    : "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              AI Support Chat
            </button>
            <button
              onClick={() => setActiveTab("faq_portal")}
              className={`flex items-center gap-2 text-2xs sm:text-xs font-black py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === "faq_portal" 
                  ? darkMode 
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] font-extrabold" 
                    : "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Instant FAQ Portal
            </button>
            <button
              onClick={() => {
                if (adminLoggedIn) {
                  setActiveTab("admin_portal");
                } else {
                  setAuthModal(true);
                }
              }}
              className={`flex items-center gap-2 text-2xs sm:text-xs font-black py-2 px-4 rounded-lg transition-all cursor-pointer ${
                activeTab === "admin_portal" 
                  ? darkMode 
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] font-extrabold" 
                    : "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              SaaS Admin Dashboard
              {adminLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          </div>

          <div className="flex items-center gap-2.5 border-l border-white/10 pl-4">
            {/* Real-time Notifications Bell indicator */}
            {adminLoggedIn && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotificationPopup(!showNotificationPopup);
                    if (hasNewAlert) handleMarkNotificationsRead();
                  }}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${darkMode ? "bg-slate-900/60 border-white/5 hover:bg-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"}`}
                >
                  <Bell className="w-4 h-4" />
                  {hasNewAlert && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>


                {/* Notifications overlay panel dropdown */}
                {showNotificationPopup && (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl p-4 space-y-3 z-50 text-xs ${darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"}`}>
                    <div className="flex justify-between items-center border-b pb-2 text-slate-400">
                      <span className="font-bold uppercase tracking-wider text-[10px]">Real-Time CRM Alerts</span>
                      <button onClick={() => setShowNotificationPopup(false)} className="font-bold">✕</button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-center text-slate-400 py-3">No admin alert signals registered today.</p>
                      ) : (
                        notifications.map((note) => (
                          <div key={note.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-700 leading-snug">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-700 uppercase text-[9px]">{note.type.replace("_", " ")}</span>
                              <span className="text-[8px] text-slate-400 font-mono">{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="font-bold text-[11px] text-slate-800">{note.title}</p>
                            <p className="text-[10px] text-slate-500">{note.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Main application body panel slotting */}
      <main id="app-main-view" className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "user_chat" ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ChatInterface 
                categories={categories}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                onNotificationTriggered={triggerNotificationAlert}
                darkMode={darkMode}
              />
            </motion.div>
          ) : activeTab === "faq_portal" ? (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <FAQSection 
                darkMode={darkMode} 
                onNavigateToChat={() => setActiveTab("user_chat")}
                categories={categories}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <AdminPanel darkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Admin Authentication Login Modal Popup */}
      {authModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-2xl max-w-sm w-full p-6.5 shadow-2xl border ${darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"} space-y-4 text-xs`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>🔒 Administrative Authorization Gate</h3>
                <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-450"}`}>Restricted zone authorization portal.</p>
              </div>
              <button 
                onClick={() => setAuthModal(false)}
                className={`p-1 rounded transition-colors ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-400"}`}
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 p-3 rounded-lg font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div className={`p-3 rounded-lg italic text-[10px] leading-relaxed border ${darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-205 text-slate-600"}`}>
                * Note: Under prompt rules settings, use any password e.g., <b>'admin123'</b> to grant direct sign-in for preview testing.
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-705"}`}>Admin Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@enterprise.ai"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400"}`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-705"}`}>Secret Authorization Password</label>
                <input
                  type="password"
                  required
                  placeholder="Password passphrase"
                  value={authPass}
                  onChange={(e) => setAuthPass(e.target.value)}
                  className={`w-full text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? "bg-slate-950 border border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400"}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModal(false)}
                  className={`flex-1 font-semibold py-2.5 rounded-lg transition-colors ${darkMode ? "bg-slate-800 hover:bg-slate-750 text-slate-300" : "bg-slate-105 text-slate-700 hover:bg-slate-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-1 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Request Sign In
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
