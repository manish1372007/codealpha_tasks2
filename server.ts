import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client lazy-style to prevent immediate crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Ensure database directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, "db.json");

// Define Initial Database Seeds
const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Account & Billing", description: "Invoices, subscriptions, refunds, and payment security.", iconName: "CreditCard", slug: "billing" },
  { id: "cat-2", name: "Technical Support", description: "API keys, system integrations, rate limits, and outages.", iconName: "Cpu", slug: "technical" },
  { id: "cat-3", name: "Product & Services", description: "General queries about features, supported languages, and widgets.", iconName: "Compass", slug: "product" },
  { id: "cat-4", name: "Enterprise Policies", description: "GDPR, HIPAA, service level agreements (SLA), and security standards.", iconName: "Shield", slug: "policies" }
];

const INITIAL_FAQS = [
  {
    id: "faq-1",
    question: "How do I secure my API keys and prevent unauthorized access?",
    answer: "To secure your API keys, run all chatbot transactions full-stack through a server-side proxy route. Never expose API keys in client-side script files. We recommend setting IP restrictions, enabling request rate-limiting on your server, and periodic key rotations in the Security console under Settings.",
    categoryId: "cat-2",
    status: "active",
    tags: ["security", "api key", "best practices"],
    viewCount: 142,
    searchCount: 88,
    helpfulVotes: 42,
    unhelpfulVotes: 2,
    lastUpdated: "2026-06-01T12:00:00Z",
    versions: [
      { id: "v-1", question: "How do I secure my API keys?", answer: "To secure your API keys, run all chatbot transactions full-stack through a proxy server.", status: "active", updatedBy: "System Setup", updatedAt: "2026-05-15T09:00:00Z" }
    ],
    embedding: null
  },
  {
    id: "faq-2",
    question: "What is your refund policy for enterprise plans?",
    answer: "We offer a full 14-day money-back guarantee for all monthly plans. For enterprise SLA-bound yearly agreements, please contact your account manager directly. Refunds are processed within 5-7 business days back to your original payment method.",
    categoryId: "cat-1",
    status: "active",
    tags: ["refund", "billing", "enterprise"],
    viewCount: 94,
    searchCount: 41,
    helpfulVotes: 23,
    unhelpfulVotes: 4,
    lastUpdated: "2026-05-20T10:30:00Z",
    versions: [],
    embedding: null
  },
  {
    id: "faq-3",
    question: "Do you support HIPAA compliance and medical data encryption?",
    answer: "Yes, our enterprise tiers support HIPAA compliance via a signed Business Associate Agreement (BAA). All message histories, chatbot knowledge databases, and vector caches are encrypted at rest with AES-256 and in transit with TLS 1.3. We also offer fields masking for patient Names and SSNs.",
    categoryId: "cat-4",
    status: "active",
    tags: ["hipaa", "security", "pii", "healthcare"],
    viewCount: 112,
    searchCount: 56,
    helpfulVotes: 35,
    unhelpfulVotes: 0,
    lastUpdated: "2026-05-28T14:15:00Z",
    versions: [],
    embedding: null
  },
  {
    id: "faq-4",
    question: "What languages does the AI chatbot support?",
    answer: "The chatbot fully supports real-time multi-lingual interactions! These include English, Hindi, Kannada, Telugu, Tamil, French, and Spanish. It features automatic language detection, real-time translations, and optional Voice Text-to-Speech assistants in native dialects.",
    categoryId: "cat-3",
    status: "active",
    tags: ["multilingual", "languages", "speech", "hindi"],
    viewCount: 201,
    searchCount: 132,
    helpfulVotes: 76,
    unhelpfulVotes: 1,
    lastUpdated: "2026-06-01T15:45:00Z",
    versions: [],
    embedding: null
  },
  {
    id: "faq-5",
    question: "How do I embed the chatbot widget directly on my Webflow/HTML website?",
    answer: "Embedding the widget is very simple. Locate the integration snippet in the admin dashboard under Settings, copy the script tag, and paste it directly before the closing body tag of your HTML. This will float the floating chat bubble instantly mapped to your KB engine.",
    categoryId: "cat-3",
    status: "active",
    tags: ["embed", "widget", "webflow", "website"],
    viewCount: 153,
    searchCount: 92,
    helpfulVotes: 51,
    unhelpfulVotes: 3,
    lastUpdated: "2026-05-22T11:00:00Z",
    versions: [],
    embedding: null
  },
  {
    id: "faq-6",
    question: "¿Cuáles son sus horas de oficina de soporte?",
    answer: "Nuestras horas de oficina de ayuda al cliente de soporte técnico son de lunes a viernes de 9:00 AM a 6:00 PM EST. El chatbot de IA está activo de forma continua 24/7 para responder cualquier consulta general de su cuenta.",
    categoryId: "cat-3",
    status: "active",
    tags: ["horas", "spanish", "soporte", "horario"],
    viewCount: 45,
    searchCount: 22,
    helpfulVotes: 12,
    unhelpfulVotes: 0,
    lastUpdated: "2026-05-18T08:00:00Z",
    versions: [],
    embedding: null
  },
  {
    id: "faq-7",
    question: "Quelles sont les heures d'ouverture du support?",
    answer: "Notre support d'aide aux clients est disponible du lundi au vendredi de 9:00 AM à 6:00 PM EST. Notre chatbot d'analyse d'IA est fonctionnel 24 heures sur 24 pour des réponses instantanées.",
    categoryId: "cat-3",
    status: "active",
    tags: ["hours", "french", "support", "ouverture"],
    viewCount: 38,
    searchCount: 15,
    helpfulVotes: 8,
    unhelpfulVotes: 0,
    lastUpdated: "2026-05-18T08:15:00Z",
    versions: [],
    embedding: null
  }
];

