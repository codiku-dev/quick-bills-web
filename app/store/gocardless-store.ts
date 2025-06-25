import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GoCardlessState {
    requisitionId: string | null;
    step: 'select-country' | 'select-bank' | 'connecting' | 'connected';
    setRequisitionId: (id: string | null) => void;
    setStep: (step: 'select-country' | 'select-bank' | 'connecting' | 'connected') => void;
}

export const useGoCardlessStore = create<GoCardlessState>()(
    persist(
        (set) => ({
            requisitionId: null,
            step: 'select-country',
            setRequisitionId: (id) => set({ requisitionId: id }),
            setStep: (step) => set({ step }),
        }),
        {
            name: 'gocardless-storage',
            partialize: (state) => ({
                requisitionId: state.requisitionId,
            }),
        }
    )
); 