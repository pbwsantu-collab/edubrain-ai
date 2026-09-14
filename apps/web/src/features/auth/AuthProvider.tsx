import { type ReactNode } from 'react';

/** Placeholder for future auth context extensions. Currently uses Zustand. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
