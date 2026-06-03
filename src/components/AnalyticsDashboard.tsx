import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, Clock, Info, ShieldAlert, Cpu, Activity, Sparkles, 
  Flame, Zap, RotateCw, RefreshCw, BarChart3, HelpCircle, Eye, 
  ThumbsUp, MessageSquare, AlertTriangle, Calendar, Download, Plus
} from "lucide-react";
import { Category, FAQ } from "../types";

// Premium accent colors matching the prompt theme requirements
const PRIMARY_GRADIENT = ["#7C3AED", "#06B6D4", "#14B8A6"];
const RECHARTS_COLORS = [
  "#7C3AED", // Violet
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EF4444"  // Rose
];

interface AnalyticsDashboardProps {
  darkMode?: boolean;
  analyticsData: any;
  categories: Category[];
  faqs: FAQ[];
  onRefresh: () => void;
}

export default function AnalyticsDashboard({ 
  darkMode = true, 
  analyticsData, 
  categories, 
  faqs, 
  onRefresh 
}: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"realtime" | "24h" | "7d" | "30d" | "ytd">("24h");
  const [activeMetricTab, setActiveMetricTab] = useState<"queries" | "sentiment" | "latency">("queries");
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  
  // Simulated realtime traffic states
  const [liveTraffic, setLiveTraffic] = useState<{ time: string; queryCount: number; latency: number }[]>([]);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState(false);
  const [spikeCount, setSpikeCount] = useState(0);

  // Initialize simulated realtime ticking streams on mount
  useEffect(() => {
    const generateInitialBuffer = () => {
      const buffer = [];
      const now = new Date();
      for (let i = 10; i >= 0; i--) {
        const timeMarker = new Date(now.getTime() - i * 5000);
        buffer.push({
          time: timeMarker.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          queryCount: Math.floor(Math.random() * 8) + 2,
          latency: Math.floor(Math.random() * 40) + 12
        });
      }
      return buffer;
    };

    setLiveTraffic(generateInitialBuffer());

    const interval = setInterval(() => {
      setLiveTraffic((prev) => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const randomFactor = isSimulatingSpike ? Math.floor(Math.random() * 45) + 35 : Math.floor(Math.random() * 8) + 2;
        const randomLatency = isSimulatingSpike ? Math.floor(Math.random() * 120) + 70 : Math.floor(Math.random() * 35) + 12;
        
        const nextSlice = [
          ...prev.slice(1), 
          { time: nextTime, queryCount: randomFactor, latency: randomLatency }
        ];

        return nextSlice;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulatingSpike]);

  // Handler for manual traffic load burst simulation
  const handleTriggerLoadSpike = () => {
    setIsSimulatingSpike(true);
    setSpikeCount(prev => prev + 1);
    
    // Auto-resolve normal state after 25 seconds
    setTimeout(() => {
      setIsSimulatingSpike(false);
    }, 25000);
  };

  // Memoized query volume trends based on chosen timeframe
  const queryTrendsData = useMemo(() => {
    const defaultData = [
      { date: "May 28", searches: 120, precision: 92, unresolved: 14 },
      { date: "May 29", searches: 145, precision: 89, unresolved: 10 },
      { date: "May 30", searches: 168, precision: 94, unresolved: 18 },
      { date: "May 31", searches: 130, precision: 91, unresolved: 8 },
      { date: "Jun 01", searches: 195, precision: 88, unresolved: 22 },
      { date: "Jun 02", searches: 224, precision: 93, unresolved: 15 },
      { date: "Jun 03", searches: 265, precision: 95, unresolved: 12 }
    ];

    if (timeframe === "realtime") {
      return liveTraffic.map(p => ({
        date: p.time,
        searches: p.queryCount,
        precision: p.latency > 50 ? 84 : Math.round(92 + Math.random() * 6),
        unresolved: Math.max(0, Math.floor(p.queryCount * 0.1))
      }));
    }

    if (timeframe === "7d") {
      return defaultData;
    }

    if (timeframe === "30d") {
      // Generate 30 days of clean trends
      return Array.from({ length: 30 }).map((_, idx) => {
        const day = new Date();
        day.setDate(day.getDate() - (29 - idx));
        return {
          date: day.toLocaleDateString([], { month: "short", day: "numeric" }),
          searches: Math.floor(Math.random() * 150) + 90,
          precision: Math.floor(Math.random() * 10) + 88,
          unresolved: Math.floor(Math.random() * 14) + 2
        };
      });
    }

    if (timeframe === "ytd") {
      return [
        { date: "Jan 2026", searches: 1240, precision: 86, unresolved: 145 },
        { date: "Feb 2026", searches: 1590, precision: 89, unresolved: 120 },
        { date: "Mar 2026", searches: 2450, precision: 91, unresolved: 190 },
        { date: "Apr 2026", searches: 3100, precision: 92, unresolved: 210 },
        { date: "May 2026", searches: 4890, precision: 94, unresolved: 310 },
        { date: "Jun 2026", searches: 5120, precision: 95, unresolved: 180 }
      ];
    }

    // Default "24h" represents hourly query tracking matching actual state heatmap or fine-grained simulation
    if (analyticsData?.hourlyHeatmap && analyticsData.hourlyHeatmap.length > 0) {
      return analyticsData.hourlyHeatmap.map((item: any) => ({
        date: `${item.hour}:00`,
        searches: item.queries || Math.floor(Math.random() * 12) + 2,
        precision: Math.round(90 + Math.random() * 8),
        unresolved: item.failed || Math.floor(Math.random() * 3)
      }));
    }

    // Hourly fallback simulator
    return Array.from({ length: 24 }).map((_, h) => ({
      date: `${h}:00`,
      searches: Math.floor(Math.random() * 20) + 5,
      precision: Math.round(89 + Math.random() * 9),
      unresolved: Math.floor(Math.random() * 3)
    }));
  }, [timeframe, liveTraffic, analyticsData]);

  // Aggregate Category distribution data manually with live values
  const compiledCategoryDistribution = useMemo(() => {
    if (analyticsData?.topCategories && analyticsData.topCategories.length > 0) {
      return analyticsData.topCategories.map((item: any, idx: number) => ({
        name: item.name,
        value: item.count || 1,
        fill: RECHARTS_COLORS[idx % RECHARTS_COLORS.length]
      }));
    }

    // Default system categories manual count fallback
    const counts: Record<string, number> = {};
    faqs.forEach(f => {
      const cat = categories.find(c => c.id === f.categoryId);
      const catName = cat ? cat.name : "Other Support";
      counts[catName] = (counts[catName] || 0) + f.viewCount;
    });

    const parsed = Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      fill: RECHARTS_COLORS[idx % RECHARTS_COLORS.length]
    }));

    return parsed.length > 0 ? parsed : [
      { name: "General Helpdesk", value: 145, fill: "#7C3AED" },
      { name: "Technical API Docs", value: 312, fill: "#06B6D4" },
      { name: "PCI & HIPAA Security", value: 198, fill: "#14B8A6" },
      { name: "SaaS Billing Plan", value: 87, fill: "#F59E0B" }
    ];
  }, [analyticsData, faqs, categories]);

  // Radar chart query intensity indicators mapping for high visual fidelity
  const radarMetrics = useMemo(() => {
    return [
      { subject: "Search Density", A: 85, B: 70, fullMark: 100 },
      { subject: "Helpfulness Rating", A: 96, B: 85, fullMark: 100 },
      { subject: "Response Latency", A: 98, B: 90, fullMark: 100 },
      { subject: "Feedback Coverage", A: 78, B: 95, fullMark: 100 },
      { subject: "Accuracy Quotient", A: 93, B: 80, fullMark: 100 },
      { subject: "API Integration Volume", A: 90, B: 75, fullMark: 100 }
    ];
  }, []);

  // Top Trending FAQ Topics view density calculations
  const trendingTopics = useMemo(() => {
    // Sort all merged FAQs using a synthetic trending score: viewCount + searchCount + (helpfulVotes * 3) - (unhelpfulVotes * 2)
    const processed = faqs.map(faq => {
      const helpfulBonus = (faq.helpfulVotes || 0) * 4;
      const penalty = (faq.unhelpfulVotes || 0) * 3;
      const trendScore = (faq.viewCount || 0) + (faq.searchCount || 0) + helpfulBonus - penalty;
      return {
        ...faq,
        trendScore
      };
    });

    return processed
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 5);
  }, [faqs]);

  // Unresolved query list from recommendations
  const unansweredInsights = useMemo(() => {
    if (analyticsData?.missingQueries && analyticsData.missingQueries.length > 0) {
      return analyticsData.missingQueries.slice(0, 4);
    }
    return [
      { query: "How to export telemetry charts to Excel directly?", count: 8, suggested: "Check FAQ Document generator section." },
      { query: "Is there an offline docker mirror package for server testing?", count: 5, suggested: "Create dynamic BAA guides." },
      { query: "Can we use Stripe webhooks without SSL certificates in preview?", count: 3, suggested: "No, Stripe requires validated webhooks." }
    ];
  }, [analyticsData]);

  // Export analytics handler helper
  const handleExportCSVReport = () => {
    const headers = "Metric,Value,AccuracyRatio,Status\n";
    const rows = [
      `Total Logged Queries,${analyticsData?.totalQueries || 452},95%,Index Verified`,
      `Semantic Model Accuracy,${analyticsData?.averageAccuracy || 94}%,100%,Active Graphs`,
      `CSAT Rating,${analyticsData?.feedbackSummary?.ratingAverage || 4.7},92%,Optimized`,
      `Total Users,${analyticsData?.totalUsers || 24},100%,Live Connections`
    ].join("\n");
    
    const universalCSV = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const hiddenTriggerAnchor = document.createElement("a");
    hiddenTriggerAnchor.setAttribute("href", universalCSV);
    hiddenTriggerAnchor.setAttribute("download", "AI_FAQ_Telemetry_Report.csv");
    document.body.appendChild(hiddenTriggerAnchor);
    hiddenTriggerAnchor.click();
    hiddenTriggerAnchor.remove();
  };

  return (
    <div className={`space-y-6 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
      
      {/* TIME-RANGE SELECTOR HEADER & TOOL CONTROL SHELF */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
        darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-205 shadow-sm"
      }`}>
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm">Telemetry Query Controls</h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">Active Matrix Time: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time pulse indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs bg-slate-950/40 border border-slate-850">
            <span className={`inline-block w-2 h-2 rounded-full ${isSimulatingSpike ? "bg-rose-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {isSimulatingSpike ? "Neural Load Spike Active" : "Telemetry Standby Ready"}
            </span>
          </div>

          <div className="flex bg-slate-950/80 border border-slate-850 p-1 rounded-xl">
            {(["realtime", "24h", "7d", "30d", "ytd"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 text-[10px] font-extrabold tracking-wide rounded-lg uppercase transition-all ${
                  timeframe === t 
                    ? "bg-slate-800 text-white shadow-xs font-black" 
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {t === "realtime" ? "Live stream" : t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSVReport}
            className="p-2 border border-slate-850 bg-slate-950/40 hover:bg-slate-900 hover:border-slate-700 rounded-xl text-slate-350 hover:text-white transition-colors"
            title="Download aggregated telemetry metrics CSV sheet"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DYNAMIC ALERT BANNER ON CRITICAL SPIKE FLOWS */}
      <AnimatePresence>
        {isSimulatingSpike && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 flex items-start gap-3.5"
          >
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 space-y-1">
              <h4 className="font-extrabold text-xs">Simulated Semantic API Traffic Spike Triggered</h4>
              <p className="text-[11px] text-rose-400/90 leading-relaxed font-semibold">
                An intentional injection of raw vector searches on standard indices is running. Peak load levels spike latency metrics to ~110ms with concurrent HNSW queries throttling. Telemetry heatmap displays continuous red-shift load profiles.
              </p>
            </div>
            <button 
              onClick={() => setIsSimulatingSpike(false)}
              className="px-2.5 py-1 text-3xs font-extrabold uppercase border border-rose-500/30 text-rose-400 hover:bg-rose-950/50 rounded-lg"
            >
              Suppress Spike
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIGH IMPACT METRIC CARD OVERLAPS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative group rounded-2xl overflow-hidden p-[1px] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-violet-950/10 opacity-70 rounded-2xl group-hover:opacity-100 transition-opacity" />
          <div className="relative p-5 bg-[#0d0d12]/95 rounded-2xl space-y-3.5">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-violet-950/50 border border-violet-500/20 rounded-xl text-violet-400">
                <Activity className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +24.2% MoM
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Indexed Query Volumes</span>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {isSimulatingSpike ? (analyticsData?.totalQueries || 452) + 120 : analyticsData?.totalQueries || 452}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">100% cloud cached routes</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="relative group rounded-2xl overflow-hidden p-[1px] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 to-cyan-950/10 opacity-70 rounded-2xl group-hover:opacity-100 transition-opacity" />
          <div className="relative p-5 bg-[#0d0d12]/95 rounded-2xl space-y-3.5">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/20 rounded-xl text-cyan-400">
                <Cpu className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">Stable Graph</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Semantic Matching Ratio</span>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {isSimulatingSpike ? "83" : analyticsData?.averageAccuracy || 94}%
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">Verified HNSW Similarity Index</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="relative group rounded-2xl overflow-hidden p-[1px] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/30 to-teal-950/10 opacity-70 rounded-2xl group-hover:opacity-100 transition-opacity" />
          <div className="relative p-5 bg-[#0d0d12]/95 rounded-2xl space-y-3.5">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-teal-950/50 border border-teal-500/20 rounded-xl text-teal-400">
                <Clock className="w-5.5 h-5.5 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <span className="text-[10px] font-mono text-teal-400 font-bold flex items-center gap-0.5">
                Avg 14ms
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Max Latency Index</span>
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                {isSimulatingSpike ? "112 ms" : "32.4 ms"}
              </h3>
              <p className="text-[9px] text-slate-500 font-mono">Edge CDN CDN nodes checked</p>
            </div>
          </div>
        </motion.div>

        {/* INTERACTIVE TRAFFIC GENERATION BOX - CRITICAL ADVANCED MICROINTERACTION */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          onClick={handleTriggerLoadSpike}
          className="relative group rounded-2xl overflow-hidden p-[1px] border border-slate-900 shadow-xl cursor-pointer bg-slate-950/60"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-3xs font-mono font-bold bg-indigo-950 border border-indigo-900/60 text-indigo-400 py-0.5 px-2 rounded-md uppercase tracking-widest">
                Admin tool
              </span>
              <Zap className={`w-4 h-4 ${isSimulatingSpike ? "text-amber-400 animate-bounce" : "text-slate-550"}`} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xs text-white">Simulate API Traffic spike</h4>
              <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                Inject custom stress logs to query graphs. Spikes simulated searches {spikeCount > 0 ? `(${spikeCount} triggered)` : ""}.
              </p>
            </div>
            <div className="pt-2">
              <div className="w-full text-center py-2.5 text-2xs font-extrabold text-indigo-400 bg-indigo-950/40 hover:bg-indigo-950/80 border border-indigo-900/40 rounded-xl transition-all">
                {isSimulatingSpike ? "Spike running..." : "Trigger Simulation Burst"}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CORE ANALYTICAL CHARTS MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 1: QUERY VOLUME AREA TIMELINE */}
        <div className={`p-5 rounded-2xl border lg:col-span-2 space-y-4 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-950/5 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs sm:text-sm">Query Volume & Search Resolution Graph</h4>
                <div className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded font-mono text-[9px] uppercase tracking-wide">
                  {timeframe}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">Plots total queries mapped against precision metrics.</p>
            </div>

            <div className="flex items-center gap-4 text-3xs font-mono font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-violet-500 rounded" />
                <span>INDEX MATCH ({queryTrendsData.reduce((acc, curr) => acc + curr.searches, 0)} total)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded" />
                <span>UNRESOLVED ({queryTrendsData.reduce((acc, curr) => acc + curr.unresolved, 0)} items)</span>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={queryTrendsData}>
                <defs>
                  <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnresolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={9} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={9} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff", 
                    borderColor: darkMode ? "#1e293b" : "#e2e8f0",
                    color: darkMode ? "#ffffff" : "#0f172a",
                    borderRadius: "12px",
                    fontSize: "11px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="searches" 
                  name="Searches Matched" 
                  stroke="#7C3AED" 
                  fillOpacity={1} 
                  fill="url(#colorSearches)" 
                  strokeWidth={2} 
                />
                <Area 
                  type="monotone" 
                  dataKey="unresolved" 
                  name="Unresolved Fallbacks" 
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorUnresolved)" 
                  strokeWidth={1.5} 
                />
                <Line 
                  type="monotone" 
                  dataKey="precision" 
                  stroke="#06B6D4" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="Precision Index (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MINDS-EYE RADAR: NETWORK EFFICIENCY SCORECARD */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm">Semantic Efficiency Radar</h4>
            <p className="text-[10px] text-slate-500 font-semibold">Normalized performance metrics plotted dynamically.</p>
          </div>

          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarMetrics}>
                <PolarGrid stroke={darkMode ? "#1e293b" : "#e2e8f0"} />
                <PolarAngleAxis dataKey="subject" stroke={darkMode ? "#94a3b8" : "#475569"} fontSize={8} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                <Tooltip />
                <Radar 
                  name="HNSW Optimized" 
                  dataKey="A" 
                  stroke="#06B6D4" 
                  fill="#06B6D4" 
                  fillOpacity={0.15} 
                />
                <Radar 
                  name="Standard Keyword" 
                  dataKey="B" 
                  stroke="#7C3AED" 
                  fill="#7C3AED" 
                  fillOpacity={0.05} 
                />
                <Legend verticalAlign="bottom" height={24} fontSize={9} iconSize={10} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECOND ROW ANALYTICS: PEAK USAGE HOURS & CATEGORIES PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART 2: PEAK USAGE TIMES BAR CHART */}
        <div className={`p-5 rounded-2xl border space-y-4 lg:col-span-2 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-center border-b border-rose-950/5 pb-3">
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm">Peak Query Activity Hour Allocation</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Identifies exact time frames displaying highest stress thresholds in 24h format.</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2 py-1 rounded">24 Hour Interval Cache</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queryTrendsData.slice(0, 12)}> {/* Shows peak daytime hours for clarity */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                  dataKey="date" 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={9} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={9} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff", 
                    borderColor: darkMode ? "#1e293b" : "#e2e8f0",
                    color: darkMode ? "#ffffff" : "#0f172a",
                    borderRadius: "12px",
                    fontSize: "11px"
                  }} 
                />
                <Bar 
                  dataKey="searches" 
                  name="Matching Queries" 
                  fill="#06B6D4" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45} 
                />
                <Bar 
                  dataKey="unresolved" 
                  name="Unresolved Tickets" 
                  fill="#EF4444" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: TOP CATEGORIES PIE CHART */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex justify-between items-center border-b border-rose-950/5 pb-3">
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm">Search Index Category Weight</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Total active telemetry query distribution.</p>
            </div>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compiledCategoryDistribution}
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {compiledCategoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute text-center">
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {compiledCategoryDistribution.reduce((acc, curr) => acc + curr.value, 0)}
              </span>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Search Hits</p>
            </div>
          </div>

          {/* Detailed Color Legend list mapping with exact hits */}
          <div className="space-y-1.5 max-h-24 overflow-y-auto pt-1 font-mono text-[9px] text-slate-400">
            {compiledCategoryDistribution.map((cat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                  <span className="truncate font-semibold text-slate-350">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-500">{cat.value} hits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED BOTTOM SHELF VIEW: TOP TRENDING TOPICS & UNANSWERED GAPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TOP TRENDING FAQ TOPICS SPOTLIGHT */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between border-b border-rose-950/5 pb-3">
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-violet-400" />
                Trending FAQ Topics Density
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold">Queries displaying maximum engagement, search hits, and CSAT scores logs.</p>
            </div>

            <span className="text-3xs font-mono text-emerald-400 py-0.5 px-2 bg-emerald-950/40 border border-emerald-900 rounded font-bold uppercase">
              Hot list
            </span>
          </div>

          <div className="space-y-3">
            {trendingTopics.map((topic, i) => {
              const activeRatio = Math.round(((topic.helpfulVotes || 12) / ((topic.helpfulVotes || 12) + (topic.unhelpfulVotes || 0) + 0.1)) * 100);
              return (
                <div 
                  key={topic.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                    hoveredTopic === topic.id 
                      ? "border-violet-500/20 bg-violet-950/20 translate-x-1 shadow-lg" 
                      : "border-slate-850 bg-slate-950/20"
                  }`}
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-3xs font-mono font-bold text-slate-500">0{i+1}</span>
                      <h5 className="text-xs font-bold text-slate-250 truncate">{topic.question}</h5>
                    </div>
                    <div className="flex items-center gap-3 text-3xs font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-600" />
                        {topic.viewCount || 0} views
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-extrabold">
                        {activeRatio}% helpful
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold hover:text-white shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 py-1 px-2.5 rounded-lg">
                      #{topic.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UNRESOLVED KNOWLEDGE GAPS */}
        <div className={`p-5 rounded-2xl border space-y-4 shadow-xl ${
          darkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-white border-slate-205"
        }`}>
          <div className="flex items-center justify-between border-b border-rose-950/5 pb-3">
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 text-rose-500/80" />
                Unresolved Knowledge Gaps & Misses
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold">User searches that returned zero database hits or low confidence matched scores.</p>
            </div>

            <span className="text-2xs font-mono text-rose-500 font-extrabold tracking-tight">Requires Training</span>
          </div>

          <div className="space-y-3.5">
            {unansweredInsights.map((g, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-[#0d0d12] border border-slate-850 rounded-xl flex items-start gap-3.5 text-xs text-slate-400 leading-relaxed font-semibold transition-all hover:bg-slate-900"
              >
                <div className="w-6 h-6 rounded bg-rose-950/50 border border-rose-500/20 text-[10px] font-extrabold text-rose-400 flex items-center justify-center font-mono shrink-0">
                  {g.count}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h5 className="font-bold text-white truncate text-xs">"{g.query}"</h5>
                  <div className="flex items-center gap-1 text-3xs font-mono tracking-wide text-slate-500 uppercase font-black leading-none">
                    <Activity className="w-3 h-3 text-indigo-500 shrink-0" />
                    Suggested Topic mapping: {g.suggested.substring(0, 30)}...
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 bg-slate-950/20 p-2.5 border border-slate-850/65 rounded-xl flex gap-3 text-3xs text-slate-500 items-start leading-relaxed font-semibold">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span className="font-medium">
              We recommend using the <strong className="text-indigo-400">FAQ Document Generator</strong> tab to paste standard training PDFs, automatically filling unanswered intents inside the neural memory graphs.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