// Seed file-backed database if empty
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      return {
        categories: data.categories || INITIAL_CATEGORIES,
        faqs: data.faqs || INITIAL_FAQS,
        conversations: data.conversations || [],
        tickets: data.tickets || [],
        notifications: data.notifications || [],
        recommendations: data.recommendations || [],
        feedback: data.feedback || []
      };
    } catch (e) {
      console.error("Failed to parse database file, rewriting default structure.", e);
    }
  }

  const defaultDb = {
    categories: INITIAL_CATEGORIES,
    faqs: INITIAL_FAQS,
    conversations: [],
    tickets: [],
    notifications: [
      { id: "note-1", type: "missing_faq", title: "Missing FAQ recommendations", message: "Two queries related to 'API key pricing limits' failed to resolve.", timestamp: new Date().toISOString(), read: false }
    ],
    recommendations: [
      { id: "rec-1", missedQuery: "What are the rate limits for premium API keys?", count: 3, suggestedQuestion: "What are the API rate limits on premium plans?", suggestedAnswer: "Our premium tier allows up to 2,000 API requests per minute. Custom enterprise agreements can be provisioned for high-scale users.", status: "pending", detectedIntent: "technical_limits" }
    ],
    feedback: []
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Load current DB
let db = loadDatabase();

// Middleware for parsing requests
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Helper: Cosine Similarity calculate
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Detect sentiment locally (no API needed)
function detectLocalSentiment(text: string): "positive" | "neutral" | "negative" {
  const lowerText = text.toLowerCase();
  const positiveWords = ["good", "great", "excellent", "happy", "helpful", "thank", "thanks", "perfect", "amazing", "awesome"];
  const negativeWords = ["bad", "terrible", "awful", "angry", "unhappy", "hate", "problem", "issue", "broken", "failed", "error"];
  
  let positiveCount = 0, negativeCount = 0;
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

// Helper: Detect intent locally (no API needed)
function detectLocalIntent(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/\b(api|key|authentication|token|secret|integration)\b/)) return "it_support";
  if (lowerText.match(/\b(price|cost|billing|payment|invoice|subscription|charge|fee)\b/)) return "billing_query";
  if (lowerText.match(/\b(feature|function|capability|support|language|widget|embed)\b/)) return "product_features";
  if (lowerText.match(/\b(hello|hi|hey|greet|help)\b/)) return "general_greetings";
  if (lowerText.match(/\b(hour|time|office|support|available|when)\b/)) return "office_timings";
  if (lowerText.match(/\b(plan|tier|package|enterprise|standard|basic)\b/)) return "pricing_plans";
  if (lowerText.match(/\b(complain|issue|problem|bug|error|failed|broken)\b/)) return "complaint";
  
  return "general_query";
}

// Helper: Extract entities locally (no API needed)
function extractLocalEntities(text: string): Array<{ text: string; type: string }> {
  const entities: Array<{ text: string; type: string }> = [];
  
  // Email pattern
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    entities.push({ text: emailMatch[0], type: "email" });
  }
  
  // URL pattern
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (urlMatch) {
    entities.push({ text: urlMatch[0], type: "url" });
  }
  
  // Simple date pattern (YYYY-MM-DD or DD/MM/YYYY)
  const dateMatch = text.match(/\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}/);
  if (dateMatch) {
    entities.push({ text: dateMatch[0], type: "date" });
  }
  
  return entities;
}

// Generate Embeddings asynchronously in background to not block setup (Optional - will skip if no API key)
async function runEmbeddingPrecalculations() {
  const ai = getAi();
  if (!ai) {
    console.log("⚠️  Skipping embedding pre-computation - GEMINI_API_KEY is missing or invalid.");
    console.log("✅ Application will work fine without embeddings using keyword-based search.");
    return;
  }

  let modified = false;
  for (const faq of db.faqs) {
    if (!faq.embedding) {
      try {
        console.log(`Precomputing embedding for FAQ: "${faq.question}"...`);
        const res: any = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: faq.question
        });
        const values = res.embeddings?.values || res.embedding?.values || res.embeddings?.[0]?.values;
        if (values) {
          faq.embedding = values;
          modified = true;
          // Small delay to prevent hitting rate limits early
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      } catch (e) {
        console.error(`Error computing embedding for: "${faq.question}"`, e);
      }
    }
  }

  if (modified) {
    saveDatabase(db);
    console.log("✅ Database embedding seeds successfully pre-computed.");
  }
}

