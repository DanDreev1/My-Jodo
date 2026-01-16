import { create } from "zustand";

type ConfirmState = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;

  show: (p: Omit<ConfirmState, "show" | "hide" | "open" | "setLoading">) => void;
  hide: () => void;
  setLoading: (v: boolean) => void;
};

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: "",
  loading: false,

  show: (p) => set({ open: true, ...p }),
  hide: () =>
    set({
      open: false,
      title: "",
      description: undefined,
      confirmText: undefined,
      cancelText: undefined,
      danger: undefined,
      loading: false,
      onConfirm: undefined,
      onCancel: undefined,
    }),
  setLoading: (v) => set({ loading: v }),
}));