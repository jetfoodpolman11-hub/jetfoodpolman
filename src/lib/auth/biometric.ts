/**
 * WebAuthn & Device Biometric Authentication Helpers for JetFood Polman Courier App
 * Enables fingerprint / Face ID / platform authenticator login for couriers in the field.
 */

export interface BiometricStatus {
  isSupported: boolean;
  isEnabled: boolean;
  registeredCourierCode: string | null;
  registeredCourierName: string | null;
}

const STORAGE_KEY_CODE = "jf_biometric_courier_code";
const STORAGE_KEY_NAME = "jf_biometric_courier_name";
const STORAGE_KEY_CRED_ID = "jf_biometric_cred_id";
const STORAGE_KEY_ENABLED = "jf_biometric_enabled";

/**
 * Checks if the user's device/browser supports WebAuthn platform biometrics (fingerprint / Face ID)
 */
export async function checkBiometricSupport(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Get current stored biometric status from device localStorage
 */
export function getStoredBiometricStatus(): BiometricStatus {
  if (typeof window === "undefined") {
    return {
      isSupported: false,
      isEnabled: false,
      registeredCourierCode: null,
      registeredCourierName: null,
    };
  }

  const isEnabled = localStorage.getItem(STORAGE_KEY_ENABLED) === "true";
  const code = localStorage.getItem(STORAGE_KEY_CODE);
  const name = localStorage.getItem(STORAGE_KEY_NAME);

  return {
    isSupported: typeof window.PublicKeyCredential !== "undefined",
    isEnabled: isEnabled && !!code,
    registeredCourierCode: code,
    registeredCourierName: name,
  };
}

/**
 * Register biometric fingerprint credential on courier's current device
 */
export async function registerDeviceBiometric(
  courierCode: string,
  courierName: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { success: false, error: "Perangkat atau browser ini tidak mendukung sensor biometrik/sidik jari." };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = new TextEncoder().encode(courierCode);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "JetFood Polman Kurir",
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: courierCode,
          displayName: courierName || `Kurir ${courierCode}`,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Built-in fingerprint / screen lock
          userVerification: "required",
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Gagal mendaftarkan sidik jari di perangkat." };
    }

    // Persist registration in device local storage
    localStorage.setItem(STORAGE_KEY_ENABLED, "true");
    localStorage.setItem(STORAGE_KEY_CODE, courierCode);
    localStorage.setItem(STORAGE_KEY_NAME, courierName);
    localStorage.setItem(STORAGE_KEY_CRED_ID, credential.id);

    return { success: true };
  } catch (err: unknown) {
    console.error("Biometric registration error:", err);
    const message = err instanceof Error ? err.message : "Pendaftaran sidik jari dibatalkan.";
    return {
      success: false,
      error: message.includes("cancel") || message.includes("abort")
        ? "Verifikasi sidik jari dibatalkan."
        : "Gagal mengaktifkan sidik jari pada perangkat ini.",
    };
  }
}

/**
 * Authenticate with device fingerprint sensor
 */
export async function authenticateDeviceBiometric(): Promise<{
  success: boolean;
  courierCode?: string;
  error?: string;
}> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { success: false, error: "Perangkat ini tidak mendukung biometrik." };
  }

  const status = getStoredBiometricStatus();
  if (!status.isEnabled || !status.registeredCourierCode) {
    return { success: false, error: "Sidik jari belum diaktifkan di perangkat ini." };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
        rpId: window.location.hostname,
      },
    });

    if (!credential) {
      return { success: false, error: "Verifikasi sidik jari tidak berhasil." };
    }

    return {
      success: true,
      courierCode: status.registeredCourierCode,
    };
  } catch (err: unknown) {
    console.error("Biometric authentication error:", err);
    const message = err instanceof Error ? err.message : "Verifikasi sidik jari gagal.";
    return {
      success: false,
      error: message.includes("cancel") || message.includes("abort")
        ? "Verifikasi sidik jari dibatalkan oleh pengguna."
        : "Sidik jari tidak cocok atau dibatalkan.",
    };
  }
}

/**
 * Disable biometric login on current device
 */
export function disableDeviceBiometric(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_ENABLED);
    localStorage.removeItem(STORAGE_KEY_CODE);
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_CRED_ID);
  }
}
