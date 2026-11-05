import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { OPDToken } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
  opdToken?: OPDToken;
}

export interface ChatSession {
  id: string;
  title: string;
  model: 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon';
  role: 'general' | 'specialist' | 'fast_triage';
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = 'sanjeevani_chat_sessions';

export const chatStorage = {
  // Get all chat sessions (from localStorage + Firestore sync)
  async getSessions(): Promise<ChatSession[]> {
    let localSessions: ChatSession[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) localSessions = JSON.parse(raw);
      } catch (e) {
        console.warn('Error reading local chat sessions:', e);
      }
    }

    // Try fetching from Firestore in background
    try {
      const q = query(collection(firestore, 'chat_conversations'), limit(25));
      const snap = await getDocs(q);
      const remoteSessions: ChatSession[] = [];
      snap.forEach((d) => {
        remoteSessions.push(d.data() as ChatSession);
      });

      if (remoteSessions.length > 0) {
        // Merge with local sessions, deduplicating by ID
        const sessionMap = new Map<string, ChatSession>();
        remoteSessions.forEach((s) => sessionMap.set(s.id, s));
        localSessions.forEach((s) => sessionMap.set(s.id, s));
        const merged = Array.from(sessionMap.values()).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch (e) {
      // Offline or permission fallback to local sessions
    }

    return localSessions.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  // Save or update a chat session
  async saveSession(session: ChatSession): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        const list: ChatSession[] = raw ? JSON.parse(raw) : [];
        const index = list.findIndex((s) => s.id === session.id);
        if (index >= 0) {
          list[index] = session;
        } else {
          list.unshift(session);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Error saving session locally:', e);
      }
    }

    // Persist to Firestore
    try {
      await setDoc(doc(firestore, 'chat_conversations', session.id), {
        id: session.id,
        title: session.title,
        model: session.model,
        role: session.role,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    } catch (e) {
      console.warn('Error persisting session to Firestore:', e);
    }
  },

  // Delete a chat session
  async deleteSession(sessionId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const list: ChatSession[] = JSON.parse(raw);
          const filtered = list.filter((s) => s.id !== sessionId);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch (e) {}
    }

    // Delete in Firestore
    try {
      await deleteDoc(doc(firestore, 'chat_conversations', sessionId));
    } catch (e) {}
  },
};
