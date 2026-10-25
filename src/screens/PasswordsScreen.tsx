import React, { useState } from "react";
import {
  Lock,
  Search,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Plus,
  Users,
  Mail,
  Zap,
  CreditCard,
  Key,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { PasswordEntry, PasswordCategory, STORAGE_KEYS, setLocalItem, ThemeMode } from "../lib/storage.ts";
import { generateQuickPassword } from "../lib/passwordGenerator.ts";
import { calculatePasswordEntropy, auditVaultSecurity } from "../lib/cryptoVault.ts";
import { Toast } from "../components/Toast.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";

const CATEGORIES: { id: PasswordCategory; label: string; icon: any; color: string }[] = [
  { id: "social", label: "Соцсеть", icon: Users, color: "#0284c7" },
  { id: "email", label: "Почта", icon: Mail, color: "#f59e0b" },
  { id: "game", label: "Игра", icon: Zap, color: "#8b5cf6" },
  { id: "bank", label: "Банк", icon: CreditCard, color: "#10b981" },
  { id: "other", label: "Другое", icon: Key, color: "#64748b" },
];

function getCategoryMeta(id: PasswordCategory) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[4];
}

type Props = {
  entries: PasswordEntry[];
  onChange: (updated: PasswordEntry[]) => void;
  themeMode?: ThemeMode;
};

export function PasswordsScreen({ entries, onChange, themeMode }: Props) {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<PasswordCategory>("other");
  const [showPassword, setShowPassword] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PasswordEntry | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const audit = auditVaultSecurity(entries);
  const modalEntropy = calculatePasswordEntropy(password);

  const handleAdd = () => {
    if (!title.trim() || !password.trim()) return;
    const newEntry: PasswordEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: title.trim(),
      password: password.trim(),
      category,
      createdAt: Date.now(),
    };
    const updated = [newEntry, ...entries];
    onChange(updated);
    setLocalItem(STORAGE_KEYS.PASSWORDS, updated);

    setTitle("");
    setPassword("");
    setCategory("other");
    setShowPassword(false);
    setModalVisible(false);
    showToast("Пароль сохранён");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = entries.filter((e) => e.id !== deleteTarget.id);
    onChange(updated);
    setLocalItem(STORAGE_KEYS.PASSWORDS, updated);
    setDeleteTarget(null);
    showToast("Пароль удалён");
  };

  const handleCopy = async (entry: PasswordEntry) => {
    try {
      await navigator.clipboard.writeText(entry.password);
      setCopiedId(entry.id);
      showToast(`Скопировано: ${entry.title}`);
      if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  const toggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const isDark =
    themeMode === "oled" ||
    (themeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden relative select-none transition-colors duration-200 ${
        isDark ? "bg-[#090b0a] text-white" : "bg-[#f8faf8] text-slate-900"
      }`}
    >
      {/* Security Health Audit Card */}
      {entries.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
              isDark
                ? "bg-[#141815] border-white/10"
                : "bg-white border-slate-200/90"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  audit.overallScorePercent >= 80
                    ? "bg-emerald-500/20 text-emerald-500"
                    : audit.overallScorePercent >= 50
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-rose-500/20 text-rose-500"
                }`}
              >
                {audit.overallScorePercent}%
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <span>Индекс защиты хранилища</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                      audit.overallScorePercent >= 80
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-amber-500/15 text-amber-500"
                    }`}
                  >
                    {audit.overallScorePercent >= 80 ? "Надёжно" : "Внимание"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {audit.duplicateCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Обнаружен повтор пароля ({audit.duplicateCount})
                    </span>
                  ) : audit.weakCount > 0 ? (
                    <span className="text-amber-500">
                      Слабых паролей: {audit.weakCount}
                    </span>
                  ) : (
                    "AES-256 Web Crypto · Все пароли уникальны"
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const generated = generateQuickPassword();
                setPassword(generated);
                setShowPassword(true);
                setModalVisible(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 pb-2">
        <div
          className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 border shadow-xs ${
            isDark
              ? "bg-[#161a17] border-white/10 text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            className="flex-1 text-xs font-medium bg-transparent outline-none placeholder-slate-400"
            placeholder="Поиск по названию или категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search.length > 0 && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-28 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="font-bold text-sm">
              {entries.length === 0 ? "Нет сохранённых паролей" : "Ничего не найдено"}
            </div>
            <div className="text-xs text-slate-400 max-w-xs">
              {entries.length === 0
                ? "Нажмите «+» ниже, чтобы добавить свой первый надёжный пароль"
                : "Попробуйте изменить поисковый запрос"}
            </div>
          </div>
        ) : (
          filtered.map((entry) => {
            const cat = getCategoryMeta(entry.category);
            const CatIcon = cat.icon;
            const isVisible = visibleIds.has(entry.id);
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className={`rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs border transition-all ${
                  isDark
                    ? "bg-[#141815] border-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  <CatIcon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {entry.title}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300 tracking-wider truncate mr-2 select-all">
                      {isVisible ? entry.password : "••••••••••"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                      <button
                        onClick={() => toggleVisible(entry.id)}
                        className="p-1.5 hover:text-slate-600 dark:hover:text-white active:scale-90 transition-colors cursor-pointer"
                        title={isVisible ? "Скрыть" : "Показать"}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(entry)}
                        className={`p-1.5 active:scale-90 transition-colors cursor-pointer ${
                          isCopied ? "text-emerald-500" : "hover:text-slate-600 dark:hover:text-white"
                        }`}
                        title="Копировать"
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="p-1.5 hover:text-rose-500 active:scale-90 transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
        title="Добавить пароль"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add Password Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-150 border ${
              isDark
                ? "bg-[#161917] border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <span>Сохранить пароль</span>
            </h2>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.color : undefined,
                    }}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Title field */}
            <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-2 mb-4">
              <Tag className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="Название (например, Steam, ВК)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Password field */}
            <div className="flex items-center gap-2 border-b-2 border-emerald-500 pb-2 mb-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                className="flex-1 text-sm font-mono bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Entropy Meter */}
            {password.length > 0 && (
              <div className="mb-4 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    Стойкость: {modalEntropy.bits} бит
                  </span>
                  <span
                    className={
                      modalEntropy.strength === "extreme"
                        ? "text-emerald-500 font-bold"
                        : modalEntropy.strength === "strong"
                        ? "text-sky-500 font-bold"
                        : modalEntropy.strength === "medium"
                        ? "text-amber-500"
                        : "text-rose-500 font-bold"
                    }
                  >
                    {modalEntropy.feedback}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      modalEntropy.strength === "extreme"
                        ? "bg-emerald-500"
                        : modalEntropy.strength === "strong"
                        ? "bg-sky-500"
                        : modalEntropy.strength === "medium"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${modalEntropy.scorePercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generator button */}
            <button
              type="button"
              onClick={() => {
                const generated = generateQuickPassword();
                setPassword(generated);
                setShowPassword(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 active:scale-98 transition-all mb-6 border border-emerald-200 dark:border-emerald-800/50 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>Сгенерировать надёжный пароль</span>
            </button>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalVisible(false);
                  setTitle("");
                  setPassword("");
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                ОТМЕНА
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!title.trim() || !password.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                  title.trim() && password.trim()
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-md active:scale-95 cursor-pointer"
                    : "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                СОХРАНИТЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Удалить пароль?"
        message={
          deleteTarget
            ? `Вы уверены, что хотите удалить «${deleteTarget.title}»?`
            : "Пароль будет удалён."
        }
        confirmText="УДАЛИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
