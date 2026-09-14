import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, User } from 'lucide-react';

export function SettingsPage() {
  const { profile, user, refreshProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile?.preferred_language || 'en'
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          preferred_language: preferredLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      await refreshProfile();
      setMessage('Settings saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your profile and preferences</p>
      </div>

      <div className="card space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
            <User className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <div className="font-medium text-white">{profile?.display_name || 'Student'}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-600">
              Role: {profile?.role || 'student'}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Display name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Preferred teaching language
          </label>
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value)}
            className="input"
          >
            <option value="en">English</option>
            <option value="bn">Bengali (বাংলা)</option>
          </select>
        </div>

        {message && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{message}</div>
        )}
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </button>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-white">About Phase 1</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
          <li>• Authentication & profiles</li>
          <li>• Dashboard & subject list</li>
          <li>• Teaching chat (local teacher + conversation persistence)</li>
          <li>• Basic mastery table ready</li>
          <li>• PWA shell</li>
        </ul>
        <p className="mt-3 text-xs text-slate-600">
          Voice, full LLM providers, curriculum, coding agent arrive in later phases.
        </p>
      </div>
    </div>
  );
}
