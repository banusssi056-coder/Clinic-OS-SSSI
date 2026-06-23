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
      activity_logs: {
        Row: {
          action: string
          actor: string
          created_at: string | null
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string | null
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          duration_min: number | null
          id: string
          notes: string | null
          patient_id: string | null
          scheduled_at: string
          status: string | null
          token_no: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          scheduled_at: string
          status?: string | null
          token_no?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          duration_min?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          scheduled_at?: string
          status?: string | null
          token_no?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_run_at: string | null
          name: string
          runs_count: number | null
          trigger: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          name: string
          runs_count?: number | null
          trigger: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_run_at?: string | null
          name?: string
          runs_count?: number | null
          trigger?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience_filter: string | null
          booked: number | null
          channel: string | null
          cost: number | null
          created_at: string | null
          delivered: number | null
          id: string
          name: string
          opened: number | null
          revenue_attributed: number | null
          sent_count: number | null
          status: string | null
          template: string | null
          updated_at: string | null
        }
        Insert: {
          audience_filter?: string | null
          booked?: number | null
          channel?: string | null
          cost?: number | null
          created_at?: string | null
          delivered?: number | null
          id?: string
          name: string
          opened?: number | null
          revenue_attributed?: number | null
          sent_count?: number | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          audience_filter?: string | null
          booked?: number | null
          channel?: string | null
          cost?: number | null
          created_at?: string | null
          delivered?: number | null
          id?: string
          name?: string
          opened?: number | null
          revenue_attributed?: number | null
          sent_count?: number | null
          status?: string | null
          template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      doctors: {
        Row: {
          active: boolean | null
          avatar_color: string | null
          consultation_fee: number
          created_at: string | null
          id: string
          name: string
          phone: string | null
          specialization: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_color?: string | null
          consultation_fee?: number
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          specialization: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_color?: string | null
          consultation_fee?: number
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          specialization?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          discount: number | null
          id: string
          invoice_no: string | null
          items: Json | null
          paid: number | null
          patient_id: string | null
          payment_mode: string | null
          status: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          invoice_no?: string | null
          items?: Json | null
          paid?: number | null
          patient_id?: string | null
          payment_mode?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          invoice_no?: string | null
          items?: Json | null
          paid?: number | null
          patient_id?: string | null
          payment_mode?: string | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          estimated_value: number | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          package_id: string | null
          patient_id: string | null
          sessions_used: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          package_id?: string | null
          patient_id?: string | null
          sessions_used?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          package_id?: string | null
          patient_id?: string | null
          sessions_used?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          channel: string | null
          created_at: string | null
          direction: string | null
          id: string
          patient_id: string | null
          sent_at: string | null
          status: string | null
          template_name: string | null
        }
        Insert: {
          body: string
          channel?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
        }
        Update: {
          body?: string
          channel?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          patient_id?: string | null
          sent_at?: string | null
          status?: string | null
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number
          services: string[] | null
          sessions_total: number | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
          services?: string[] | null
          sessions_total?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
          services?: string[] | null
          sessions_total?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          city: string | null
          created_at: string | null
          dob: string | null
          email: string | null
          gender: string | null
          id: string
          last_visit: string | null
          lifetime_value: number | null
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          dob?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit?: string | null
          lifetime_value?: number | null
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          dob?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          last_visit?: string | null
          lifetime_value?: number | null
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string | null
          id: string
          patient_id: string | null
          platform: string | null
          posted_at: string | null
          rating: number
          requested_at: string | null
          text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          platform?: string | null
          posted_at?: string | null
          rating: number
          requested_at?: string | null
          text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          patient_id?: string | null
          platform?: string | null
          posted_at?: string | null
          rating?: number
          requested_at?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          clinic_name: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          phone: string | null
          slot_duration: number | null
          tagline: string | null
          theme_gradient: string | null
          timezone: string | null
          updated_at: string | null
          whatsapp_template_followup: string | null
          whatsapp_template_noshow: string | null
          whatsapp_template_review: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          slot_duration?: number | null
          tagline?: string | null
          theme_gradient?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_template_followup?: string | null
          whatsapp_template_noshow?: string | null
          whatsapp_template_review?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          clinic_name?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          slot_duration?: number | null
          tagline?: string | null
          theme_gradient?: string | null
          timezone?: string | null
          updated_at?: string | null
          whatsapp_template_followup?: string | null
          whatsapp_template_noshow?: string | null
          whatsapp_template_review?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          performance_score: number | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          performance_score?: number | null
          phone?: string | null
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          performance_score?: number | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          id: string
          priority: string | null
          related_patient_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string | null
          related_patient_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string | null
          related_patient_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_patient_id_fkey"
            columns: ["related_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
