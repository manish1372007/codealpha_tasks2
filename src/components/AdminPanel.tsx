import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  LayoutDashboard, BookOpen, Clock, Heart, Users, CheckCircle, 
  Settings, RefreshCw, AlertCircle, Plus, Trash2, Edit2, ShieldAlert,
  ArrowRight, Sparkles, FileText, Upload, Volume2, Search, Filter, 
  Check, ChevronRight, X, Clock8, Star
} from "lucide-react";
import { FAQ, Category, SupportTicket, AdminNotification, LearningRecommendation } from "../types";
import AnalyticsDashboard from "./AnalyticsDashboard";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const PRESET_DOCUMENTS = [
  {
    title: "SaaS API Security Guide",
    content: "Enterprise API rate limitation guidelines. Standard premium tiers authorize up to 2000 Requests Per Minute (RPM) to maintain server throughput. Security requires caching token keys server-side; do not expose credentials inside browser headers. HIPAA compliance is activated with enterprise AES-256 TLS 1.3 encryption matrices."
  },
  {
    title: "HR Employee Travel Policies",
    content: "Corporate travel reimbursable boundaries. Standard daily food allowance matches $75 per individual. All travel bookings should route via the HR Travel portal 14 days in advance. Reimbursements process weekly on Friday. Accommodation guidelines restrict choice to standard 3-star business lodging tiers."
  },
  {
    title: "E-Commerce Return Matrix",
    content: "General commercial refund policies. Customer items are candidate for return inside 30 calendar days from initial shipping receipt confirmation. Return postages are free using prepaid courier vouchers downloaded from customer accounts. Sale items marked custom-clearance are non-reimbursable."
  }
];

interface AdminPanelProps {
  darkMode?: boolean;
}

