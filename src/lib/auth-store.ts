"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AuthUser = {
  name: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
};

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
} as Storage;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "smelly-water-auth",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage
      ),
    }
  )
);
