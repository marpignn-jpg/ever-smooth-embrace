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
      email_history: {
        Row: {
          created_at: string
          download_url: string | null
          event_id: string | null
          event_name: string | null
          id: string
          last_sent_at: string
          recipient_email: string
          resend_count: number
          status: string
          subject: string | null
          ticket_infos: Json
          tokens: string[]
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          last_sent_at?: string
          recipient_email: string
          resend_count?: number
          status?: string
          subject?: string | null
          ticket_infos?: Json
          tokens?: string[]
        }
        Update: {
          created_at?: string
          download_url?: string | null
          event_id?: string | null
          event_name?: string | null
          id?: string
          last_sent_at?: string
          recipient_email?: string
          resend_count?: number
          status?: string
          subject?: string | null
          ticket_infos?: Json
          tokens?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "email_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          apple_pay_enabled: boolean
          artist: string | null
          categories: string[]
          city: string | null
          created_at: string
          date: string
          face_value: number | null
          fee_amount: number | null
          id: string
          image_url: string | null
          max_tickets_per_order: number
          name: string
          payment_url_applepay: string | null
          payment_url_card: string | null
          payment_url_googlepay: string | null
          seat_block: string | null
          seat_details: string | null
          seat_entrance: string | null
          seat_numbers: string | null
          seat_row: string | null
          seating_type: Database["public"]["Enums"]["seating_type"]
          show_seat_numbers: boolean
          status: Database["public"]["Enums"]["event_status"]
          total_tickets: number | null
          updated_at: string
          venue: string
        }
        Insert: {
          apple_pay_enabled?: boolean
          artist?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          date: string
          face_value?: number | null
          fee_amount?: number | null
          id?: string
          image_url?: string | null
          max_tickets_per_order?: number
          name: string
          payment_url_applepay?: string | null
          payment_url_card?: string | null
          payment_url_googlepay?: string | null
          seat_block?: string | null
          seat_details?: string | null
          seat_entrance?: string | null
          seat_numbers?: string | null
          seat_row?: string | null
          seating_type?: Database["public"]["Enums"]["seating_type"]
          show_seat_numbers?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          total_tickets?: number | null
          updated_at?: string
          venue: string
        }
        Update: {
          apple_pay_enabled?: boolean
          artist?: string | null
          categories?: string[]
          city?: string | null
          created_at?: string
          date?: string
          face_value?: number | null
          fee_amount?: number | null
          id?: string
          image_url?: string | null
          max_tickets_per_order?: number
          name?: string
          payment_url_applepay?: string | null
          payment_url_card?: string | null
          payment_url_googlepay?: string | null
          seat_block?: string | null
          seat_details?: string | null
          seat_entrance?: string | null
          seat_numbers?: string | null
          seat_row?: string | null
          seating_type?: Database["public"]["Enums"]["seating_type"]
          show_seat_numbers?: boolean
          status?: Database["public"]["Enums"]["event_status"]
          total_tickets?: number | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      kyc_requests: {
        Row: {
          buyer_name: string | null
          created_at: string
          deadline: string | null
          email: string
          event_name: string | null
          id: string
          message: string | null
          status: string
          target_url: string
          token: string
          updated_at: string
        }
        Insert: {
          buyer_name?: string | null
          created_at?: string
          deadline?: string | null
          email: string
          event_name?: string | null
          id?: string
          message?: string | null
          status?: string
          target_url: string
          token?: string
          updated_at?: string
        }
        Update: {
          buyer_name?: string | null
          created_at?: string
          deadline?: string | null
          email?: string
          event_name?: string | null
          id?: string
          message?: string | null
          status?: string
          target_url?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          buyer_email: string | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_phone: string | null
          created_at: string
          event_id: string
          id: string
          payment_method: string | null
          payment_url_used: string | null
          resale_token: string | null
          status: Database["public"]["Enums"]["order_status"]
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          event_id: string
          id?: string
          payment_method?: string | null
          payment_url_used?: string | null
          resale_token?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          event_id?: string
          id?: string
          payment_method?: string | null
          payment_url_used?: string | null
          resale_token?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          event_id: string
          id: string
          original_price: number | null
          price: number
          resale_token: string
          seat: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tarif_label: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          event_id: string
          id?: string
          original_price?: number | null
          price: number
          resale_token?: string
          seat?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tarif_label?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          event_id?: string
          id?: string
          original_price?: number | null
          price?: number
          resale_token?: string
          seat?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tarif_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      event_status: "active" | "sold_out" | "cancelled" | "draft"
      order_status: "pending" | "paid" | "refunded" | "cancelled"
      seating_type: "numbered" | "free"
      ticket_status: "available" | "reserved" | "sold"
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
    Enums: {
      app_role: ["admin", "user"],
      event_status: ["active", "sold_out", "cancelled", "draft"],
      order_status: ["pending", "paid", "refunded", "cancelled"],
      seating_type: ["numbered", "free"],
      ticket_status: ["available", "reserved", "sold"],
    },
  },
} as const
