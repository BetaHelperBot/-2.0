import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Moon,
  Mic,
  Zap,
  RotateCcw,
  Check,
  ArrowRight,
  Send,
  Lock,
  Database,
  WifiOff,
} from "lucide-react";
import {
  POLICY_DOC_URL,
  CURRENT_POLICY_VERSION,
  STORAGE_KEYS,
  APP_AVATAR_PATH,
  TELEGRAM_DEV_URL,
} from "../lib/storage.ts";

type Props = {
  onAccept: () => void;
};

export function ConsentSplashScreen({ onAccept }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setHasScrolledToBottom(true);
    }
  };

  const handleConfirm = () => {
    if (!agreed) return;
    localStorage.setItem(STORAGE_KEYS.POLICY_ACCEPTED_VERSION, CURRENT_POLICY_VERSION);
    onAccept();
  };

  const handleOpenDoc = () => {
    window.open(POLICY_DOC_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-black/10 dark:border-white/10 animate-in zoom-in-95">
        {/* Header Hero */}
        <div className="bg-black text-white p-5 shrink-0 relative overflow-hidden border-b border-white/10">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={APP_AVATAR_PATH}
                alt="Heybo"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">Heybo</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-400">Политика конфиденциальности & Запуск</p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed relative"
        >
          {/* Quick Notice */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Пожалуйста, ознакомьтесь с условиями обработки данных перед первым входом в приложение.
            </span>
          </div>

          {/* Core Takes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
                  1. Полная автономность и 100% офлайн
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Все пароли, заметки, задачи, фото и аудиозаписи хранятся только в локальной памяти вашего браузера. Никаких внешних серверов или баз данных.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
                  2. Аппаратная биометрия и безопасность
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Отпечаток пальца и PIN-код проверяются криптографически через WebAuthn прямо на устройстве. Приложение никогда не имеет доступа к вашим биометрическим образцам.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">
                  3. Никакой слежки и рекламы
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Heybo не собирает метрики, не подключает аналитические трекеры, не требует регистрации и работает полностью без интернета.
                </p>
              </div>
            </div>
          </div>

          {/* Prominent link to Google Doc with Arrow */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Полная юридическая политика</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 animate-bounce-x" />
            </div>

            <button
              onClick={handleOpenDoc}
              className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-500" />
                <span>Читать полную версию в Google Docs</span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Telegram Channel Link */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                Telegram: @heybo_dev
              </span>
            </div>
            <button
              onClick={() => window.open(TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer")}
              className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer"
            >
              Перейти
            </button>
          </div>

          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 py-2 flex justify-center pointer-events-none">
              <button
                onClick={scrollToBottom}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-black/75 text-white text-[11px] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Прокрутить вниз</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Consent Controls & Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-[#181818] border-t border-slate-200 dark:border-white/10 shrink-0 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-md text-[#2E7D32] focus:ring-[#2E7D32] border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <span className="text-xs text-slate-900 dark:text-white font-medium leading-tight">
              Я ознакомился(-лась) и принимаю Политику конфиденциальности Heybo v2.0
            </span>
          </label>

          <button
            onClick={handleConfirm}
            disabled={!agreed}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
              agreed
                ? "bg-[#2E7D32] hover:bg-[#1B5E20] shadow-md shadow-[#2E7D32]/25 active:scale-98"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-70"
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Принять и начать</span>
          </button>
        </div>
      </div>
    </div>
  );
}