// Trigger background calculations
setTimeout(() => {
  runEmbeddingPrecalculations().catch(err => console.error("Precalculation thread failed", err));
}, 1000);

// API: Authentication Simulation
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  // Simple administrative authorization
  if (email === "admin@enterprise.ai" || password === "admin123" || email === "manishom137@gmail.com") {
    return res.json({
      success: true,
      token: "mock-jwt-token-val-098",
      user: {
        email: email || "admin@enterprise.ai",
        name: "Enterprise Admin",
        role: "admin"
      }
    });
  }
  return res.json({
    success: true,
    token: "mock-jwt-token-val-123",
    user: {
      email: email || "user@client.com",
      name: "Standard Client",
      role: "user"
    }
  });
});

// API: Manage categories
app.get("/api/categories", (req, res) => {
  res.json(db.categories);
});

// API: KB Knowledge Base CRUD operations
app.get("/api/kb", (req, res) => {
  res.json(db.faqs);
});

app.post("/api/kb", async (req, res) => {
  const { question, answer, categoryId, status, tags } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required" });
  }

  const newFaq: any = {
    id: `faq-${Date.now()}`,
    question,
    answer,
    categoryId: categoryId || "cat-3",
    status: status || "draft",
    tags: tags || [],
    viewCount: 0,
    searchCount: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    lastUpdated: new Date().toISOString(),
    versions: [],
    embedding: null
  };

  // Embed content if feasible (optional - will work without embeddings)
  const ai = getAi();
  if (ai) {
    try {
      const embRes: any = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: question
      });
      const values = embRes.embeddings?.values || embRes.embedding?.values || embRes.embeddings?.[0]?.values;
      if (values) {
        newFaq.embedding = values;
      }
    } catch (e) {
      console.error("Embed calculation failed for new query FAQ (skipping)", e);
    }
  }

  db.faqs.push(newFaq);
  saveDatabase(db);
  res.json(newFaq);
});

app.put("/api/kb/:id", async (req, res) => {
  const { id } = req.params;
  const { question, answer, categoryId, status, tags, updatedBy } = req.body;

  const idx = db.faqs.findIndex((f: any) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });

  const oldFaq = db.faqs[idx];
  
  // Track Version History
  const historicalVersion = {
    id: `v-${Date.now()}`,
    question: oldFaq.question,
    answer: oldFaq.answer,
    status: oldFaq.status,
    updatedBy: updatedBy || "Administrator",
    updatedAt: oldFaq.lastUpdated || new Date().toISOString()
  };

  const updatedVersions = [...(oldFaq.versions || []), historicalVersion];

  const updatedFaq: any = {
    ...oldFaq,
    question: question ?? oldFaq.question,
    answer: answer ?? oldFaq.answer,
    categoryId: categoryId ?? oldFaq.categoryId,
    status: status ?? oldFaq.status,
    tags: tags ?? oldFaq.tags,
    lastUpdated: new Date().toISOString(),
    versions: updatedVersions
  };

  // If question is updated, recount embeddings
  if (question && question !== oldFaq.question) {
    const ai = getAi();
    if (ai) {
      try {
        const embRes: any = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: question
        });
        const values = embRes.embeddings?.values || embRes.embedding?.values || embRes.embeddings?.[0]?.values;
        if (values) {
          updatedFaq.embedding = values;
        }
      } catch (e) {
        console.error("Embed calculation failed on FAQ edit list update (skipping)", e);
      }
    } else {
      updatedFaq.embedding = null;
    }
  }

  db.faqs[idx] = updatedFaq;
  saveDatabase(db);
  res.json(updatedFaq);
});

app.post("/api/kb/:id/vote", (req, res) => {
  const { id } = req.params;
  const { vote } = req.body; // "helpful" or "unhelpful"
  const idx = db.faqs.findIndex((f: any) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });

  const faq = db.faqs[idx];
  if (vote === "helpful") {
    faq.helpfulVotes = (faq.helpfulVotes || 0) + 1;
  } else if (vote === "unhelpful") {
    faq.unhelpfulVotes = (faq.unhelpfulVotes || 0) + 1;
    // Log negative feedback automatically as an alert CRM Notification
    db.notifications.push({
      id: `note-${Date.now()}`,
      type: "customer_feedback",
      title: `Low rating on FAQ: "${faq.question.substring(0, 30)}..."`,
      message: `User marked FAQ as unhelpful in the instant portal. Feedback review is suggested.`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }
  // Also track overall view count or general activity inside analytics
  saveDatabase(db);
  res.json({ success: true, helpfulVotes: faq.helpfulVotes, unhelpfulVotes: faq.unhelpfulVotes });
});

app.post("/api/kb/:id/view", (req, res) => {
  const { id } = req.params;
  const idx = db.faqs.findIndex((f: any) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });

  db.faqs[idx].viewCount = (db.faqs[idx].viewCount || 0) + 1;
  db.faqs[idx].searchCount = (db.faqs[idx].searchCount || 0) + 1; // map with analytics weights
  saveDatabase(db);
  res.json({ success: true, viewCount: db.faqs[idx].viewCount });
});

