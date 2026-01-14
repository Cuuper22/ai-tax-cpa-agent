/**
 * Global application state using Zustand
 */

import { create } from "zustand";
import { auth, settings, type AuthStatus, type ChatResponse } from "@/lib/tauri";

// ============================================================================
// Auth Store
// ============================================================================

interface AuthState {
  isUnlocked: boolean;
  hasPin: boolean;
  isLoading: boolean;
  error: string | null;
  
  checkStatus: () => Promise<void>;
  setupPin: (pin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isUnlocked: false,
  hasPin: false,
  isLoading: true,
  error: null,
  
  checkStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const status: AuthStatus = await auth.isUnlocked();
      set({ isUnlocked: status.unlocked, hasPin: status.has_pin, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: String(e) });
    }
  },
  
  setupPin: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      await auth.setupPin(pin);
      set({ isUnlocked: true, hasPin: true, isLoading: false });
      return true;
    } catch (e) {
      set({ isLoading: false, error: String(e) });
      return false;
    }
  },
  
  unlock: async (pin: string) => {
    set({ isLoading: true, error: null });
    try {
      await auth.unlock(pin);
      set({ isUnlocked: true, isLoading: false });
      return true;
    } catch (e) {
      set({ isLoading: false, error: String(e) });
      return false;
    }
  },
  
  lock: async () => {
    try {
      await auth.lock();
      set({ isUnlocked: false });
    } catch (e) {
      set({ error: String(e) });
    }
  },
  
  clearError: () => set({ error: null }),
}));

// ============================================================================
// Settings Store
// ============================================================================

interface SettingsState {
  hasApiKey: boolean;
  isLoading: boolean;
  
  checkApiKey: () => Promise<void>;
  saveApiKey: (key: string) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hasApiKey: false,
  isLoading: true,
  
  checkApiKey: async () => {
    try {
      const has = await settings.hasApiKey();
      set({ hasApiKey: has, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  
  saveApiKey: async (key: string) => {
    try {
      await settings.saveApiKey(key);
      set({ hasApiKey: true });
      return true;
    } catch {
      return false;
    }
  },
}));

// ============================================================================
// Chat Store
// ============================================================================

interface ChatState {
  messages: ChatResponse[];
  isLoading: boolean;
  
  addMessage: (message: ChatResponse) => void;
  setMessages: (messages: ChatResponse[]) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  setMessages: (messages) => set({ messages }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearMessages: () => set({ messages: [] }),
}));

// ============================================================================
// UI Store
// ============================================================================

interface UIState {
  sidebarCollapsed: boolean;
  activeTab: string;
  
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeTab: "dashboard",
  
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setActiveTab: (activeTab) => set({ activeTab }),
}));
