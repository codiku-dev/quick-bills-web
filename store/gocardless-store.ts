import { User } from '@/lib/generated/prisma';
import { Step } from '@/types/steps-type';
import { WithoutFunctions } from '@/types/ts-helper';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoCardlessState {
  user: User | null;
  step: Step;
  setUser: (user: User | null) => void;
  setStep: (step: Step) => void;
}

const initialState: WithoutFunctions<GoCardlessState> = {
  user: null,
  step: 'select-country',
};

export const useGoCardlessStore = create<GoCardlessState>()(
  persist(
    set => ({
      ...initialState,
      setUser: user => set({ user }),
      setStep: step => set({ step }),
    }),
    {
      name: 'gocardless-storage',

    }
  )
);