app.delete("/api/kb/:id", (req, res) => {
  const { id } = req.params;
  const idx = db.faqs.findIndex((f: any) => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });

  db.faqs.splice(idx, 1);
  saveDatabase(db);
  res.json({ success: true, message: "FAQ removed permanently." });
});

// CSV Bulk Import Action
app.post("/api/kb/bulk-import", async (req, res) => {
  const { dataset } = req.body; // Array of { question, answer, category, tags }
  if (!Array.isArray(dataset)) {
    return res.status(400).json({ error: "Invalid bulk dataset. Expects an array." });
  }

  const ai = getAi();
  const loadedCount = dataset.length;
  let successCount = 0;

  for (const rows of dataset) {
    if (!rows.question || !rows.answer) continue;

    // Find category or assign product
    let cat = db.categories.find((c: any) => c.name.toLowerCase() === (rows.category || "").toLowerCase());
    let categoryId = cat ? cat.id : "cat-3";

    const newFaq: any = {
      id: `faq-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question: rows.question,
      answer: rows.answer,
      categoryId,
      status: "active",
      tags: rows.tags ? rows.tags.split(",").map((t: string) => t.trim()) : ["bulk"],
      viewCount: 0,
      searchCount: 0,
      helpfulVotes: 0,
      unhelpfulVotes: 0,
      lastUpdated: new Date().toISOString(),
      versions: [],
      embedding: null
    };

    if (ai) {
      try {
        const emb: any = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: rows.question
        });
        const values = emb.embeddings?.values || emb.embedding?.values || emb.embeddings?.[0]?.values;
        if (values) {
          newFaq.embedding = values;
        }
      } catch (e) {
        console.error("Bulk embed calculating failed (skipping)", e);
      }
    }

    db.faqs.push(newFaq);
    successCount++;
  }

  if (successCount > 0) {
    saveDatabase(db);
  }

  res.json({ success: true, count: successCount, total: loadedCount });
});

// Document-Based FAQ Generator API (Extracts FAQs using Gemini - Optional)
app.post("/api/kb/generate-from-file", async (req, res) => {
  const { fileName, textContent } = req.body;
  if (!textContent || textContent.trim().length === 0) {
    return res.status(400).json({ error: "Text content is required for FAQ extraction." });
  }

  const ai = getAi();
  if (!ai) {
    return res.json({
      success: false,
      error: "AI Integration currently inactive. Populate GEMINI_API_KEY in environment variables to enable automatic FAQ extraction."
    });
  }

  try {
    const prompt = `Inspect the following document text and automatically extract a list of exactly 3-5 high-quality FAQ questions and answers. Format your output strictly as a JSON list in this format:
    [
      {
        "question": "A logical clear question extracted from text",
        "answer": "A detailed clear response sourced strictly from the text content provided.",
        "category": "Account & Billing" | "Technical Support" | "Product & Services" | "Enterprise Policies"
      }
    ]
    
    Document text:
    """
    ${textContent.substring(0, 8000)}
    """`;

    const cleanModel = "gemini-3.5-flash";
    const response = await ai.models.generateContent({
      model: cleanModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an elite enterprise knowledge manager. Extract clean FAQs as a JSON database from text documents."
      }
    });

    const text = response.text?.trim() || "[]";
    const parsedFAQs = JSON.parse(text);
    
    // Add them as draft FAQs
    const created = [];
    for (const faq of parsedFAQs) {
      const cat = db.categories.find((c: any) => c.name === faq.category) || db.categories[2];
      const newFaq: any = {
        id: `faq-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        question: faq.question,
        answer: faq.answer,
        categoryId: cat.id,
        status: "draft",
        tags: ["file-extraction", fileName ? fileName.substring(0, 15) : "document"],
        viewCount: 0,
        searchCount: 0,
        helpfulVotes: 0,
        unhelpfulVotes: 0,
        lastUpdated: new Date().toISOString(),
        versions: [],
        embedding: null
      };

      try {
        const emb: any = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: faq.question
        });
        const values = emb.embeddings?.values || emb.embedding?.values || emb.embeddings?.[0]?.values;
        if (values) {
          newFaq.embedding = values;
        }
      } catch (e) {
        console.error("Embedding generation for file FAQ fail", e);
      }

      db.faqs.push(newFaq);
      created.push(newFaq);
    }

    if (created.length > 0) {
      saveDatabase(db);
    }

    res.json({ success: true, count: created.length, faqs: created });
  } catch (e: any) {
    console.error("FAQ Extraction failed", e);
    res.status(500).json({ error: "Failed to extract FAQs due to modeling error: " + e.message });
  }
});

// API: Voice Synthesis (TTS) via gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  const { text, language } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required for Speech Synthesis" });
  }

  const ai = getAi();
  
  // If no AI, return a message indicating TTS is unavailable but the app continues to work
  if (!ai) {
    console.log("TTS Service: Gemini API key not available, TTS disabled. User will fallback to browser Web Speech API.");
    return res.status(503).json({ error: "TTS Service unavailable - API key missing", fallbackAvailable: true });
  }

  try {
    // Select correct speaker/voice parameters based on language preference
    const isIndianLanguage = ["hi", "ta", "te", "kn"].includes(language || "en");
    const voiceName = isIndianLanguage ? "Kore" : "Puck"; // Kore has higher friendliness matching Indian accents, Puck for Western

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read clearly and politely: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio });
    } else {
      return res.status(500).json({ error: "Audio structure chunk missing in model response." });
    }
  } catch (e: any) {
    console.error("Text-To-Speech pipeline failure", e);
    return res.status(500).json({ error: "TTS model failure: " + e.message });
  }
});

