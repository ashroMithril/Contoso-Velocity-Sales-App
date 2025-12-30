import { ChatSession, Message } from "../types";

const STORAGE_KEY = 'contoso_copilot_history';

export const saveSession = (messages: Message[]) => {
  if (messages.length <= 1) return; // Don't save empty/welcome sessions

  const sessions = getSessions();
  
  // Extract a title from the first user message
  const firstUserMsg = messages.find(m => m.role === 'user');
  const title = firstUserMsg ? firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '') : 'New Session';
  const preview = messages[messages.length - 1].text.slice(0, 60) + '...';

  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: title,
    date: new Date(),
    messages: messages,
    previewText: preview
  };

  // Add to top
  const updatedSessions = [newSession, ...sessions].slice(0, 50); // Limit to 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
};

export const getSessions =(): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored).map((s: any) => ({
      ...s,
      date: new Date(s.date),
      messages: s.messages.map((m: any) => ({...m, timestamp: new Date(m.timestamp)}))
    }));
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};