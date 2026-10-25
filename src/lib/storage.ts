export type PasswordCategory = "social" | "email" | "game" | "bank" | "other";

export type PasswordEntry = {
  id: string;
  title: string;
  password: string;
  category: PasswordCategory;
  createdAt: number;
};

export type VoiceMemo = {
  id: string;
  duration: number; // in seconds
  transcription: string;
  createdAt: number;
  audioBlobUrl?: string;
  audioData?: string; // Base64 audio for persistent playback
};

export type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  color: string;
  images?: string[];
  voiceMemos?: VoiceMemo[];
  isPinned?: boolean;
};

export type TodoPriority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  priority: TodoPriority;
  createdAt: number;
  dueDate?: string;
};

export type ThemeMode = "light" | "oled" | "system";

export type ExperimentalSettings = {
  paletteDynamic: boolean;
  localImageStorage: boolean;
  repeatHomeAnimations: boolean;
  noteContextWidgets: boolean;
  voiceSplitView: boolean;
  trashRecovery: boolean;
};

export type TrashedItem = {
  id: string;
  type: "note" | "password" | "todo";
  data: any;
  deletedAt: number;
  title: string;
};

export const CURRENT_POLICY_VERSION = "2.1_consent";
export const POLICY_DOC_URL =
  "https://docs.google.com/document/d/1UzfmxlVCO5mGnLvbFCtGYhKLm_4JKCIav7yDdx9A-64/edit?usp=drivesdk";
export const AUTHOR_SITE_URL = "https://clck.ru/3ViDX4";
export const TELEGRAM_DEV_URL = "https://t.me/heybo_dev";
export const APP_AVATAR_PATH = "/assets/aistudio/a87c8621-2cd8-43a7-b45a-cf72e2c59ce9_8f00bb46.png";

export type WipeRecoverySnapshot = {
  timestamp: number;
  passwords: PasswordEntry[];
  notes: Note[];
  todos: Todo[];
};

export const STORAGE_KEYS = {
  PASSWORDS: "passwords",
  NOTES: "notes",
  TODOS: "todos",
  PIN_CODE: "pin_code",
  PIN_ENABLED: "pin_enabled",
  BIOMETRIC_ENABLED: "biometric_enabled",
  POLICY_ACCEPTED_VERSION: "heybo_policy_accepted_version",
  THEME_MODE: "heybo_theme_mode",
  EXPERIMENTAL_SETTINGS: "heybo_experimental_settings",
  RECOVERY_TRASH: "heybo_recovery_trash",
  WIPE_RECOVERY_SNAPSHOT: "heybo_wipe_recovery_snapshot",
  STORIES_SEEN_V2: "heybo_stories_seen_v2",
} as const;

export const DEFAULT_EXPERIMENTAL_SETTINGS: ExperimentalSettings = {
  paletteDynamic: false,
  localImageStorage: false,
  repeatHomeAnimations: false,
  noteContextWidgets: true,
  voiceSplitView: true,
  trashRecovery: true,
};

