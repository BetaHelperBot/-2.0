import React, { useState, useEffect } from "react";
import { ArrowLeft, Wifi, Battery, Smartphone, Maximize2 } from "lucide-react";
import { ThemeMode } from "../lib/storage.ts";

type Props = {
  currentRoute: string;
  onBack: () => void;
  children: React.ReactNode;
  themeMode?: ThemeMode;
};

const SCREEN_TITLES: Record<string, { title: string; headerBg: string; headerColor: string }> = {
  home: { title: "Личный Органайзер", headerBg: "#23582e", headerColor: "#ffffff" },
  passwords: { title: "Пароли", headerBg: "#23582e", headerColor: "#ffffff" },
  notes: { title: "Заметки", headerBg: "#23582e", headerColor: "#ffffff" },
  todos: { title: "Задачи", headerBg: "#E65100", headerColor: "#ffffff" },
  gallery: { title: "Галерея", headerBg: "#00838F", headerColor: "#ffffff" },
  generator: { title: "Генератор паролей", headerBg: "#6A1B9A", headerColor: "#ffffff" },
  export: { title: "Экспорт & Импорт", headerBg: "#065f46", headerColor: "#ffffff" },
  search: { title: "Поиск", headerBg: "#23582e", headerColor: "#ffffff" },
  pin: { title: "Установить PIN-код", headerBg: "#23582e", headerColor: "#ffffff" },
  settings: { title: "Настройки", headerBg: "#37474F", headerColor: "#ffffff" },
  about: { title: "О приложении", headerBg: "#C62828", headerColor: "#ffffff" },
};

export function AndroidFrame({ currentRoute, onBack, children, themeMode }: Props) {
  const [time, setTime] = useState("");
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const screenMeta = SCREEN_TITLES[currentRoute] ?? SCREEN_TITLES.home;
  const isHome = currentRoute === "home";
  const isOled = themeMode === "oled";

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden theme-transition">
      {/* Top Device Switcher Toolbar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-xs text-white/60">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Heybo v2.0 · Android App</span>
        </div>
        <button
          onClick={() => setIsPhoneFrame(!isPhoneFrame)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
        >
          {isPhoneFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Широкий экран</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Рамка смартфона</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container / Mobile Shell with OLED background & 350ms crossfade */}
      <div
        className={`w-full flex flex-col bg-[#f5f5f5] dark:bg-[#000000] shadow-2xl overflow-hidden transition-all duration-350 relative ${
          isPhoneFrame
            ? "max-w-[420px] h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[40px] sm:ring-8 sm:ring-black/40 dark:sm:ring-white/10"
            : "max-w-2xl h-[100dvh] sm:h-[90vh] sm:rounded-3xl"
        }`}
      >
        {/* Android Status Bar */}
        <div
          className="px-5 pt-2 pb-1.5 flex items-center justify-between text-xs select-none transition-colors duration-350 shrink-0 z-30"
          style={{
            backgroundColor: isOled ? "#000000" : isHome ? "#388E3C" : screenMeta.headerBg,
            color: "#ffffff",
          }}
        >
          <span className="font-semibold tracking-tight">{time || "12:00"}</span>
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">LTE</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium">98%</span>
              <Battery className="w-4 h-4 fill-current" />
            </div>
          </div>
        </div>

        {/* Android App Header */}
        {!isHome && (
          <div
            className="px-4 py-3 flex items-center gap-3 shadow-xs select-none shrink-0 z-20 transition-colors duration-350"
            style={{
              backgroundColor: isOled ? "#121212" : screenMeta.headerBg,
              color: screenMeta.headerColor,
              borderBottom: isOled ? "1px solid rgba(255,255,255,0.08)" : undefined,
            }}
          >
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-white hover:bg-black/15 rounded-full transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
              title="Назад"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight flex-1 truncate">
              {screenMeta.title}
            </h1>
          </div>
        )}

        {/* Screen Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative theme-transition">
          {children}
        </main>

        {/* Android Bottom Navigation Pill */}
        <div className="w-full bg-[#f5f5f5] dark:bg-[#000000] py-2 flex items-center justify-center shrink-0 z-20 select-none transition-colors duration-350">
          <div className="w-32 h-1 rounded-full bg-black/25 dark:bg-white/25" />
        </div>
      </div>
    </div>
  );
}
