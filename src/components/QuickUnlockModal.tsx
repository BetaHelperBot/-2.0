import React, { useState, useEffect } from "react";
import { Lock, Fingerprint, Delete, X, Shield, KeyRound, Check } from "lucide-react";
import { verifyBiometrics, triggerHaptic } from "../lib/biometrics.ts";

type Props = {
  visible: boolean;
  title?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export function QuickUnlockModal({
  visible,
  title = "Приватная заметка",
  onSuccess,
  onCancel,
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [mode, setMode] = useState<"pin" | "bio">("pin");
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const storedPin = typeof window !== "undefined" ? localStorage.getItem("pin_code") : null;
  const pinEnabled = typeof window !== "undefined" ? localStorage.getItem("pin_enabled") === "true" : false;
  const bioEnabled = typeof window !== "undefined" ? localStorage.getItem("biometric_enabled") === "true" : false;

  useEffect(() => {
    if (visible) {
      setPin("");
      setError("");
      setIsSuccess(false);
      if (bioEnabled && !pinEnabled) {
        setMode("bio");
        handleBioScan();
      } else if (bioEnabled) {
        setMode("bio");
        handleBioScan();
      } else {
        setMode("pin");
      }
    }
  }, [visible, bioEnabled, pinEnabled]);

  const handleBioScan = async () => {
    setIsScanning(true);
    setError("");
    triggerHaptic([25]);
    try {
      const res = await verifyBiometrics();
      if (res.success) {
        setIsSuccess(true);
        triggerHaptic([40, 60]);
        setTimeout(() => {
          onSuccess();
        }, 300);
      } else if (res.cancelled) {
        setError("Сканирование отменено. Попробуйте снова или введите PIN.");
      } else {
        setError(res.error || "Отпечаток не распознан");
      }
    } catch {
      setError("Ошибка проверки биометрии");
    } finally {
      setIsScanning(false);
    }
  };

  const handleKey = (digit: string) => {
    triggerHaptic([15]);
    if (digit === "⌫") {
      setPin((prev) => prev.slice(0, -1));
      setError("");
      return;
    }
    if (digit === "") return;
    if (pin.length >= 4) return;

    const next = pin + digit;
    setPin(next);
    setError("");

    if (next.length === 4) {
      setTimeout(() => {
        if (!storedPin || next === storedPin) {
          triggerHaptic([40, 70]);
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
          }, 200);
        } else {
          triggerHaptic([80, 50, 80]);
          setShaking(true);
          setError("Неверный PIN-код");
          setTimeout(() => {
            setPin("");
            setShaking(false);
          }, 450);
        }
      }, 100);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-[#161616] border border-black/10 dark:border-white/10 p-5 shadow-2xl text-slate-900 dark:text-white flex flex-col items-center animate-in zoom-in-95 duration-150 relative">
        {/* Close / Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="font-bold text-base text-center mb-0.5">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
          Подтвердите доступ к приватным данным
        </p>

        {/* Mode switcher if both are available */}
        {bioEnabled && pinEnabled && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setMode("bio");
                handleBioScan();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === "bio"
                  ? "bg-[#4527a0] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Отпечаток</span>
            </button>
            <button
              onClick={() => setMode("pin")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === "pin"
                  ? "bg-[#4527a0] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN-код</span>
            </button>
          </div>
        )}

        {/* BIOMETRIC VIEW */}
        {mode === "bio" ? (
          <div className="flex flex-col items-center py-2 w-full">
            <button
              onClick={handleBioScan}
              disabled={isScanning}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer mb-3 ${
                isScanning
                  ? "border-emerald-500 bg-emerald-500/10 ring-4 ring-emerald-500/30 animate-pulse"
                  : isSuccess
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:scale-105"
              }`}
            >
              {isSuccess ? (
                <Check className="w-10 h-10 text-white animate-in zoom-in" />
              ) : (
                <Fingerprint className="w-10 h-10" />
              )}
            </button>

            {error ? (
              <p className="text-xs text-rose-500 font-medium text-center mb-3 px-2">
                {error}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
                {isScanning ? "Проверка отпечатка..." : "Коснитесь для подтверждения"}
              </p>
            )}

            <button
              onClick={handleBioScan}
              disabled={isScanning}
              className="w-full py-2.5 rounded-xl bg-[#4527a0] hover:bg-[#381e85] text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
            >
              {isScanning ? "Сканирование..." : "Прикоснуться к сенсору"}
            </button>
          </div>
        ) : (
          /* PIN VIEW */
          <div className="flex flex-col items-center w-full">
            {/* PIN Dots */}
            <div className={`flex gap-3 mb-3 ${shaking ? "animate-shake" : ""}`}>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? "bg-[#4527a0] border-[#4527a0] scale-110 shadow-xs"
                      : "bg-transparent border-slate-300 dark:border-slate-600"
                  }`}
                />
              ))}
            </div>

            {error ? (
              <p className="text-xs text-rose-500 font-medium mb-3 h-4 text-center">{error}</p>
            ) : (
              <div className="h-4 mb-3" />
            )}

            {/* Compact Numpad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[210px] mb-2">
              {NUMPAD.flat().map((k, i) => (
                <button
                  key={i}
                  disabled={k === ""}
                  onClick={() => handleKey(k)}
                  className={`h-11 rounded-xl flex items-center justify-center text-lg font-medium transition-all active:scale-95 cursor-pointer ${
                    k === ""
                      ? "opacity-0 pointer-events-none"
                      : "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white"
                  }`}
                >
                  {k === "⌫" ? <Delete className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : k}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onCancel}
          className="mt-3 text-xs font-semibold text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