export function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function initializeDefaultStorage(): void {
  if (typeof window === "undefined") return;

  const cleanStartDone = localStorage.getItem("heybo_empty_init_v2");
  if (!cleanStartDone) {
    const existingPass = getLocalItem<PasswordEntry[]>(STORAGE_KEYS.PASSWORDS, []);
    const existingNotes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    const existingTodos = getLocalItem<Todo[]>(STORAGE_KEYS.TODOS, []);

    const isOnlyMockPass = existingPass.every((p) => ["p1", "p2", "p3", "p4"].includes(p.id));
    const isOnlyMockNotes = existingNotes.every((n) => ["n1", "n2"].includes(n.id));
    const isOnlyMockTodos = existingTodos.every((t) => ["t1", "t2", "t3", "t4"].includes(t.id));

    const sampleNotes: Note[] = [
      {
        id: "note-1",
        title: "Размышления",
        body: "И так я сего я взяла что не чо не получится так а гас попрубем хотя бы ...",
        color: "#4B2B96",
        createdAt: 1728813600000,
      },
      {
        id: "note-2",
        title: "Обновление",
        body: "Принято! Плавность UI — это как раз то, что отличает «топорную самоделку» от классного приложения.",
        color: "#7BB383",
        createdAt: 1728813600000,
      },
      {
        id: "note-3",
        title: "Идея?",
        body: "Голосовые заметки с автоматической расшифровкой речи и воспроизведением.",
        color: "#D87D82",
        createdAt: 1728813600000,
      },
      {
        id: "note-4",
        title: "Что дальше",
        body: "Высокая производительность, мгновенный отклик и шифрование данных.",
        color: "#EEA86B",
        createdAt: 1728813600000,
      },
    ];

    if (isOnlyMockPass) setLocalItem(STORAGE_KEYS.PASSWORDS, []);
    if (isOnlyMockNotes) setLocalItem(STORAGE_KEYS.NOTES, sampleNotes);
    if (isOnlyMockTodos) setLocalItem(STORAGE_KEYS.TODOS, []);

    localStorage.setItem("heybo_empty_init_v2", "true");
  }

  if (localStorage.getItem(STORAGE_KEYS.PASSWORDS) === null) {
    setLocalItem(STORAGE_KEYS.PASSWORDS, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.NOTES) === null) {
    setLocalItem(STORAGE_KEYS.NOTES, [
      {
        id: "note-1",
        title: "Размышления",
        body: "И так я сего я взяла что не чо не получится так а гас попрубем хотя бы ...",
        color: "#4B2B96",
        createdAt: 1728813600000,
      },
      {
        id: "note-2",
        title: "Обновление",
        body: "Принято! Плавность UI — это как раз то, что отличает «топорную самоделку» от классного приложения.",
        color: "#7BB383",
        createdAt: 1728813600000,
      },
      {
        id: "note-3",
        title: "Идея?",
        body: "Голосовые заметки с автоматической расшифровкой речи и воспроизведением.",
        color: "#D87D82",
        createdAt: 1728813600000,
      },
      {
        id: "note-4",
        title: "Что дальше",
        body: "Высокая производительность, мгновенный отклик и шифрование данных.",
        color: "#EEA86B",
        createdAt: 1728813600000,
      },
    ]);
  }
  if (localStorage.getItem(STORAGE_KEYS.TODOS) === null) {
    setLocalItem(STORAGE_KEYS.TODOS, []);
  }
}

/**
 * Standard user backup
 */
export function generateBackupText(
  passwords: PasswordEntry[],
  notes: Note[],
  todos: Todo[],
  options: { includeImages?: boolean } = { includeImages: false }
): string {
  const date = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = `ЛИЧНЫЙ ОРГАНАЙЗЕР HEYBO v2.0 — РЕЗЕРВНАЯ КОПИЯ\n`;
  text += `Дата: ${date}\n`;
  text += `${"─".repeat(45)}\n\n`;

  // Passwords
  text += `ПАРОЛИ (${passwords.length})\n${"─".repeat(30)}\n`;
  for (const p of passwords) {
    text += `• ${p.title}\n  Пароль: ${p.password}\n  Категория: ${p.category}\n\n`;
  }

  // Notes
  text += `ЗАМЕТКИ (${notes.length})\n${"─".repeat(30)}\n`;
  for (const n of notes) {
    if (n.title) text += `• ${n.title}\n`;
    if (n.body) text += `  ${n.body.replace(/\n/g, "\n  ")}\n`;
    if (n.images && n.images.length > 0) {
      if (options.includeImages) {
        text += `  [Вложенные фото (${n.images.length})]:\n`;
        n.images.forEach((img, idx) => {
          text += `  [Фото ${idx + 1} data: ${img.slice(0, 50)}...]\n`;
        });
      } else {
        text += `  [Вложенных изображений: ${n.images.length}]\n`;
      }
    }
    if (n.voiceMemos && n.voiceMemos.length > 0) {
      text += `  [Голосовые заметки (${n.voiceMemos.length})]:\n`;
      n.voiceMemos.forEach((vm, idx) => {
        text += `  - Голосовое ${idx + 1} (${vm.duration}с): «${vm.transcription}»\n`;
      });
    }
    text += "\n";
  }

  // Todos
  text += `ЗАДАЧИ (${todos.length})\n${"─".repeat(30)}\n`;
  for (const t of todos) {
    const status = t.done ? "✓" : "○";
    text += `${status} ${t.text}`;
    if (t.dueDate) text += ` (срок: ${t.dueDate})`;
    text += ` [${t.priority}]`;
    text += "\n";
  }
  text += "\n";

  text += `${"─".repeat(45)}\nЛичный Органайзер v2.0 · Heybo\nВсе данные защищены локально на устройстве\n`;
  return text;
}

