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
      content_product_links: {
        Row: {
          content_id: string
          created_at: string
          product_content_id: string
          relation_type: Database["public"]["Enums"]["product_relation_type"]
        }
        Insert: {
          content_id: string
          created_at?: string
          product_content_id: string
          relation_type: Database["public"]["Enums"]["product_relation_type"]
        }
        Update: {
          content_id?: string
          created_at?: string
          product_content_id?: string
          relation_type?: Database["public"]["Enums"]["product_relation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "content_product_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_product_links_product_content_id_fkey"
            columns: ["product_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_revisions: {
        Row: {
          body_markdown: string
          change_summary: string | null
          content_id: string
          created_at: string
          created_by: string | null
          frontmatter_json: Json
          id: string
          revision_no: number
        }
        Insert: {
          body_markdown: string
          change_summary?: string | null
          content_id: string
          created_at?: string
          created_by?: string | null
          frontmatter_json: Json
          id?: string
          revision_no: number
        }
        Update: {
          body_markdown?: string
          change_summary?: string | null
          content_id?: string
          created_at?: string
          created_by?: string | null
          frontmatter_json?: Json
          id?: string
          revision_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          cited_url: string | null
          content_id: string
          created_at: string
          id: string
          note: string | null
          source_id: string
        }
        Insert: {
          cited_url?: string | null
          content_id: string
          created_at?: string
          id?: string
          note?: string | null
          source_id: string
        }
        Update: {
          cited_url?: string | null
          content_id?: string
          created_at?: string
          id?: string
          note?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          content_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          authoring_source: Database["public"]["Enums"]["authoring_source"]
          body_html: string | null
          body_markdown: string
          checksum: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          date: string
          description: string
          featured: boolean
          hero_image_url: string | null
          id: string
          legacy_category: string | null
          published_at: string | null
          read_time: number
          slug: string
          source_path: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          authoring_source?: Database["public"]["Enums"]["authoring_source"]
          body_html?: string | null
          body_markdown: string
          checksum?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          date: string
          description: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          legacy_category?: string | null
          published_at?: string | null
          read_time: number
          slug: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          authoring_source?: Database["public"]["Enums"]["authoring_source"]
          body_html?: string | null
          body_markdown?: string
          checksum?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          date?: string
          description?: string
          featured?: boolean
          hero_image_url?: string | null
          id?: string
          legacy_category?: string | null
          published_at?: string | null
          read_time?: number
          slug?: string
          source_path?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      digest_details: {
        Row: {
          content_id: string
          created_at: string
          digest_date: string
          edition: Database["public"]["Enums"]["digest_edition"]
          updated_at: string
        }
        Insert: {
          content_id: string
          created_at?: string
          digest_date: string
          edition: Database["public"]["Enums"]["digest_edition"]
          updated_at?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          digest_date?: string
          edition?: Database["public"]["Enums"]["digest_edition"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_details_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_ranking_items: {
        Row: {
          created_at: string
          headline: string
          news_content_id: string | null
          nva_community: number | null
          nva_media: number | null
          nva_social: number | null
          nva_solo_relevance: number | null
          nva_technical: number | null
          nva_total: number
          product_content_id: string | null
          rank: number
          ranking_id: string
          source_url: string | null
        }
        Insert: {
          created_at?: string
          headline: string
          news_content_id?: string | null
          nva_community?: number | null
          nva_media?: number | null
          nva_social?: number | null
          nva_solo_relevance?: number | null
          nva_technical?: number | null
          nva_total: number
          product_content_id?: string | null
          rank: number
          ranking_id: string
          source_url?: string | null
        }
        Update: {
          created_at?: string
          headline?: string
          news_content_id?: string | null
          nva_community?: number | null
          nva_media?: number | null
          nva_social?: number | null
          nva_solo_relevance?: number | null
          nva_technical?: number | null
          nva_total?: number
          product_content_id?: string | null
          rank?: number
          ranking_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digest_ranking_items_news_content_id_fkey"
            columns: ["news_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digest_ranking_items_product_content_id_fkey"
            columns: ["product_content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digest_ranking_items_ranking_id_fkey"
            columns: ["ranking_id"]
            isOneToOne: false
            referencedRelation: "digest_rankings"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_rankings: {
        Row: {
          created_at: string
          digest_content_id: string
          id: string
          top_n: number
          updated_at: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string
          digest_content_id: string
          id?: string
          top_n?: number
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string
          digest_content_id?: string
          id?: string
          top_n?: number
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digest_rankings_digest_content_id_fkey"
            columns: ["digest_content_id"]
            isOneToOne: true
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_name: string | null
          content_id: string
          created_at: string
          last_verified_at: string | null
          pricing_summary: string | null
          product_slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          content_id: string
          created_at?: string
          last_verified_at?: string | null
          pricing_summary?: string | null
          product_slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          content_id?: string
          created_at?: string
          last_verified_at?: string | null
          pricing_summary?: string | null
          product_slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          id: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_content_type: {
        Args: {
          expected_type: Database["public"]["Enums"]["content_type"]
          field_name: string
          target_content_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      authoring_source: "markdown" | "db"
      content_status: "draft" | "review" | "published" | "archived"
      content_type: "news" | "product" | "digest"
      digest_edition: "morning" | "evening"
      product_relation_type:
        | "primary"
        | "related"
        | "mentioned"
        | "ranking-item"
      source_type: "official" | "media" | "community" | "social" | "other"
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
      authoring_source: ["markdown", "db"],
      content_status: ["draft", "review", "published", "archived"],
      content_type: ["news", "product", "digest"],
      digest_edition: ["morning", "evening"],
      product_relation_type: [
        "primary",
        "related",
        "mentioned",
        "ranking-item",
      ],
      source_type: ["official", "media", "community", "social", "other"],
    },
  },
} as const
