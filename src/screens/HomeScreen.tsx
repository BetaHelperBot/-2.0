import React, { useState, useRef, useEffect } from "react";
import {
  Lock,
  FileText,
  CheckSquare,
  Zap,
  Download,
  Heart,
  Search,
  Settings,
  ChevronRight,
  Shield,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Play,
  Send,
} from "lucide-react";
import { EasterEggModal } from "../components/EasterEggModal.tsx";
import {
  getLocalItem,
  STORAGE_KEYS,
  DEFAULT_EXPERIMENTAL_SETTINGS,
  ExperimentalSettings,
  APP_AVATAR_PATH,
  TELEGRAM_DEV_URL,
  getWipeRecoverySnapshot,
  clearWipeRecoverySnapshot,
  WipeRecoverySnapshot,
} from "../lib/storage.ts";
import {
  checkForTelegramUpdates,
  isUpdateDismissed,
  dismissUpdate,
  UpdateAnnouncement,
} from "../lib/telegramUpdateChecker.ts";

// Global flag to ensure animation only plays ONCE during the app session unless settings enable it
let hasPlayedSessionHomeAnimation = false;

type Props = {
  onNavigate: (route: string) => void;
  counts: { passwords: number; notes: number; todos: number };
  totalPhotos?: number;
  onRestoreWipeSnapshot?: () => void;
};

type Tip = { text: string; icon: string; category: string; color: string };

const TIPS: Tip[] = [
  { icon: "🔐", category: "Безопасность", color: "#10b981", text: "Используй отдельный пароль для каждого сервиса. Если утечёт один — остальные в безопасности." },
  { icon: "🎯", category: "Интерактивные цели", color: "#f59e0b", text: "Добавь в заметку «Цель: 500/1000» — появятся кнопки [+] и [-] для кликабельного прогресса прямо на карточке!" },
  { icon: "⛏️", category: "Minecraft стиль", color: "#10b981", text: "Слова «Майн», «Крафт» или «Выживание» окрашивают заметку в пиксельный стиль со шкалой XP опыта." },
  { icon: "🏆", category: "Brawl Stars режим", color: "#f59e0b", text: "Упоминание «Кубки», «Ранг» или «Трофеи» превращает заметку в стильный трофейный счетчик." },
  { icon: "🎙️", category: "Speech-to-Text", color: "#0284c7", text: "Нажмите кнопку «Голос» в заметке: работает настоящее офлайн-распознавание речи и шторка Split-View." },
  { icon: "🔒", category: "18+ Приватный режим", color: "#ec4899", text: "Тег «18+» или «Секрет» скрывает содержимое за блюр-шторкой. Нажмите, чтобы открыть." },
  { icon: "📵", category: "Цифровой детокс", color: "#6366f1", text: "Первые 30 минут после сна и последние 30 перед сном — без телефона. Это меняет качество дня." },
];

function getTodayTip(): Tip {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length];
}

const SECTIONS = [
  { id: "passwords", title: "Пароли", subtitle: "Хранение и WebAuthn биометрия", icon: Lock, route: "passwords", color: "#10b981" },
  { id: "notes", title: "Заметки & Контекст", subtitle: "Цели [+]/[-], речь, стили Майн и Brawl", icon: FileText, route: "notes", color: "#0284c7" },
  { id: "todos", title: "Задачи", subtitle: "Дела с приоритетами и дедлайнами", icon: CheckSquare, route: "todos", color: "#f59e0b" },
  { id: "gallery", title: "Галерея", subtitle: "Все фото и медиа из заметок", icon: ImageIcon, route: "gallery", color: "#14b8a6" },
  { id: "generator", title: "Генератор паролей", subtitle: "Криптостойкий пароль за клик", icon: Zap, route: "generator", color: "#8b5cf6" },
  { id: "export", title: "Экспорт & Импорт", subtitle: "4 компонента и умное слияние данных", icon: Download, route: "export", color: "#10b981" },
  { id: "about", title: "О приложении", subtitle: "Heybo v2.0 · Локально и автономно", icon: Heart, route: "about", color: "#f43f5e" },
];

