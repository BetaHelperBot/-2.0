import React, { useState, useEffect, useCallback } from "react";
import { Lock, Delete, Shield, KeyRound, Fingerprint, Check } from "lucide-react";
import { verifyBiometrics, triggerHaptic } from "../lib/biometrics.ts";

type Props = {
  onUnlock: () => void;
};

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export function AppLockModal({ onUnlock }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [mode, setMode] = useState<"pin" | "biometric">("pin");
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const storedPin = localStorage.getItem("pin_code");
  const bioEnabled = localStorage.getItem("biometric_enabled") === "true";
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const triggerBiometricAuth = useCallback(async () => {
    setIsScanning(true);
    setError("");
    triggerHaptic([30, 40]);
    try {
      const res = await verifyBiometrics();
      if (res.success) {
        setIsSuccess(true);
        triggerHaptic([40, 60]);
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else if (res.cancelled) {
        setError("Сканирование отменено. Коснитесь для повтора.");
      } else {
        setError(res.error || "Отпечаток не распознан");
      }
    } catch {
      setError("Ошибка проверки биометрии");
    } finally {
      setIsScanning(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    if (bioEnabled && !storedPin) {
      setMode("biometric");
      triggerBiometricAuth();
    } else if (localStorage.getItem("pin_enabled") === "true" && storedPin) {
      setMode("pin");
    } else if (bioEnabled) {
      setMode("biometric");
      triggerBiometricAuth();
    }
  }, [storedPin, bioEnabled, triggerBiometricAuth]);

  const handleKey = (key: string) => {
    triggerHaptic([15]);
    if (key === "⌫") {
      setPin((prev) => prev.slice(0, -1));
      setError("");
      return;
    }
    if (key === "") return;
    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);
    setError("");

    if (next.length === 4) {
      setTimeout(() => {
        if (!storedPin || next === storedPin) {
          triggerHaptic([40, 70]);
          setIsSuccess(true);
          setTimeout(() => {
            onUnlock();
          }, 200);
        } else {
          triggerHaptic([80, 50, 80]);
          setShaking(true);
          setError("Неверный PIN");
          setTimeout(() => {
            setPin("");
            setShaking(false);
          }, 400);
        }
      }, 100);
    }
  };

  const containerBg = isDark
    ? "bg-[#050505] text-white"
    : "bg-[#1B5E20] text-white";

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between ${containerBg} p-6 select-none animate-in fade-in duration-200`}>
      <div className="w-full flex justify-end pt-4">
        {bioEnabled && mode === "pin" && (
          <button
            onClick={() => {
              setMode("biometric");
              triggerBiometricAuth();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs text-white/90 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Биометрия</span>
          </button>
        )}
        {mode === "biometric" && storedPin && (
          <button
            onClick={() => {
              setMode("pin");
              setError("");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-xs text-white/90 hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ввести PIN</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-xs w-full">
        {mode === "pin" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-white/12 flex items-center justify-center mb-5 shadow-inner">
              <Lock className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Heybo</h1>
            <p className="text-sm text-white/70 mb-8">Введите PIN-код для входа</p>

            {/* Dots */}
            <div className={`flex gap-4 mb-4 ${shaking ? "animate-shake" : ""}`}>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? "bg-white border-white scale-110 shadow-sm"
                      : "bg-transparent border-white/50"
                  }`}
                />
              ))}
            </div>

            {error ? (
              <p className="text-xs text-red-300 font-medium mb-4 h-4 text-center">{error}</p>
            ) : (
              <div className="h-4 mb-4" />
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
              {NUMPAD_KEYS.flat().map((key, i) => (
                <button
                  key={i}
                  disabled={key === ""}
                  onClick={() => handleKey(key)}
                  className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-light transition-all active:scale-95 mx-auto cursor-pointer ${
                    key === ""
                      ? "opacity-0 pointer-events-none"
                      : "bg-white/12 hover:bg-white/20 active:bg-white/30 text-white"
                  }`}
                >
                  {key === "⌫" ? <Delete className="w-6 h-6 text-white/80" /> : key}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Interactive Biometric Sensor Touch Pad */}
            <div className="relative mb-6">
              <button
                onClick={triggerBiometricAuth}
                className={`relative w-28 h-28 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-2xl cursor-pointer hover:bg-white/20 active:scale-95 transition-all overflow-hidden ${
                  isScanning ? "ring-4 ring-emerald-400/50" : ""
                } ${isSuccess ? "bg-emerald-500/30 border-emerald-400" : ""}`}
                title="Нажмите для сканирования отпечатка"
              >
                {/* Visual laser scanner sweep animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2 w-full pointer-events-none" />
                )}
                {isSuccess ? (
                  <Check className="w-14 h-14 text-emerald-400 animate-in zoom-in" />
                ) : (
                  <Fingerprint className={`w-14 h-14 text-white transition-opacity ${isScanning ? "opacity-90 animate-pulse text-emerald-300" : "opacity-80"}`} />
                )}
              </button>
              {isScanning && (
                <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
              )}
            </div>

            <h1 className="text-3xl font-bold mb-1 tracking-tight">Heybo</h1>
            <p className="text-sm text-white/70 mb-3">Вход по отпечатку пальца</p>
            
            {error ? (
              <p className="text-xs text-red-300 font-medium mb-6 px-4">{error}</p>
            ) : (
              <p className="text-xs text-white/60 mb-6">
                {isScanning ? "Сканирование датчика..." : isSuccess ? "Успешно распознан!" : "Прикоснитесь к сенсору для разблокировки"}
              </p>
            )}

            <button
              onClick={triggerBiometricAuth}
              disabled={isScanning}
              className="px-8 py-3.5 bg-white text-[#1B5E20] dark:text-emerald-900 rounded-2xl font-bold shadow-lg hover:bg-white/95 active:scale-98 transition-all flex items-center gap-2.5 text-sm cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span>{isScanning ? "Проверка..." : "Сканировать отпечаток"}</span>
            </button>
          </div>
        )}
      </div>

      <footer className="text-xs text-white/35 pb-4">© 2026 Heybo · Защита устройства</footer>
    </div>
  );
}