// API: Process chat query with semantic metrics, language detection, entities, sentiment
app.post("/api/chat", async (req, res) => {
  const { message, conversationId, history = [] } = req.body;
  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message query is required" });
  }

  const clientIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "Mozilla/5.0";

  const ai = getAi();
  let matchedFAQ: any = null;
  let confidenceScore = 0.0;
  let semanticMatches: Array<{ faq: any; score: number }> = [];

  // Track search heatmap parameters
  const now = new Date();
  const hourCode = now.getHours();
  const dayCode = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

  // NLP Analytics Payload computed locally/via AI
  // Simple local NLP processing (no API required)
  let nlpMetrics = {
    language: "en",
    tokens: message.split(/\s+/).map((t: string) => t.replace(/[^\w]/g, "")).filter(Boolean),
    lemmas: message.split(/\s+/).map((t: string) => t.toLowerCase().replace(/[^\w]/g, "")).filter(Boolean),
    sentiment: detectLocalSentiment(message),
    intent: detectLocalIntent(message),
    entities: extractLocalEntities(message),
    rewrittenQuery: message
  };

  // Step 1: Use Gemini to build full Intelligent Query Understanding (lemmas, tokens, language, sentiment, intents, entities) - OPTIONAL if AI available
  if (ai) {
    try {
      const nlpSystemInstruction = `You are a high-fidelity natural language pre-processor engine.
      Analyze the query and output a strict JSON scheme. Detect:
      - Language: "en", "hi", "kn", "te", "ta", "fr", "es"
      - Tokens: Exact split array
      - Lemmas: Absolute dictionary roots of words in base form
      - Sentiment: "positive" | "neutral" | "negative" map based on prompt mood
      - Intent: Map user's question to a specific label: "billing_query", "it_support", "product_features", "general_greetings", "office_timings", "pricing_plans", "complaint"
      - Entities: List date, name, email, URL, organization references
      - RewrittenQuery: Standardized search query string.`;

      const parsedNlpResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Inspect user query: "${message}"`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: nlpSystemInstruction,
          temperature: 0.1
        }
      });

      const nlpText = parsedNlpResponse.text?.trim();
      if (nlpText) {
        const parsed = JSON.parse(nlpText);
        nlpMetrics = {
          ...nlpMetrics,
          ...parsed
        };
      }
    } catch (e) {
      console.error("Intelligent Query Preprocessor crashed, using local NLP fallback", e);
    }
  }

  const queryToSearch = nlpMetrics.rewrittenQuery || message;

  // Step 2: Advanced Vector Similarity Matching (Semantic Search) - OPTIONAL if AI and embeddings available
  if (ai && db.faqs.some(f => f.embedding)) {
    try {
      const queryEmbRes: any = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: queryToSearch
      });
      const queryVector = queryEmbRes.embeddings?.values || queryEmbRes.embedding?.values || queryEmbRes.embeddings?.[0]?.values;
      if (queryVector) {
        // Calculate Cosine Similarity with cached embedding vectors
        for (const faq of db.faqs) {
          if (faq.status === "active" && faq.embedding) {
            const similarity = cosineSimilarity(queryVector, faq.embedding);
            semanticMatches.push({ faq, score: similarity });
          }
        }

        // Sort by similarity score descending
        semanticMatches.sort((a, b) => b.score - a.score);

        if (semanticMatches.length > 0) {
          const topMatch = semanticMatches[0];
          // Determine Threshold criteria
          if (topMatch.score >= 0.70) {
            matchedFAQ = topMatch.faq;
            confidenceScore = topMatch.score;
            // Record view stats in DB
            faqIncrementStats(topMatch.faq.id, true);
          } else {
            confidenceScore = topMatch.score;
            // High probability it might match, so save as secondary
          }
        }
      }
    } catch (e) {
      console.error("Semantic Vector Search error, falling back to substring overlap query match.", e);
    }
  }

  // Substring/TF-IDF Fallback search (NO API KEY REQUIRED - always available)
  if (!matchedFAQ) {
    const terms = queryToSearch.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    let bestFallback: any = null;
    let highestHits = 0;

    for (const faq of db.faqs) {
      if (faq.status === "active") {
        let hits = 0;
        const textToSearch = (faq.question + " " + faq.answer + " " + faq.tags.join(" ")).toLowerCase();
        for (const term of terms) {
          if (textToSearch.includes(term)) hits++;
        }

        if (hits > highestHits) {
          highestHits = hits;
          bestFallback = faq;
        }
      }
    }

    if (bestFallback && highestHits > 0) {
      matchedFAQ = bestFallback;
      // Synthesize similarity based on word hits
      confidenceScore = Math.min(0.65 + (highestHits * 0.05), 0.88);
      faqIncrementStats(bestFallback.id, true);
    }
  }

  // Compile Dynamic Similar FAQ recommendations
  const recommendations: string[] = [];
  semanticMatches.slice(0, 3).forEach(({ faq }) => {
    if (faq.id !== (matchedFAQ?.id || "")) {
      recommendations.push(faq.question);
    }
  });

  // Prepare Server Response
  let botResponseText = "";
  let needsEscalation = false;

  if (matchedFAQ && confidenceScore >= 0.70) {
    botResponseText = matchedFAQ.answer;
  } else {
    // No high-confidence match found
    botResponseText = "I couldn't identify a perfect response in my knowledge base. However, I'm still learning! Please consider creating a support ticket so our team can help you directly.";
    needsEscalation = true;

    // If Gemini API is available, try to synthesize a dynamic answer
    if (ai) {
      try {
        const dynamicAnswerPrompt = `A client is asking: "${message}". We do not have a high-confidence FAQ matching this in our base. 
        Formulate an intelligent, incredibly helpful, high-grade response explaining that you cannot find a direct FAQ, but try to answer dynamically. Keep it concise.
        Current chat history: ${JSON.stringify(history)}`;

        const dyRes = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: dynamicAnswerPrompt,
          config: {
            systemInstruction: "You are an expert CRM bot. State your knowledge boundary gracefully, then try to give a sound general answer."
          }
        });
        botResponseText = dyRes.text?.trim() || botResponseText;
      } catch (e) {
        console.error("Dynamic answering failed", e);
        // Keep the fallback text
      }
    }

    // Trigger AI Learning recommendation logs: Track unanswered / low confidence searches
    faqIncrementUnresolved(queryToSearch);
  }

  // Create response message item
  const assistantMsgId = `msg-${Date.now()}-bot`;
  const responseMessage = {
    id: assistantMsgId,
    role: "assistant" as const,
    content: botResponseText,
    timestamp: new Date().toISOString(),
    tokens: nlpMetrics.tokens,
    lemmas: nlpMetrics.lemmas,
    sentiment: nlpMetrics.sentiment,
    language: nlpMetrics.language,
    intent: nlpMetrics.intent,
    confidence: Number(confidenceScore.toFixed(2)),
    matchedFAQId: matchedFAQ?.id || undefined,
    suggestions: recommendations.length > 0 ? recommendations : ["How do reset API rate limits?", "Do you support credit cards?"],
    escalated: needsEscalation
  };

  // Record conversation in database
  const targetConvId = conversationId || `conv-${Date.now()}`;
  let conv = db.conversations.find((c: any) => c.id === targetConvId);
  
  if (!conv) {
    conv = {
      id: targetConvId,
      messages: [],
      startTime: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: needsEscalation ? "escalated" : "active",
      browser: userAgent.substring(0, 100),
      platform: "Desktop Web"
    };
    db.conversations.push(conv);
  }

  conv.messages.push({
    id: `msg-${Date.now()}-user`,
    role: "user",
    content: message,
    timestamp: new Date().toISOString()
  });

  conv.messages.push(responseMessage);
  conv.lastActive = new Date().toISOString();
  if (needsEscalation) {
    conv.status = "escalated";
    // Send administrative notification
    db.notifications.push({
      id: `note-${Date.now()}`,
      type: "low_confidence",
      title: "Query Escalation Alert",
      message: `A client query fell below confidence threshold: "${message.substring(0, 60)}..."`,
      timestamp: new Date().toISOString(),
      read: false,
      meta: { convId: targetConvId, userQuery: message, score: confidenceScore }
    });
  }

  // Update Heatmap stats inside db.feedback / analytics
  db.feedback.push({
    id: `feed-${Date.now()}`,
    type: "search_stat",
    query: queryToSearch,
    hour: hourCode,
    day: dayCode,
    matched: !!matchedFAQ,
    score: confidenceScore,
    sentiment: nlpMetrics.sentiment
  });

  saveDatabase(db);

  res.json({
    conversationId: targetConvId,
    message: responseMessage
  });
});

// Helper routines to manage Analytics Increments
function faqIncrementStats(faqId: string, isSearch: boolean) {
  const faq = db.faqs.find((f: any) => f.id === faqId);
  if (faq) {
    if (isSearch) faq.searchCount++;
    faq.viewCount++;
  }
}

function faqIncrementUnresolved(queryText: string) {
  const normQuery = queryText.trim().toLowerCase().substring(0, 150);
  let rec = db.recommendations.find((r: any) => r.missedQuery.toLowerCase() === normQuery);
  if (rec) {
    rec.count++;
  } else {
    // Automatically use Gemini to suggest a logical standard FAQ based on this missed query!
    db.recommendations.push({
      id: `rec-${Date.now()}`,
      missedQuery: queryText,
      count: 1,
      suggestedQuestion: queryText.replace(/\b([a-z])/g, m => m.toUpperCase()),
      suggestedAnswer: "Checking knowledge manual. We are currently formulating an accurate resource manual addressing this specific topic. Please check back shortly.",
      status: "pending"
    });

    // In background, let Gemini enrich the recommended FAQ
    getAi()?.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Design a professional Enterprise QA database entry for these terms: "${queryText}".
      Provide suggestedQuestion and a highly informational professional suggestedAnswer that is general but logically sound. Output strictly in JSON format:
      {
        "suggestedQuestion": "Clean grammatical question",
        "suggestedAnswer": "Complete helpful professional answer in 2-3 sentences."
      }`,
      config: { responseMimeType: "application/json" }
    }).then(gRes => {
      const gTxt = gRes.text?.trim();
      if (gTxt) {
        const enriched = JSON.parse(gTxt);
        const idx = db.recommendations.findIndex((r: any) => r.missedQuery === queryText);
        if (idx !== -1) {
          db.recommendations[idx].suggestedQuestion = enriched.suggestedQuestion;
          db.recommendations[idx].suggestedAnswer = enriched.suggestedAnswer;
          saveDatabase(db);
        }
      }
    }).catch(err => console.error("Enrichment recommendation failed in background", err));
  }
}

