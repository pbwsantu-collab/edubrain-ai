import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { clearLocalSession, isLocalSession, localProfile } from '@/lib/localAuth';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      profile: isLocalSession(session) && session ? localProfile(session) : get().profile,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (loading) => set({ loading }),

  setInitialized: (initialized) => set({ initialized }),

  signOut: async () => {
    clearLocalSession();
    try {
      await supabase.auth.signOut();
    } catch {
      /* backend may be down */
    }
    set({ user: null, session: null, profile: null });
  },

  refreshProfile: async () => {
    const session = get().session;
    const user = get().user;
    if (!user || !session) {
      set({ profile: null });
      return;
    }
    if (isLocalSession(session)) {
      set({ profile: localProfile(session) });
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[EDUBRAIN] Failed to load profile', error);
      return;
    }

    set({ profile: data });
  },
}));
