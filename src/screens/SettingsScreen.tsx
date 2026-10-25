import React, { useState, useEffect, useRef } from "react";
import {
  Hash,
  Edit2,
  Shield,
  Database,
  WifiOff,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Fingerprint,
  Moon,
  Sun,
  Laptop,
  HelpCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  Sparkles,
  Sliders,
  AlertTriangle,
  Send,
  RefreshCw,
  Download,
} from "lucide-react";
import {
  checkForTelegramUpdates,
  UpdateAnnouncement,
  CURRENT_APP_VERSION,
} from "../lib/telegramUpdateChecker.ts";
import {
  STORAGE_KEYS,
  setLocalItem,
  getLocalItem,
  ThemeMode,
  ExperimentalSettings,
  DEFAULT_EXPERIMENTAL_SETTINGS,
  CURRENT_POLICY_VERSION,
  POLICY_DOC_URL,
  AUTHOR_SITE_URL,
  TELEGRAM_DEV_URL,
} from "../lib/storage.ts";
import { registerBiometrics, verifyBiometrics } from "../lib/biometrics.ts";
import { EasterEggModal } from "../components/EasterEggModal.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { Toast } from "../components/Toast.tsx";
import { PrivacyPolicyModal } from "../components/PrivacyPolicyModal.tsx";

type Props = {
  onNavigate: (route: string) => void;
  onClearAll: () => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
};

