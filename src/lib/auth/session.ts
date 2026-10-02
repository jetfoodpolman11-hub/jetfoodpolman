import "server-only";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/constants";

export interface CurrentSessionData {
  user: {
    id: string;
    email: string;
  };
  profile: {
    id: string;
    role: UserRole;
    fullName: string;
    phone: string | null;
    isActive: boolean;
  } | null;
  courier: {
    id: string;
    courierCode: string;
    vehicleType: string | null;
    plateNumber: string | null;
  } | null;
}

/**
 * Get current authenticated user profile and courier info from Server Components or Server Actions
 */
export async function getCurrentSession(): Promise<CurrentSessionData | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return null;
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name, phone, is_active")
      .eq("id", user.id)
      .single();

    let courierData = null;
    if (profile?.role === "KURIR") {
      const { data: courier } = await supabase
        .from("couriers")
        .select("id, courier_code, vehicle_type, plate_number")
        .eq("user_id", user.id)
        .single();

      if (courier) {
        courierData = {
          id: courier.id,
          courierCode: courier.courier_code,
          vehicleType: courier.vehicle_type,
          plateNumber: courier.plate_number,
        };
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile
        ? {
            id: profile.id,
            role: profile.role,
            fullName: profile.full_name,
            phone: profile.phone,
            isActive: profile.is_active,
          }
        : null,
      courier: courierData,
    };
  } catch (error) {
    console.error("Error retrieving current session:", error);
    return null;
  }
}
