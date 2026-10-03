import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/constants";
import { verifyMockSessionSignature } from "./cookie-signer";

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

const MOCK_COURIER_DIRECTORY: Record<
  string,
  {
    userId: string;
    courierId: string;
    fullName: string;
    email: string;
    phone: string;
    vehicleType: string;
    plateNumber: string;
  }
> = {
  "JF-001": {
    userId: "mock-courier-uuid",
    courierId: "mock-courier-rec-id",
    fullName: "Kurir Lapangan Ali",
    email: "kurir@jetfoodpolman.com",
    phone: "081234567890",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 1234 XX",
  },
  "JF-002": {
    userId: "mock-courier-uuid-2",
    courierId: "mock-courier-rec-2",
    fullName: "Kurir Lapangan Budi",
    email: "budi@jetfoodpolman.com",
    phone: "081234567891",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 5678 YY",
  },
  "JF-003": {
    userId: "mock-courier-uuid-3",
    courierId: "mock-courier-rec-3",
    fullName: "Kurir Lapangan Citra",
    email: "citra@jetfoodpolman.com",
    phone: "081234567892",
    vehicleType: "Sepeda Motor",
    plateNumber: "DC 9012 ZZ",
  },
};

/**
 * Get current authenticated user profile and courier info from Server Components or Server Actions
 */
export async function getCurrentSession(): Promise<CurrentSessionData | null> {
  try {
    const cookieStore = await cookies();
    const mockRole = cookieStore.get("jf_mock_role")?.value as UserRole | undefined;
    const mockCode = cookieStore.get("jf_mock_code")?.value || "JF-001";
    const mockSig = cookieStore.get("jf_mock_sig")?.value;

    // Support local development mock session cookies ONLY when cryptographically signed & not expired
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
        const mockEmail =
          cookieStore.get("jf_mock_email")?.value || "admin@jetfoodpolman.com";
        const mockName =
          cookieStore.get("jf_mock_name")?.value || "Super Admin JetFood";

        return {
          user: {
            id: "mock-admin-uuid",
            email: mockEmail,
          },
          profile: {
            id: "mock-admin-uuid",
            role: "ADMIN",
            fullName: mockName,
            phone: "081234567890",
            isActive: true,
          },
          courier: null,
        };
      }

      const directoryEntry =
        MOCK_COURIER_DIRECTORY[mockCode.toUpperCase()] ||
        MOCK_COURIER_DIRECTORY["JF-001"];

      const mockEmail =
        cookieStore.get("jf_mock_email")?.value || directoryEntry.email;
      const mockName =
        cookieStore.get("jf_mock_name")?.value || directoryEntry.fullName;

      return {
        user: {
          id: directoryEntry.userId,
          email: mockEmail,
        },
        profile: {
          id: directoryEntry.userId,
          role: "KURIR",
          fullName: mockName,
          phone: directoryEntry.phone,
          isActive: true,
        },
        courier: {
          id: directoryEntry.courierId,
          courierCode: mockCode.toUpperCase(),
          vehicleType: directoryEntry.vehicleType,
          plateNumber: directoryEntry.plateNumber,
        },
      };
    }

    // Standard Supabase Auth
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
        .select("id, courier_code, vehicle_type, plate_number, status")
        .eq("user_id", user.id)
        .single();

      // If courier record is deactivated, mark profile inactive in session
      if (courier && courier.status === "ACTIVE") {
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
            isActive:
              profile.is_active &&
              (profile.role !== "KURIR" || courierData !== null),
          }
        : null,
      courier: courierData,
    };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Error retrieving current session:", error);
    return null;
  }
}
