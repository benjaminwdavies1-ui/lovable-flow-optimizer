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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action_type: string
          cluster_id: string | null
          created_at: string
          element_info: Json | null
          id: string
          screenshot_url: string | null
          session_date: string
          timestamp: string
          url: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          cluster_id?: string | null
          created_at?: string
          element_info?: Json | null
          id?: string
          screenshot_url?: string | null
          session_date?: string
          timestamp?: string
          url?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          cluster_id?: string | null
          created_at?: string
          element_info?: Json | null
          id?: string
          screenshot_url?: string | null
          session_date?: string
          timestamp?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "process_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          affected_processes: string[] | null
          created_at: string
          description: string
          id: string
          recommendation_type: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          affected_processes?: string[] | null
          created_at?: string
          description: string
          id?: string
          recommendation_type: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          affected_processes?: string[] | null
          created_at?: string
          description?: string
          id?: string
          recommendation_type?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_suggestions: {
        Row: {
          automation_type: string
          created_at: string
          description: string
          estimated_time_saved: string | null
          id: string
          implementation_difficulty: string | null
          integration_tools: string[] | null
          sop_id: string | null
          status: string | null
          step_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          automation_type: string
          created_at?: string
          description: string
          estimated_time_saved?: string | null
          id?: string
          implementation_difficulty?: string | null
          integration_tools?: string[] | null
          sop_id?: string | null
          status?: string | null
          step_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          description?: string
          estimated_time_saved?: string | null
          id?: string
          implementation_difficulty?: string | null
          integration_tools?: string[] | null
          sop_id?: string | null
          status?: string | null
          step_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_suggestions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_suggestions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "sop_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      business_context: {
        Row: {
          confidence_score: number | null
          content: string
          context_type: string
          created_at: string
          id: string
          source_ids: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content: string
          context_type: string
          created_at?: string
          id?: string
          source_ids?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content?: string
          context_type?: string
          created_at?: string
          id?: string
          source_ids?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      process_clusters: {
        Row: {
          confidence_score: number | null
          converted_to_recording_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_count: number
          id: string
          start_time: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          converted_to_recording_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_count?: number
          id?: string
          start_time?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          converted_to_recording_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_count?: number
          id?: string
          start_time?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          step_count: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          step_count?: number | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          step_count?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_steps: {
        Row: {
          created_at: string | null
          decision_mode: string
          description: string | null
          has_warning: boolean | null
          id: string
          is_decision: boolean
          is_redacted: boolean | null
          no_branch_steps: Json
          order_number: number
          screenshot_url: string | null
          show_screenshot: boolean | null
          sop_id: string
          title: string | null
          warning_text: string | null
          yes_branch_steps: Json
        }
        Insert: {
          created_at?: string | null
          decision_mode?: string
          description?: string | null
          has_warning?: boolean | null
          id?: string
          is_decision?: boolean
          is_redacted?: boolean | null
          no_branch_steps?: Json
          order_number: number
          screenshot_url?: string | null
          show_screenshot?: boolean | null
          sop_id: string
          title?: string | null
          warning_text?: string | null
          yes_branch_steps?: Json
        }
        Update: {
          created_at?: string | null
          decision_mode?: string
          description?: string | null
          has_warning?: boolean | null
          id?: string
          is_decision?: boolean
          is_redacted?: boolean | null
          no_branch_steps?: Json
          order_number?: number
          screenshot_url?: string | null
          show_screenshot?: boolean | null
          sop_id?: string
          title?: string | null
          warning_text?: string | null
          yes_branch_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "sop_steps_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          created_at: string | null
          department_tags: string[] | null
          description: string | null
          employee_tags: string[] | null
          id: string
          published_at: string | null
          recording_id: string | null
          status: string
          title: string
          tools_tags: string[] | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          department_tags?: string[] | null
          description?: string | null
          employee_tags?: string[] | null
          id?: string
          published_at?: string | null
          recording_id?: string | null
          status?: string
          title?: string
          tools_tags?: string[] | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          department_tags?: string[] | null
          description?: string | null
          employee_tags?: string[] | null
          id?: string
          published_at?: string | null
          recording_id?: string | null
          status?: string
          title?: string
          tools_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sops_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          action_type: string
          created_at: string | null
          decision_mode: string
          element_selector: string | null
          has_warning: boolean | null
          id: string
          instruction_text: string | null
          is_decision: boolean
          is_redacted: boolean | null
          no_branch_steps: Json
          order_number: number
          recording_id: string
          screenshot_url: string | null
          timestamp: string | null
          url: string | null
          warning_text: string | null
          yes_branch_steps: Json
        }
        Insert: {
          action_type?: string
          created_at?: string | null
          decision_mode?: string
          element_selector?: string | null
          has_warning?: boolean | null
          id?: string
          instruction_text?: string | null
          is_decision?: boolean
          is_redacted?: boolean | null
          no_branch_steps?: Json
          order_number: number
          recording_id: string
          screenshot_url?: string | null
          timestamp?: string | null
          url?: string | null
          warning_text?: string | null
          yes_branch_steps?: Json
        }
        Update: {
          action_type?: string
          created_at?: string | null
          decision_mode?: string
          element_selector?: string | null
          has_warning?: boolean | null
          id?: string
          instruction_text?: string | null
          is_decision?: boolean
          is_redacted?: boolean | null
          no_branch_steps?: Json
          order_number?: number
          recording_id?: string
          screenshot_url?: string | null
          timestamp?: string | null
          url?: string | null
          warning_text?: string | null
          yes_branch_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "steps_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
