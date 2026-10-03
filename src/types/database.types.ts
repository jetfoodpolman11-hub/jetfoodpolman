/**
 * Supabase Database TypeScript Definitions
 * Aligned with Masterplan entities:
 * - users / profiles (ADMIN, KURIR)
 * - couriers (courier metadata linked to user)
 * - package_types (managed by admin)
 * - attendance (clock in / clock out with WITA timestamps)
 * - daily_reports (daily courier operational report)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "ADMIN" | "KURIR";
export type CourierStatus = "ACTIVE" | "INACTIVE";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // references auth.users(id)
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url?: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      couriers: {
        Row: {
          id: string;
          user_id: string; // references profiles(id)
          courier_code: string;
          vehicle_type: string | null;
          plate_number: string | null;
          status: CourierStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          courier_code: string;
          vehicle_type?: string | null;
          plate_number?: string | null;
          status?: CourierStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          courier_code?: string;
          vehicle_type?: string | null;
          plate_number?: string | null;
          status?: CourierStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "couriers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      package_types: {
        Row: {
          id: string;
          name: string; // e.g. "Reguler", "Express", "Dokumen", "Cargo"
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          courier_id: string; // references couriers(id)
          date: string; // YYYY-MM-DD in WITA
          clock_in_time: string; // ISO timestamp
          clock_out_time: string | null; // ISO timestamp
          clock_in_notes: string | null;
          clock_out_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          courier_id: string;
          date: string;
          clock_in_time: string;
          clock_out_time?: string | null;
          clock_in_notes?: string | null;
          clock_out_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          courier_id?: string;
          date?: string;
          clock_in_time?: string;
          clock_out_time?: string | null;
          clock_in_notes?: string | null;
          clock_out_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_courier_id_fkey";
            columns: ["courier_id"];
            isOneToOne: false;
            referencedRelation: "couriers";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_reports: {
        Row: {
          id: string;
          courier_id: string; // references couriers(id)
          date: string; // YYYY-MM-DD in WITA
          package_type_id: string; // references package_types(id)
          
          // Departure region
          origin_province_id: string;
          origin_province_name: string;
          origin_regency_id: string;
          origin_regency_name: string;
          origin_district_id: string;
          origin_district_name: string;
          origin_village_id: string;
          origin_village_name: string;

          // Destination region
          dest_province_id: string;
          dest_province_name: string;
          dest_regency_id: string;
          dest_regency_name: string;
          dest_district_id: string;
          dest_district_name: string;
          dest_village_id: string;
          dest_village_name: string;

          // Operational metrics
          order_count: number;
          omset: number;
          ojol_count: number;
          ojol_amount: number;
          jastip_count: number;
          jastip_amount: number;
          notes: string | null;

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          courier_id: string;
          date: string;
          package_type_id: string;

          origin_province_id: string;
          origin_province_name: string;
          origin_regency_id: string;
          origin_regency_name: string;
          origin_district_id: string;
          origin_district_name: string;
          origin_village_id: string;
          origin_village_name: string;

          dest_province_id: string;
          dest_province_name: string;
          dest_regency_id: string;
          dest_regency_name: string;
          dest_district_id: string;
          dest_district_name: string;
          dest_village_id: string;
          dest_village_name: string;

          order_count?: number;
          omset?: number;
          ojol_count?: number;
          ojol_amount?: number;
          jastip_count?: number;
          jastip_amount?: number;
          notes?: string | null;

          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          courier_id?: string;
          date?: string;
          package_type_id?: string;

          origin_province_id?: string;
          origin_province_name?: string;
          origin_regency_id?: string;
          origin_regency_name?: string;
          origin_district_id?: string;
          origin_district_name?: string;
          origin_village_id?: string;
          origin_village_name?: string;

          dest_province_id?: string;
          dest_province_name?: string;
          dest_regency_id?: string;
          dest_regency_name?: string;
          dest_district_id?: string;
          dest_district_name?: string;
          dest_village_id?: string;
          dest_village_name?: string;

          order_count?: number;
          omset?: number;
          ojol_count?: number;
          ojol_amount?: number;
          jastip_count?: number;
          jastip_amount?: number;
          notes?: string | null;

          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_reports_courier_id_fkey";
            columns: ["courier_id"];
            isOneToOne: false;
            referencedRelation: "couriers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_package_type_id_fkey";
            columns: ["package_type_id"];
            isOneToOne: false;
            referencedRelation: "package_types";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      courier_status: CourierStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
