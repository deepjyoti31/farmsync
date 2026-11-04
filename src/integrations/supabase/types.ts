export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_screenshots: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_featured: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      batch_contributions: {
        Row: {
          batch_id: string
          created_at: string | null
          harvest_id: string | null
          id: string
          notes: string | null
          quantity: number
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          harvest_id?: string | null
          id?: string
          notes?: string | null
          quantity: number
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          harvest_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_contributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "produce_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_order_items: {
        Row: {
          bulk_order_id: string
          id: string
          product_name: string
          unit: string
          unit_price: number
        }
        Insert: {
          bulk_order_id: string
          id?: string
          product_name: string
          unit: string
          unit_price: number
        }
        Update: {
          bulk_order_id?: string
          id?: string
          product_name?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulk_order_items_bulk_order_id_fkey"
            columns: ["bulk_order_id"]
            isOneToOne: false
            referencedRelation: "bulk_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_orders: {
        Row: {
          created_at: string | null
          deadline: string
          id: string
          organization_id: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          deadline: string
          id?: string
          organization_id: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          deadline?: string
          id?: string
          organization_id?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audits: {
        Row: {
          farm_id: string
          generated_at: string | null
          id: string
          results: Json
          severity_score: number | null
        }
        Insert: {
          farm_id: string
          generated_at?: string | null
          id?: string
          results: Json
          severity_score?: number | null
        }
        Update: {
          farm_id?: string
          generated_at?: string | null
          id?: string
          results?: Json
          severity_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audits_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          category: string
          created_at: string | null
          id: string
          rule_description: string
          severity: string | null
          standard_id: string
          validation_logic: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          rule_description: string
          severity?: string | null
          standard_id: string
          validation_logic: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          rule_description?: string
          severity?: string | null
          standard_id?: string
          validation_logic?: Json
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "compliance_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_standards: {
        Row: {
          authority: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          version: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          version?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          version?: string | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string | null
          description: string | null
          growing_duration: number | null
          growing_season: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string | null
          variety: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          growing_duration?: number | null
          growing_season?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string | null
          variety?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          growing_duration?: number | null
          growing_season?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string | null
          variety?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          api_key: string
          configuration: Json | null
          created_at: string
          external_id: string | null
          farm_id: string
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          api_key: string
          configuration?: Json | null
          created_at?: string
          external_id?: string | null
          farm_id: string
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          api_key?: string
          configuration?: Json | null
          created_at?: string
          external_id?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          equipment_type: string
          farm_id: string
          id: string
          last_maintenance_date: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_type: string
          farm_id: string
          id?: string
          last_maintenance_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_type?: string
          farm_id?: string
          id?: string
          last_maintenance_date?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          cost: number | null
          created_at: string | null
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          equipment_id: string
          id?: string
          maintenance_date: string
          maintenance_type: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_tips: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_verified: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_verified?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      farm_subscriptions: {
        Row: {
          created_at: string | null
          farm_id: string
          id: string
          standard_id: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          farm_id: string
          id?: string
          standard_id: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          farm_id?: string
          id?: string
          standard_id?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_subscriptions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_subscriptions_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "compliance_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          area_unit: string | null
          boundaries: Json | null
          created_at: string | null
          district: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          location: string | null
          name: string
          organization_id: string | null
          state: string | null
          total_area: number | null
          updated_at: string | null
          user_id: string
          village: string | null
        }
        Insert: {
          area_unit?: string | null
          boundaries?: Json | null
          created_at?: string | null
          district?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location?: string | null
          name: string
          organization_id?: string | null
          state?: string | null
          total_area?: number | null
          updated_at?: string | null
          user_id: string
          village?: string | null
        }
        Update: {
          area_unit?: string | null
          boundaries?: Json | null
          created_at?: string | null
          district?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location?: string | null
          name?: string
          organization_id?: string | null
          state?: string | null
          total_area?: number | null
          updated_at?: string | null
          user_id?: string
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      field_crops: {
        Row: {
          actual_harvest_date: string | null
          created_at: string | null
          crop_id: string | null
          expected_harvest_date: string | null
          field_id: string
          id: string
          name: string | null
          notes: string | null
          planting_date: string
          status: string | null
          updated_at: string | null
          yield_amount: number | null
          yield_unit: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          created_at?: string | null
          crop_id?: string | null
          expected_harvest_date?: string | null
          field_id: string
          id?: string
          name?: string | null
          notes?: string | null
          planting_date: string
          status?: string | null
          updated_at?: string | null
          yield_amount?: number | null
          yield_unit?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          created_at?: string | null
          crop_id?: string | null
          expected_harvest_date?: string | null
          field_id?: string
          id?: string
          name?: string | null
          notes?: string | null
          planting_date?: string
          status?: string | null
          updated_at?: string | null
          yield_amount?: number | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_crops_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_crops_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          area: number
          area_unit: string
          boundaries: Json | null
          created_at: string | null
          farm_id: string
          id: string
          images: string[] | null
          location: string | null
          name: string
          soil_ph: number | null
          soil_type: string | null
          updated_at: string | null
        }
        Insert: {
          area: number
          area_unit: string
          boundaries?: Json | null
          created_at?: string | null
          farm_id: string
          id?: string
          images?: string[] | null
          location?: string | null
          name: string
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: number
          area_unit?: string
          boundaries?: Json | null
          created_at?: string | null
          farm_id?: string
          id?: string
          images?: string[] | null
          location?: string | null
          name?: string
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fields_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          farm_id: string
          id: string
          payment_method: string | null
          reference_number: string | null
          transaction_date: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          farm_id: string
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string | null
          forum_id: string
          id: string
          image_url: string | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          forum_id: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          forum_id?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_forum_id_fkey"
            columns: ["forum_id"]
            isOneToOne: false
            referencedRelation: "forums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forums: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      harvests: {
        Row: {
          created_at: string
          field_crop_id: string
          harvest_date: string
          id: string
          notes: string | null
          quality_rating: number | null
          quantity: number
          revenue: number | null
          unit: string
        }
        Insert: {
          created_at?: string
          field_crop_id: string
          harvest_date?: string
          id?: string
          notes?: string | null
          quality_rating?: number | null
          quantity: number
          revenue?: number | null
          unit: string
        }
        Update: {
          created_at?: string
          field_crop_id?: string
          harvest_date?: string
          id?: string
          notes?: string | null
          quality_rating?: number | null
          quantity?: number
          revenue?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvests_field_crop_id_fkey"
            columns: ["field_crop_id"]
            isOneToOne: false
            referencedRelation: "field_crops"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          amount_requested: number
          claim_date: string | null
          created_at: string | null
          evidence: string | null
          id: string
          policy_id: string
          reason: string
          status: string | null
        }
        Insert: {
          amount_requested: number
          claim_date?: string | null
          created_at?: string | null
          evidence?: string | null
          id?: string
          policy_id: string
          reason: string
          status?: string | null
        }
        Update: {
          amount_requested?: number
          claim_date?: string | null
          created_at?: string | null
          evidence?: string | null
          id?: string
          policy_id?: string
          reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          coverage_amount: number
          coverage_type: string
          created_at: string | null
          end_date: string
          farm_id: string
          id: string
          policy_number: string
          premium_amount: number
          provider: string
          start_date: string
          status: string | null
        }
        Insert: {
          coverage_amount: number
          coverage_type: string
          created_at?: string | null
          end_date: string
          farm_id: string
          id?: string
          policy_number: string
          premium_amount: number
          provider: string
          start_date: string
          status?: string | null
        }
        Update: {
          coverage_amount?: number
          coverage_type?: string
          created_at?: string | null
          end_date?: string
          farm_id?: string
          id?: string
          policy_number?: string
          premium_amount?: number
          provider?: string
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          farm_id: string
          id: string
          minimum_stock: number | null
          name: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          storage_location: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          farm_id: string
          id?: string
          minimum_stock?: number | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          farm_id?: string
          id?: string
          minimum_stock?: number | null
          name?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          total_price: number | null
          transaction_date: string
          transaction_type: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          notes?: string | null
          quantity: number
          total_price?: number | null
          transaction_date?: string
          transaction_type: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          total_price?: number | null
          transaction_date?: string
          transaction_type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          acquisition_cost: number | null
          acquisition_date: string | null
          birth_date: string | null
          breed: string | null
          created_at: string
          farm_id: string
          gender: string | null
          id: string
          livestock_type_id: string
          notes: string | null
          status: string | null
          tag_id: string | null
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          farm_id: string
          gender?: string | null
          id?: string
          livestock_type_id: string
          notes?: string | null
          status?: string | null
          tag_id?: string | null
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          farm_id?: string
          gender?: string | null
          id?: string
          livestock_type_id?: string
          notes?: string | null
          status?: string | null
          tag_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_livestock_type_id_fkey"
            columns: ["livestock_type_id"]
            isOneToOne: false
            referencedRelation: "livestock_types"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_health_records: {
        Row: {
          administered_by: string | null
          cost: number | null
          created_at: string
          description: string | null
          dosage: string | null
          id: string
          livestock_id: string
          medicine: string | null
          next_due_date: string | null
          notes: string | null
          record_date: string
          record_type: string
        }
        Insert: {
          administered_by?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          livestock_id: string
          medicine?: string | null
          next_due_date?: string | null
          notes?: string | null
          record_date?: string
          record_type: string
        }
        Update: {
          administered_by?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          livestock_id?: string
          medicine?: string | null
          next_due_date?: string | null
          notes?: string | null
          record_date?: string
          record_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_health_records_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_production: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          livestock_id: string | null
          notes: string | null
          production_date: string
          production_type: string
          quantity: number
          unit: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          production_date?: string
          production_type: string
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          livestock_id?: string | null
          notes?: string | null
          production_date?: string
          production_type?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_production_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_production_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          created_at: string | null
          farm_id: string
          id: string
          interest_rate: number
          provider: string
          status: string | null
          term_months: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          farm_id: string
          id?: string
          interest_rate: number
          provider: string
          status?: string | null
          term_months: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          farm_id?: string
          id?: string
          interest_rate?: number
          provider?: string
          status?: string | null
          term_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data: {
        Row: {
          created_at: string
          crop_name: string
          district: string | null
          id: string
          market_location: string | null
          max_price: number | null
          min_price: number | null
          modal_price: number | null
          price_date: string
          price_per_unit: number
          source: string | null
          state: string | null
          unit: string
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          district?: string | null
          id?: string
          market_location?: string | null
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          price_date: string
          price_per_unit: number
          source?: string | null
          state?: string | null
          unit: string
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          district?: string | null
          id?: string
          market_location?: string | null
          max_price?: number | null
          min_price?: number | null
          modal_price?: number | null
          price_date?: string
          price_per_unit?: number
          source?: string | null
          state?: string | null
          unit?: string
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      marketplace_inquiries: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string
          message: string
          offer_price: number | null
          status: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          message: string
          offer_price?: number | null
          status?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string
          offer_price?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          available_date: string
          category: string
          created_at: string | null
          description: string | null
          farm_id: string
          id: string
          images: string[] | null
          location: Json
          min_order_quantity: number
          price_per_unit: number
          quantity_available: number
          seller_id: string
          status: string
          title: string
          unit: string
        }
        Insert: {
          available_date?: string
          category: string
          created_at?: string | null
          description?: string | null
          farm_id: string
          id?: string
          images?: string[] | null
          location?: Json
          min_order_quantity?: number
          price_per_unit: number
          quantity_available: number
          seller_id: string
          status?: string
          title: string
          unit: string
        }
        Update: {
          available_date?: string
          category?: string
          created_at?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          images?: string[] | null
          location?: Json
          min_order_quantity?: number
          price_per_unit?: number
          quantity_available?: number
          seller_id?: string
          status?: string
          title?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      member_orders: {
        Row: {
          bulk_order_id: string
          created_at: string | null
          id: string
          items: Json
          status: string | null
          user_id: string
        }
        Insert: {
          bulk_order_id: string
          created_at?: string | null
          id?: string
          items: Json
          status?: string | null
          user_id: string
        }
        Update: {
          bulk_order_id?: string
          created_at?: string | null
          id?: string
          items?: Json
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_orders_bulk_order_id_fkey"
            columns: ["bulk_order_id"]
            isOneToOne: false
            referencedRelation: "bulk_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          role: string
          status: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          email: string
          expires_at: string
          id?: string
          organization_id: string
          role: string
          status?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_personal: boolean | null
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_personal?: boolean | null
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_personal?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          provider: string | null
          reference_id: string | null
          status: string | null
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          provider?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          provider?: string | null
          reference_id?: string | null
          status?: string | null
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      produce_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          crop_name: string
          id: string
          organization_id: string
          status: string | null
          total_quantity: number | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          crop_name: string
          id?: string
          organization_id: string
          status?: string | null
          total_quantity?: number | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          crop_name?: string
          id?: string
          organization_id?: string
          status?: string | null
          total_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "produce_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string
          contact_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string
          name: string
          verified: boolean | null
        }
        Insert: {
          category: string
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          name: string
          verified?: boolean | null
        }
        Update: {
          category?: string
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          name?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      sustainability_logs: {
        Row: {
          created_at: string
          field_id: string | null
          id: string
          log_date: string
          method: string | null
          notes: string | null
          product_name: string
          quantity: number
          type: string
          unit: string
        }
        Insert: {
          created_at?: string
          field_id?: string | null
          id?: string
          log_date?: string
          method?: string | null
          notes?: string | null
          product_name: string
          quantity: number
          type: string
          unit: string
        }
        Update: {
          created_at?: string
          field_id?: string | null
          id?: string
          log_date?: string
          method?: string | null
          notes?: string | null
          product_name?: string
          quantity?: number
          type?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sustainability_logs_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          farm_id: string
          id: string
          priority: string | null
          recurrence: string
          related_id: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          farm_id: string
          id?: string
          priority?: string | null
          recurrence?: string
          related_id?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          farm_id?: string
          id?: string
          priority?: string | null
          recurrence?: string
          related_id?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry: {
        Row: {
          created_at: string
          data: Json
          device_id: string
          id: string
          timestamp: string
          type: string | null
        }
        Insert: {
          created_at?: string
          data: Json
          device_id: string
          id?: string
          timestamp?: string
          type?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          device_id?: string
          id?: string
          timestamp?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          quote: string
          rating: number | null
          role: string | null
          updated_at: string
          user_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          quote: string
          rating?: number | null
          role?: string | null
          updated_at?: string
          user_name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          quote?: string
          rating?: number | null
          role?: string | null
          updated_at?: string
          user_name?: string
        }
        Relationships: []
      }
      water_usage: {
        Row: {
          created_at: string
          field_id: string | null
          id: string
          source: string | null
          unit: string
          usage_date: string
          volume: number
        }
        Insert: {
          created_at?: string
          field_id?: string | null
          id?: string
          source?: string | null
          unit: string
          usage_date?: string
          volume: number
        }
        Update: {
          created_at?: string
          field_id?: string | null
          id?: string
          source?: string | null
          unit?: string
          usage_date?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "water_usage_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invites: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      can_access_farm: {
        Args: {
          p_farm_id: string
        }
        Returns: boolean
      }
      can_edit_farm: {
        Args: {
          p_farm_id: string
          p_roles?: string[]
        }
        Returns: boolean
      }
      field_crop_farm_id: {
        Args: {
          p_field_crop_id: string
        }
        Returns: string
      }
      field_farm_id: {
        Args: {
          p_field_id: string
        }
        Returns: string
      }
      is_org_member: {
        Args: {
          p_org_id: string
          p_roles?: string[]
        }
        Returns: boolean
      }
      migrate_users_to_organizations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
