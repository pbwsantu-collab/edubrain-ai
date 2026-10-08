import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TeachingPage } from '@/features/teaching/TeachingPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { CurriculumPage } from '@/features/curriculum/CurriculumPage';
import { CurriculumDetailPage } from '@/features/curriculum/CurriculumDetailPage';
import { ConceptLearnPage } from '@/features/curriculum/ConceptLearnPage';
import { KnowledgePage } from '@/features/knowledge/KnowledgePage';
import { CodingPage } from '@/features/coding/CodingPage';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { isLocalSession, readLocalSession } from '@/lib/localAuth';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export default function App() {
  const { setSession, setLoading, setInitialized, refreshProfile } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function init() {
      const local = readLocalSession();
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 4000);
        if (!mounted) return;
        const session = data.session ?? local;
        setSession(session);
        if (session?.user && !isLocalSession(session)) {
          await refreshProfile();
        }
      } catch (err) {
        console.error('[EDUBRAIN] Auth init error', err);
        if (mounted && local) setSession(local);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session && readLocalSession()) return;
      setSession(session);
      if (session?.user && !isLocalSession(session)) {
        await refreshProfile();
      } else if (!session) {
        useAuthStore.getState().setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setLoading, setInitialized, refreshProfile]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="teach" element={<TeachingPage />} />
          <Route path="teach/:conversationId" element={<TeachingPage />} />
          <Route path="curriculum" element={<CurriculumPage />} />
          <Route path="curriculum/:slug" element={<CurriculumDetailPage />} />
          <Route path="learn/:conceptId" element={<ConceptLearnPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="coding" element={<CodingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
