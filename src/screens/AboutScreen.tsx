import React, { useState, useRef } from "react";
import {
  Globe,
  Copy,
  ExternalLink,
  ShieldCheck,
  Shield,
  FileText,
  Send,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { EasterEggModal } from "../components/EasterEggModal.tsx";
import { Toast } from "../components/Toast.tsx";
import { PrivacyPolicyModal } from "../components/PrivacyPolicyModal.tsx";
import {
  AUTHOR_SITE_URL,
  POLICY_DOC_URL,
  TELEGRAM_DEV_URL,
  APP_AVATAR_PATH,
} from "../lib/storage.ts";

const VERSION = "2.0.0";

export function AboutScreen() {
  const [toastMsg, setToastMsg] = useState("");
  const [easterEgg, setEasterEgg] = useState<{
    title: string;
    message: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const versionTapCount = useRef(0);
  const versionTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleOpenSite = () => {
    window.open(AUTHOR_SITE_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenTelegram = () => {
    window.open(TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer");
  };

  const handleVersionTap = () => {
    versionTapCount.current += 1;
    if (versionTapTimer.current) clearTimeout(versionTapTimer.current);
    versionTapTimer.current = setTimeout(() => {
      versionTapCount.current = 0;
    }, 2000);

    if (versionTapCount.current >= 7) {
      versionTapCount.current = 0;
      setEasterEgg({
        title: "А ты настойчивый!",
        message:
          "Создателю этого приложения 17 лет. Да-да, всё это написано с душой. Если ты нашёл этот секрет — огромное уважение тебе! Heybo v2.0 🫡",
        emoji: "🎂",
        color: "#10b981",
      });
    }
  };

  const handleLogoTap = () => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 1500);

    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      setEasterEgg({
        title: "Тссс, секрет Heybo",
        message:
          "Пока автор кодил Heybo v2.0 — вышел тизер 2 сезона «При». Первая серия уже доступна! А ты уже в курсе событий? 👀",
        emoji: "🎬",
        color: "#f43f5e",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 select-none">
      {/* Dark Hero with Squircle Avatar */}
      <div className="bg-black text-white pt-8 pb-7 px-6 border-b border-white/10 flex flex-col items-center text-center">
        <img
          src={APP_AVATAR_PATH}
          alt="Heybo"
          onClick={handleLogoTap}
          className="w-20 h-20 rounded-3xl object-cover ring-2 ring-emerald-500/50 shadow-2xl shadow-emerald-500/20 mb-3 active:scale-95 transition-transform cursor-pointer"
        />

        <button
          onClick={handleLogoTap}
          className="text-3xl font-black tracking-tight mb-1 active:opacity-80 cursor-pointer"
        >
          Heybo
        </button>

        <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
          Личный карманный органайзер нового поколения — безопасность, интерактивные цели и полная автономность
        </p>

        <button
          onClick={handleVersionTap}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-emerald-400 tracking-wider transition-colors active:scale-95 cursor-pointer font-mono"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>v{VERSION} · Major Update</span>
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Telegram Community Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Telegram сообщество
              </div>
              <div className="text-xs text-slate-500">Новости и разработка @heybo_dev</div>
            </div>
          </div>

          <button
            onClick={handleOpenTelegram}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>Вступить</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Author Site Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Сайт приложения
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[170px]">{AUTHOR_SITE_URL}</div>
            </div>
          </div>

          <button
            onClick={handleOpenSite}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span>Открыть</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Privacy Policy Card & Button */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Политика конфиденциальности</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Heybo не хранит данные на серверах. Все пароли, заметки и задачи защищены аппаратно на вашем устройстве.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPolicyModal(true)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Кратко в приложении</span>
            </button>

            <button
              onClick={() => window.open(POLICY_DOC_URL, "_blank", "noopener,noreferrer")}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <span>Google Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Next-Gen Security Manifest Card */}
        <div className="bg-white dark:bg-[#141414] rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Паспорт безопасности · Органайзер нового поколения</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Мы не просто пишем «безопасно» — каждый байт подкреплён настоящей архитектурой нулевого доверия:
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1. Шифрование Web Crypto AES-256-GCM</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Пароли и конфиденциальные данные деривируются через алгоритм PBKDF2 (100 000 итераций SHA-256) и шифруются симметричным ключом AES-256 прямо в оперативной памяти устройства.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>2. 100% Air-Gap (Нулевая сетевая поверхность)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Heybo не отправляет ни одного байта во внешнюю сеть. В приложении нет сторонних трекеров, аналитики и баз данных. Вкладка Network в DevTools остаётся пустой.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>3. Аппаратный биометрический доступ (WebAuthn)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Аутентификация по отпечатку пальца выполняется аппаратным сопроцессором (Secure Enclave / TEE). Приложение никогда не видит и не хранит отпечаток — только криптографический ответ модуля.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>4. Аудит уязвимостей и энтропия Шеннона</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Автоматический анализ хранилища находит дубликаты паролей между сервисами и рассчитывает реальные биты стойкости к атакам перебором.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-3">© 2026 Heybo · v2.0</div>
      </div>

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
        color={easterEgg?.color ?? "#10b981"}
      />

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
