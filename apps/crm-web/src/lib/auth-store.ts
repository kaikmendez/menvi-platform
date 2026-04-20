'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUserOut } from '@menvi/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUserOut | null;
  setSession: (tokens: { access_token: string; refresh_token: string }) => void;
  setUser: (user: CurrentUserOut) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ access_token, refresh_token }) =>
        set({ accessToken: access_token, refreshToken: refresh_token }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'menvi-crm-auth' },
  ),
);
