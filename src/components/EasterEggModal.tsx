import React, { useEffect } from "react";
import confetti from "canvas-confetti";

type EasterEggProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  emoji?: string;
  color?: string;
};

export function EasterEggModal({
  visible,
  onClose,
  title,
  message,
  emoji = "🎉",
  color = "#2E7D32",
}: EasterEggProps) {
  useEffect(() => {
    if (visible) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2E7D32", "#4CAF50", "#FFD700", "#1565C0", "#E65100"],
        });
      } catch {}
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner"
          style={{ backgroundColor: `${color}18` }}
        >
          <span className="animate-bounce">{emoji}</span>
        </div>

        <div
          className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-3"
          style={{ backgroundColor: `${color}18`, color }}
        >
          Пасхалка найдена
        </div>

        <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{title}</h3>
        <p className="text-sm text-[#616161] leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm shadow-md active:scale-98 transition-transform"
          style={{ backgroundColor: color }}
        >
          Понял, красавчик 👑
        </button>
      </div>
    </div>
  );
}
