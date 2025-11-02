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
  sellerId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (session: { token: string; user: AuthUser }) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
};

const AUTH_TOKEN_COOKIE = "swc-auth-token";
const SELLER_ID_COOKIE = "swc-auth-seller";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS) {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function syncAuthCookies(token: string, sellerId: string | null) {
  if (!isBrowser()) {
    return;
  }
  setCookie(AUTH_TOKEN_COOKIE, token);
  if (sellerId) {
    setCookie(SELLER_ID_COOKIE, sellerId);
  } else {
    clearCookie(SELLER_ID_COOKIE);
  }
}

function clearAuthCookies() {
  clearCookie(AUTH_TOKEN_COOKIE);
  clearCookie(SELLER_ID_COOKIE);
}

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
    (set, get) => ({
      user: null,
      token: null,
      login: ({ token, user }) => {
        syncAuthCookies(token, user.sellerId);
        set({ user, token });
      },
      logout: () => {
        clearAuthCookies();
        set({ user: null, token: null });
      },
      updateUser: (user) => {
        const token = get().token;
        if (token) {
          syncAuthCookies(token, user.sellerId);
        } else if (user.sellerId) {
          setCookie(SELLER_ID_COOKIE, user.sellerId);
        }
        set({ user });
      },
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