/**
 * Custom 4-component text export
 */
export function generateCustomBackupText(
  passwords: PasswordEntry[],
  notes: Note[],
  todos: Todo[],
  options: {
    includePasswords: boolean;
    includeNotes: boolean;
    includeTodos: boolean;
    includeImages: boolean;
  }
): string {
  const dateStr = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = `ЛИЧНЫЙ ОРГАНАЙЗЕР HEYBO v2.0 — ЭКСПОРТ ДАННЫХ\n`;
  text += `Дата экспорта: ${dateStr}\n`;
  text += `Хранилище: 100% Локальное, автономное, без серверов\n`;
  text += `${"─".repeat(45)}\n\n`;

  if (options.includePasswords) {
    text += `### ПАРОЛИ (${passwords.length})\n${"─".repeat(30)}\n`;
    for (const p of passwords) {
      text += `• ${p.title}\n  Пароль: ${p.password}\n  Категория: ${p.category}\n\n`;
    }
  }

  if (options.includeNotes) {
    text += `### ЗАМЕТКИ (${notes.length})\n${"─".repeat(30)}\n`;
    for (const n of notes) {
      if (n.title) text += `• ${n.title}\n`;
      if (n.body) text += `  ${n.body.replace(/\n/g, "\n  ")}\n`;
      if (n.images && n.images.length > 0) {
        if (options.includeImages) {
          text += `  [Вложенные изображения (${n.images.length})]:\n`;
          n.images.forEach((img, idx) => {
            text += `  - Фото #${idx + 1}: ${img.slice(0, 60)}...\n`;
          });
        } else {
          text += `  [Вложенных изображений: ${n.images.length}]\n`;
        }
      }
      if (n.voiceMemos && n.voiceMemos.length > 0) {
        text += `  [Голосовые заметки (${n.voiceMemos.length})]:\n`;
        n.voiceMemos.forEach((vm, idx) => {
          text += `  - Аудио #${idx + 1} (${vm.duration}с): «${vm.transcription}»\n`;
        });
      }
      text += "\n";
    }
  }

  if (options.includeTodos) {
    text += `### ЗАДАЧИ (${todos.length})\n${"─".repeat(30)}\n`;
    for (const t of todos) {
      const status = t.done ? "✓" : "○";
      text += `${status} ${t.text}`;
      if (t.dueDate) text += ` (срок: ${t.dueDate})`;
      text += ` [${t.priority}]`;
      text += "\n";
    }
    text += "\n";
  }

  text += `${"─".repeat(45)}\nHeybo v2.0 · Официальный канал разработчиков: ${TELEGRAM_DEV_URL}\n`;
  return text;
}

/**
 * 30-Minute Wipe Recovery Helpers
 */
const WIPE_RECOVERY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

export function saveWipeRecoverySnapshot(data: {
  passwords: PasswordEntry[];
  notes: Note[];
  todos: Todo[];
}): void {
  if (typeof window === "undefined") return;
  const snapshot: WipeRecoverySnapshot = {
    timestamp: Date.now(),
    passwords: data.passwords,
    notes: data.notes,
    todos: data.todos,
  };
  setLocalItem(STORAGE_KEYS.WIPE_RECOVERY_SNAPSHOT, snapshot);
}

export function getWipeRecoverySnapshot(): (WipeRecoverySnapshot & { remainingMs: number }) | null {
  if (typeof window === "undefined") return null;
  const snapshot = getLocalItem<WipeRecoverySnapshot | null>(
    STORAGE_KEYS.WIPE_RECOVERY_SNAPSHOT,
    null
  );
  if (!snapshot || !snapshot.timestamp) return null;

  const elapsed = Date.now() - snapshot.timestamp;
  if (elapsed > WIPE_RECOVERY_LIMIT_MS) {
    clearWipeRecoverySnapshot();
    return null;
  }

  return {
    ...snapshot,
    remainingMs: WIPE_RECOVERY_LIMIT_MS - elapsed,
  };
}

export function clearWipeRecoverySnapshot(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.WIPE_RECOVERY_SNAPSHOT);
}

/**
 * Smart Non-Destructive Data Merge
 * Merges imported items without wiping existing notes or passwords
 */