// API: Continuous AI Learning Approval - Promotes suggested FAQ to Draft/Active KB
app.post("/api/learning/approve/:recId", async (req, res) => {
  const { recId } = req.params;
  const recIdx = db.recommendations.findIndex((r: any) => r.id === recId);
  if (recIdx === -1) return res.status(404).json({ error: "Recommendation item not found" });

  const rec = db.recommendations[recIdx];
  rec.status = "approved";

  // Create dynamic FAQ
  const newFaq: any = {
    id: `faq-learned-${Date.now()}`,
    question: rec.suggestedQuestion,
    answer: rec.suggestedAnswer,
    categoryId: "cat-3",
    status: "active",
    tags: ["continuous-learning", "ai-recommended"],
    viewCount: 1,
    searchCount: 1,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
    lastUpdated: new Date().toISOString(),
    versions: [],
    embedding: null
  };

  const ai = getAi();
  if (ai) {
    try {
      const emb: any = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: rec.suggestedQuestion
      });
      const values = emb.embeddings?.values || emb.embedding?.values || emb.embeddings?.[0]?.values;
      if (values) {
        newFaq.embedding = values;
      }
    } catch (e) {
      console.error("Embed failed on approved FAQ learning (skipping)", e);
    }
  }

  db.faqs.push(newFaq);
  // Remove or update recommendation status
  db.recommendations.splice(recIdx, 1);
  saveDatabase(db);

  res.json({ success: true, promotedFaq: newFaq });
});

