import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = '@sanjeevani_native_chat_sessions';

export const chatStorage = {
  async getSessions(): Promise<ChatSession[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading chat sessions from AsyncStorage:', e);
    }
    return [];
  },

  async saveSession(session: ChatSession): Promise<void> {
    try {
      const current = await this.getSessions();
      const existingIdx = current.findIndex((s) => s.id === session.id);
      let updated: ChatSession[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = session;
      } else {
        updated = [session, ...current];
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving chat session:', e);
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const current = await this.getSessions();
      const filtered = current.filter((s) => s.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Error deleting chat session:', e);
    }
  },
};
