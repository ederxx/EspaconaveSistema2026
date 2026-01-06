export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          bio: string | null
          created_at: string
          featured: boolean | null
          genres: string[] | null
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          profile_id: string | null
          stage_name: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          featured?: boolean | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          profile_id?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          featured?: boolean | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          profile_id?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          comment: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          comment?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          comment?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      carousel_highlights: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          position: number | null
          subtitle: string
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number | null
          subtitle: string
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number | null
          subtitle?: string
          tag?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_message: boolean | null
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_message?: boolean | null
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_message?: boolean | null
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "radio_playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "radio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      production_artists: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          production_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          production_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          production_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_artists_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          admin_id: string | null
          created_at: string
          description: string | null
          id: string
          production_type: Database["public"]["Enums"]["production_type"]
          status: Database["public"]["Enums"]["production_status"]
          title: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          production_type?: Database["public"]["Enums"]["production_type"]
          status?: Database["public"]["Enums"]["production_status"]
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          production_type?: Database["public"]["Enums"]["production_type"]
          status?: Database["public"]["Enums"]["production_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_hours_limit: number | null
          full_name: string
          hours_reset_date: string | null
          hours_used_this_month: number | null
          id: string
          monthly_hours_limit: number | null
          phone: string | null
          stage_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_hours_limit?: number | null
          full_name: string
          hours_reset_date?: string | null
          hours_used_this_month?: number | null
          id: string
          monthly_hours_limit?: number | null
          phone?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_hours_limit?: number | null
          full_name?: string
          hours_reset_date?: string | null
          hours_used_this_month?: number | null
          id?: string
          monthly_hours_limit?: number | null
          phone?: string | null
          stage_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      radio_history: {
        Row: {
          duration_played: number | null
          id: string
          played_at: string
          track_id: string
        }
        Insert: {
          duration_played?: number | null
          id?: string
          played_at?: string
          track_id: string
        }
        Update: {
          duration_played?: number | null
          id?: string
          played_at?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "radio_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "radio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      radio_live_session: {
        Row: {
          admin_id: string
          admin_name: string | null
          current_track_name: string | null
          current_track_url: string | null
          id: string
          is_live: boolean
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          admin_name?: string | null
          current_track_name?: string | null
          current_track_url?: string | null
          id?: string
          is_live?: boolean
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          admin_name?: string | null
          current_track_name?: string | null
          current_track_url?: string | null
          id?: string
          is_live?: boolean
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      radio_loop_track: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          track_name: string
          updated_at: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          track_name: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          track_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      radio_playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      radio_queue: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          played_at: string | null
          position: number
          track_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          played_at?: string | null
          position?: number
          track_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          played_at?: string | null
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "radio_queue_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "radio_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      radio_sound_effects: {
        Row: {
          audio_url: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      radio_tracks: {
        Row: {
          album: string | null
          artist: string
          audio_url: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          genres: string[] | null
          id: string
          is_active: boolean | null
          play_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          album?: string | null
          artist: string
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          play_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          album?: string | null
          artist?: string
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          play_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_bookings: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_user_bootstrap: {
        Args: { _full_name?: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "visitor" | "guest"
      production_status:
        | "in_progress"
        | "completed"
        | "paused"
        | "awaiting_feedback"
      production_type:
        | "music"
        | "mix_master"
        | "recording"
        | "podcast"
        | "meeting"
        | "class"
        | "project"
        | "multimedia"
        | "other"
      service_status:
        | "pending"
        | "approved"
        | "denied"
        | "in_progress"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "visitor", "guest"],
      production_status: [
        "in_progress",
        "completed",
        "paused",
        "awaiting_feedback",
      ],
      production_type: [
        "music",
        "mix_master",
        "recording",
        "podcast",
        "meeting",
        "class",
        "project",
        "multimedia",
        "other",
      ],
      service_status: [
        "pending",
        "approved",
        "denied",
        "in_progress",
        "completed",
      ],
    },
  },
} as const