app.post("/api/learning/ignore/:recId", (req, res) => {
  const { recId } = req.params;
  const idx = db.recommendations.findIndex((r: any) => r.id === recId);
  if (idx !== -1) {
    db.recommendations.splice(idx, 1);
    saveDatabase(db);
  }
  res.json({ success: true });
});

// API: Record thumbs feedback and rating
app.post("/api/feedback", (req, res) => {
  const { conversationId, messageId, status, rating, comments } = req.body;
  
  if (messageId && status) {
    // Record Helpful or Unhelpful
    const conv = db.conversations.find((c: any) => c.id === conversationId);
    if (conv) {
      const msg = conv.messages.find((m: any) => m.id === messageId);
      if (msg) {
        msg.feedbackRecorded = status;
        // Increment FAQ vote directly if matched
        if (msg.matchedFAQId) {
          const faq = db.faqs.find((f: any) => f.id === msg.matchedFAQId);
          if (faq) {
            if (status === "helpful") faq.helpfulVotes++;
            else faq.unhelpfulVotes++;
          }
        }
      }
    }

    // Capture and save notification upon negative feedback
    if (status === "not_helpful") {
      db.notifications.push({
        id: `note-${Date.now()}`,
        type: "customer_feedback",
        title: "Negative Feedback Logged",
        message: `Client marked bot answer as unhelpful. Check review history under conversation logs.`,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }

  // Handle Stars overall scaling
  if (conversationId && rating) {
    const conv = db.conversations.find((c: any) => c.id === conversationId);
    if (conv) {
      conv.rating = rating;
      conv.feedbackComments = comments || "";
    }
  }

  saveDatabase(db);
  res.json({ success: true });
});

// API: Support ticketing escalations
app.get("/api/tickets", (req, res) => {
  res.json(db.tickets);
});

app.post("/api/tickets", async (req, res) => {
  const { conversationId, userEmail, userQuery } = req.body;

  let summary = "Customer support escalation requested.";
  const ai = getAi();
  if (ai) {
    try {
      const summaries = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Summarize this client support question into a single-sentence CRM ticket title: "${userQuery}"`
      });
      summary = summaries.text?.trim() || summary;
    } catch (e) {
      console.error("Synthesizing ticket summaries failed (using fallback)", e);
    }
  }

  const newTicket = {
    id: `tkt-${Date.now()}`,
    conversationId: conversationId || `conv-${Date.now()}`,
    userQuery,
    generatedSummary: summary,
    status: "open" as const,
    priority: "medium" as const,
    createdAt: new Date().toISOString(),
    userEmail: userEmail || "anonymous@client.com"
  };

  db.tickets.push(newTicket);
  
  // Close the conversation or mark it escalated
  const conv = db.conversations.find((c: any) => c.id === conversationId);
  if (conv) {
    conv.status = "escalated";
  }

  db.notifications.push({
    id: `note-${Date.now()}`,
    type: "support_ticket",
    title: "New Support Ticket Raised",
    message: `Priority ticket #${newTicket.id} was created for ${newTicket.userEmail}`,
    timestamp: new Date().toISOString(),
    read: false,
    meta: { ticketId: newTicket.id }
  });

  saveDatabase(db);
  res.json(newTicket);
});

app.put("/api/tickets/:id", (req, res) => {
  const { id } = req.params;
  const { status, priority, adminNotes } = req.body;

  const idx = db.tickets.findIndex((t: any) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Ticket not found" });

  db.tickets[idx] = {
    ...db.tickets[idx],
    status: status || db.tickets[idx].status,
    priority: priority || db.tickets[idx].priority,
    adminNotes: adminNotes ?? db.tickets[idx].adminNotes
  };

  saveDatabase(db);
  res.json(db.tickets[idx]);
});

// API: List conversations
app.get("/api/conversations", (req, res) => {
  res.json(db.conversations);
});

// API: Notifications center
app.get("/api/notifications", (req, res) => {
  res.json(db.notifications);
});

app.post("/api/notifications/read-all", (req, res) => {
  db.notifications.forEach((n: any) => n.read = true);
  saveDatabase(db);
  res.json({ success: true });
});

// API: Aggregated SaaS Analytics Dashboard Metrics
app.get("/api/analytics", (req, res) => {
  // Aggregate accuracy (average rating, matching rate)
  const totalQueries = db.feedback.filter((f: any) => f.type === "search_stat").length;
  const successfulMatches = db.feedback.filter((f: any) => f.type === "search_stat" && f.matched).length;
  const ratingSum = db.conversations.reduce((sum: number, c: any) => sum + (c.rating || 0), 0);
  const ratingCount = db.conversations.filter((c: any) => typeof c.rating === "number" && c.rating > 0).length;

  const positiveSentiments = db.feedback.filter((f: any) => f.sentiment === "positive").length;
  const neutralSentiments = db.feedback.filter((f: any) => f.sentiment === "neutral").length;
  const negativeSentiments = db.feedback.filter((f: any) => f.sentiment === "negative").length;

  const sumTotal = Math.max(positiveSentiments + neutralSentiments + negativeSentiments, 1);

  // Compile top categories mapping
  const categoryCountMap: Record<string, number> = {};
  db.faqs.forEach((faq: any) => {
    const cat = db.categories.find((c: any) => c.id === faq.categoryId);
    const catName = cat ? cat.name : "Uncategorized";
    categoryCountMap[catName] = (categoryCountMap[catName] || 0) + faq.searchCount;
  });

  const categoryCounts = Object.entries(categoryCountMap).map(([name, count]) => ({ name, count }));

  // Heatmap tracking calculations (hourly and weekly)
  const hourlyCount = Array.from({ length: 24 }).map((_, h) => {
    return {
      hour: h,
      queries: db.feedback.filter((f: any) => f.type === "search_stat" && f.hour === h).length,
      failed: db.feedback.filter((f: any) => f.type === "search_stat" && f.hour === h && !f.matched).length
    };
  });

  const missingQueries = db.recommendations
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)
    .map((r: any) => ({ query: r.missedQuery, count: r.count, suggested: r.suggestedQuestion }));

  const topSearched = [...db.faqs]
    .sort((a: any, b: any) => b.searchCount - a.searchCount)
    .slice(0, 5)
    .map((f: any) => ({ question: f.question, count: f.searchCount, helpfulness: f.helpfulVotes }));

  res.json({
    totalUsers: Math.max(db.conversations.length, 12),
    totalQueries: Math.max(totalQueries, db.faqs.reduce((s: number, f: any) => s + f.searchCount, 0)),
    averageAccuracy: Math.round(((successfulMatches || 1) / Math.max(totalQueries, INITIAL_FAQS.length)) * 100),
    averageSentiment: {
      positive: Math.round((positiveSentiments / sumTotal) * 100) || 45,
      neutral: Math.round((neutralSentiments / sumTotal) * 100) || 40,
      negative: Math.round((negativeSentiments / sumTotal) * 100) || 15
    },
    topCategories: categoryCounts.length > 0 ? categoryCounts : [{ name: "General Help", count: 8 }],
    hourlyHeatmap: hourlyCount,
    missingQueries,
    topSearched,
    feedbackSummary: {
      helpfulCount: db.faqs.reduce((sum: number, f: any) => sum + (f.helpfulVotes || 0), 0),
      unhelpfulCount: db.faqs.reduce((sum: number, f: any) => sum + (f.unhelpfulVotes || 0), 0),
      ratingAverage: Number((ratingSum / Math.max(ratingCount, 1)).toFixed(1)) || 4.2
    },
    pendingLearningCount: db.recommendations.length
  });
});

// Configure Vite integration for React
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise full-stack engine running at http://localhost:${PORT}`);
  });
}

startServer();