export function smartMergeData(
  existing: { passwords: PasswordEntry[]; notes: Note[]; todos: Todo[] },
  incoming: { passwords?: PasswordEntry[]; notes?: Note[]; todos?: Todo[] }
): {
  merged: { passwords: PasswordEntry[]; notes: Note[]; todos: Todo[] };
  added: { passwords: number; notes: number; todos: number };
} {
  const mergedPasswords = [...existing.passwords];
  let addedPasswords = 0;
  if (incoming.passwords && incoming.passwords.length > 0) {
    for (const p of incoming.passwords) {
      const exists = mergedPasswords.some(
        (ep) => ep.id === p.id || (ep.title.toLowerCase() === p.title.toLowerCase() && ep.password === p.password)
      );
      if (!exists) {
        mergedPasswords.push({
          ...p,
          id: p.id || Date.now().toString() + Math.random().toString(36).slice(2, 6),
        });
        addedPasswords++;
      }
    }
  }

  const mergedNotes = [...existing.notes];
  let addedNotes = 0;
  if (incoming.notes && incoming.notes.length > 0) {
    for (const n of incoming.notes) {
      const exists = mergedNotes.some(
        (en) => en.id === n.id || (en.title && en.title === n.title && en.body === n.body)
      );
      if (!exists) {
        mergedNotes.push({
          ...n,
          id: n.id || Date.now().toString() + Math.random().toString(36).slice(2, 6),
        });
        addedNotes++;
      }
    }
  }

  const mergedTodos = [...existing.todos];
  let addedTodos = 0;
  if (incoming.todos && incoming.todos.length > 0) {
    for (const t of incoming.todos) {
      const exists = mergedTodos.some(
        (et) => et.id === t.id || et.text.toLowerCase() === t.text.toLowerCase()
      );
      if (!exists) {
        mergedTodos.push({
          ...t,
          id: t.id || Date.now().toString() + Math.random().toString(36).slice(2, 6),
        });
        addedTodos++;
      }
    }
  }

  return {
    merged: {
      passwords: mergedPasswords,
      notes: mergedNotes,
      todos: mergedTodos,
    },
    added: {
      passwords: addedPasswords,
      notes: addedNotes,
      todos: addedTodos,
    },
  };
}

/**
 * Smart Importer:
 * Can parse JSON dump, Heybo TXT backup, or raw messy message dumps from Telegram/WhatsApp
 */
