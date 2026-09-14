export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'teacher' | 'admin' | 'developer';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: UserRole;
          preferred_language: string;
          ui_language: string;
          voice_settings: Json | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: UserRole;
          preferred_language?: string;
          ui_language?: string;
          voice_settings?: Json | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: UserRole;
          preferred_language?: string;
          ui_language?: string;
          voice_settings?: Json | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          grade_or_level: string | null;
          goals: string[] | null;
          learning_preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          grade_or_level?: string | null;
          goals?: string[] | null;
          learning_preferences?: Json | null;
        };
        Update: {
          grade_or_level?: string | null;
          goals?: string[] | null;
          learning_preferences?: Json | null;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          icon: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          icon?: string | null;
          is_active?: boolean;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string | null;
          title: string | null;
          mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id?: string | null;
          title?: string | null;
          mode?: string;
        };
        Update: {
          title?: string | null;
          subject_id?: string | null;
          mode?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          metadata?: Json | null;
        };
        Update: {
          content?: string;
          metadata?: Json | null;
        };
      };
      mastery: {
        Row: {
          id: string;
          user_id: string;
          concept_key: string;
          subject_id: string | null;
          score: number;
          confidence: number;
          evidence_count: number;
          last_assessed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          concept_key: string;
          subject_id?: string | null;
          score?: number;
          confidence?: number;
          evidence_count?: number;
          last_assessed_at?: string | null;
        };
        Update: {
          score?: number;
          confidence?: number;
          evidence_count?: number;
          last_assessed_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subject = Database['public']['Tables']['subjects']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Mastery = Database['public']['Tables']['mastery']['Row'];
