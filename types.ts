export enum UserRole {
  ADMIN = 'Admin',
  INTERVIEWER = 'Interviewer',
  VIEWER = 'Viewer',
}

export enum SessionStatus {
  DRAFT = 'Draft',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived',
}

export type SessionMode = 'ai_interviewer' | 'manual_recording';

export interface Message {
  id: string;
  role: 'interviewer' | 'respondent' | 'system' | 'ai_suggestion';
  content: string;
  timestamp: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  overview: string;
  keyInsights: string[];
  planningNotes: string[];
  executionNotes: string[];
  tags: string[];
  fullTranscript: Message[];
  createdAt: number;
  author: string;
  category: string;
}

export interface InterviewSession {
  id: string;
  title: string;
  interviewee: string;
  interviewer: string;
  category: string;
  status: SessionStatus;
  mode: SessionMode;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface DashboardStats {
  totalSessions: number;
  totalArticles: number;
  topTags: { tag: string; count: number }[];
}

export interface AIAnalysisResult {
  suggestedTitle: string;
  summary: string;
  overview: string;
  keyInsights: string[];
  planningNotes: string[];
  executionNotes: string[];
  tags: string[];
}
