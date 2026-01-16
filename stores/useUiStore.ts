import { create } from "zustand";

type UiStore = {
  isSidebarOpen: boolean;         // desktop: open vs collapsed
  toggleSidebar: () => void;

  isMobileSidebarOpen: boolean;   // mobile drawer
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

export const useUiStore = create<UiStore>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  isMobileSidebarOpen: false,
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));