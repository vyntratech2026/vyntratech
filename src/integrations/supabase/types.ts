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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string
          company_id: string
          created_at: string
          customer_id: string
          duration_minutes: number
          end_at: string
          id: string
          manage_token: string
          notes: string | null
          notified_at: string | null
          price: number
          product_items: Json
          service_id: string
          service_name: string
          source: string
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          barber_id: string
          company_id?: string
          created_at?: string
          customer_id: string
          duration_minutes: number
          end_at: string
          id?: string
          manage_token?: string
          notes?: string | null
          notified_at?: string | null
          price: number
          product_items?: Json
          service_id: string
          service_name: string
          source?: string
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          barber_id?: string
          company_id?: string
          created_at?: string
          customer_id?: string
          duration_minutes?: number
          end_at?: string
          id?: string
          manage_token?: string
          notes?: string | null
          notified_at?: string | null
          price?: number
          product_items?: Json
          service_id?: string
          service_name?: string
          source?: string
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_company_fkey"
            columns: ["customer_id", "company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_company_fkey"
            columns: ["service_id", "company_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          company_id: string
          id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          company_id?: string
          id?: string
          service_id: string
        }
        Update: {
          barber_id?: string
          company_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_company_fkey"
            columns: ["service_id", "company_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          commission_percent: number
          company_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          photo_url: string | null
          specialties: string[]
          user_id: string | null
        }
        Insert: {
          commission_percent?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          specialties?: string[]
          user_id?: string | null
        }
        Update: {
          commission_percent?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          specialties?: string[]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_times: {
        Row: {
          barber_id: string | null
          company_id: string
          created_at: string
          end_at: string
          id: string
          reason: string | null
          start_at: string
        }
        Insert: {
          barber_id?: string | null
          company_id?: string
          created_at?: string
          end_at: string
          id?: string
          reason?: string | null
          start_at: string
        }
        Update: {
          barber_id?: string | null
          company_id?: string
          created_at?: string
          end_at?: string
          id?: string
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_times_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "blocked_times_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_times_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          business_type: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          business_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          company_id: string
          expires_at: string | null
          plan: string | null
          starts_at: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          expires_at?: string | null
          plan?: string | null
          starts_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          expires_at?: string | null
          plan?: string | null
          starts_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_offers: {
        Row: {
          benefits: string
          company_id: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          period_months: number
          price: number
          service_id: string | null
          start_date: string | null
        }
        Insert: {
          benefits?: string
          company_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          kind: string
          name: string
          period_months?: number
          price: number
          service_id?: string | null
          start_date?: string | null
        }
        Update: {
          benefits?: string
          company_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          period_months?: number
          price?: number
          service_id?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_offers_service_id_company_id_fkey"
            columns: ["service_id", "company_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "company_id"]
          },
        ]
      }
      customers: {
        Row: {
          company_id: string
          created_at: string
          full_name: string
          id: string
          notes: string | null
          phone: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
        }
        Update: {
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          company_id: string
          id: number
          pushcut_enabled: boolean
          pushcut_url: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          id?: number
          pushcut_enabled?: boolean
          pushcut_url?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          id?: number
          pushcut_enabled?: boolean
          pushcut_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          barber_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          kind: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barber_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          payment_date?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          product_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barber_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          kind?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_company_fkey"
            columns: ["appointment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "payments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_company_fkey"
            columns: ["customer_id", "company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_product_company_fkey"
            columns: ["product_id", "company_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admin_authorizations: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          name: string
          photo_url: string | null
          price: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name: string
          photo_url?: string | null
          price: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          name?: string
          photo_url?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          barber_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          barber_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          barber_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string
          barber_id: string | null
          comment: string | null
          company_id: string
          created_at: string
          customer_id: string
          id: string
          is_approved: boolean
          rating: number
          reviewer_name: string
        }
        Insert: {
          appointment_id: string
          barber_id?: string | null
          comment?: string | null
          company_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_approved?: boolean
          rating: number
          reviewer_name: string
        }
        Update: {
          appointment_id?: string
          barber_id?: string | null
          comment?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_approved?: boolean
          rating?: number
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_company_fkey"
            columns: ["appointment_id", "company_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "reviews_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_company_fkey"
            columns: ["customer_id", "company_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          price: number
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          price: number
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          address: string | null
          brand_background: string
          brand_primary: string
          brand_text: string
          business_name: string
          cancellation_min_hours: number
          cancellation_policy: string | null
          company_id: string
          cover_url: string | null
          description: string | null
          google_review_url: string | null
          id: number
          instagram: string | null
          logo_url: string | null
          maps_url: string | null
          max_advance_days: number
          min_advance_minutes: number
          notification_email: string | null
          opening_hours: Json
          phone: string | null
          slot_interval_minutes: number
          tagline: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          brand_background?: string
          brand_primary?: string
          brand_text?: string
          business_name?: string
          cancellation_min_hours?: number
          cancellation_policy?: string | null
          company_id: string
          cover_url?: string | null
          description?: string | null
          google_review_url?: string | null
          id?: number
          instagram?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_advance_days?: number
          min_advance_minutes?: number
          notification_email?: string | null
          opening_hours?: Json
          phone?: string | null
          slot_interval_minutes?: number
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          brand_background?: string
          brand_primary?: string
          brand_text?: string
          business_name?: string
          cancellation_min_hours?: number
          cancellation_policy?: string | null
          company_id?: string
          cover_url?: string | null
          description?: string | null
          google_review_url?: string | null
          id?: number
          instagram?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_advance_days?: number
          min_advance_minutes?: number
          notification_email?: string | null
          opening_hours?: Json
          phone?: string | null
          slot_interval_minutes?: number
          tagline?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      site_videos: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string | null
          video_path: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string | null
          video_path: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string | null
          video_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_videos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_videos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          action: string
          actor_id: string
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          plan: string | null
          starts_at: string | null
        }
        Insert: {
          action: string
          actor_id: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          starts_at?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string | null
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          barber_id: string
          company_id: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
        }
        Insert: {
          barber_id: string
          company_id?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
        }
        Update: {
          barber_id?: string
          company_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_barber_company_fkey"
            columns: ["barber_id", "company_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "working_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_company_directory: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      public_company_settings: {
        Row: {
          address: string | null
          brand_background: string | null
          brand_primary: string | null
          brand_text: string | null
          business_name: string | null
          cancellation_min_hours: number | null
          cancellation_policy: string | null
          company_id: string | null
          cover_url: string | null
          description: string | null
          google_review_url: string | null
          instagram: string | null
          logo_url: string | null
          maps_url: string | null
          max_advance_days: number | null
          min_advance_minutes: number | null
          opening_hours: Json | null
          phone: string | null
          slot_interval_minutes: number | null
          tagline: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          brand_background?: string | null
          brand_primary?: string | null
          brand_text?: string | null
          business_name?: string | null
          cancellation_min_hours?: number | null
          cancellation_policy?: string | null
          company_id?: string | null
          cover_url?: string | null
          description?: string | null
          google_review_url?: string | null
          instagram?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_advance_days?: number | null
          min_advance_minutes?: number | null
          opening_hours?: Json | null
          phone?: string | null
          slot_interval_minutes?: number | null
          tagline?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          brand_background?: string | null
          brand_primary?: string | null
          brand_text?: string | null
          business_name?: string | null
          cancellation_min_hours?: number | null
          cancellation_policy?: string | null
          company_id?: string | null
          cover_url?: string | null
          description?: string | null
          google_review_url?: string | null
          instagram?: string | null
          logo_url?: string | null
          maps_url?: string | null
          max_advance_days?: number | null
          min_advance_minutes?: number | null
          opening_hours?: Json | null
          phone?: string | null
          slot_interval_minutes?: number | null
          tagline?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "public_company_directory"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_booking: {
        Args: {
          p_barber_id: string
          p_full_name: string
          p_notes?: string
          p_phone: string
          p_service_id: string
          p_start_at: string
        }
        Returns: string
      }
      admin_exists: { Args: never; Returns: boolean }
      barber_slot_ok: {
        Args: {
          p_barber: string
          p_end: string
          p_ignore?: string
          p_start: string
        }
        Returns: boolean
      }
      cancel_booking: { Args: { p_token: string }; Returns: boolean }
      claim_platform_admin: { Args: never; Returns: boolean }
      company_access_active: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      create_booking: {
        Args: {
          p_barber_id: string
          p_full_name: string
          p_phone: string
          p_service_id: string
          p_start_at: string
        }
        Returns: Json
      }
      create_booking_with_products: {
        Args: {
          p_barber_id: string
          p_full_name: string
          p_phone: string
          p_products?: Json
          p_service_id: string
          p_start_at: string
        }
        Returns: Json
      }
      create_company: {
        Args: { p_name: string; p_slug: string; p_type: string }
        Returns: Json
      }
      current_barber_id: { Args: never; Returns: string }
      current_company_id: { Args: never; Returns: string }
      effective_service_price: { Args: { p_service: string }; Returns: number }
      get_available_slots: {
        Args: { p_barber_id?: string; p_date: string; p_service_id: string }
        Returns: {
          barber_ids: string[]
          slot_start: string
        }[]
      }
      get_booking: { Args: { p_token: string }; Returns: Json }
      grant_company_trial: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: { Args: { _cid: string }; Returns: boolean }
      is_company_member: { Args: { _cid: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_published_site_file: {
        Args: { p_bucket: string; p_path: string }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      normalize_phone: { Args: { p: string }; Returns: string }
      remove_professional: { Args: { p_barber_id: string }; Returns: undefined }
      set_company_subscription: {
        Args: { p_company_id: string; p_plan: string; p_suspend?: boolean }
        Returns: undefined
      }
      set_company_subscription_dates: {
        Args: {
          p_company_id: string
          p_end_date: string
          p_plan: string
          p_start_date: string
        }
        Returns: undefined
      }
      slug_problem: { Args: { p_slug: string }; Returns: string }
      storage_company: { Args: { _name: string }; Returns: string }
      submit_review: {
        Args: { p_comment: string; p_rating: number; p_token: string }
        Returns: boolean
      }
      update_appointment_status: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["appointment_status"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "barber"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      payment_method: "cash" | "pix" | "credit_card" | "debit_card" | "other"
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
      app_role: ["admin", "barber"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      payment_method: ["cash", "pix", "credit_card", "debit_card", "other"],
    },
  },
} as const
