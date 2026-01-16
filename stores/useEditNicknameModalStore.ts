// stores/useEditNicknameModalStore.ts
import { create } from "zustand";

type EditNicknamePayload = {
  initialValue: string;
};

type EditNicknameState = {
  open: boolean;
  initialValue: string;
  loading: boolean;

  show: (p: EditNicknamePayload) => void;
  hide: () => void;
  setLoading: (v: boolean) => void;
};

export const useEditNicknameModalStore = create<EditNicknameState>((set) => ({
  open: false,
  initialValue: "",
  loading: false,

  show: (p) => set({ open: true, initialValue: p.initialValue }),
  hide: () => set({ open: false, initialValue: "", loading: false }),
  setLoading: (v) => set({ loading: v }),
}));