export function HomeScreen({ onNavigate, counts, totalPhotos = 0, onRestoreWipeSnapshot }: Props) {
  const [easterEgg, setEasterEgg] = useState<{ title: string; message: string; emoji: string; color: string } | null>(null);

  // 30-Minute Wipe Recovery State
  const [wipeSnapshot, setWipeSnapshot] = useState<(WipeRecoverySnapshot & { remainingMs: number }) | null>(null);

  // Check experimental settings for repeat animation flag
  const expSettings = getLocalItem<ExperimentalSettings>(
    STORAGE_KEYS.EXPERIMENTAL_SETTINGS,
    DEFAULT_EXPERIMENTAL_SETTINGS
  );

  // If repeatHomeAnimations is false and we already played once, start as true immediately (static!)
  const shouldAnimate = expSettings.repeatHomeAnimations || !hasPlayedSessionHomeAnimation;
  const [hasEntered, setHasEntered] = useState(!shouldAnimate);

  const titleTapCount = useRef(0);
  const titleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shieldLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [telegramUpdate, setTelegramUpdate] = useState<UpdateAnnouncement | null>(null);

  // Check for Telegram channel updates in the background
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const update = await checkForTelegramUpdates();
        if (active && update.hasUpdate && update.version && !isUpdateDismissed(update.version)) {
          setTelegramUpdate(update);
        }
      } catch {}
    }, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Check for wipe snapshot on mount and periodically
  useEffect(() => {
    const checkSnapshot = () => {
      setWipeSnapshot(getWipeRecoverySnapshot());
    };
    checkSnapshot();
    const timer = setInterval(checkSnapshot, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setHasEntered(true);
        hasPlayedSessionHomeAnimation = true;
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  const handleTitleTap = () => {
    titleTapCount.current += 1;
    if (titleTapTimer.current) clearTimeout(titleTapTimer.current);
    titleTapTimer.current = setTimeout(() => {
      titleTapCount.current = 0;
    }, 1500);

    if (titleTapCount.current >= 5) {
      titleTapCount.current = 0;
      setEasterEgg({
        title: "Привет, дорогой пользователь!",
        message: "Ты только что нашёл пасхалку — случайно или специально. Это приложение сделано с душой и заботой о твоих данных. Heybo v2.0 💚",
        emoji: "🌸",
        color: "#10b981",
      });
    }
  };

  const handleShieldPressStart = () => {
    shieldLongPressTimer.current = setTimeout(() => {
      setEasterEgg({
        title: "Секрет раскрыт 🛡️",
        message: "100% локальное хранение. Никакого облака, серверов или аналитики. Все пароли и заметки принадлежат только тебе.",
        emoji: "🔒",
        color: "#0284c7",
      });
    }, 600);
  };

  const handleShieldPressEnd = () => {
    if (shieldLongPressTimer.current) {
      clearTimeout(shieldLongPressTimer.current);
      shieldLongPressTimer.current = null;
    }
  };

  const handleRestoreWipedData = () => {
    if (onRestoreWipeSnapshot) {
      onRestoreWipeSnapshot();
    }
    setWipeSnapshot(null);
  };

  const handleDismissWipeSnapshot = () => {
    clearWipeRecoverySnapshot();
    setWipeSnapshot(null);
  };

  const tip = getTodayTip();
  const totalPasswords = counts.passwords ?? 0;
  const totalNotes = counts.notes ?? 0;
  const totalTodos = counts.todos ?? 0;

  // Dynamic counter widgets: ONLY show for non-zero categories
  const activeWidgets = [
    totalPasswords > 0 && { id: "passwords", label: "паролей", count: totalPasswords, color: "#10b981", bg: "#062817", border: "#10b98133", icon: Lock, route: "passwords" },
    totalNotes > 0 && { id: "notes", label: "заметок", count: totalNotes, color: "#0284c7", bg: "#082136", border: "#0284c733", icon: FileText, route: "notes" },
    totalTodos > 0 && { id: "todos", label: "задач", count: totalTodos, color: "#f59e0b", bg: "#2d1c05", border: "#f59e0b33", icon: CheckSquare, route: "todos" },
  ].filter(Boolean) as Array<{ id: string; label: string; count: number; color: string; bg: string; border: string; icon: any; route: string }>;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 pb-24 select-none">
      {/* Real Telegram In-App Update Notice */}
      {telegramUpdate && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-900 dark:text-white">
                Обновление Heybo {telegramUpdate.version}:
              </span>{" "}
              <span className="opacity-90">{telegramUpdate.headline}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => window.open(telegramUpdate.postUrl || TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer")}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Открыть
            </button>
            <button
              onClick={() => {
                if (telegramUpdate.version) dismissUpdate(telegramUpdate.version);
                setTelegramUpdate(null);
              }}
              className="p-1 text-slate-400 hover:text-black dark:hover:text-white"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 30-Minute Total Wipe Grace Recovery Banner */}
      {wipeSnapshot && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/70 text-amber-200 flex flex-col gap-2.5 shadow-lg animate-in slide-in-from-top">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Недавний сброс данных!</span>
            </div>
            <span className="font-mono text-[11px] bg-amber-900/60 px-2 py-0.5 rounded-md">
              Осталось: {Math.max(1, Math.ceil(wipeSnapshot.remainingMs / 60000))} мин
            </span>
          </div>

          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            В резерве: {wipeSnapshot.notes.length} заметок, {wipeSnapshot.passwords.length} паролей, {wipeSnapshot.todos.length} задач. Вы можете восстановить их до истечения таймера.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRestoreWipedData}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Восстановить всё</span>
            </button>
            <button
              onClick={handleDismissWipeSnapshot}
              className="py-2 px-3 rounded-xl bg-black/40 hover:bg-black/60 text-amber-400 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              Стереть сейчас
            </button>
          </div>
        </div>
      )}

      {/* Header with App Logo & Navigation */}
      <div
        className="flex items-start justify-between mb-4 transition-all duration-300 ease-out"
        style={{
          opacity: hasEntered ? 1 : 0,
          transform: hasEntered ? "translateY(0)" : "translateY(-16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src={APP_AVATAR_PATH}
            alt="Heybo Logo"
            onClick={handleTitleTap}
            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95 transition-transform"
          />
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTitleTap}
                className="text-left font-black text-2xl text-slate-900 dark:text-white tracking-tight leading-none block active:opacity-75 cursor-pointer"
              >
                Heybo
              </button>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] tracking-wider uppercase">
                v2.0
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              личный органайзер
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("search")}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Поиск"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate("settings")}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-800"
            title="Настройки"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dynamic Stats Row: Appears gradually and ONLY for non-zero categories */}
      {activeWidgets.length > 0 && (
        <div
          className={`grid gap-2.5 mb-4 transition-all duration-300 ease-out ${
            activeWidgets.length === 1
              ? "grid-cols-1"
              : activeWidgets.length === 2
              ? "grid-cols-2"
              : "grid-cols-3"
          }`}
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? "scale(1)" : "scale(0.95)",
          }}
        >
          {activeWidgets.map((w) => {
            const Icon = w.icon;
            return (
              <button
                key={w.id}
                onClick={() => onNavigate(w.route)}
                className="rounded-2xl p-3 flex flex-col items-center justify-center gap-0.5 active:scale-98 transition-all cursor-pointer shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <Icon className="w-4 h-4" style={{ color: w.color }} />
                <span className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
                  {w.count}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {w.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Section Navigation Cards */}
      <div className="space-y-2.5 mb-5">
        {SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          const count =
            section.id === "passwords"
              ? counts.passwords
              : section.id === "notes"
              ? counts.notes
              : section.id === "todos"
              ? counts.todos
              : section.id === "gallery"
              ? totalPhotos
              : undefined;

          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.route)}
              className="w-full bg-white dark:bg-[#141414] rounded-2xl p-3.5 flex items-center shadow-xs hover:shadow-md active:scale-99 transition-all text-left cursor-pointer border border-slate-200 dark:border-slate-800 group"
              style={{
                opacity: hasEntered ? 1 : 0,
                transform: hasEntered ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
                transition: shouldAnimate
                  ? `all 300ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 35}ms`
                  : "none",
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mr-3.5 transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${section.color}15`, color: section.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-slate-900 dark:text-white tracking-tight">
                  {section.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {section.subtitle}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {count != null && count > 0 && (
                  <span
                    className="min-w-5 h-5 px-1.5 rounded-full text-white text-[11px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: section.color }}
                  >
                    {count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Smart Advice / Tip of the day */}
      <div
        className="bg-white dark:bg-[#141414] rounded-2xl p-4 shadow-xs mb-5 transition-all duration-300 ease-out border border-slate-200 dark:border-slate-800"
        style={{
          opacity: hasEntered ? 1 : 0,
          transform: hasEntered ? "translateY(0)" : "translateY(12px)",
          transitionDelay: shouldAnimate ? "260ms" : "0ms",
        }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-2xl">{tip.icon}</span>
          <div>
            <div className="text-xs font-bold tracking-wide" style={{ color: tip.color }}>
              {tip.category}
            </div>
            <div className="text-[11px] text-slate-500">Офлайн-совет дня</div>
          </div>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{tip.text}</p>
      </div>

      {/* Bottom Footer Actions */}
      <div
        className="flex items-center justify-between text-xs text-slate-500 pt-1 transition-all duration-300 ease-out"
        style={{
          opacity: hasEntered ? 1 : 0,
          transitionDelay: shouldAnimate ? "300ms" : "0ms",
        }}
      >
        {/* Telegram Community Link */}
        <a
          href={TELEGRAM_DEV_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sky-500 hover:text-sky-400 font-semibold cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>@heybo_dev</span>
        </a>

        <button
          onMouseDown={handleShieldPressStart}
          onMouseUp={handleShieldPressEnd}
          onMouseLeave={handleShieldPressEnd}
          onTouchStart={handleShieldPressStart}
          onTouchEnd={handleShieldPressEnd}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium active:scale-95 transition-transform cursor-pointer"
          title="Зажмите, чтобы узнать секрет"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>100% на устройстве</span>
        </button>
      </div>

      {/* Modals */}
      <EasterEggModal
        visible={!!easterEgg}
        onClose={() => setEasterEgg(null)}
        title={easterEgg?.title ?? ""}
        message={easterEgg?.message ?? ""}
        emoji={easterEgg?.emoji ?? "🐾"}
        color={easterEgg?.color ?? "#10b981"}
      />
    </div>
  );
}