export default function AdminPanel({ darkMode = true }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "kb" | "escalations" | "learning" | "import">("dashboard");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // FAQ Form State
  const [faqModal, setFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("");
  const [faqStatus, setFaqStatus] = useState<"active" | "draft" | "archived">("active");
  const [faqTags, setFaqTags] = useState("");
  const [historyModalFaq, setHistoryModalFaq] = useState<FAQ | null>(null);

  // Search & Filter state for KB
  const [kbSearch, setKbSearch] = useState("");
  const [kbFilterSub, setKbFilterSub] = useState("");

  // Document Upload Extraction state
  const [selectedPresetDoc, setSelectedPresetDoc] = useState<number | null>(null);
  const [customDocText, setCustomDocText] = useState("");
  const [customDocName, setCustomDocName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFaqsCount, setExtractedFaqsCount] = useState<number | null>(null);

  // CSV paste mock state
  const [csvText, setCsvText] = useState("");
  const [csvParseSuccess, setCsvParseSuccess] = useState<string | null>(null);

  // Load Admin Data on startup
  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [kbRes, catRes, tktRes, notRes, recRes, alyRes] = await Promise.all([
        fetch("/api/kb"),
        fetch("/api/categories"),
        fetch("/api/tickets"),
        fetch("/api/notifications"),
        fetch("/api/conversations"), // using this or recommendations endpoint
        fetch("/api/analytics")
      ]);

      if (kbRes.ok) setFaqs(await kbRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (tktRes.ok) setTickets(await tktRes.json());
      if (notRes.ok) setNotifications(await notRes.json());
      
      // Load pending low-confidence suggestions from learning recommendations API directly
      const recsRes = await fetch("/api/analytics");
      if (recsRes.ok) {
        const alyData = await recsRes.json();
        setAnalytics(alyData);
        // Load learning recommendations directly from raw database config or mock
        const sysRecs = await fetch("/api/kb"); // fallbacks
      }

      // Re-fetch custom training suggestions
      const mockRecommendations = [
        { id: "rec-1", missedQuery: "What are the rate limits for premium API keys?", count: 3, suggestedQuestion: "What are the API rate limits on premium plans?", suggestedAnswer: "Our premium tier allows up to 2,000 API requests per minute. Custom enterprise agreements can be provisioned for high-scale users.", status: "pending" as const, detectedIntent: "technical_limits" },
        { id: "rec-2", missedQuery: "Can we sign a dynamic BAA for HIPAA data?", count: 2, suggestedQuestion: "How do we sign a HIPAA BAA agreement?", suggestedAnswer: "Our enterprise legal experts provide standard pre-signed Business Associate Agreements (BAAs) prior to onboarding database records.", status: "pending" as const, detectedIntent: "regulatory_compliance" }
      ];
      setRecommendations(mockRecommendations);

    } catch (e) {
      console.error("Failed fetching admin details", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update support ticket status via API
  const updateTicketStatus = async (ticketId: string, status: "open" | "in_progress" | "resolved") => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // KB: Add or update FAQ
  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;

    const payload = {
      question: faqQuestion,
      answer: faqAnswer,
      categoryId: faqCategory || categories[0]?.id || "cat-3",
      status: faqStatus,
      tags: faqTags ? faqTags.split(",").map(t => t.trim()) : [],
      updatedBy: "Admin Portal"
    };

    try {
      let res;
      if (editingFaq) {
        res = await fetch(`/api/kb/${editingFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/kb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setFaqModal(false);
        setEditingFaq(null);
        setFaqQuestion("");
        setFaqAnswer("");
        setFaqTags("");
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // KB: Delete FAQ
  const handleFaqDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this resource FAQ?")) return;
    try {
      const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (e) {
       console.error(e);
    }
  };

  // Learning recommendations: Approve learning suggestion
  const handleApproveRecommendation = async (recId: string) => {
    try {
      const res = await fetch(`/api/learning/approve/${recId}`, { method: "POST" });
      if (res.ok) {
        setRecommendations(prev => prev.filter(r => r.id !== recId));
        alert("FAQ promoted straight to active knowledge list!");
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIgnoreRecommendation = async (recId: string) => {
    try {
      await fetch(`/api/learning/ignore/${recId}`, { method: "POST" });
      setRecommendations(prev => prev.filter(r => r.id !== recId));
    } catch (e) {
      console.error(e);
    }
  };

  // FAQ generator: document upload extraction API
  const handleDocExtraction = async () => {
    let text = "";
    let name = "Custom Doc";
    if (selectedPresetDoc !== null) {
      text = PRESET_DOCUMENTS[selectedPresetDoc].content;
      name = PRESET_DOCUMENTS[selectedPresetDoc].title;
    } else {
      text = customDocText;
      name = customDocName || "Uploaded Policy Doc";
    }

    if (!text.trim()) return;
    setIsExtracting(true);
    setExtractedFaqsCount(null);

    try {
      const res = await fetch("/api/kb/generate-from-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: name, textContent: text })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedFaqsCount(data.count);
        setCustomDocText("");
        setCustomDocName("");
        setSelectedPresetDoc(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  // Bulk paste CSV manual parsing
  const handleCSVImport = async () => {
    if (!csvText.trim()) return;
    const lines = csvText.split("\n");
    const dataset = [];

    // Simple parser
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split("|"); // separator pipes
      if (parts.length >= 2) {
        dataset.push({
          question: parts[0]?.trim(),
          answer: parts[1]?.trim(),
          category: parts[2]?.trim() || "Product & Services",
          tags: parts[3]?.trim() || "csv-import"
        });
      }
    }

    if (dataset.length === 0) {
      setCsvParseSuccess("Failed parsing. Please adhere to Question|Answer|Category|Tags format.");
      return;
    }

    try {
      const res = await fetch("/api/kb/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset })
      });
      if (res.ok) {
        setCsvParseSuccess(`Successfully imported ${dataset.length} FAQs!`);
        setCsvText("");
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered FAQs list
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(kbSearch.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(kbSearch.toLowerCase()) || 
                          faq.tags.some(t => t.toLowerCase().includes(kbSearch.toLowerCase()));
    const matchesCategory = kbFilterSub ? faq.categoryId === kbFilterSub : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="admin-main-container" className={`flex h-full transition-colors duration-200 ${darkMode ? "bg-transparent text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* Mini tabs navigation sidebar */}
      <div className={`w-60 border-r flex flex-col justify-between shrink-0 transition-all ${darkMode ? "bg-[#0F172A]/40 border-white/8 backdrop-blur-md" : "bg-white border-slate-205"}`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">KB</div>
            <div>
              <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-800"}`}>Dashboard Admin</h3>
              <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-400"}`}>Enterprise AI Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dashboard" 
                  ? (darkMode ? "bg-indigo-950/40 border-r-3 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-r-3 border-indigo-600 text-indigo-700") 
                  : (darkMode ? "text-slate-400 hover:bg-slate-850" : "text-slate-600 hover:bg-slate-50")}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview & Analytics
            </button>
            <button 
              onClick={() => setActiveTab("kb")} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "kb" 
                  ? (darkMode ? "bg-indigo-950/40 border-r-3 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-r-3 border-indigo-600 text-indigo-700") 
                  : (darkMode ? "text-slate-400 hover:bg-slate-850" : "text-slate-600 hover:bg-slate-50")}`}
            >
              <BookOpen className="w-4 h-4" />
              Manage FAQs Database
              <span className={`ml-auto py-0.5 px-2 rounded-full text-[9px] ${darkMode ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{faqs.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("escalations")} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "escalations" 
                  ? (darkMode ? "bg-indigo-950/40 border-r-3 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-r-3 border-indigo-600 text-indigo-700") 
                  : (darkMode ? "text-slate-400 hover:bg-slate-850" : "text-slate-600 hover:bg-slate-50")}`}
            >
              <ShieldAlert className="w-4 h-4" />
              Escalation Support CRM
              {tickets.filter(t => t.status === "open").length > 0 && (
                <span className="ml-auto bg-rose-500 text-white py-0.5 px-2 rounded-full text-[9px] animate-pulse">{tickets.filter(t => t.status === "open").length}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("learning")} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "learning" 
                  ? (darkMode ? "bg-indigo-950/40 border-r-3 border-indigo-500 text-indigo-400" : "bg-indigo-50 border-r-3 border-indigo-600 text-indigo-700") 
                  : (darkMode ? "text-slate-400 hover:bg-slate-850" : "text-slate-600 hover:bg-slate-50")}`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Learning Recommendations
              <span className="ml-auto bg-amber-500 text-white py-0.5 px-1.5 rounded-full text-[9px]">{recommendations.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("import")} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "import" 
                  ? (darkMode ? "bg-indigo-950/40 border-r-3 border-indigo-500 text-indigo-400" : "bg-indigo-55 border-r-3 border-indigo-600 text-indigo-700") 
                  : (darkMode ? "text-slate-400 hover:bg-slate-850" : "text-slate-600 hover:bg-slate-50")}`}
            >
              <FileText className="w-4 h-4" />
              FAQ Document Generator
            </button>
          </nav>
        </div>

        <div className={`p-5 border-t space-y-2 ${darkMode ? "border-slate-800" : "border-slate-150"}`}>
          <div className={`border rounded-lg p-3 text-2xs space-y-1.5 ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex justify-between font-bold">
              <span>Embedding Engine:</span>
              <span className="text-emerald-400 font-semibold uppercase">Active</span>
            </div>
            <p className={darkMode ? "text-slate-500" : "text-slate-400"}>Cosine index optimized for FAQ document vector weights.</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className={`w-full flex items-center justify-center gap-2 py-2 text-2xs border rounded-lg transition-colors font-semibold ${
              darkMode 
                ? "bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300" 
                : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Database
          </button>
        </div>
      </div>

      {/* Tab Panels content scroller */}
      <div id="admin-scroller" className={`flex-1 overflow-y-auto px-8 py-6 transition-colors ${darkMode ? "bg-transparent font-normal" : "bg-slate-50"}`}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center flex-col gap-3">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className={`text-xs font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>Synchronizing Cloud Run JSON Database...</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header section admin banner */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-800"}`}>
                  {activeTab === "dashboard" && "Overview Analytics & Insights"}
                  {activeTab === "kb" && "Knowledge Base Database Registry"}
                  {activeTab === "escalations" && "Support Ticketing Escalations CRM"}
                  {activeTab === "learning" && "Continuous AI Learning & Intent Recommendations"}
                  {activeTab === "import" && "Document-Based FAQ Generator"}
                </h1>
                <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {activeTab === "dashboard" && "Real-time accuracy mapping, sentiment indicators, and search telemetry."}
                  {activeTab === "kb" && "Maintain categories, create context logs, and analyze version history."}
                  {activeTab === "escalations" && "Handle escalated user sessions and resolve pending client queries."}
                  {activeTab === "learning" && "Identify knowledge gaps from unresolved queries and promote AI suggested FAQ answers."}
                  {activeTab === "import" && "Upload policies or manuals to automatically extract robust FAQs using Gemini API."}
                </p>
              </div>

              {activeTab === "kb" && (
                <button 
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqQuestion("");
                    setFaqAnswer("");
                    setFaqTags("");
                    setFaqModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add New FAQ Row
                </button>
              )}
            </div>

            {/* TAB: DASHBOARD PANELS VIEW */}
            {activeTab === "dashboard" && (
              <AnalyticsDashboard
                darkMode={darkMode}
                analyticsData={analytics}
                categories={categories}
                faqs={faqs}
                onRefresh={fetchAdminData}
              />
            )}

            {/* TAB: FAQ KNOWLEDGE BASE DATABASE */}
            {activeTab === "kb" && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                
                {/* Search & Filter bar FAQs section */}
                <div className="p-4.5 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex gap-3 flex-1 max-w-lg">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5. w-4 h-4 text-slate-400 top-3" />
                      <input
                        type="text"
                        placeholder="Search standard FAQs tags, questions, answers..."
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                        className="w-full text-xs bg-white text-slate-800 pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    <select
                      value={kbFilterSub}
                      onChange={(e) => setKbFilterSub(e.target.value)}
                      className="text-xs bg-white text-slate-800 border border-slate-200 px-3 py-2.5 rounded-lg focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">Displaying {filteredFaqs.length} of {faqs.length} registry entries</span>
                </div>

                {/* Table list rows FAQs */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-250 text-slate-500 font-bold text-2xs uppercase tracking-wider">
                        <th className="py-4.5 px-6">FAQ Inquiries (Semantic Keys)</th>
                        <th className="py-4.5 px-5">Topic category</th>
                        <th className="py-4.5 px-5">Status state</th>
                        <th className="py-4.5 px-5">Views/Searches</th>
                        <th className="py-4.5 px-5">Utility Feedback</th>
                        <th className="py-4.5 px-5 text-right">Row Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredFaqs.map((faq) => {
                        const cat = categories.find(c => c.id === faq.categoryId);
                        return (
                          <tr key={faq.id} className="hover:bg-slate-50/50 text-xs transition-colors">
                            <td className="py-4.5 px-6 space-y-1 max-w-md">
                              <p className="font-bold text-slate-800 leading-snug">{faq.question}</p>
                              <p className="text-slate-500 leading-relaxed truncate">{faq.answer}</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {faq.tags.map((tag, tIdx) => (
                                  <span key={tIdx} className="bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4.5 px-5">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded text-[10px]">
                                {cat ? cat.name : "Unassigned"}
                              </span>
                            </td>
                            <td className="py-4.5 px-5">
                              <span className={`inline-block py-0.5 px-2 rounded-full font-bold text-[9px] uppercase border ${
                                faq.status === "active" 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                  : faq.status === "draft" 
                                    ? "bg-amber-50 border-amber-200 text-amber-700" 
                                    : "bg-slate-100 border-slate-300 text-slate-600"
                              }`}>
                                {faq.status}
                              </span>
                            </td>
                            <td className="py-4.5 px-5 font-mono text-slate-500">
                              <span>{faq.viewCount}v</span> • <span>{faq.searchCount}s</span>
                            </td>
                            <td className="py-4.5 px-5">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                                <span className="text-emerald-600 font-bold">+{faq.helpfulVotes}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-rose-500 font-bold">-{faq.unhelpfulVotes}</span>
                              </div>
                            </td>
                            <td className="py-4.5 px-5 text-right space-x-1 shrink-0">
                              {faq.versions && faq.versions.length > 0 && (
                                <button 
                                  onClick={() => setHistoryModalFaq(faq)}
                                  className="p-1 px-2.5 rounded-md hover:bg-slate-100 text-slate-500 font-semibold text-[10px]"
                                  title="Audit editing versions of this FAQ"
                                >
                                  Versions ({faq.versions.length})
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingFaq(faq);
                                  setFaqQuestion(faq.question);
                                  setFaqAnswer(faq.answer);
                                  setFaqCategory(faq.categoryId);
                                  setFaqStatus(faq.status);
                                  setFaqTags(faq.tags.join(", "));
                                  setFaqModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 inline-block transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleFaqDelete(faq.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 inline-block transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB: SUPPORT CRITICAL TICKETS CRM ESCALATION */}
            {activeTab === "escalations" && (
              <div className="space-y-6">
                
                {/* Tickets dynamic row tables */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5.5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm">Escalated CRM Session Records</h3>
                    <span className="text-xs bg-rose-50 border border-rose-200 text-rose-700 py-1 px-2.5 rounded-md font-semibold">
                      {tickets.filter(t => t.status !== "resolved").length} Active Escalations Pending
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-2xs tracking-wider border-b border-slate-250 font-bold">
                          <th className="py-4 px-6">Ticket Details</th>
                          <th className="py-4 px-5">Client Query</th>
                          <th className="py-4 px-5">Priority</th>
                          <th className="py-4 px-5">Raised on</th>
                          <th className="py-4 px-5">Status</th>
                          <th className="py-4 px-5 text-right">System Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-xs">
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-slate-400 font-semibold">
                              No escalated tickets raised yet. Chat confidence matching is doing stable duty!
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4.5 px-6 space-y-1 max-w-sm">
                                <p className="font-bold text-slate-800 leading-snug">#{t.id}</p>
                                <p className="font-semibold text-indigo-700 leading-tight">{t.generatedSummary}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Mail: {t.userEmail} • Session: {t.conversationId}</p>
                              </td>
                              <td className="py-4.5 px-5 max-w-xs leading-relaxed text-slate-550 italic">
                                "{t.userQuery}"
                              </td>
                              <td className="py-4.5 px-5">
                                <span className={`inline-block py-0.5 px-2 rounded-md uppercase text-[9px] font-bold ${
                                  t.priority === "high" 
                                    ? "bg-rose-100 text-rose-700" 
                                    : t.priority === "medium" 
                                      ? "bg-amber-100 text-amber-700" 
                                      : "bg-slate-100 text-slate-600"
                                }`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="py-4.5 px-5 font-mono text-slate-400 text-[10px]">
                                {new Date(t.createdAt).toLocaleString()}
                              </td>
                              <td className="py-4.5 px-5">
                                <span className={`inline-block py-0.5 px-2 rounded-full font-bold text-[9px] uppercase border ${
                                  t.status === "open" 
                                    ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse" 
                                    : t.status === "in_progress" 
                                      ? "bg-amber-50 border-amber-200 text-amber-700" 
                                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-4.5 px-5 text-right space-y-1.5">
                                {t.status !== "resolved" && (
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => updateTicketStatus(t.id, "in_progress")}
                                      className="text-[10px] bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded transition-colors font-semibold"
                                    >
                                      Progress
                                    </button>
                                    <button
                                      onClick={() => updateTicketStatus(t.id, "resolved")}
                                      className="text-[10px] bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded transition-colors font-bold"
                                    >
                                      Resolve
                                    </button>
                                  </div>
                                )}
                                <p className="text-[9px] text-slate-400">Admin Ticket Tracking ID</p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: CONTINUOUS AI LEARNING */}
            {activeTab === "learning" && (
              <div className="space-y-6">
                
                {/* Learning insight cards */}
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Continuous AI Knowledge Loop</span>
                    </div>
                    <h3 className="text-lg font-bold">Unresolved & Low Confidence Query Intelligence Tracker</h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      This autonomous system detects failed client inquiries falling below the threshold limits. 
                      Gemini analyzes query semantic gaps, recommends pre-drafted standard Q&As, and lets you approve them instantly.
                    </p>
                  </div>
                  <div className="bg-indigo-900/60 border border-indigo-800 p-4.5 rounded-xl text-center">
                    <span className="text-3xl font-black block text-amber-400">{recommendations.length}</span>
                    <span className="text-[10px] tracking-wider uppercase text-slate-300 font-semibold block mt-0.5">Deficit Query Cards</span>
                  </div>
                </div>

                {/* Recommendations Grid lists */}
                <div className="grid grid-cols-1 gap-6">
                  {recommendations.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center text-slate-400 font-semibold border border-slate-200">
                      Unresolved list empty! The continuous AI learning loops have zero pending deficits today.
                    </div>
                  ) : (
                    recommendations.map((rec) => (
                      <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div className="space-y-0.5">
                            <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase py-0.5 px-2 rounded-full inline-block">
                              Missed Search Target ({rec.count} sessions)
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm">Failed Client Terms: <span className="text-slate-600 font-semibold italic text-xs">"{rec.missedQuery}"</span></h4>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleIgnoreRecommendation(rec.id)}
                              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200"
                            >
                              Ignore
                            </button>
                            <button 
                              onClick={() => handleApproveRecommendation(rec.id)}
                              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & Publish FAQ
                            </button>
                          </div>
                        </div>

                        {/* Interactive Q&A generated suggestion preview card under */}
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4.5 space-y-3">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600">Gemini Recommended Question</span>
                            <p className="text-xs font-bold text-slate-800">{rec.suggestedQuestion}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600">Gemini Recommended Answer</span>
                            <p className="text-xs font-medium leading-relaxed text-slate-600">{rec.suggestedAnswer}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB: BULK DOCUMENT/CSV IMPORT GENERATOR */}
            {activeTab === "import" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* File/Doc FAQ Generator Panel side */}
                <div className="bg-white rounded-2xl border border-slate-205 p-5.5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Convert Documents to FAQs</h3>
                      <p className="text-[10px] text-slate-400">Generates 3-5 complete contextual Q&As using Gemini API</p>
                    </div>
                  </div>

                  {extractedFaqsCount !== null && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Success! Automatically extracted {extractedFaqsCount} complete FAQ rows into the database registry as drafts!
                    </div>
                  )}

                  <div className="space-y-3.5">
                    <p className="text-xs font-bold text-slate-700">Option A: Select Preset Document Samples</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {PRESET_DOCUMENTS.map((doc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedPresetDoc(idx);
                            setCustomDocText(doc.content);
                          }}
                          className={`text-2xs font-semibold p-3 border rounded-xl text-center flex flex-col justify-between h-20 leading-tight transition-all ${selectedPresetDoc === idx ? "bg-indigo-50 border-indigo-500 text-indigo-600 font-bold" : "bg-slate-50 hover:bg-slate-100- border-slate-200 text-slate-600"}`}
                        >
                          <FileText className={`w-4 h-4 mx-auto mb-1 ${selectedPresetDoc === idx ? "text-indigo-600" : "text-slate-400"}`} />
                          {doc.title}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold text-slate-700">Option B: Paste Custom Manuals/Policies Text</p>
                      <input
                        type="text"
                        placeholder="Project/File name (e.g. Refund Policy, Company Rules)"
                        value={customDocName}
                        onChange={(e) => setCustomDocName(e.target.value)}
                        className="w-full text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 placeholder-slate-400"
                      />
                      <textarea
                        placeholder="Paste document policy, legal handbook, compliance outline, product specifications handbook text here..."
                        rows={6}
                        value={customDocText}
                        onChange={(e) => {
                          setSelectedPresetDoc(null);
                          setCustomDocText(e.target.value);
                        }}
                        className="w-full text-xs bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 placeholder-slate-400"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleDocExtraction}
                        disabled={isExtracting || !customDocText.trim()}
                        className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-550 border-indigo-700 hover:border-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isExtracting ? "Extracting FAQs via Gemini API..." : "Extract FAQs with AI"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CSV Importer Panel side */}
                <div className="bg-white rounded-2xl border border-slate-205 p-5.5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Bulk CSV FAQ Data Importer</h3>
                      <p className="text-[10px] text-slate-400">Bulk load structured pipe-separated files instantly.</p>
                    </div>
                  </div>

                  {csvParseSuccess && (
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-3.5 rounded-lg text-xs font-semibold">
                      {csvParseSuccess}
                    </div>
                  )}

                  <div className="space-y-3.5 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Copy paste bulk rows in the text area below. Use pipe symbols (<code>|</code>) as dividing lines, separating categories and comma tags easily.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[10px] text-slate-500 space-y-1">
                      <span className="font-bold text-slate-705 block uppercase tracking-wider text-[9px] mb-1">Standard Format Scheme Example:</span>
                      <p>Question | Answer | Category | Tags</p>
                      <p>How do password reset? | Click button. | Support | tech, api-limits</p>
                      <p>Do you sign SLA? | No yearly support SLA is signed. | Policy | sla, legal</p>
                    </div>

                    <textarea
                      placeholder="Question | Answer | Category | Tags"
                      rows={6}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 placeholder-slate-400"
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleCSVImport}
                        disabled={!csvText.trim()}
                        className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all"
                      >
                        Submit Bulk Upload CSV
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* FAQ Creation & Editing Drawer Dialog Modal */}
      {faqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-xl w-full p-6.5 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">{editingFaq ? "Edit Existing Registry FAQ Row" : "Add New Knowledge Base Row"}</h3>
              <button 
                onClick={() => setFaqModal(false)}
                className="p-1 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFaqSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Question Formulation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Do you support HIPAA health encryption guidelines?"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Detailed Informational Answer</label>
                <textarea
                  required
                  placeholder="Provide complete diagnostic guides or company policy limits details here..."
                  rows={4}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Topic category</label>
                  <select
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="w-full bg-slate-50 text-slate-805 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Status State</label>
                  <select
                    value={faqStatus}
                    onChange={(e) => setFaqStatus(e.target.value as any)}
                    className="w-full bg-slate-50 text-slate-805 border border-slate-200 rounded-lg p-2.5 focus:outline-none"
                  >
                    <option value="active">Active (Visible to search)</option>
                    <option value="draft">Draft (Private edit history)</option>
                    <option value="archived">Archived (System logs only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Search Keywords & Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. security, api limits, billing, tags"
                  value={faqTags}
                  onChange={(e) => setFaqTags(e.target.value)}
                  className="w-full bg-slate-50 text-slate-808 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setFaqModal(false)}
                  className="bg-slate-100 hover:bg-slate-150 text-slate-700 font-semibold py-2.5 px-4.5 rounded-lg transition-colors border border-slate-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Publish Knowledge Base Row
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* Version History Modal Auditer Logs Dialog */}
      {historyModalFaq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-xl w-full p-6.5 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">FAQ Audit Version History Logs</h3>
                <p className="text-[10px] text-slate-400">Listing historical edit logs for verification diagnostics.</p>
              </div>
              <button 
                onClick={() => setHistoryModalFaq(null)}
                className="p-1 rounded hover:bg-slate-150 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 flex items-center gap-1.5 leading-none mb-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Active Registry (Current Version)
                </span>
                <p className="font-bold text-slate-800">{historyModalFaq.question}</p>
                <p className="text-slate-600 leading-relaxed italic">"{historyModalFaq.answer}"</p>
                <p className="text-[10px] text-slate-400 font-mono">Last edited on {new Date(historyModalFaq.lastUpdated).toLocaleString()}</p>
              </div>

              {historyModalFaq.versions.map((ver, vIdx) => (
                <div key={ver.id || vIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 relative">
                  <div className="flex justify-between items-center text-slate-400 border-b border-slate-200/60 pb-1.5 mb-1 text-[10px] font-mono">
                    <span className="font-bold text-slate-500 uppercase tracking-wide">Historical Snapshot #{vIdx + 1}</span>
                    <span>Admin: {ver.updatedBy}</span>
                  </div>
                  <p className="font-bold text-slate-800">{ver.question}</p>
                  <p className="text-slate-600 leading-relaxed italic">"{ver.answer}"</p>
                  <p className="text-[9px] text-slate-400 font-mono">Archived Snapshot date: {new Date(ver.updatedAt).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryModalFaq(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Close Audit Viewer
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
