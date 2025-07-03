import { WithoutFunctions } from '@/types/ts-helper';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoCardlessState {
  requisitionId: string | null;
  step: 'select-country' | 'select-bank' | 'connecting' | 'connected' | 'transactions';
  setRequisitionId: (id: string | null) => void;
  setStep: (step: 'select-country' | 'select-bank' | 'connecting' | 'connected' | 'transactions') => void;
}

const initialState: WithoutFunctions<GoCardlessState> = {
  requisitionId: "9be8ae69-6298-4576-a642-544a11f47d45",
  step: 'select-country',
};

export const useGoCardlessStore = create<GoCardlessState>()(
  persist(
    set => ({
      ...initialState,
      setRequisitionId: id => set({ requisitionId: id }),
      setStep: step => set({ step }),
    }),
    {
      name: 'gocardless-storage',
      partialize: state => ({
        requisitionId: state.requisitionId,
      }),
    }
  )
);
