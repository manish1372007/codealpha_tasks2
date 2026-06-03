/**
 * Enterprise AI FAQ Chatbot - Shared Core Types
 */

export interface FAQVersion {
  id: string;
  question: string;
  answer: string;
  status: 'active' | 'draft' | 'archived';
  updatedBy: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  viewCount: number;
  searchCount: number;
  helpfulVotes: number;
  unhelpfulVotes: number;
  lastUpdated: string;
  versions: FAQVersion[];
  embeddingId?: string; // Cache identifier for semantic comparison
}

export interface Category {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon identifier
  slug: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  // Natural Language Processing metrics metadata
  tokens?: string[];
  lemmas?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  language?: string; // e.g. "en", "hi", "ta", "fr", "es", etc.
  intent?: string; // Detected primary intent
  confidence?: number; // Match confidence score (0.00 to 1.00)
  matchedFAQId?: string; // Links back to FAQ if matched semantically
  suggestions?: string[]; // Similar questions recommended dynamically
  escalated?: boolean; // True if escalated to Support Ticket
  feedbackRecorded?: 'helpful' | 'not_helpful' | null;
  audioVoicePath?: string; // Reference to play back audio chunk
}

export interface Conversation {
  id: string;
  messages: Message[];
  startTime: string;
  lastActive: string;
  status: 'active' | 'resolved' | 'escalated';
  rating?: number; // 1 to 5 stars feedback loop
  feedbackComments?: string;
  browser?: string;
  platform?: string;
}

export interface SupportTicket {
  id: string;
  conversationId: string;
  userQuery: string;
  generatedSummary: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  userEmail: string;
  adminNotes?: string;
}

export interface AdminNotification {
  id: string;
  type: 'missing_faq' | 'low_confidence' | 'customer_feedback' | 'support_ticket' | 'traffic_spike';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meta?: any;
}

export interface SearchHeatmapPoint {
  hourCode: number; // 0-23
  dayCode: string; // "Mon", "Tue", etc
  queryCount: number;
  failCount: number;
}

export interface LearningRecommendation {
  id: string;
  missedQuery: string;
  count: number;
  suggestedAnswer: string;
  suggestedQuestion: string;
  status: 'pending' | 'ignored' | 'approved';
  detectedIntent?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalQueries: number;
  averageAccuracy: number; // calculated from confidence scores %
  averageSentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  mostSearchedFAQ: Array<{ question: string; count: number }>;
  categoryCounts: Array<{ name: string; count: number }>;
  feedbackSummary: {
    helpfulCount: number;
    unhelpfulCount: number;
    ratingAverage: number;
  };
  recentTickets: SupportTicket[];
}
