"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  X,
  CheckCircle2,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showManualAndroidHint, setShowManualAndroidHint] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker for PWA installability
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore SW registration failure on unsupported environments
      });
    }

    // Check if already running as installed standalone PWA
    const standaloneMatch =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standaloneMatch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStandalone(true);
      return;
    }

    // Detect iOS vs Android/Other
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (isIosDevice) {
      setActiveTab("ios");
    } else {
      setActiveTab("android");
    }

    // Automatically open the install popup when visiting the URL (unless dismissed in this session)
    const dismissedSession = sessionStorage.getItem("jf_pwa_prompt_dismissed");
    if (!dismissedSession) {
      setIsOpen(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Ensure popup is shown when native prompt becomes ready
      if (!sessionStorage.getItem("jf_pwa_prompt_dismissed")) {
        setIsOpen(true);
      }
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsOpen(false);
        setIsStandalone(true);
      }, 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("jf_pwa_prompt_dismissed", "1");
    setIsOpen(false);
  };

  const handleAndroidInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalledSuccess(true);
          setDeferredPrompt(null);
        }
      } catch {
        setShowManualAndroidHint(true);
      }
    } else {
      setShowManualAndroidHint(true);
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Re-open Button when Modal is Closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-[#DC0000] px-4 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-red-950/40 ring-2 ring-white/90 transition hover:bg-red-700 active:scale-95"
          aria-label="Install Aplikasi JetFood Polman"
        >
          <Download className="h-4 w-4 animate-bounce" />
          <span>Install Aplikasi</span>
        </button>
      )}

      {/* Auto Pop-up Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-xs sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Red & Black Branded Banner */}
            <div className="relative bg-gradient-to-br from-[#DC0000] via-[#b80000] to-zinc-950 px-6 pt-6 pb-5 text-white">
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white/90 transition hover:bg-black/40"
                aria-label="Tutup pop up install"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-md">
                  <Image
                    src="/images/logo.png"
                    alt="JetFood Polman"
                    width={52}
                    height={52}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase">
                    Aplikasi Resmi
                  </span>
                  <h2
                    id="pwa-install-title"
                    className="mt-1 text-lg font-black tracking-tight text-white"
                  >
                    Install JetFood Polman
                  </h2>
                  <p className="text-xs text-white/85">
                    Pasang di layar utama HP Android &amp; iPhone Anda
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Selector Tabs (Android & iOS) */}
            <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 p-2">
              <button
                type="button"
                onClick={() => setActiveTab("android")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition ${
                  activeTab === "android"
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Smartphone className="h-4 w-4 text-[#DC0000]" />
                <span>HP Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ios")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold transition ${
                  activeTab === "ios"
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Smartphone className="h-4 w-4 text-[#DC0000]" />
                <span>iPhone / iOS</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {installedSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                  <p className="mt-3 text-base font-black text-zinc-900">
                    Aplikasi Sedang Dipasang!
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Cek layar utama (Home Screen) HP Anda untuk membuka aplikasi
                    JetFood Polman.
                  </p>
                </div>
              ) : activeTab === "android" ? (
                <div className="space-y-4">
                  {/* Direct 1-Click Install Button for Android */}
                  <button
                    type="button"
                    onClick={handleAndroidInstallClick}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#DC0000] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 active:scale-[0.99]"
                  >
                    <Download className="h-5 w-5" />
                    <span>Install Aplikasi Sekarang (Android)</span>
                  </button>

                  {/* Step-by-step instructions (always visible or highlighted if in-app browser) */}
                  <div
                    className={`rounded-2xl border p-3.5 text-xs transition ${
                      showManualAndroidHint
                        ? "border-red-300 bg-red-50/70 text-zinc-800"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600"
                    }`}
                  >
                    <p className="font-extrabold text-zinc-900">
                      {showManualAndroidHint
                        ? "Cara cepat pasang dari menu browser Android:"
                        : "Atau pasang melalui menu browser Chrome:"}
                    </p>
                    <ol className="mt-2 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                          1
                        </span>
                        <span>
                          Ketuk ikon{" "}
                          <strong className="inline-flex items-center gap-0.5 text-zinc-900">
                            Titik Tiga <MoreVertical className="h-3.5 w-3.5" />
                          </strong>{" "}
                          di pojok kanan atas browser Chrome.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DC0000] text-[11px] font-bold text-white">
                          2
                        </span>
                        <span>
                          Pilih{" "}
                          <strong className="text-zinc-900">
                            &ldquo;Instal aplikasi&rdquo;
                          </strong>{" "}
                          atau{" "}
                          <strong className="text-zinc-900">
                            &ldquo;Tambahkan ke layar utama&rdquo;
                          </strong>
                          .
                        </span>
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                /* iOS / iPhone Installation Guide */
                <div className="space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
                    <p className="font-extrabold text-zinc-900">
                      Cara Install di iPhone / iPad (Safari):
                    </p>
                    <ol className="mt-3 space-y-3">
                      <li className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
                          <Share className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900">
                            1. Ketuk tombol Bagikan (Share)
                          </span>
                          <p className="text-[11px] text-zinc-500">
                            Ikon kotak dengan panah ke atas di bagian bawah
                            layar Safari.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#DC0000] text-white">
                          <PlusSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900">
                            2. Pilih &ldquo;Tambah ke Layar Utama&rdquo;
                          </span>
                          <p className="text-[11px] text-zinc-500">
                            Geser ke bawah lalu ketuk{" "}
                            <em>Add to Home Screen</em>.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-black text-white">
                          ✓
                        </div>
                        <div>
                          <span className="font-bold text-zinc-900">
                            3. Ketuk &ldquo;Tambah&rdquo; (Add)
                          </span>
                          <p className="text-[11px] text-zinc-500">
                            Di pojok kanan atas — aplikasi JetFood siap di layar
                            HP Anda!
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Dismiss / Continue Button */}
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 w-full rounded-xl py-2.5 text-center text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                Nanti Saja, Lanjut Buka di Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
