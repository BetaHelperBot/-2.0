import React, { useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  X,
  Lock,
  Database,
  EyeOff,
  Check,
  ArrowRight,
  Send,
  Globe,
  Sparkles,
} from "lucide-react";
import { POLICY_DOC_URL, TELEGRAM_DEV_URL, AUTHOR_SITE_URL } from "../lib/storage.ts";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyPolicyModal({ visible, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(POLICY_DOC_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleOpenDoc = () => {
    window.open(POLICY_DOC_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenTelegram = () => {
    window.open(TELEGRAM_DEV_URL, "_blank", "noopener,noreferrer");
  };

  const handleOpenSite = () => {
    window.open(AUTHOR_SITE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#121212] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 px-5 bg-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-tight">
                Политика конфиденциальности
              </h3>
              <div className="text-xs text-white/80">Heybo v2.0 · Local-First Security</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-95 transition-all text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Main takeaway highlight */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 mb-1">
                Главный принцип: 100% данных на вашем устройстве
              </h4>
              <p className="text-[12px] text-emerald-800 dark:text-emerald-300">
                Heybo не передаёт ни одного байта ваших заметок, паролей или задач во внешние серверы. Никаких аккаунтов третьих лиц, скрытых баз данных или трекеров.
              </p>
            </div>
          </div>

          {/* 4 Key Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Database className="w-4 h-4 text-emerald-500" />
                Офлайн хранение
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Все базы SQLite/LocalStorage изолированы внутри приложения и защищены системой безопасности ОС.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <EyeOff className="w-4 h-4 text-emerald-500" />
                0 трекеров и аналитики
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Полное отсутствие Google Analytics, рекламных SDK, пикселей и телеметрии.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Аппаратная биометрия
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Отпечаток пальца обрабатывается защищённым чипом безопасности смартфона (WebAuthn).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-900 dark:text-white text-xs">
                <Lock className="w-4 h-4 text-emerald-500" />
                Полный контроль данных
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Выгружайте свои данные в чистый .txt/.json в 1 клик или стирайте всё с таймером спасения 30 минут.
              </p>
            </div>
          </div>

          {/* Prominent Button with Arrow pointing to Google Docs */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Полная юридическая редакция документа:</span>
              <ArrowRight className="w-4 h-4 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-600/15 to-teal-500/10 border-2 border-emerald-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Google Docs · Официальная политика Heybo
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Скопировать ссылку"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleOpenDoc}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-3 active:scale-98 transition-all cursor-pointer shadow-lg shadow-emerald-900/20"
              >
                <span>Читать полную официальную политику в Google Docs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Author and Community links */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ресурсы разработчиков & Сообщество
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleOpenTelegram}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>Telegram @heybo_dev</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={handleOpenSite}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Сайт приложения Heybo</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">Редакция v2.0 (Октябрь 2026)</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
