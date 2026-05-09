import { create } from "zustand";

export type WizardStepId = "profile" | "role" | "review";

const STEP_ORDER: WizardStepId[] = ["profile", "role", "review"];

export function canGoNext(step: WizardStepId) {
  return STEP_ORDER.indexOf(step) < STEP_ORDER.length - 1;
}

export function canGoBack(step: WizardStepId) {
  return STEP_ORDER.indexOf(step) > 0;
}

type WizardState = {
  step: WizardStepId;
  bioDraft: string;
  setBioDraft: (value: string) => void;
  setStep: (step: WizardStepId) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
};

export const useOnboardingWizardStore = create<WizardState>((set, get) => ({
  step: "profile",
  bioDraft: "",
  setBioDraft: (bioDraft) => set({ bioDraft }),
  setStep: (step) => set({ step }),
  next: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i < STEP_ORDER.length - 1) set({ step: STEP_ORDER[i + 1]! });
  },
  back: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i > 0) set({ step: STEP_ORDER[i - 1]! });
  },
  reset: () => set({ step: "profile", bioDraft: "" }),
}));
