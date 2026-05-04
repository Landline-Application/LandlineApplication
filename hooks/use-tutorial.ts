import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface TutorialState {
  hasSeenTutorial: boolean;
  currentStep: number;
  isLoaded: boolean;
  loadTutorialState: () => Promise<void>;
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTutorial: () => Promise<void>;
  resetTutorial: () => Promise<void>;
}

export const TUTORIAL_TOTAL_STEPS = 8;

export const useTutorialStore = create<TutorialState>((set, get) => ({
  hasSeenTutorial: false,
  currentStep: 0,
  isLoaded: false,

  loadTutorialState: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN);
      set({ hasSeenTutorial: value === 'true', isLoaded: true });
    } catch {
      set({ hasSeenTutorial: false, isLoaded: true });
    }
  },

  startTutorial: () => {
    set({ currentStep: 0 });
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TUTORIAL_TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  completeTutorial: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TUTORIAL_SEEN, 'true');
      set({ hasSeenTutorial: true, currentStep: 0 });
    } catch {
      set({ hasSeenTutorial: true, currentStep: 0 });
    }
  },

  resetTutorial: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TUTORIAL_SEEN);
      set({ hasSeenTutorial: false, currentStep: 0 });
    } catch {
      set({ hasSeenTutorial: false, currentStep: 0 });
    }
  },
}));
