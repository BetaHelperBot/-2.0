import React, { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { buildPassword, getStrength, PasswordOptions } from "../lib/passwordGenerator.ts";
import { Toast } from "../components/Toast.tsx";

const LENGTH_PRESETS = [8, 10, 12, 14, 16, 20, 24, 32];
const HISTORY_LIMIT = 10;

export function GeneratorScreen() {
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 14,
    upper: true,
    lower: true,
    digits: true,
    special: true,
  });
  const [password, setPassword] = useState(() =>
    buildPassword({ length: 14, upper: true, lower: true, digits: true, special: true })
  );
  const [history, setHistory] = useState<string[]>([]);
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handleGenerate = () => {
    const newPass = buildPassword(opts);
    setPassword(newPass);
    setHistory((h) => [newPass, ...h].slice(0, HISTORY_LIMIT));
    setCopiedMain(false);
  };

  const handleCopyMain = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedMain(true);
      showToast("Скопировано!");
      setTimeout(() => setCopiedMain(false), 2000);
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  const handleCopyHistory = async (pass: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(pass);
      setCopiedIdx(idx);
      showToast("Скопировано!");
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      showToast("Не удалось скопировать");
    }
  };

  const updateOpt = <K extends keyof PasswordOptions>(key: K, val: PasswordOptions[K]) => {
    const newOpts = { ...opts, [key]: val };
    setOpts(newOpts);
    const newPass = buildPassword(newOpts);
    setPassword(newPass);
    setHistory((h) => [newPass, ...h].slice(0, HISTORY_LIMIT));
  };

  const strength = getStrength(password);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 select-none">
      {/* Generated Password Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xs mb-5">
        <div className="text-[11px] font-semibold text-[#9e9e9e] uppercase tracking-wider mb-2">
          Сгенерированный пароль
        </div>

        <div className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-[#1a1a1a] select-all break-all mb-4 leading-relaxed">
          {password}
        </div>

        {/* Strength meter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: i <= strength.score ? strength.color : "#e0e0e0",
                }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyMain}
            className="flex-1 py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
            style={{ backgroundColor: strength.color }}
          >
            {copiedMain ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedMain ? "Скопировано" : "Копировать"}</span>
          </button>

          <button
            onClick={handleGenerate}
            className="w-12 h-12 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center hover:bg-[#dcedc8] active:scale-95 transition-all shrink-0"
            title="Сгенерировать другой пароль"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Card */}
      <div className="text-base font-bold text-[#1a1a1a] mb-2.5 px-1">Настройки</div>
      <div className="bg-white rounded-2xl p-4 shadow-xs mb-5">
        <div className="text-sm font-semibold text-[#1a1a1a] mb-2.5">
          Длина: {opts.length} символов
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {LENGTH_PRESETS.map((n) => (
            <button
              key={n}
              onClick={() => updateOpt("length", n)}
              className={`w-11 h-9 rounded-xl text-xs font-semibold transition-all ${
                opts.length === n
                  ? "bg-[#2E7D32] text-white shadow-xs"
                  : "bg-[#f5f5f5] text-[#424242] hover:bg-[#e0e0e0]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="h-px bg-[#f0f0f0] my-2" />

        {[
          { key: "upper" as const, label: "Заглавные буквы", example: "A–Z" },
          { key: "lower" as const, label: "Строчные буквы", example: "a–z" },
          { key: "digits" as const, label: "Цифры", example: "0–9" },
          { key: "special" as const, label: "Спецсимволы", example: "!@#$%" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-sm font-medium text-[#1a1a1a]">{item.label}</div>
              <div className="text-xs text-[#9e9e9e]">{item.example}</div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={opts[item.key]}
                onChange={(e) => updateOpt(item.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e0e0e0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32]"></div>
            </label>
          </div>
        ))}
      </div>

      {/* History Card */}
      {history.length > 0 && (
        <>
          <div className="text-base font-bold text-[#1a1a1a] mb-2.5 px-1">
            История ({history.length})
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-xs divide-y divide-[#f5f5f5]">
            {history.map((pass, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 gap-2">
                <span className="font-mono text-xs text-[#424242] truncate tracking-wider">
                  {pass}
                </span>
                <button
                  onClick={() => handleCopyHistory(pass, idx)}
                  className={`p-1.5 transition-colors ${
                    copiedIdx === idx ? "text-[#2E7D32]" : "text-[#9e9e9e] hover:text-[#424242]"
                  }`}
                  title="Копировать"
                >
                  {copiedIdx === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
