export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          plan: "free" | "single" | "team" | "broker";
          monthly_analysis_limit: number;
          analyses_used_this_month: number;
          billing_cycle_start: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          plan?: "free" | "single" | "team" | "broker";
          monthly_analysis_limit?: number;
          analyses_used_this_month?: number;
          billing_cycle_start?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          plan?: "free" | "single" | "team" | "broker";
          monthly_analysis_limit?: number;
          analyses_used_this_month?: number;
          billing_cycle_start?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: "admin" | "member" | "viewer";
          invited_by: string | null;
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: "admin" | "member" | "viewer";
          invited_by?: string | null;
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: "admin" | "member" | "viewer";
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
      };
      market_benchmarks: {
        Row: {
          id: string;
          region: string;
          property_type: string;
          building_class: string | null;
          avg_rent_per_sf: number | null;
          avg_cam_per_sf: number | null;
          avg_ti_allowance_per_sf: number | null;
          avg_lease_term_months: number | null;
          avg_annual_escalation: number | null;
          avg_free_rent_months: number | null;
          avg_security_deposit_months: number | null;
          personal_guarantee_common: boolean;
          early_termination_common: boolean;
          renewal_option_common: boolean;
          data_source: string | null;
          sample_size: number | null;
          effective_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          region: string;
          property_type: string;
          building_class?: string | null;
          avg_rent_per_sf?: number | null;
          avg_cam_per_sf?: number | null;
          avg_ti_allowance_per_sf?: number | null;
          avg_lease_term_months?: number | null;
          avg_annual_escalation?: number | null;
          avg_free_rent_months?: number | null;
          avg_security_deposit_months?: number | null;
          personal_guarantee_common?: boolean;
          early_termination_common?: boolean;
          renewal_option_common?: boolean;
          data_source?: string | null;
          sample_size?: number | null;
          effective_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          region?: string;
          property_type?: string;
          building_class?: string | null;
          avg_rent_per_sf?: number | null;
          avg_cam_per_sf?: number | null;
          avg_ti_allowance_per_sf?: number | null;
          avg_lease_term_months?: number | null;
          avg_annual_escalation?: number | null;
          avg_free_rent_months?: number | null;
          avg_security_deposit_months?: number | null;
          personal_guarantee_common?: boolean;
          early_termination_common?: boolean;
          renewal_option_common?: boolean;
          data_source?: string | null;
          sample_size?: number | null;
          effective_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          full_name: string | null;
          role: "owner" | "admin" | "member" | "viewer";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: "owner" | "admin" | "member" | "viewer";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          email?: string;
          full_name?: string | null;
          role?: "owner" | "admin" | "member" | "viewer";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leases: {
        Row: {
          id: string;
          organization_id: string;
          uploaded_by: string | null;
          title: string;
          property_address: string | null;
          property_type:
            | "office"
            | "retail"
            | "industrial"
            | "warehouse"
            | "medical"
            | "mixed"
            | "other"
            | null;
          file_url: string;
          file_size_bytes: number | null;
          page_count: number | null;
          status: "processing" | "analyzed" | "failed" | "pending";
          ocr_enabled: boolean;
          ocr_processed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          uploaded_by?: string | null;
          title: string;
          property_address?: string | null;
          property_type?:
            | "office"
            | "retail"
            | "industrial"
            | "warehouse"
            | "medical"
            | "mixed"
            | "other"
            | null;
          file_url: string;
          file_size_bytes?: number | null;
          page_count?: number | null;
          status?: "processing" | "analyzed" | "failed" | "pending";
          ocr_enabled?: boolean;
          ocr_processed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          uploaded_by?: string | null;
          title?: string;
          property_address?: string | null;
          property_type?:
            | "office"
            | "retail"
            | "industrial"
            | "warehouse"
            | "medical"
            | "mixed"
            | "other"
            | null;
          file_url?: string;
          file_size_bytes?: number | null;
          page_count?: number | null;
          status?: "processing" | "analyzed" | "failed" | "pending";
          ocr_enabled?: boolean;
          ocr_processed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      lease_chunks: {
        Row: {
          id: string;
          lease_id: string;
          page: number;
          chunk_index: number;
          content: string;
          embedding: number[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          page: number;
          chunk_index?: number;
          content: string;
          embedding?: number[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          page?: number;
          chunk_index?: number;
          content?: string;
          embedding?: number[] | null;
          created_at?: string;
        };
      };
      lease_analyses: {
        Row: {
          id: string;
          lease_id: string;
          risk_score: number | null;
          risk_level: "low" | "medium" | "high" | "critical" | null;
          executive_summary: string | null;
          strengths: Json;
          concerns: Json;
          high_risk_items: Json;
          recommendations: Json;
          market_comparison: Json | null;
          analysis_metadata: Json;
          processing_time_ms: number | null;
          ai_model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          risk_score?: number | null;
          risk_level?: "low" | "medium" | "high" | "critical" | null;
          executive_summary?: string | null;
          strengths?: Json;
          concerns?: Json;
          high_risk_items?: Json;
          recommendations?: Json;
          market_comparison?: Json | null;
          analysis_metadata?: Json;
          processing_time_ms?: number | null;
          ai_model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          risk_score?: number | null;
          risk_level?: "low" | "medium" | "high" | "critical" | null;
          executive_summary?: string | null;
          strengths?: Json;
          concerns?: Json;
          high_risk_items?: Json;
          recommendations?: Json;
          market_comparison?: Json | null;
          analysis_metadata?: Json;
          processing_time_ms?: number | null;
          ai_model?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clause_extractions: {
        Row: {
          id: string;
          lease_id: string;
          analysis_id: string | null;
          category: string;
          subcategory: string | null;
          clause_type: string;
          original_text: string;
          plain_english_explanation: string | null;
          risk_impact: number | null;
          risk_factors: Json;
          page_numbers: number[] | null;
          is_standard: boolean;
          recommendations: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          analysis_id?: string | null;
          category: string;
          subcategory?: string | null;
          clause_type: string;
          original_text: string;
          plain_english_explanation?: string | null;
          risk_impact?: number | null;
          risk_factors?: Json;
          page_numbers?: number[] | null;
          is_standard?: boolean;
          recommendations?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          analysis_id?: string | null;
          category?: string;
          subcategory?: string | null;
          clause_type?: string;
          original_text?: string;
          plain_english_explanation?: string | null;
          risk_impact?: number | null;
          risk_factors?: Json;
          page_numbers?: number[] | null;
          is_standard?: boolean;
          recommendations?: string[] | null;
          created_at?: string;
        };
      };
      lease_comments: {
        Row: {
          id: string;
          lease_id: string;
          clause_id: string | null;
          analysis_id: string | null;
          parent_comment_id: string | null;
          user_id: string | null;
          content: string;
          created_at: string;
          updated_at: string | null;
          share_link_id: string | null;
          guest_name: string | null;
          guest_email: string | null;
        };
        Insert: {
          id?: string;
          lease_id: string;
          clause_id?: string | null;
          analysis_id?: string | null;
          parent_comment_id?: string | null;
          user_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string | null;
          share_link_id?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
        };
        Update: {
          id?: string;
          lease_id?: string;
          clause_id?: string | null;
          analysis_id?: string | null;
          parent_comment_id?: string | null;
          user_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string | null;
          share_link_id?: string | null;
          guest_name?: string | null;
          guest_email?: string | null;
        };
      };
      share_links: {
        Row: {
          id: string;
          organization_id: string;
          lease_id: string;
          created_by: string | null;
          token: string;
          password_hash: string | null;
          expires_at: string | null;
          label: string | null;
          allow_comments: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lease_id: string;
          created_by?: string | null;
          token: string;
          password_hash?: string | null;
          expires_at?: string | null;
          label?: string | null;
          allow_comments?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lease_id?: string;
          created_by?: string | null;
          token?: string;
          password_hash?: string | null;
          expires_at?: string | null;
          label?: string | null;
          allow_comments?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      organization_branding: {
        Row: {
          id: string;
          organization_id: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          custom_domain: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          custom_domain?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          custom_domain?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      share_link_views: {
        Row: {
          id: string;
          share_link_id: string;
          viewed_at: string;
          ip_hash: string | null;
          user_agent: string | null;
          referrer: string | null;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          viewed_at?: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
        };
        Update: {
          id?: string;
          share_link_id?: string;
          viewed_at?: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
        };
      };
      approval_workflows: {
        Row: {
          id: string;
          share_link_id: string;
          status: string;
          requested_by: string | null;
          responded_at: string | null;
          response_note: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          status?: string;
          requested_by?: string | null;
          responded_at?: string | null;
          response_note?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          share_link_id?: string;
          status?: string;
          requested_by?: string | null;
          responded_at?: string | null;
          response_note?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by?: string | null;
          name?: string;
          key_prefix?: string;
          key_hash?: string;
          last_used_at?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
      };
      webhooks: {
        Row: {
          id: string;
          organization_id: string;
          url: string;
          secret: string | null;
          events: string[];
          active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          url: string;
          secret?: string | null;
          events?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          url?: string;
          secret?: string | null;
          events?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      lease_templates: {
        Row: {
          id: string;
          organization_id: string | null;
          created_by: string | null;
          name: string;
          description: string | null;
          structure_type: string | null;
          content_json: Json | null;
          is_prebuilt: boolean;
          shared_with_org: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          created_by?: string | null;
          name: string;
          description?: string | null;
          structure_type?: string | null;
          content_json?: Json | null;
          is_prebuilt?: boolean;
          shared_with_org?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          created_by?: string | null;
          name?: string;
          description?: string | null;
          structure_type?: string | null;
          content_json?: Json | null;
          is_prebuilt?: boolean;
          shared_with_org?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      lease_template_versions: {
        Row: {
          id: string;
          template_id: string;
          version_number: number;
          content_json: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          version_number: number;
          content_json?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          version_number?: number;
          content_json?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_risk_level: {
        Args: { score: number };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

