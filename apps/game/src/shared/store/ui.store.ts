import { create } from 'zustand';

export type BannerKind = 'success' | 'error' | 'info';

type UiState = {
  banner: { message: string; kind: BannerKind } | null;
  timeoutId: number | null;
  showBanner: (message: string, kind?: BannerKind, durationMs?: number) => void;
  clearBanner: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  banner: null,
  timeoutId: null,
  showBanner(message, kind = 'info', durationMs = 10000) {
    const existing = get().timeoutId;
    if (existing) {
      clearTimeout(existing);
    }
    set({ banner: { message, kind } });
    const id = window.setTimeout(() => {
      set({ banner: null, timeoutId: null });
    }, durationMs);
    set({ timeoutId: id });
  },
  clearBanner() {
    const existing = get().timeoutId;
    if (existing) {
      clearTimeout(existing);
    }
    set({ banner: null, timeoutId: null });
  },
}));


