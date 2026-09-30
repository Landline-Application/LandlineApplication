import { create } from 'zustand';

import { getUsageTutorialSteps } from '@/constants/usage-tutorial';
import { markUsageTutorialSeen } from '@/utils/usage-tutorial-storage';

export interface TutorialSpotlight {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UsageTutorialStore {
  visible: boolean;
  stepIndex: number;
  spotlight: TutorialSpotlight | null;
  setSpotlight: (spotlight: TutorialSpotlight) => void;
  start: () => void;
  back: () => void;
  next: () => void;
  dismiss: () => void;
}

export const useUsageTutorialStore = create<UsageTutorialStore>((set, get) => ({
  visible: false,
  stepIndex: 0,
  spotlight: null,
  setSpotlight: (spotlight) => {
    const steps = getUsageTutorialSteps();
    const step = steps[get().stepIndex];
    if (!get().visible || step?.target !== spotlight.id) return;
    set({ spotlight });
  },
  start: () => set({ visible: true, stepIndex: 0, spotlight: null }),
  back: () =>
    set((state) => ({
      stepIndex: Math.max(0, state.stepIndex - 1),
      spotlight: null,
    })),
  next: () => {
    const steps = getUsageTutorialSteps();
    const { stepIndex } = get();
    if (stepIndex >= steps.length - 1) {
      get().dismiss();
      return;
    }
    set({ stepIndex: stepIndex + 1, spotlight: null });
  },
  dismiss: () => {
    set({ visible: false, stepIndex: 0, spotlight: null });
    void markUsageTutorialSeen().catch((error) => {
      console.warn('markUsageTutorialSeen', error);
    });
  },
}));
