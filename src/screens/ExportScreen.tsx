import React, { useState, useRef } from "react";
import {
  Download,
  Share2,
  Lock,
  FileText,
  CheckSquare,
  Upload,
  Check,
  FileCheck,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import {
  PasswordEntry,
  Note,
  Todo,
  generateCustomBackupText,
  parseImportBackup,
  smartMergeData,
  ThemeMode,
} from "../lib/storage.ts";
import { encryptText, decryptText } from "../lib/cryptoVault.ts";
import { Toast } from "../components/Toast.tsx";

type Props = {
  passwords: PasswordEntry[];
  notes: Note[];
  todos: Todo[];
  onDataImported: (data: { passwords?: PasswordEntry[]; notes?: Note[]; todos?: Todo[] }) => void;
  themeMode?: ThemeMode;
};

export function ExportScreen({
  passwords,
  notes,
  todos,
  onDataImported,
  themeMode,
}: Props) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [toastMsg, setToastMsg] = useState("");

  // 4 Export checkboxes
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includePasswords, setIncludePasswords] = useState(true);
  const [includeTodos, setIncludeTodos] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);

  // Encrypted vault export
  const [encryptBackup, setEncryptBackup] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupPass, setShowBackupPass] = useState(false);

  // Import state
  const [importText, setImportText] = useState("");
  const [decryptPassword, setDecryptPassword] = useState("");
  const [isEncryptedImport, setIsEncryptedImport] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    passwordsCount: number;
    notesCount: number;
    todosCount: number;
    detectedType?: string;
    parsed: { passwords?: PasswordEntry[]; notes?: Note[]; todos?: Todo[] };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const isDark =
    themeMode === "oled" ||
    (themeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  const imagesCount = notes.reduce((acc, n) => acc + (n.images?.length || 0), 0);

  const selectAll = () => {
    setIncludeNotes(true);
    setIncludePasswords(true);
    setIncludeTodos(true);
    setIncludeImages(true);
  };

  const deselectAll = () => {
    setIncludeNotes(false);
    setIncludePasswords(false);
    setIncludeTodos(false);
    setIncludeImages(false);
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Файл «${filename}» сохранён!`);
  };

  // Export as formatted TXT
  const handleExportTxt = async () => {
    if (!includeNotes && !includePasswords && !includeTodos) {
      showToast("Выберите хотя бы один тип данных для экспорта");
      return;
    }

    const text = generateCustomBackupText(passwords, notes, todos, {
      includeNotes,
      includePasswords,
      includeTodos,
      includeImages,
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ text })) {
      try {
        await navigator.share({
          title: "Экспорт Heybo v2.0",
          text,
        });
        showToast("Экспорт отправлен");
        return;
      } catch {}
    }

    downloadFile(`heybo_export_${Date.now()}.txt`, text, "text/plain;charset=utf-8");
  };

  // Export as JSON or Encrypted AES-256 Vault
  const handleExportJson = async () => {
    if (!includeNotes && !includePasswords && !includeTodos) {
      showToast("Выберите хотя бы один тип данных для экспорта");
      return;
    }

    const payload: {
      version: string;
      exportedAt: number;
      passwords?: PasswordEntry[];
      notes?: Note[];
      todos?: Todo[];
    } = {
      version: "2.0",
      exportedAt: Date.now(),
    };

    if (includePasswords) payload.passwords = passwords;
    if (includeNotes) {
      payload.notes = includeImages
        ? notes
        : notes.map((n) => ({ ...n, images: [] }));
    }
    if (includeTodos) payload.todos = todos;

    const rawJson = JSON.stringify(payload, null, 2);

    if (encryptBackup) {
      if (!backupPassword.trim()) {
        showToast("Введите пароль для шифрования резервной копии");
        return;
      }
      try {
        const encrypted = await encryptText(rawJson, backupPassword.trim());
        downloadFile(`heybo_encrypted_${Date.now()}.vault`, encrypted, "text/plain;charset=utf-8");
        showToast("Зашифрованный архив AES-256 создан!");
      } catch {
        showToast("Ошибка шифрования файла");
      }
    } else {
      downloadFile(
        `heybo_backup_${Date.now()}.json`,
        rawJson,
        "application/json"
      );
    }
  };

  // Analyze import text
  const handleAnalyzeText = (text: string) => {
    setImportText(text);
    setIsEncryptedImport(false);

    if (!text.trim()) {
      setImportPreview(null);
      return;
    }

    // Check if the file is an encrypted AES-256 vault
    if (text.startsWith("heybo_enc_v1:")) {
      setIsEncryptedImport(true);
      setImportPreview(null);
      showToast("Обнаружен зашифрованный архив! Введите пароль для расшифровки.");
      return;
    }

    const parsed = parseImportBackup(text);
    setImportPreview({
      passwordsCount: parsed.passwords?.length || 0,
      notesCount: parsed.notes?.length || 0,
      todosCount: parsed.todos?.length || 0,
      detectedType: parsed.detectedType,
      parsed,
    });
  };

  // Decrypt encrypted vault
  const handleDecryptVault = async () => {
    if (!decryptPassword.trim()) {
      showToast("Введите пароль для расшифровки");
      return;
    }
    try {
      const decrypted = await decryptText(importText, decryptPassword.trim());
      if (decrypted.startsWith("heybo_enc_v1:")) {
        showToast("Неверный пароль к архиву!");
        return;
      }
      showToast("Архив успешно расшифрован ✓");
      handleAnalyzeText(decrypted);
      setIsEncryptedImport(false);
      setDecryptPassword("");
    } catch {
      showToast("Неверный пароль или повреждённый архив!");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleAnalyzeText(content);
        showToast(`Файл «${file.name}» загружен`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Confirm Smart Merge
  const handleApplySmartMerge = () => {
    if (!importPreview) return;

    const { merged, added } = smartMergeData(
      { passwords, notes, todos },
      importPreview.parsed
    );

    onDataImported({
      passwords: merged.passwords,
      notes: merged.notes,
      todos: merged.todos,
    });

    showToast(
      `Добавлено: ${added.notes} заметок, ${added.passwords} паролей, ${added.todos} задач! Существующие данные сохранены.`
    );
    setImportText("");
    setImportPreview(null);
  };

  return (
    <div
      className={`flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-5 select-none transition-colors duration-200 ${
        isDark ? "bg-[#090b0a] text-white" : "bg-[#f8faf8] text-slate-900"
      }`}
    >
      {/* Toast Notification */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      {/* Tabs */}
      <div
        className={`flex p-1 rounded-2xl border ${
          isDark
            ? "bg-[#141815] border-white/10"
            : "bg-slate-100 border-slate-200"
        }`}
      >
        <button
          onClick={() => setActiveTab("export")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "export"
              ? "bg-[#23582e] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Экспорт (4 категории)</span>
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "import"
              ? "bg-[#23582e] text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Умный Импорт</span>
        </button>
      </div>

      {activeTab === "export" ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-[#141815] border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Выбор компонентов для экспорта</span>
              </h2>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={selectAll}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Все
                </button>
                <span className="text-slate-400">·</span>
                <button
                  onClick={deselectAll}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Снять
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Отметьте нужные категории. Данные выгружаются в чистом структурированном виде без внешних серверов.
            </p>
          </div>

          {/* 4 Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Notes */}
            <div
              onClick={() => setIncludeNotes(!includeNotes)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                includeNotes
                  ? isDark
                    ? "bg-[#18261b] border-emerald-500/40"
                    : "bg-emerald-50/70 border-emerald-300"
                  : isDark
                  ? "bg-[#131614] border-white/5 opacity-60"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Заметки</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {notes.length} записей
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  includeNotes
                    ? "bg-emerald-600 text-white"
                    : "border-2 border-slate-300 dark:border-slate-700"
                }`}
              >
                {includeNotes && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* 2. Passwords */}
            <div
              onClick={() => setIncludePasswords(!includePasswords)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                includePasswords
                  ? isDark
                    ? "bg-[#18261b] border-emerald-500/40"
                    : "bg-emerald-50/70 border-emerald-300"
                  : isDark
                  ? "bg-[#131614] border-white/5 opacity-60"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Пароли</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {passwords.length} записей
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  includePasswords
                    ? "bg-emerald-600 text-white"
                    : "border-2 border-slate-300 dark:border-slate-700"
                }`}
              >
                {includePasswords && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* 3. Todos */}
            <div
              onClick={() => setIncludeTodos(!includeTodos)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                includeTodos
                  ? isDark
                    ? "bg-[#18261b] border-emerald-500/40"
                    : "bg-emerald-50/70 border-emerald-300"
                  : isDark
                  ? "bg-[#131614] border-white/5 opacity-60"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Задачи и цели</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {todos.length} задач
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  includeTodos
                    ? "bg-emerald-600 text-white"
                    : "border-2 border-slate-300 dark:border-slate-700"
                }`}
              >
                {includeTodos && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* 4. Images */}
            <div
              onClick={() => setIncludeImages(!includeImages)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                includeImages
                  ? isDark
                    ? "bg-[#18261b] border-emerald-500/40"
                    : "bg-emerald-50/70 border-emerald-300"
                  : isDark
                  ? "bg-[#131614] border-white/5 opacity-60"
                  : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold">Фото и файлы</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {imagesCount} фото
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center ${
                  includeImages
                    ? "bg-emerald-600 text-white"
                    : "border-2 border-slate-300 dark:border-slate-700"
                }`}
              >
                {includeImages && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* AES-256 Encryption Option */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isDark
                ? "bg-[#141815] border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold">Шифрование архива (AES-256)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={encryptBackup}
                  onChange={(e) => setEncryptBackup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#23582e]"></div>
              </label>
            </div>

            {encryptBackup ? (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Задайте пароль. Файл будет сохранён с расширением <code className="font-mono">.vault</code> и его нельзя будет открыть без пароля.
                </p>
                <div className="relative">
                  <input
                    type={showBackupPass ? "text" : "password"}
                    placeholder="Придумайте пароль для архива"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    className={`w-full pr-10 pl-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark
                        ? "bg-[#1a211b] border-white/10 text-white"
                        : "bg-slate-50 border-slate-300 text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowBackupPass(!showBackupPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showBackupPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Защитите выгружаемый файл криптографическим ключом при переносе на другое устройство.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleExportTxt}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#23582e] hover:bg-[#1b4624] text-white font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Экспортировать выбранное (.txt)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJson}
                className={`flex-1 py-3 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                  encryptBackup
                    ? "bg-[#4527a0] hover:bg-[#381e85] text-white border-transparent"
                    : isDark
                    ? "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {encryptBackup ? "Зашифрованный файл (.vault)" : "Полный архив (.json)"}
                </span>
              </button>

              {typeof navigator !== "undefined" && typeof (navigator as any).share === "function" && (
                <button
                  onClick={handleExportTxt}
                  className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer ${
                    isDark
                      ? "bg-white/10 hover:bg-white/15 text-white border-white/10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                  }`}
                  title="Поделиться через систему"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Поделиться</span>
                </button>
              )}
            </div>
          </div>

          {/* Trust Banner */}
          <div
            className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs leading-relaxed ${
              isDark
                ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
            <p>
              Экспорт формируется исключительно в памяти вашего браузера. Никаких сетевых запросов.
            </p>
          </div>
        </div>
      ) : (
        /* IMPORT TAB */
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-[#141815] border-white/10"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Умный Импорт без потери данных</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Вставьте текст или выберите файл (.txt, .json, .vault). Импортированные записи мягко добавятся к вашим текущим без затирания.
            </p>
          </div>

          {/* Upload file trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.json,.vault"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-3.5 px-4 rounded-2xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDark
                ? "border-emerald-500/40 bg-white/5 hover:bg-white/10 text-slate-200"
                : "border-emerald-600/40 bg-emerald-50/50 hover:bg-emerald-50 text-slate-800"
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Выбрать файл с устройства (.txt, .json, .vault)</span>
          </button>

          {/* If Encrypted Vault Detected */}
          {isEncryptedImport && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Архив зашифрован. Введите пароль:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Пароль архива"
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark
                      ? "bg-[#181d19] border-white/10 text-white"
                      : "bg-white border-slate-300 text-slate-900"
                  }`}
                />
                <button
                  onClick={handleDecryptVault}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs active:scale-95 transition-all"
                >
                  Открыть
                </button>
              </div>
            </div>
          )}

          {/* Paste text area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Или вставьте текст вручную:</span>
              {importText && (
                <button
                  onClick={() => handleAnalyzeText("")}
                  className="text-rose-500 hover:underline cursor-pointer"
                >
                  Очистить
                </button>
              )}
            </div>
            <textarea
              value={importText}
              onChange={(e) => handleAnalyzeText(e.target.value)}
              placeholder="Вставьте сюда текст из другого приложения или файла резервной копии..."
              rows={4}
              className={`w-full p-3 rounded-2xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-mono ${
                isDark
                  ? "bg-[#141815] border-white/10 text-white placeholder-slate-500"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
              }`}
            />
          </div>

          {/* Preview of detected items */}
          {importPreview && (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                isDark
                  ? "bg-[#141d16] border-emerald-500/30 text-white"
                  : "bg-emerald-50 border-emerald-200 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                  <span>Распознано в архиве:</span>
                </span>
                <span className="text-[11px] opacity-75">
                  Формат: {importPreview.detectedType || "пользовательский"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  className={`p-2 rounded-xl border ${
                    isDark ? "bg-black/30 border-white/10" : "bg-white border-emerald-100"
                  }`}
                >
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {importPreview.notesCount}
                  </div>
                  <div className="text-[10px] opacity-75">Заметок</div>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    isDark ? "bg-black/30 border-white/10" : "bg-white border-emerald-100"
                  }`}
                >
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {importPreview.passwordsCount}
                  </div>
                  <div className="text-[10px] opacity-75">Паролей</div>
                </div>
                <div
                  className={`p-2 rounded-xl border ${
                    isDark ? "bg-black/30 border-white/10" : "bg-white border-emerald-100"
                  }`}
                >
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {importPreview.todosCount}
                  </div>
                  <div className="text-[10px] opacity-75">Задач</div>
                </div>
              </div>

              <button
                onClick={handleApplySmartMerge}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-md active:scale-98"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Объединить с текущими данными (Ничего не затрётся)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
