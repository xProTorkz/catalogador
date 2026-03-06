import { create } from 'zustand';
import { api } from '../services/api';

interface SettingsState {
  settings: any;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: any) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  isLoading: false,
  error: null,
  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.getSettings();
      set({ settings: data, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch settings', isLoading: false });
    }
  },
  updateSettings: async (newSettings) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.saveSettings(newSettings);
      set({ settings: updated, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to save settings', isLoading: false });
    }
  },
}));