export function SettingsScreen({
  onNavigate,
  onClearAll,
  themeMode,
  onChangeTheme,
}: Props) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showExpAccordion, setShowExpAccordion] = useState(false);
  const [expSettings, setExpSettings] = useState<ExperimentalSettings>(
    DEFAULT_EXPERIMENTAL_SETTINGS
  );
  const [easterEgg, setEasterEgg] = useState<{
    title: string;
    message: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [showDisablePinDialog, setShowDisablePinDialog] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [foundUpdate, setFoundUpdate] = useState<UpdateAnnouncement | null>(null);

  const handleManualCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    showToast("Проверяем Telegram-канал @heybo_dev...");
    try {
      const res = await checkForTelegramUpdates();
      if (res.hasUpdate) {
        setFoundUpdate(res);
      } else if (res.source === "offline") {
        showToast("Нет подключения к интернету");
      } else {
        showToast(`У вас установлена актуальная версия Heybo v${CURRENT_APP_VERSION} ✓`);
      }
    } catch {
      showToast("Не удалось проверить обновления");
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const footerTapCount = useRef(0);
  const footerTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pin = localStorage.getItem(STORAGE_KEYS.PIN_ENABLED) === "true";
    setPinEnabled(pin);
    const bio = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED) === "true";
    setBiometricEnabled(bio);

    const pol =
      localStorage.getItem(STORAGE_KEYS.POLICY_ACCEPTED_VERSION) === CURRENT_POLICY_VERSION;
    setPolicyAccepted(pol);

    const storedExp = getLocalItem<ExperimentalSettings>(
      STORAGE_KEYS.EXPERIMENTAL_SETTINGS,
      DEFAULT_EXPERIMENTAL_SETTINGS
    );
    setExpSettings(storedExp);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const togglePin = (val: boolean) => {
    if (val) {
      onNavigate("pin");
    } else {
      setShowDisablePinDialog(true);
    }
  };

  const confirmDisablePin = () => {
    setPinEnabled(false);
    setLocalItem(STORAGE_KEYS.PIN_ENABLED, "false");
    localStorage.removeItem(STORAGE_KEYS.PIN_CODE);
    setShowDisablePinDialog(false);
    showToast("PIN-код отключён");
  };

  const toggleBiometric = async (val: boolean) => {
    if (val) {
      setIsVerifyingBio(true);
      showToast("Коснитесь датчика отпечатка пальца...");
      try {
        const res = await registerBiometrics();
        if (res.success) {
          setBiometricEnabled(true);
          setLocalItem(STORAGE_KEYS.BIOMETRIC_ENABLED, "true");
          showToast("Биометрия успешно настроена ✓");
        } else if (res.error) {
          setBiometricEnabled(false);
          setLocalItem(STORAGE_KEYS.BIOMETRIC_ENABLED, "false");
          showToast(res.error);
        }
      } catch (err: any) {
        showToast("Ошибка биометрии");
      } finally {
        setIsVerifyingBio(false);
      }
    } else {
      setBiometricEnabled(false);
      setLocalItem(STORAGE_KEYS.BIOMETRIC_ENABLED, "false");
      showToast("Биометрия отключена");
    }
  };

  const handleTestBiometrics = async () => {
    showToast("Проверка отпечатка пальца...");
    const res = await verifyBiometrics();
    if (res.success) {
      showToast("Отпечаток распознан! Доступ разрешён ✓");
    } else {
      showToast(res.error || "Отпечаток не распознан");
    }
  };

  const updateExpSetting = (key: keyof ExperimentalSettings, val: boolean) => {
    const updated = { ...expSettings, [key]: val };
    setExpSettings(updated);
    setLocalItem(STORAGE_KEYS.EXPERIMENTAL_SETTINGS, updated);
    showToast("Настройки обновлены");
  };

  const handleCopySite = async () => {
    try {
      await navigator.clipboard.writeText(AUTHOR_SITE_URL);
      showToast("Ссылка скопирована");
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowClearAllDialog(false);
    showToast("Все данные удалены");
  };

  const handleFooterTap = () => {
    footerTapCount.current += 1;
    if (footerTapTimer.current) clearTimeout(footerTapTimer.current);
    footerTapTimer.current = setTimeout(() => {
      footerTapCount.current = 0;
    }, 2000);

    if (footerTapCount.current >= 5) {
      footerTapCount.current = 0;
      setEasterEgg({
        title: "Пасхалка #3",
        message: "Знаешь что? Пока шла разработка этого приложения, вышел тизер 2 сезона «При». Первая серия уже в эфире — но разработчик ещё не смотрел. Не спойлерь ему пожалуйста 🙏",
        emoji: "📺",
        color: "#E65100",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 select-none">
      {/* Theme Section */}
      <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2 px-1">
        Внешний вид & Тема
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-2xl p-3 shadow-xs mb-5 border border-black/5 dark:border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChangeTheme("light")}
            className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
              themeMode === "light"
                ? "bg-[#2E7D32] text-white shadow-xs"
                : "bg-gray-100 dark:bg-white/5 text-[#616161] dark:text-[#a0a0a0] hover:bg-gray-200"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Светлая</span>
          </button>

          <button
            onClick={() => onChangeTheme("oled")}
            className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
              themeMode === "oled"
                ? "bg-[#1565C0] text-white shadow-xs"
                : "bg-gray-100 dark:bg-white/5 text-[#616161] dark:text-[#a0a0a0] hover:bg-gray-200"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>OLED Тёмная</span>
          </button>

          <button
            onClick={() => onChangeTheme("system")}
            className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
              themeMode === "system"
                ? "bg-[#4527A0] text-white shadow-xs"
                : "bg-gray-100 dark:bg-white/5 text-[#616161] dark:text-[#a0a0a0] hover:bg-gray-200"
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Системная</span>
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2 px-1">
        Безопасность
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-2xl overflow-hidden shadow-xs divide-y divide-[#f5f5f5] dark:divide-white/5 mb-5 border border-black/5 dark:border-white/10">
        {/* PIN Switch */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] dark:bg-[#1B5E20]/30 text-[#2E7D32] dark:text-[#81C784] flex items-center justify-center shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">PIN-код</div>
            <div className="text-xs text-[#9e9e9e]">
              {pinEnabled ? "Вход по 4-значному коду" : "Установить PIN для блокировки"}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={(e) => togglePin(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#e0e0e0] dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
          </label>
        </div>

        {/* Change PIN (if enabled) */}
        {pinEnabled && (
          <button
            onClick={() => onNavigate("pin")}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-99 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F3E5F5] dark:bg-[#4A148C]/30 text-[#6A1B9A] dark:text-[#CE93D8] flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">Изменить PIN</div>
              <div className="text-xs text-[#9e9e9e]">Установить новый код</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#bdbdbd] shrink-0" />
          </button>
        )}

        {/* Biometrics Switch */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] dark:bg-[#1B5E20]/30 text-[#2E7D32] dark:text-[#81C784] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">Биометрия</div>
            <div className="text-xs text-[#9e9e9e]">
              Отпечаток пальца / Face ID / Быстрый доступ
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={biometricEnabled}
              disabled={isVerifyingBio}
              onChange={(e) => toggleBiometric(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#e0e0e0] dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
          </label>
        </div>

        {/* Test Fingerprint (if enabled) */}
        {biometricEnabled && (
          <button
            onClick={handleTestBiometrics}
            className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-99 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] dark:bg-[#1B5E20]/30 text-[#2E7D32] dark:text-[#81C784] flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">
                Проверить отпечаток
              </div>
              <div className="text-xs text-[#9e9e9e]">Протестировать сканер биометрии</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#bdbdbd] shrink-0" />
          </button>
        )}
      </div>

      {/* Privacy & Legal Section */}
      <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2 px-1">
        Приватность & Правовая информация
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-2xl overflow-hidden shadow-xs divide-y divide-[#f5f5f5] dark:divide-white/5 mb-5 border border-black/5 dark:border-white/10">
        {/* Privacy Policy Item with Acceptance Badge */}
        <button
          onClick={() => setShowPolicyModal(true)}
          className="w-full p-4 flex items-center gap-3.5 hover:bg-gray-50 dark:hover:bg-white/5 active:scale-99 transition-all text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] dark:bg-[#1B5E20]/30 text-[#2E7D32] dark:text-[#81C784] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white flex items-center gap-2">
              <span>Политика конфиденциальности</span>
            </div>
            <div className="text-xs text-[#9e9e9e]">
              Условия обработки локальных данных v2.0
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {policyAccepted ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Принята</span>
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center animate-pulse shadow-xs">
                ?
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-[#bdbdbd]" />
          </div>
        </button>

        {/* Local Storage Indicator */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] dark:bg-[#1565C0]/30 text-[#1565C0] dark:text-[#90CAF9] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">Локальное хранение</div>
            <div className="text-xs text-[#9e9e9e]">Данные не покидают устройство</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#2E7D32] dark:text-[#81C784] shrink-0" />
        </div>

        {/* Offline indicator */}
        <div className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FCE4EC] dark:bg-[#C2185B]/30 text-[#C62828] dark:text-[#F48FB1] flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white">Без интернета</div>
            <div className="text-xs text-[#9e9e9e]">Работает полностью офлайн</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#2E7D32] dark:text-[#81C784] shrink-0" />
        </div>
      </div>

      {/* Official Telegram Channel */}
      <div className="bg-white dark:bg-[#141414] rounded-2xl p-4 shadow-xs mb-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-500" />
            <span className="font-semibold text-sm text-[#1a1a1a] dark:text-white">
              Официальный Telegram канал
            </span>
          </div>
          <span className="text-[10px] bg-sky-500/10 text-sky-500 font-bold px-2 py-0.5 rounded-full">
            @heybo_dev
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Новости разработки, анонсы фишек, обновления и прямая связь с автором.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer")}
            className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Канал @heybo_dev</span>
          </button>
          <button
            onClick={handleManualCheckUpdates}
            disabled={isCheckingUpdates}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? "animate-spin text-emerald-500" : ""}`} />
            <span>{isCheckingUpdates ? "Проверка..." : "Проверить обновления"}</span>
          </button>
        </div>
      </div>

      {/* Experimental Features Accordion (Collapsed by default, all off initially) */}
      <div className="bg-white dark:bg-[#141414] rounded-2xl overflow-hidden shadow-xs mb-5 border border-black/5 dark:border-white/10">
        <button
          onClick={() => setShowExpAccordion(!showExpAccordion)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1a1a1a] dark:text-white flex items-center gap-1.5">
                <span>Экспериментальные функции</span>
                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  BETA
                </span>
              </div>
              <div className="text-xs text-[#9e9e9e]">Тонкая настройка Heybo v2.0</div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#9e9e9e] transition-transform duration-200 ${
              showExpAccordion ? "rotate-180" : ""
            }`}
          />
        </button>

        {showExpAccordion && (
          <div className="p-4 pt-1 border-t border-black/5 dark:border-white/5 divide-y divide-[#f5f5f5] dark:divide-white/5 space-y-3">
            {/* Repeat Home Animations */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#1a1a1a] dark:text-white">
                  Повторять анимацию главного экрана
                </div>
                <div className="text-[11px] text-[#9e9e9e]">
                  По умолчанию анимация играет только 1 раз при запуске
                </div>
              </div>
              <input
                type="checkbox"
                checked={expSettings.repeatHomeAnimations}
                onChange={(e) => updateExpSetting("repeatHomeAnimations", e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded-md cursor-pointer"
              />
            </div>

            {/* Note Context Widgets */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#1a1a1a] dark:text-white">
                  Контекстный парсер заметок
                </div>
                <div className="text-[11px] text-[#9e9e9e]">
                  Интерактивные виджеты /цель и /таймер
                </div>
              </div>
              <input
                type="checkbox"
                checked={expSettings.noteContextWidgets}
                onChange={(e) => updateExpSetting("noteContextWidgets", e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded-md cursor-pointer"
              />
            </div>

            {/* Voice Split-View */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#1a1a1a] dark:text-white">
                  Голосовой Split-View блок
                </div>
                <div className="text-[11px] text-[#9e9e9e]">
                  Панель аудиозаметок с расшифровкой речи
                </div>
              </div>
              <input
                type="checkbox"
                checked={expSettings.voiceSplitView}
                onChange={(e) => updateExpSetting("voiceSplitView", e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded-md cursor-pointer"
              />
            </div>

            {/* Trash Recovery */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#1a1a1a] dark:text-white">
                  30-минутная корзина безопасности
                </div>
                <div className="text-[11px] text-[#9e9e9e]">
                  Возможность восстановить случайно удалённые элементы
                </div>
              </div>
              <input
                type="checkbox"
                checked={expSettings.trashRecovery}
                onChange={(e) => updateExpSetting("trashRecovery", e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded-md cursor-pointer"
              />
            </div>

            {/* Dynamic Palette */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#1a1a1a] dark:text-white">
                  Palette API / Динамические акценты
                </div>
                <div className="text-[11px] text-[#9e9e9e]">
                  Адаптация цветов карточек под фото
                </div>
              </div>
              <input
                type="checkbox"
                checked={expSettings.paletteDynamic}
                onChange={(e) => updateExpSetting("paletteDynamic", e.target.checked)}
                className="w-4 h-4 text-[#2E7D32] rounded-md cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Section */}
      <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2 px-1">
        Данные
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-2xl overflow-hidden shadow-xs mb-8 border border-black/5 dark:border-white/10">
        <button
          onClick={() => setShowClearAllDialog(true)}
          className="w-full p-4 flex items-center gap-3.5 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-99 transition-all text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFEBEE] dark:bg-red-950/40 text-[#C62828] flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-[#C62828]">Удалить все данные</div>
            <div className="text-xs text-[#9e9e9e]">Пароли, заметки и задачи</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#C62828] shrink-0" />
        </button>
      </div>

      {/* Footer */}
      <button
        onClick={handleFooterTap}
        className="w-full text-center text-xs text-[#bdbdbd] hover:text-[#9e9e9e] transition-colors leading-relaxed block py-2 cursor-pointer"
      >
        Heybo · v2.0
        <br />
        © 2026
      </button>

      {/* Modals & Dialogs */}
      <PrivacyPolicyModal
        visible={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
      />

      <EasterEggModal
        visible={!!easterEgg}
        onClose={() => setEasterEgg(null)}
        title={easterEgg?.title ?? ""}
        message={easterEgg?.message ?? ""}
        emoji={easterEgg?.emoji ?? "🎉"}
        color={easterEgg?.color ?? "#2E7D32"}
      />

      {/* Disable PIN Confirm Dialog */}
      <ConfirmDialog
        visible={showDisablePinDialog}
        title="Отключить PIN-код?"
        message="Приложение больше не будет блокироваться при входе."
        confirmText="ОТКЛЮЧИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setShowDisablePinDialog(false)}
        onConfirm={confirmDisablePin}
      />

      {/* Delete All Data Confirm Dialog */}
      <ConfirmDialog
        visible={showClearAllDialog}
        title="Сбросить все данные приложения?"
        message="Приложение станет нулевым и чистым. У вас будет 30 минут, чтобы восстановить данные со снимка безопасности, после чего они будут физически удалены."
        confirmText="СБРОСИТЬ ДАННЫЕ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setShowClearAllDialog(false)}
        onConfirm={confirmClearAll}
      />

      {/* New Update Announcement Dialog */}
      {foundUpdate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161616] p-5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Новая версия {foundUpdate.version}</span>
              </span>
              <button
                onClick={() => setFoundUpdate(null)}
                className="p-1 text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h3 className="font-bold text-base leading-snug">{foundUpdate.headline}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
              {foundUpdate.messageText}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setFoundUpdate(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Позже
              </button>
              <button
                onClick={() => {
                  window.open(foundUpdate.postUrl || TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer");
                  setFoundUpdate(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Открыть пост</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
