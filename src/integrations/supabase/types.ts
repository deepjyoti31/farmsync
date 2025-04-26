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
      crop_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          field_crop_id: string
          id: string
          notes: string | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          field_crop_id: string
          id?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          field_crop_id?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_activities_field_crop_id_fkey"
            columns: ["field_crop_id"]
            isOneToOne: false
            referencedRelation: "field_crops"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          created_at: string
          description: string | null
          growing_duration: number | null
          growing_season: string | null
          id: string
          name: string
          updated_at: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          growing_duration?: number | null
          growing_season?: string | null
          id?: string
          name: string
          updated_at?: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          growing_duration?: number | null
          growing_season?: string | null
          id?: string
          name?: string
          updated_at?: string
          variety?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
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
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
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
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
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
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      farms: {
        Row: {
          address: string | null
          area_unit: string | null
          country: string | null
          created_at: string
          district: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          name: string
          state: string | null
          total_area: number | null
          updated_at: string
          user_id: string
          village: string | null
          boundaries: Json | null
        }
        Insert: {
          address?: string | null
          area_unit?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          name: string
          state?: string | null
          total_area?: number | null
          updated_at?: string
          user_id: string
          village?: string | null
          boundaries?: Json | null
        }
        Update: {
          address?: string | null
          area_unit?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          name?: string
          state?: string | null
          total_area?: number | null
          updated_at?: string
          user_id?: string
          village?: string | null
          boundaries?: Json | null
        }
        Relationships: []
      }
      field_crops: {
        Row: {
          actual_harvest_date: string | null
          created_at: string
          crop_id: string
          expected_harvest_date: string | null
          field_id: string
          id: string
          notes: string | null
          planting_date: string
          status: string | null
          updated_at: string
          yield_amount: number | null
          yield_unit: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          created_at?: string
          crop_id: string
          expected_harvest_date?: string | null
          field_id: string
          id?: string
          notes?: string | null
          planting_date: string
          status?: string | null
          updated_at?: string
          yield_amount?: number | null
          yield_unit?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          created_at?: string
          crop_id?: string
          expected_harvest_date?: string | null
          field_id?: string
          id?: string
          notes?: string | null
          planting_date?: string
          status?: string | null
          updated_at?: string
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
      field_images: {
        Row: {
          caption: string | null
          created_at: string
          field_id: string
          id: string
          image_url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          field_id: string
          id?: string
          image_url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          field_id?: string
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_images_field_id_fkey"
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
          area_unit: string | null
          created_at: string
          farm_id: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          name: string
          soil_ph: number | null
          soil_type: string | null
          updated_at: string
        }
        Insert: {
          area: number
          area_unit?: string | null
          created_at?: string
          farm_id: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          name: string
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string
        }
        Update: {
          area?: number
          area_unit?: string | null
          created_at?: string
          farm_id?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          name?: string
          soil_ph?: number | null
          soil_type?: string | null
          updated_at?: string
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
      financial_transactions: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string | null
          farm_id: string
          id: string
          payment_method: string | null
          reference_number: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          payment_method?: string | null
          reference_number?: string | null
          transaction_date?: string
          updated_at?: string
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
      forum_comments: {
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
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          forum_id: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          forum_id: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          forum_id?: string
          id?: string
          title?: string
          updated_at?: string
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
        ]
      }
      forums: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category_id: string
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
          category_id: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          farm_id: string
          id?: string
          minimum_stock?: number | null
          name: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity: number
          storage_location?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
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
          transaction_date: string
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
          notes?: string | null
          record_date: string
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
          id?: string
          livestock_id?: string | null
          notes?: string | null
          production_date: string
          production_type: string
          quantity: number
          unit: string
        }
        Update: {
          created_at?: string
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
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_component: number | null
          loan_id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          principal_component: number | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_component?: number | null
          loan_id: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          principal_component?: number | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_component?: number | null
          loan_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          principal_component?: number | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          end_date: string | null
          farm_id: string
          id: string
          interest_rate: number | null
          lender: string
          notes: string | null
          payment_amount: number | null
          payment_frequency: string | null
          principal_amount: number
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          farm_id: string
          id?: string
          interest_rate?: number | null
          lender: string
          notes?: string | null
          payment_amount?: number | null
          payment_frequency?: string | null
          principal_amount: number
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          farm_id?: string
          id?: string
          interest_rate?: number | null
          lender?: string
          notes?: string | null
          payment_amount?: number | null
          payment_frequency?: string | null
          principal_amount?: number
          start_date?: string
          status?: string | null
          updated_at?: string
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
      notifications: {
        Row: {
          category: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          phone: string | null
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_date: string | null
          farm_id: string
          id: string
          priority: string | null
          related_id: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          farm_id: string
          id?: string
          priority?: string | null
          related_id?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          farm_id?: string
          id?: string
          priority?: string | null
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
      weather_data: {
        Row: {
          created_at: string
          date: string
          farm_id: string
          forecast_data: Json | null
          humidity: number | null
          id: string
          precipitation: number | null
          temperature_max: number | null
          temperature_min: number | null
          weather_condition: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string
          date: string
          farm_id: string
          forecast_data?: Json | null
          humidity?: number | null
          id?: string
          precipitation?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          farm_id?: string
          forecast_data?: Json | null
          humidity?: number | null
          id?: string
          precipitation?: number | null
          temperature_max?: number | null
          temperature_min?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_data_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          id: string
          user_name: string
          role: string | null
          quote: string
          image_url: string | null
          rating: number | null
          is_featured: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_name: string
          role?: string | null
          quote: string
          image_url?: string | null
          rating?: number | null
          is_featured?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_name?: string
          role?: string | null
          quote?: string
          image_url?: string | null
          rating?: number | null
          is_featured?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_screenshots: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string
          display_order: number | null
          is_featured: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url: string
          display_order?: number | null
          is_featured?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string
          display_order?: number | null
          is_featured?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      forums: {
        Row: {
          id: string
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      market_data: {
        Row: {
          id: string
          crop_name: string
          price_per_unit: number
          unit: string
          market_location: string | null
          price_date: string
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          crop_name: string
          price_per_unit: number
          unit: string
          market_location?: string | null
          price_date: string
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          crop_name?: string
          price_per_unit?: number
          unit?: string
          market_location?: string | null
          price_date?: string
          source?: string | null
          created_at?: string
          updated_at?: string
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
