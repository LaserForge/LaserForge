import { create } from "zustand";

interface AppState {
  zoom: number;
  setZoom: (zoom: number) => void;
  tool: "select" | "pen" | "rect";
  setTool: (tool: "select" | "pen" | "rect") => void;
}

export const useAppStore = create<AppState>((set) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  tool: "select",
  setTool: (tool) => set({ tool }),
}));