export function parseImportBackup(content: string): {
  passwords?: PasswordEntry[];
  notes?: Note[];
  todos?: Todo[];
  success: boolean;
  detectedType?: "json" | "heybo_txt" | "chat_messages" | "plain_lines";
} {
  const trimmed = content.trim();

  // Try JSON
  try {
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        passwords: Array.isArray(parsed.passwords) ? parsed.passwords : undefined,
        notes: Array.isArray(parsed.notes) ? parsed.notes : undefined,
        todos: Array.isArray(parsed.todos) ? parsed.todos : undefined,
        success: true,
        detectedType: "json",
      };
    }
  } catch {}

  const passwords: PasswordEntry[] = [];
  const notes: Note[] = [];
  const todos: Todo[] = [];

  const lines = content.split("\n");

  // Check if Heybo formatted backup
  const hasHeyboHeaders = lines.some(
    (l) => l.includes("ПАРОЛИ") || l.includes("ЗАМЕТКИ") || l.includes("ЗАДАЧИ")
  );

  if (hasHeyboHeaders) {
    let section: "none" | "passwords" | "notes" | "todos" = "none";
    let currentNoteTitle = "";
    let currentNoteBody: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("ПАРОЛИ")) {
        section = "passwords";
        continue;
      }
      if (line.startsWith("ЗАМЕТКИ")) {
        section = "notes";
        continue;
      }
      if (line.startsWith("ЗАДАЧИ")) {
        if (currentNoteTitle || currentNoteBody.length) {
          notes.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            title: currentNoteTitle,
            body: currentNoteBody.join("\n").trim(),
            createdAt: Date.now(),
            color: "#E8F5E9",
          });
          currentNoteTitle = "";
          currentNoteBody = [];
        }
        section = "todos";
        continue;
      }

      if (section === "passwords" && line.startsWith("• ")) {
        const title = line.replace("• ", "").trim();
        let pass = "";
        let cat: PasswordCategory = "other";
        if (lines[i + 1]?.includes("Пароль: ")) {
          pass = lines[i + 1].split("Пароль: ")[1].trim();
        }
        if (lines[i + 2]?.includes("Категория: ")) {
          cat = (lines[i + 2].split("Категория: ")[1].trim() as PasswordCategory) || "other";
        }
        if (title && pass) {
          passwords.push({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            title,
            password: pass,
            category: cat,
            createdAt: Date.now(),
          });
        }
      } else if (section === "notes") {
        if (line.startsWith("• ")) {
          if (currentNoteTitle || currentNoteBody.length) {
            notes.push({
              id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
              title: currentNoteTitle,
              body: currentNoteBody.join("\n").trim(),
              createdAt: Date.now(),
              color: "#E8F5E9",
            });
            currentNoteBody = [];
          }
          currentNoteTitle = line.replace("• ", "").trim();
        } else if (line.startsWith("  ")) {
          currentNoteBody.push(line.replace("  ", ""));
        }
      } else if (section === "todos") {
        if (line.startsWith("✓ ") || line.startsWith("○ ")) {
          const done = line.startsWith("✓ ");
          let rest = line.substring(2).trim();
          let dueDate: string | undefined = undefined;
          let priority: TodoPriority = "medium";

          // Match priority tag [high], [medium], [low]
          const prioMatch = rest.match(/\[(high|medium|low)\]/i);
          if (prioMatch) {
            priority = prioMatch[1].toLowerCase() as TodoPriority;
            rest = rest.replace(prioMatch[0], "").trim();
          }

          const dueMatch = rest.match(/\(срок:\s*([^)]+)\)/);
          if (dueMatch) {
            dueDate = dueMatch[1];
            rest = rest.replace(dueMatch[0], "").trim();
          }
          if (rest) {
            todos.push({
              id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
              text: rest,
              done,
              priority,
              createdAt: Date.now(),
              dueDate,
            });
          }
        }
      }
    }

    if (currentNoteTitle || currentNoteBody.length) {
      notes.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        title: currentNoteTitle,
        body: currentNoteBody.join("\n").trim(),
        createdAt: Date.now(),
        color: "#E8F5E9",
      });
    }

    return {
      passwords: passwords.length > 0 ? passwords : undefined,
      notes: notes.length > 0 ? notes : undefined,
      todos: todos.length > 0 ? todos : undefined,
      success: passwords.length > 0 || notes.length > 0 || todos.length > 0,
      detectedType: "heybo_txt",
    };
  }

  // Telegram / WhatsApp / Raw chat parser
  // Matches patterns like [12:34] Author: Message or 12.03.2026, 14:20 - Author: Message
  const chatMessageRegex =
    /(?:\[?\d{1,2}[.:/]\d{1,2}(?:[.:/]\d{2,4})?,?\s+\d{1,2}:\d{2}(?::\d{2})?\]?|-?\s*[^:\n]+:)/;

  const paragraphs = content.split(/\n{2,}/);
  paragraphs.forEach((p, idx) => {
    const text = p.trim();
    if (!text) return;

    // Check if line looks like a task (starts with [] or [ ] or - [ ] or "сделать", "купить")
    const isTodo =
      /^(\[[\sx]?\]|-|\*)\s+/i.test(text) ||
      /^(надо|купить|сделать|позвонить|заказать)\s+/i.test(text);

    if (isTodo) {
      todos.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6) + idx,
        text: text.replace(/^(\[[\sx]?\]|-|\*)\s+/i, ""),
        done: text.startsWith("[x]") || text.startsWith("[X]"),
        priority: "medium",
        createdAt: Date.now(),
      });
    } else {
      const firstLine = text.split("\n")[0].slice(0, 60);
      const rest = text.includes("\n") ? text.slice(text.indexOf("\n") + 1).trim() : "";

      notes.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6) + idx,
        title: firstLine.startsWith("#") ? firstLine.replace(/^#+\s*/, "") : firstLine,
        body: rest || text,
        createdAt: Date.now(),
        color: "#E8F5E9",
      });
    }
  });

  return {
    notes: notes.length > 0 ? notes : undefined,
    todos: todos.length > 0 ? todos : undefined,
    success: notes.length > 0 || todos.length > 0,
    detectedType: "chat_messages",
  };
}
