import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole } from "@/lib/constants";
import { verifyMockSessionSignature } from "./cookie-signer";
import {
  fetchAllCouriersInternal,
  findCourierByCodeInternal,
} from "@/actions/couriers";

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
    avatarUrl?: string | null;
    isActive: boolean;
  } | null;
  courier: {
    id: string;
    courierCode: string;
    vehicleType: string | null;
    plateNumber: string | null;
    avatarUrl?: string | null;
  } | null;
}

/**
 * Get current authenticated user profile and courier info from Server Components or Server Actions.
 * Memoized per request with React cache() so Layout + Page + Server Actions never repeat session queries.
 */
export const getCurrentSession = cache(async (): Promise<CurrentSessionData | null> => {
  try {
    const cookieStore = await cookies();
    const mockRole = cookieStore.get("jf_mock_role")?.value as UserRole | undefined;
    const mockCode = cookieStore.get("jf_mock_code")?.value || "";
    const mockSig = cookieStore.get("jf_mock_sig")?.value;

    // 1. Verify HMAC-SHA256 signed session cookie
    if (
      mockRole &&
      (mockRole === "ADMIN" || mockRole === "KURIR") &&
      verifyMockSessionSignature(
        mockRole,
        mockRole === "KURIR" ? mockCode : "",
        mockSig
      )
    ) {
      if (mockRole === "ADMIN") {
        const adminEmail =
          cookieStore.get("jf_mock_email")?.value ||
          "jetfoodpolman11@gmail.com";
        const adminName =
          cookieStore.get("jf_mock_name")?.value || "Admin JetFood Polman";

        return {
          user: {
            id: "de610516-c19a-4e0f-930a-a0731b469f65",
            email: adminEmail,
          },
          profile: {
            id: "de610516-c19a-4e0f-930a-a0731b469f65",
            role: "ADMIN",
            fullName: adminName,
            phone: null,
            avatarUrl: null,
            isActive: true,
          },
          courier: null,
        };
      }

      // Role is KURIR: verify against registered couriers in Supabase
      if (mockCode) {
        const liveCourier = await findCourierByCodeInternal(mockCode);
        if (!liveCourier || !liveCourier.isActive || liveCourier.status !== "ACTIVE") {
          return null;
        }

        return {
          user: {
            id: liveCourier.userId,
            email: liveCourier.email,
          },
          profile: {
            id: liveCourier.userId,
            role: "KURIR",
            fullName: liveCourier.fullName,
            phone: liveCourier.phone,
            avatarUrl: liveCourier.avatarUrl,
            isActive: liveCourier.isActive,
          },
          courier: {
            id: liveCourier.id,
            courierCode: liveCourier.courierCode,
            vehicleType: liveCourier.vehicleType,
            plateNumber: liveCourier.plateNumber,
            avatarUrl: liveCourier.avatarUrl,
          },
        };
      }

      return null;
    }

    // 2. Standard Supabase Auth JWT Fallback
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return null;
    }

    // Check if user is the official Admin
    if (
      user.email.toLowerCase() === "jetfoodpolman11@gmail.com" ||
      user.user_metadata?.role === "ADMIN"
    ) {
      return {
        user: {
          id: user.id,
          email: user.email,
        },
        profile: {
          id: user.id,
          role: "ADMIN",
          fullName:
            (user.user_metadata?.full_name as string) || "Admin JetFood Polman",
          phone: null,
          avatarUrl: null,
          isActive: true,
        },
        courier: null,
      };
    }

    // Check if user is a registered courier
    const allCouriers = await fetchAllCouriersInternal();
    const matchedCourier = allCouriers.find(
      (c) =>
        c.userId === user.id ||
        c.email.toLowerCase() === user.email?.toLowerCase()
    );

    if (matchedCourier) {
      const active =
        matchedCourier.isActive && matchedCourier.status === "ACTIVE";
      return {
        user: {
          id: matchedCourier.userId,
          email: matchedCourier.email,
        },
        profile: {
          id: matchedCourier.userId,
          role: "KURIR",
          fullName: matchedCourier.fullName,
          phone: matchedCourier.phone,
          avatarUrl: matchedCourier.avatarUrl,
          isActive: active,
        },
        courier: active
          ? {
              id: matchedCourier.id,
              courierCode: matchedCourier.courierCode,
              vehicleType: matchedCourier.vehicleType,
              plateNumber: matchedCourier.plateNumber,
              avatarUrl: matchedCourier.avatarUrl,
            }
          : null,
      };
    }

    // Query PostgreSQL profiles table if available
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, role, full_name, phone, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        id: profile.id,
        role: profile.role,
        fullName: profile.full_name,
        phone: profile.phone,
        isActive: profile.is_active,
      },
      courier: null,
    };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Error retrieving current session:", error);
    return null;
  }
});
