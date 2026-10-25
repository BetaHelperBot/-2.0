import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Lock,
  FileText,
  CheckSquare,
  ChevronRight,
  ArrowRight,
  Frown,
} from "lucide-react";
import { PasswordEntry, Note, Todo } from "../lib/storage.ts";
import { EasterEggModal } from "../components/EasterEggModal.tsx";

type Result = {
  id: string;
  section: "passwords" | "notes" | "todos";
  title: string;
  subtitle: string;
  color: string;
  icon: any;
  route: string;
};

const SECTION_META = {
  passwords: { color: "#2E7D32", icon: Lock, label: "Пароли", route: "passwords" },
  notes:     { color: "#1565C0", icon: FileText, label: "Заметки", route: "notes" },
  todos:     { color: "#E65100", icon: CheckSquare, label: "Задачи", route: "todos" },
};

type Props = {
  passwords: PasswordEntry[];
  notes: Note[];
  todos: Todo[];
  onNavigate: (route: string) => void;
};

export function SearchScreen({ passwords, notes, todos, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    if (trimmed === "heybo") {
      setEasterEgg(true);
      setResults([]);
      setSearched(true);
      return;
    }

    const found: Result[] = [];

    // Search passwords
    for (const p of passwords) {
      if (
        p.title?.toLowerCase().includes(trimmed) ||
        p.category?.toLowerCase().includes(trimmed)
      ) {
        found.push({
          id: `p_${p.id}`,
          section: "passwords",
          title: p.title,
          subtitle: p.category ?? "Без категории",
          color: SECTION_META.passwords.color,
          icon: SECTION_META.passwords.icon,
          route: SECTION_META.passwords.route,
        });
      }
    }

    // Search notes
    for (const n of notes) {
      if (
        n.title?.toLowerCase().includes(trimmed) ||
        n.body?.toLowerCase().includes(trimmed)
      ) {
        found.push({
          id: `n_${n.id}`,
          section: "notes",
          title: n.title || "Без заголовка",
          subtitle: n.body ? n.body.slice(0, 60) : "",
          color: SECTION_META.notes.color,
          icon: SECTION_META.notes.icon,
          route: SECTION_META.notes.route,
        });
      }
    }

    // Search todos
    for (const t of todos) {
      if (t.text?.toLowerCase().includes(trimmed)) {
        found.push({
          id: `t_${t.id}`,
          section: "todos",
          title: t.text,
          subtitle: t.done ? "Выполнено" : "Активная задача",
          color: SECTION_META.todos.color,
          icon: SECTION_META.todos.icon,
          route: SECTION_META.todos.route,
        });
      }
    }

    setResults(found);
    setSearched(true);
  }, [query, passwords, notes, todos]);

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = [];
    acc[r.section].push(r);
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none">
      {/* Search Input Box */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-xs">
          <Search className="w-5 h-5 text-[#9e9e9e] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-sm bg-transparent outline-none text-[#1a1a1a] placeholder-[#9e9e9e]"
            placeholder="Найти в паролях, заметках, задачах..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.length > 0 && (
            <button onClick={() => setQuery("")} className="text-[#9e9e9e] hover:text-[#424242]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-24">
        {query.trim().length < 2 && (
          <div className="flex flex-col items-center justify-center pt-16 text-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-[#9e9e9e]">
              <Search className="w-8 h-8" />
            </div>
            <div className="font-semibold text-base text-[#424242] mt-1">Глобальный поиск</div>
            <div className="text-xs text-[#9e9e9e] mb-4">Введите минимум 2 символа</div>

            <div className="flex flex-wrap gap-2 justify-center">
              {Object.entries(SECTION_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => onNavigate(meta.route)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {searched && results.length === 0 && query.trim().length >= 2 && query.toLowerCase() !== "heybo" && (
          <div className="flex flex-col items-center justify-center pt-20 text-center gap-2">
            <Frown className="w-12 h-12 text-[#bdbdbd]" />
            <div className="font-semibold text-base text-[#424242] mt-2">Ничего не найдено</div>
            <div className="text-xs text-[#9e9e9e]">Попробуйте другой запрос</div>
          </div>
        )}

        {Object.entries(grouped).map(([section, items]) => {
          const meta = SECTION_META[section as keyof typeof SECTION_META];
          const Icon = meta.icon;

          return (
            <div key={section} className="mb-4">
              <button
                onClick={() => onNavigate(meta.route)}
                className="w-full flex items-center gap-2 mb-2 text-left hover:opacity-80 transition-opacity"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold flex-1" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                <span className="text-xs text-[#9e9e9e] mr-1">{items.length}</span>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </button>

              <div className="bg-white rounded-2xl overflow-hidden shadow-xs divide-y divide-[#f5f5f5]">
                {items.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onNavigate(r.route)}
                    className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-gray-50 active:scale-99 transition-all"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1a1a1a] truncate">{r.title}</div>
                      {r.subtitle.length > 0 && (
                        <div className="text-xs text-[#9e9e9e] truncate mt-0.5">{r.subtitle}</div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#bdbdbd] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <EasterEggModal
        visible={easterEgg}
        onClose={() => {
          setEasterEgg(false);
          setQuery("");
        }}
        title="Нашёл меня!"
        message="Ты искал «heybo» — и нашёл. Это я, создатель. Привет! Спасибо что пользуешься этим приложением. Надеюсь оно тебе помогает 💚"
        emoji="🫡"
        color="#2E7D32"
      />
    </div>
  );
}
