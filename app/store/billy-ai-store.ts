import { create } from 'zustand';

interface BillyAiState {
    matchingList: any[];
    setMatchingList: (list: any[]) => void;
}

export const useBillyAiStore = create<BillyAiState>((set) => ({
    matchingList: [],
    setMatchingList: (list) => set({ matchingList: list }),
})); 