import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  Mic,
  MicOff,
  Play,
  Pause,
  Copy,
  CheckCircle2,
  Trophy,
  Minus,
  Sparkles,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import {
  Note,
  VoiceMemo,
  STORAGE_KEYS,
  setLocalItem,
  ThemeMode,
} from "../lib/storage.ts";
import { parseGoalFromText, updateGoalInText } from "../lib/goalsEngine.ts";
import { detectDominantTheme } from "../lib/themeMatrix.ts";
import { Toast } from "../components/Toast.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { QuickUnlockModal } from "../components/QuickUnlockModal.tsx";

// 5 Dual-Mode Color Schemes: Soft Pastels for Light Mode + Rich Cyber Hues for Dark Mode
export const NOTE_PALETTES = [
  {
    id: "green",
    name: "Изумруд",
    dotLight: "#7BB383",
    dotDark: "#4ade80",
    light: {
      bg: "bg-[#CBD7CB]",
      border: "border-emerald-700/10",
      title: "text-[#27532B]",
      body: "text-[#3D4C3E]",
      date: "text-[#586C59]",
      badge: "bg-[#27532B]/10 text-[#27532B]",
    },
    dark: {
      bg: "bg-[#132517]",
      border: "border-emerald-500/30",
      title: "text-[#4ade80]",
      body: "text-[#bbf7d0]",
      date: "text-[#86efac]",
      badge: "bg-emerald-500/20 text-[#4ade80]",
    },
  },
  {
    id: "blue",
    name: "Сапфир",
    dotLight: "#6B9EE2",
    dotDark: "#60a5fa",
    light: {
      bg: "bg-[#D5E1ED]",
      border: "border-sky-700/10",
      title: "text-[#214979]",
      body: "text-[#3B4C5D]",
      date: "text-[#586A7C]",
      badge: "bg-[#214979]/10 text-[#214979]",
    },
    dark: {
      bg: "bg-[#111e33]",
      border: "border-sky-500/30",
      title: "text-[#60a5fa]",
      body: "text-[#bfdbfe]",
      date: "text-[#93c5fd]",
      badge: "bg-sky-500/20 text-[#60a5fa]",
    },
  },
  {
    id: "peach",
    name: "Янтарь",
    dotLight: "#EEA86B",
    dotDark: "#fbbf24",
    light: {
      bg: "bg-[#EEDCC8]",
      border: "border-amber-700/10",
      title: "text-[#7A4219]",
      body: "text-[#554338]",
      date: "text-[#806C62]",
      badge: "bg-[#7A4219]/10 text-[#7A4219]",
    },
    dark: {
      bg: "bg-[#2b1c10]",
      border: "border-amber-500/30",
      title: "text-[#fbbf24]",
      body: "text-[#fde68a]",
      date: "text-[#fcd34d]",
      badge: "bg-amber-500/20 text-[#fbbf24]",
    },
  },
  {
    id: "salmon",
    name: "Рубин",
    dotLight: "#D87D82",
    dotDark: "#fb7185",
    light: {
      bg: "bg-[#E6D4D4]",
      border: "border-rose-700/10",
      title: "text-[#7C2929]",
      body: "text-[#533F3F]",
      date: "text-[#7C6C6C]",
      badge: "bg-[#7C2929]/10 text-[#7C2929]",
    },
    dark: {
      bg: "bg-[#2d1219]",
      border: "border-rose-500/30",
      title: "text-[#fb7185]",
      body: "text-[#fecdd3]",
      date: "text-[#fda4af]",
      badge: "bg-rose-500/20 text-[#fb7185]",
    },
  },
  {
    id: "purple",
    name: "Аметист",
    dotLight: "#4B2B96",
    dotDark: "#c084fc",
    light: {
      bg: "bg-[#D8D5DF]",
      border: "border-purple-700/10",
      title: "text-[#3B2874]",
      body: "text-[#484550]",
      date: "text-[#7A7584]",
      badge: "bg-[#3B2874]/10 text-[#3B2874]",
    },
    dark: {
      bg: "bg-[#221333]",
      border: "border-purple-500/30",
      title: "text-[#c084fc]",
      body: "text-[#e9d5ff]",
      date: "text-[#d8b4fe]",
      badge: "bg-purple-500/20 text-[#c084fc]",
    },
  },
];

type Props = {
  notes: Note[];
  onChange: (updated: Note[]) => void;
  themeMode?: ThemeMode;
};

