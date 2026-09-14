export type UserRole = 'student' | 'teacher' | 'admin' | 'developer';

export const APP_NAME = 'EDUBRAIN AI';
export const APP_TAGLINE = 'Learn. Remember. Teach. Build. Improve.';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
