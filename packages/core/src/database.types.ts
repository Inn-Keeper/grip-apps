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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answer_events: {
        Row: {
          correct: boolean
          created_at: string
          difficulty: string | null
          id: string
          request_id: string | null
          source: string
          tech: string
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          difficulty?: string | null
          id?: string
          request_id?: string | null
          source?: string
          tech: string
          user_id?: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          difficulty?: string | null
          id?: string
          request_id?: string | null
          source?: string
          tech?: string
          user_id?: string
        }
        Relationships: []
      }
      arch_boards: {
        Row: {
          created_at: string
          edges: Json
          id: string
          nodes: Json
          scenario_id: string
          share_token: string | null
          story_id: string | null
          talk_grade: number | null
          talk_track: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          scenario_id: string
          share_token?: string | null
          story_id?: string | null
          talk_grade?: number | null
          talk_track?: Json
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          edges?: Json
          id?: string
          nodes?: Json
          scenario_id?: string
          share_token?: string | null
          story_id?: string | null
          talk_grade?: number | null
          talk_track?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arch_boards_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          date: string | null
          id: string
          link: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          note: string | null
          posting_techs: string[]
          role: string | null
          stage_reached_on: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          link?: string | null
          name: string
          next_action?: string | null
          next_action_date?: string | null
          note?: string | null
          posting_techs?: string[]
          role?: string | null
          stage_reached_on?: string | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          link?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          note?: string | null
          posting_techs?: string[]
          role?: string | null
          stage_reached_on?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_scenarios: {
        Row: {
          brief: string
          budget: number
          checks: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief?: string
          budget: number
          checks?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          brief?: string
          budget?: number
          checks?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          cv_techs: string[]
          display_name: string | null
          email: string | null
          favorite_techs: string[]
          github_url: string | null
          headline: string | null
          linkedin_url: string | null
          location: string | null
          onboarding_completed: boolean
          portfolio_url: string | null
          target_role: string | null
          timezone: string | null
          updated_at: string
          use_github_techs_for_prep: boolean
          user_id: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          cv_techs?: string[]
          display_name?: string | null
          email?: string | null
          favorite_techs?: string[]
          github_url?: string | null
          headline?: string | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          portfolio_url?: string | null
          target_role?: string | null
          timezone?: string | null
          updated_at?: string
          use_github_techs_for_prep?: boolean
          user_id?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          cv_techs?: string[]
          display_name?: string | null
          email?: string | null
          favorite_techs?: string[]
          github_url?: string | null
          headline?: string | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean
          portfolio_url?: string | null
          target_role?: string | null
          timezone?: string | null
          updated_at?: string
          use_github_techs_for_prep?: boolean
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          correct: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          prompt: string
          tech: string
        }
        Insert: {
          category: string
          correct?: number
          created_at?: string
          difficulty: string
          explanation?: string | null
          id?: string
          options: Json
          prompt: string
          tech: string
        }
        Update: {
          category?: string
          correct?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          prompt?: string
          tech?: string
        }
        Relationships: []
      }
      retros: {
        Row: {
          contact_id: string
          created_at: string
          date: string
          id: string
          questions: string | null
          round: string | null
          struggled_techs: string[]
          to_improve: string | null
          user_id: string
          went_well: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          date?: string
          id?: string
          questions?: string | null
          round?: string | null
          struggled_techs?: string[]
          to_improve?: string | null
          user_id?: string
          went_well?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          date?: string
          id?: string
          questions?: string | null
          round?: string | null
          struggled_techs?: string[]
          to_improve?: string | null
          user_id?: string
          went_well?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retros_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      status_events: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          action: string | null
          competency: string
          created_at: string
          id: string
          result: string | null
          scenario_id: string | null
          situation: string | null
          task: string | null
          title: string
          user_id: string
        }
        Insert: {
          action?: string | null
          competency: string
          created_at?: string
          id?: string
          result?: string | null
          scenario_id?: string | null
          situation?: string | null
          task?: string | null
          title: string
          user_id?: string
        }
        Update: {
          action?: string | null
          competency?: string
          created_at?: string
          id?: string
          result?: string | null
          scenario_id?: string | null
          situation?: string | null
          task?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: { Args: { points: number }; Returns: number }
      answer_daily_totals: {
        Args: { p_tz: string }
        Returns: {
          correct: number
          day: string
          total: number
        }[]
      }
      answer_tech_stats: {
        Args: never
        Returns: {
          correct: number
          last_at: string
          streak: number
          tech: string
          wrong: number
        }[]
      }
      get_shared_board: {
        Args: { token: string }
        Returns: {
          edges: Json
          nodes: Json
          scenario_id: string
          title: string
          updated_at: string
        }[]
      }
      record_answer: {
        Args: {
          p_correct: boolean
          p_difficulty?: string
          p_request_id: string
          p_source: string
          p_tech: string
        }
        Returns: undefined
      }
      reset_scores: { Args: never; Returns: undefined }
      seed_demo_data: { Args: { uid: string }; Returns: undefined }
      set_board_sharing: {
        Args: { board_id: string; enable: boolean }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
