import { create } from "zustand";

type AuthState = {
  userId: string | null;
  email: string | null;
  setUser: (userId: string | null, email: string | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  email: null,
  setUser: (userId, email) => set({ userId, email }),
  reset: () => set({ userId: null, email: null }),
}));