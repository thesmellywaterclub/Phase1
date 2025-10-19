"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  isSeller: boolean;
  clubMember: boolean;
  clubVerified: boolean;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (session: { token: string; user: AuthUser }) => void;
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
      token: null,
      login: ({ token, user }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "smelly-water-auth",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? noopStorage : window.localStorage
      ),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
