
export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  industry: string;
  status: 'New' | 'Contacted' | 'Proposal' | 'Negotiation';
  needs: string[];
  estimatedValue: number;
  lastInteraction: string;
  // New AI Fields
  aiSummary?: string;
  meetingTime?: string;
  signals?: { type: 'positive' | 'warning' | 'info'; text: string }[];
  suggestedAction?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  functionResponse?: any;
  // New: Link to generated artifact
  relatedArtifact?: ArtifactData;
}

export enum WorkspaceMode {
  DASHBOARD = 'DASHBOARD',
  CALENDAR = 'CALENDAR',
  ARTIFACTS = 'ARTIFACTS',
  HISTORY = 'HISTORY'
}

export interface PricingItem {
  sku: string;
  name: string;
  price: number;
  currency: string;
}

export interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
  previewText: string;
}

export interface ArtifactData {
    documentContent: string;
    presentationContent: string;
}

export interface Artifact {
    id: string;
    title: string;
    type: 'Proposal' | 'Handoff' | 'Meeting Brief' | 'Email' | 'Research' | 'Generic';
    status: 'Draft' | 'In Review' | 'Finalized' | 'Sent';
    companyName: string;
    createdAt: Date;
    lastModified: Date;
    content: ArtifactData;
}

export interface DocumentComment {
    id: string;
    author: string;
    text: string;
    selectedContext: string;
    timestamp: Date;
    taggedUsers?: string[];
}

export interface ActionSuggestion {
    id: string;
    company: string;
    headline: string;
    actionLabel: string;
    prompt: string;
    icon: any;
    colorClass: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'meeting' | 'reminder' | 'deadline';
    leadId?: string; // Links to a CRM record
    companyName?: string;
    description?: string;
}