export function NotesScreen({ notes, onChange, themeMode }: Props) {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Private notes privacy shield
  const [revealedPrivateNotes, setRevealedPrivateNotes] = useState<Record<string, boolean>>({});
  const [unlockTargetNoteId, setUnlockTargetNoteId] = useState<string | null>(null);
  const [pendingActionAfterUnlock, setPendingActionAfterUnlock] = useState<(() => void) | null>(null);

  // Voice recording & Live SpeechRecognition
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");

  // Audio Playback
  const [playingMemoId, setPlayingMemoId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => setToastMsg(msg);

  // Check if dark mode is active
  const isDark =
    themeMode === "oled" ||
    (themeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  // Format date like in screenshot: "13 окт."
  const formatDateSnippet = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }).replace(".", "");
    } catch {
      return "13 окт";
    }
  };

  // Map note.color to palette index
  const getPaletteIndex = (note: Note): number => {
    const colorLower = (note.color || "").toLowerCase();
    const found = NOTE_PALETTES.findIndex(
      (p) =>
        p.id.toLowerCase() === colorLower ||
        p.dotLight.toLowerCase() === colorLower ||
        p.dotDark.toLowerCase() === colorLower
    );
    if (found !== -1) return found;
    const charCode = (note.id || "0").charCodeAt(0);
    return charCode % NOTE_PALETTES.length;
  };

  // Check if a note is considered private
  const isNotePrivate = (note: Note): boolean => {
    const dominantTheme = detectDominantTheme(`${note.title} ${note.body}`);
    return (
      dominantTheme === "private" ||
      note.title.toLowerCase().includes("18+") ||
      note.title.toLowerCase().includes("приватн") ||
      note.title.toLowerCase().includes("секрет") ||
      note.body.toLowerCase().includes("18+") ||
      note.body.toLowerCase().includes("приватн") ||
      note.body.toLowerCase().includes("секрет")
    );
  };

  // Handle request to reveal or edit a private note
  const handleRequestRevealOrEdit = (note: Note, onUnlocked?: () => void) => {
    const isPrivate = isNotePrivate(note);
    const isRevealed = revealedPrivateNotes[note.id];

    // If already revealed or not private, proceed directly
    if (!isPrivate || isRevealed) {
      if (onUnlocked) onUnlocked();
      else setRevealedPrivateNotes((prev) => ({ ...prev, [note.id]: true }));
      return;
    }

    // Check if security (PIN or Biometrics) is enabled
    const pinEnabled = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.PIN_ENABLED) === "true" : false;
    const bioEnabled = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED) === "true" : false;

    if (pinEnabled || bioEnabled) {
      // Require verification via QuickUnlockModal
      setUnlockTargetNoteId(note.id);
      setPendingActionAfterUnlock(() => () => {
        setRevealedPrivateNotes((prev) => ({ ...prev, [note.id]: true }));
        if (onUnlocked) onUnlocked();
        showToast("Доступ открыт ✓");
      });
    } else {
      // Direct reveal if no lock enabled
      setRevealedPrivateNotes((prev) => ({ ...prev, [note.id]: true }));
      if (onUnlocked) onUnlocked();
      showToast("Заметка открыта");
    }
  };

  const handleQuickUnlockSuccess = () => {
    if (unlockTargetNoteId) {
      setRevealedPrivateNotes((prev) => ({ ...prev, [unlockTargetNoteId]: true }));
    }
    if (pendingActionAfterUnlock) {
      pendingActionAfterUnlock();
    }
    setUnlockTargetNoteId(null);
    setPendingActionAfterUnlock(null);
  };

  const openNew = () => {
    setSelectedNote(null);
    setTitle("");
    setBody("");
    setImages([]);
    setVoiceMemos([]);
    setPaletteIdx(0);
    setLiveTranscript("");
    setModalVisible(true);
  };

  const openEdit = (note: Note) => {
    if (isNotePrivate(note) && !revealedPrivateNotes[note.id]) {
      handleRequestRevealOrEdit(note, () => {
        setSelectedNote(note);
        setTitle(note.title);
        setBody(note.body);
        setImages(note.images || []);
        setVoiceMemos(note.voiceMemos || []);
        setPaletteIdx(getPaletteIndex(note));
        setLiveTranscript("");
        setModalVisible(true);
      });
      return;
    }

    setSelectedNote(note);
    setTitle(note.title);
    setBody(note.body);
    setImages(note.images || []);
    setVoiceMemos(note.voiceMemos || []);
    setPaletteIdx(getPaletteIndex(note));
    setLiveTranscript("");
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!title.trim() && !body.trim() && images.length === 0 && voiceMemos.length === 0) {
      showToast("Заметка не может быть пустой");
      return;
    }

    const noteToSave: Note = {
      id: selectedNote ? selectedNote.id : Date.now().toString(),
      title: title.trim(),
      body: body.trim(),
      color: NOTE_PALETTES[paletteIdx].id,
      createdAt: selectedNote ? selectedNote.createdAt : Date.now(),
      images: images.length > 0 ? images : undefined,
      voiceMemos: voiceMemos.length > 0 ? voiceMemos : undefined,
    };

    let updated: Note[];
    if (selectedNote) {
      updated = notes.map((n) => (n.id === selectedNote.id ? noteToSave : n));
      showToast("Заметка обновлена");
    } else {
      updated = [noteToSave, ...notes];
      showToast("Заметка сохранена");
    }

    onChange(updated);
    setLocalItem(STORAGE_KEYS.NOTES, updated);
    setModalVisible(false);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;
    const updated = notes.filter((n) => n.id !== noteToDelete.id);
    onChange(updated);
    setLocalItem(STORAGE_KEYS.NOTES, updated);
    setNoteToDelete(null);
    if (modalVisible && selectedNote?.id === noteToDelete.id) {
      setModalVisible(false);
    }
    showToast("Заметка удалена");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setImages((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Real voice recording with Web Speech live transcription
  const startRecording = async () => {
    try {
      setLiveTranscript("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "ru-RU";

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current) setLiveTranscript(current);
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setRecordDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecordDuration((s) => s + 1);
      }, 1000);
    } catch {
      showToast("Микрофон недоступен. Проверьте разрешения браузера.");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {}
    }

    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const blobUrl = URL.createObjectURL(audioBlob);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const dur = Math.max(1, recordDuration);
        const transcriptText =
          liveTranscript.trim() ||
          `Голосовая запись (${new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })})`;

        const memo: VoiceMemo = {
          id: Date.now().toString(),
          duration: dur,
          transcription: transcriptText,
          createdAt: Date.now(),
          audioBlobUrl: blobUrl,
          audioData: base64Audio,
        };

        setVoiceMemos((prev) => [...prev, memo]);

        setBody((prev) => {
          const trimmed = prev.trim();
          if (!trimmed) return transcriptText;
          return `${trimmed}\n\n${transcriptText}`;
        });

        setLiveTranscript("");
        showToast(`Голосовое сообщение расшифровано (${dur}с)`);
      };
      reader.readAsDataURL(audioBlob);
    }, 150);
  };

  const playAudioMemo = (memo: VoiceMemo) => {
    if (playingMemoId === memo.id) {
      currentAudioRef.current?.pause();
      setPlayingMemoId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    const audioSrc = memo.audioData || memo.audioBlobUrl;
    if (!audioSrc) {
      showToast("Аудиофайл недоступен для воспроизведения");
      return;
    }

    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;
    setPlayingMemoId(memo.id);

    audio.onended = () => {
      setPlayingMemoId(null);
    };
    audio.onerror = () => {
      setPlayingMemoId(null);
      showToast("Ошибка воспроизведения аудио");
    };

    audio.play().catch(() => {
      setPlayingMemoId(null);
    });
  };

  const copyText = (txt: string) => {
    navigator.clipboard?.writeText(txt);
    showToast("Текст скопирован");
  };

  // Interactive Goals stepper on note card
  const handleUpdateGoal = (noteId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const { updatedText, goal } = updateGoalInText(note.body, delta);
    if (!goal) return;

    const updatedNotes = notes.map((n) => (n.id === noteId ? { ...n, body: updatedText } : n));
    onChange(updatedNotes);
    setLocalItem(STORAGE_KEYS.NOTES, updatedNotes);

    if (goal.isComplete) {
      showToast(`🏆 Цель выполнена! (${goal.current}/${goal.max} ${goal.unit})`);
    }
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase()) ||
      (n.voiceMemos &&
        n.voiceMemos.some((v) => v.transcription.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden relative select-none transition-colors duration-250 ${
        isDark ? "bg-[#090b0a] text-white" : "bg-[#ECEEEC] text-[#1D1B20]"
      }`}
    >
      {/* Search Bar */}
      <div className="px-3.5 pt-3 pb-2 shrink-0">
        <div className="relative w-full flex items-center">
          <Search
            className={`w-5 h-5 absolute left-4 ${
              isDark ? "text-slate-400" : "text-[#6b726d]"
            }`}
          />
          <input
            type="text"
            placeholder="Поиск по заметкам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-12 pr-10 py-3 rounded-2xl text-sm font-normal outline-none transition-colors border-0 ${
              isDark
                ? "bg-[#161a17] text-white placeholder-slate-400 focus:ring-1 focus:ring-emerald-500/50"
                : "bg-[#DEE3DE] text-[#1e231f] placeholder-[#687069]"
            }`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute right-3.5 p-1 ${
                isDark ? "text-slate-400 hover:text-white" : "text-[#6b726d] hover:text-black"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2-COLUMN PASTEL & CYBER GRID */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-1 pb-24">
        {filtered.length === 0 ? (
          <div
            className={`rounded-3xl p-8 text-center mt-6 ${
              isDark ? "bg-[#131614] border border-white/5" : "bg-[#DFE4DF]"
            }`}
          >
            <h3 className="font-bold text-base mb-1">
              {search ? "Ничего не найдено" : "Заметок пока нет"}
            </h3>
            <p
              className={`text-xs max-w-xs mx-auto leading-relaxed ${
                isDark ? "text-slate-400" : "text-[#59625a]"
              }`}
            >
              {search
                ? "Попробуйте изменить поисковый запрос"
                : "Нажмите «+» внизу экрана, чтобы создать заметку с защитой, целями и голосом."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((note) => {
              const pal = NOTE_PALETTES[getPaletteIndex(note)];
              const palStyle = isDark ? pal.dark : pal.light;
              const goal = parseGoalFromText(note.body);
              const isPrivate = isNotePrivate(note);
              const isRevealed = revealedPrivateNotes[note.id];

              return (
                <div
                  key={note.id}
                  onClick={() => openEdit(note)}
                  className={`rounded-3xl p-4 flex flex-col justify-between min-h-[165px] transition-all duration-200 active:scale-[0.98] cursor-pointer relative overflow-hidden shadow-xs border ${palStyle.bg} ${palStyle.border}`}
                >
                  {/* Top Content Area */}
                  <div>
                    {/* Header: Title and Privacy / Delete */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <h4
                        className={`font-bold text-base leading-snug line-clamp-2 ${palStyle.title}`}
                      >
                        {note.title || "Без названия"}
                      </h4>
                      <div className="flex items-center gap-0.5">
                        {isPrivate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isRevealed) {
                                setRevealedPrivateNotes((prev) => ({ ...prev, [note.id]: false }));
                                showToast("Заметка скрыта");
                              } else {
                                handleRequestRevealOrEdit(note);
                              }
                            }}
                            className={`p-1 rounded-full cursor-pointer transition-colors ${
                              isRevealed
                                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            }`}
                            title={isRevealed ? "Скрыть" : "Открыть"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToDelete(note);
                          }}
                          className="p-1 text-black/25 dark:text-white/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-full cursor-pointer transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* FULL PRIVACY SHIELD: When private and locked, HIDE EVERYTHING (body, goals, photos, audio) */}
                    {isPrivate && !isRevealed ? (
                      <div
                        className="py-6 my-1 flex flex-col items-center justify-center text-center gap-2 rounded-2xl bg-black/5 dark:bg-black/40 backdrop-blur-sm border border-black/5 dark:border-white/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestRevealOrEdit(note);
                        }}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold opacity-80">
                          Приватные данные скрыты
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestRevealOrEdit(note);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/15 hover:bg-black/20 dark:hover:bg-white/25 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Раскрыть</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Note Body Text with Line Clamp */}
                        {note.body && (
                          <p
                            className={`text-xs leading-relaxed line-clamp-4 font-normal ${palStyle.body}`}
                          >
                            {note.body}
                          </p>
                        )}

                        {/* Interactive Goal Progress Card */}
                        {goal && (
                          <div
                            className="mt-2 p-2 rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/10 space-y-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="flex items-center gap-1 truncate">
                                {goal.isComplete ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                )}
                                <span className="truncate">
                                  {goal.current}/{goal.max} {goal.unit}
                                </span>
                              </span>
                              <span className="text-[10px] font-mono opacity-80">
                                {goal.percent}%
                              </span>
                            </div>

                            {/* Mini progress bar */}
                            <div className="h-1.5 w-full bg-black/10 dark:bg-white/15 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                                style={{ width: `${goal.percent}%` }}
                              />
                            </div>

                            {/* Stepper buttons */}
                            <div className="flex items-center justify-end gap-1 pt-0.5">
                              <button
                                onClick={(e) => handleUpdateGoal(note.id, -1, e)}
                                className="w-5 h-5 rounded-md bg-black/10 dark:bg-white/15 hover:bg-black/20 dark:hover:bg-white/25 flex items-center justify-center font-bold text-xs"
                                title="Уменьшить на 1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleUpdateGoal(note.id, 1, e)}
                                className="w-5 h-5 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 flex items-center justify-center font-bold text-xs shadow-2xs"
                                title="Увеличить на 1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Attached Audio Memo Pill */}
                        {note.voiceMemos && note.voiceMemos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {note.voiceMemos.map((memo) => {
                              const isThisPlaying = playingMemoId === memo.id;
                              return (
                                <button
                                  key={memo.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playAudioMemo(memo);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                                    isThisPlaying
                                      ? "bg-[#4527a0] text-white animate-pulse"
                                      : "bg-black/10 dark:bg-white/15 hover:bg-black/15"
                                  }`}
                                >
                                  {isThisPlaying ? (
                                    <Pause className="w-2.5 h-2.5 fill-current" />
                                  ) : (
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                  )}
                                  <span>🎙️ {memo.duration}с</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Attached Photo Previews */}
                        {note.images && note.images.length > 0 && (
                          <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
                            {note.images.slice(0, 3).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt="preview"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(img);
                                }}
                                className="w-8 h-8 rounded-lg object-cover border border-black/10 dark:border-white/10"
                              />
                            ))}
                            {note.images.length > 3 && (
                              <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                +{note.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bottom Row: Date Snippet */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-normal ${palStyle.date}`}>
                      {formatDateSnippet(note.createdAt)}
                    </span>

                    {isPrivate && isRevealed && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Открыто
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB - Add Button */}
      <button
        onClick={openNew}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#23582e] hover:bg-[#1b4624] text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all z-20 cursor-pointer"
        title="Новая заметка"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Hidden File Input for Photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Full-screen Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Quick Unlock Modal for Private Notes */}
      <QuickUnlockModal
        visible={!!unlockTargetNoteId}
        title="Приватная заметка"
        onSuccess={handleQuickUnlockSuccess}
        onCancel={() => {
          setUnlockTargetNoteId(null);
          setPendingActionAfterUnlock(null);
        }}
      />

      {/* BOTTOM SHEET MODAL - DUAL LIGHT/DARK ELEGANCE */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200 overflow-hidden border-t ${
              isDark
                ? "bg-[#16131c] text-white border-white/10"
                : "bg-[#F5F0F9] text-[#1D1B20] border-black/5"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: [✕]   Новая заметка   [Сохранить] */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
              <button
                onClick={() => setModalVisible(false)}
                className={`p-1 -ml-1 rounded-full cursor-pointer transition-colors ${
                  isDark ? "text-slate-300 hover:text-white" : "text-[#49454F] hover:text-black"
                }`}
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="font-bold text-lg">
                {selectedNote ? "Редактировать заметку" : "Новая заметка"}
              </h3>

              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-2xl bg-[#4527a0] hover:bg-[#381e85] text-white text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Сохранить
              </button>
            </div>

            {/* Sub-bar: 5 Palette Dots + [🖼️ Фото] + [🎙️ Голос] */}
            <div className="px-5 py-2 flex items-center justify-between shrink-0">
              {/* 5 Dual-Mode Color Dots */}
              <div className="flex items-center gap-2.5">
                {NOTE_PALETTES.map((pal, idx) => {
                  const dotColor = isDark ? pal.dotDark : pal.dotLight;
                  const isSelected = paletteIdx === idx;
                  return (
                    <button
                      key={pal.id}
                      onClick={() => setPaletteIdx(idx)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        isSelected
                          ? "scale-115 ring-2 ring-[#4527a0] ring-offset-2 shadow-xs"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: dotColor }}
                      title={`${pal.name} (${isDark ? "тёмный" : "светлый"})`}
                    />
                  );
                })}
              </div>

              {/* Action Buttons: [🖼️ Фото] & [🎙️ Голос] */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isDark
                      ? "border-white/20 bg-white/10 hover:bg-white/15 text-slate-200"
                      : "border-[#CAC4D0] bg-white/70 hover:bg-white text-[#49454F]"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Фото {images.length > 0 ? `(${images.length})` : ""}</span>
                </button>

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse"
                      : isDark
                      ? "border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300"
                      : "border border-[#CAC4D0] bg-white/70 hover:bg-white text-[#4527a0]"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 text-white" />
                      <span>{recordDuration}с Стоп</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Голос</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Speech-to-Text Live Transcript Banner */}
            {isRecording && (
              <div className="mx-5 my-2 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1 animate-pulse">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>Распознавание речи активно...</span>
                  </div>
                  <span className="font-mono text-[11px]">{recordDuration} сек</span>
                </div>
                <p className="text-[11px] italic opacity-90">
                  {liveTranscript || "Говорите в микрофон, слова сразу расшифровываются в текст..."}
                </p>
              </div>
            )}

            {/* Scrollable Content: Title + Body */}
            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-6 space-y-3">
              <input
                type="text"
                placeholder="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-2xl font-bold bg-transparent border-0 outline-none p-0 ${
                  isDark ? "placeholder-slate-500 text-white" : "placeholder-[#8F8A94] text-[#1D1B20]"
                }`}
              />

              <textarea
                placeholder="Начните писать..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                className={`w-full text-base font-normal bg-transparent border-0 outline-none p-0 resize-none leading-relaxed ${
                  isDark ? "placeholder-slate-500 text-slate-100" : "placeholder-[#8F8A94] text-[#1D1B20]"
                }`}
              />

              {/* Quick contextual templates */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => `${prev ? prev + "\n" : ""}Цель: 500/1000 кубков`)
                  }
                  className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                >
                  + Цель: 500/1000
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => `${prev ? prev + "\n" : ""}Майн: Построить базу`)
                  }
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                >
                  + Майнкрафт
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => `${prev ? prev + "\n" : ""}Бравл: Апнуть кубки на Леоне`)
                  }
                  className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-500/25 cursor-pointer"
                >
                  + Бравл Старс
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => `${prev ? prev + "\n" : ""}18+ Приватно: Секретный код`)
                  }
                  className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-[11px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                >
                  + 18+ Приватно
                </button>
              </div>

              {/* Attached Photos Strip */}
              {images.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold opacity-80 mb-1.5">
                    Прикрепленные фото ({images.length}):
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img
                          src={img}
                          alt="preview"
                          onClick={() => setPreviewImage(img)}
                          className="w-16 h-16 rounded-xl object-cover border border-black/10 dark:border-white/10 cursor-pointer"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Voice Messages Strip */}
              {voiceMemos.length > 0 && (
                <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4527a0] dark:text-purple-300 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Голосовые записи ({voiceMemos.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {voiceMemos.map((memo) => {
                      const isPlaying = playingMemoId === memo.id;
                      return (
                        <div
                          key={memo.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 shadow-2xs ${
                            isDark
                              ? "bg-white/5 border-white/10"
                              : "bg-white border-[#CAC4D0]"
                          }`}
                        >
                          <button
                            onClick={() => playAudioMemo(memo)}
                            className="w-8 h-8 rounded-full bg-[#4527a0] text-white flex items-center justify-center shrink-0 active:scale-95"
                            title={isPlaying ? "Пауза" : "Воспроизвести"}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">
                              «{memo.transcription}»
                            </p>
                            <span className="text-[10px] opacity-70">
                              {memo.duration} сек · {new Date(memo.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => copyText(memo.transcription)}
                              className="p-1.5 text-slate-400 hover:text-black dark:hover:text-white"
                              title="Копировать расшифровку"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setVoiceMemos((prev) => prev.filter((v) => v.id !== memo.id))
                              }
                              className="p-1.5 text-rose-500 hover:text-rose-700"
                              title="Удалить аудио"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}

      <ConfirmDialog
        visible={!!noteToDelete}
        title="Удалить заметку?"
        message={
          noteToDelete?.title
            ? `Удалить «${noteToDelete.title}»? Заметка будет удалена.`
            : "Заметка будет удалена."
        }
        confirmText="УДАЛИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setNoteToDelete(null)}
        onConfirm={confirmDeleteNote}
      />
    </div>
  );
}
