import React, { useState } from "react";
import { Delete } from "lucide-react";
import { STORAGE_KEYS, setLocalItem } from "../lib/storage.ts";

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

type Props = {
  onBack: () => void;
};

export function PinScreen({ onBack }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleKey = (key: string) => {
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
      setTimeout(() => handleComplete(next), 120);
    }
  };

  const handleComplete = (entered: string) => {
    if (step === "enter") {
      setFirstPin(entered);
      setPin("");
      setStep("confirm");
    } else {
      if (entered !== firstPin) {
        setShaking(true);
        setError("PIN-коды не совпадают. Попробуйте снова.");
        setTimeout(() => {
          setPin("");
          setStep("enter");
          setFirstPin("");
          setShaking(false);
        }, 500);
      } else {
        setLocalItem(STORAGE_KEYS.PIN_CODE, entered);
        setLocalItem(STORAGE_KEYS.PIN_ENABLED, "true");
        onBack();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white select-none">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-2">
          {step === "enter" ? "Введите PIN-код" : "Повторите PIN-код"}
        </h2>
        <p className="text-xs sm:text-sm text-[#9e9e9e] mb-8">
          {step === "enter"
            ? "Придумайте 4-значный код для входа"
            : "Введите тот же код для подтверждения"}
        </p>

        {/* Dots */}
        <div className={`flex gap-4 mb-4 ${shaking ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > i
                  ? "bg-[#2E7D32] border-[#2E7D32] scale-110"
                  : "bg-transparent border-[#2E7D32]"
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs text-[#C62828] font-medium mb-4 h-4">{error}</p>
        ) : (
          <div className="h-4 mb-4" />
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] my-4">
          {NUMPAD_KEYS.flat().map((key, i) => (
            <button
              key={i}
              disabled={key === ""}
              onClick={() => handleKey(key)}
              className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-normal transition-all active:scale-95 mx-auto ${
                key === ""
                  ? "opacity-0 pointer-events-none"
                  : "bg-[#f5f5f5] hover:bg-[#e0e0e0] text-[#1a1a1a]"
              }`}
            >
              {key === "⌫" ? <Delete className="w-6 h-6 text-[#424242]" /> : key}
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-6 text-sm font-medium text-[#9e9e9e] hover:text-[#424242] py-2 px-4"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
