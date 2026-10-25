import React, { useState, useEffect, useRef } from "react";
import {
  PasswordEntry,
  Note,
  Todo,
  STORAGE_KEYS,
  getLocalItem,
  setLocalItem,
  initializeDefaultStorage,
  ThemeMode,
  CURRENT_POLICY_VERSION,
  TrashedItem,
  saveWipeRecoverySnapshot,
  getWipeRecoverySnapshot,
  clearWipeRecoverySnapshot,
} from "./lib/storage.ts";
import { AndroidFrame } from "./components/AndroidFrame.tsx";
import { AppLockModal } from "./components/AppLockModal.tsx";
import { ConsentSplashScreen } from "./components/ConsentSplashScreen.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { PasswordsScreen } from "./screens/PasswordsScreen.tsx";
import { NotesScreen } from "./screens/NotesScreen.tsx";
import { TodosScreen } from "./screens/TodosScreen.tsx";
import { GalleryScreen } from "./screens/GalleryScreen.tsx";
import { GeneratorScreen } from "./screens/GeneratorScreen.tsx";
import { ExportScreen } from "./screens/ExportScreen.tsx";
import { SearchScreen } from "./screens/SearchScreen.tsx";
import { SettingsScreen } from "./screens/SettingsScreen.tsx";
import { PinScreen } from "./screens/PinScreen.tsx";
import { AboutScreen } from "./screens/AboutScreen.tsx";
import { RotateCcw, Trash2, AlertCircle } from "lucide-react";

export default function App() {
  const [currentRoute, setCurrentRoute] = useState("home");
  const [routeHistory, setRouteHistory] = useState<string[]>(["home"]);
  const [isLocked, setIsLocked] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [permanentDeleteProgress, setPermanentDeleteProgress] = useState(0);

  const deleteHoldTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Apply dark theme class to root document element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      themeMode === "oled" ||
      (themeMode === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

  // Auto-lock and Privacy Protection when app is minimized or backgrounded
  useEffect(() => {
    const handleVisibility = () => {
      const pinEnabled = localStorage.getItem(STORAGE_KEYS.PIN_ENABLED) === "true";
      const bioEnabled = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED) === "true";
      if (document.hidden && (pinEnabled || bioEnabled)) {
        setIsLocked(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    initializeDefaultStorage();

    const storedPasswords = getLocalItem<PasswordEntry[]>(STORAGE_KEYS.PASSWORDS, []);
    const storedNotes = getLocalItem<Note[]>(STORAGE_KEYS.NOTES, []);
    const storedTodos = getLocalItem<Todo[]>(STORAGE_KEYS.TODOS, []);
    const pinEnabled = localStorage.getItem(STORAGE_KEYS.PIN_ENABLED) === "true";
    const bioEnabled = localStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED) === "true";
    const storedTheme = getLocalItem<ThemeMode>(STORAGE_KEYS.THEME_MODE, "light");
    const storedTrash = getLocalItem<TrashedItem[]>(STORAGE_KEYS.RECOVERY_TRASH, []);

    // Filter out trashed items older than 30 minutes (1800000 ms)
    const now = Date.now();
    const validTrash = storedTrash.filter((item) => now - item.deletedAt < 30 * 60 * 1000);
    setLocalItem(STORAGE_KEYS.RECOVERY_TRASH, validTrash);

    const isPolicyConfirmed =
      localStorage.getItem(STORAGE_KEYS.POLICY_ACCEPTED_VERSION) === CURRENT_POLICY_VERSION;

    setPasswords(storedPasswords);
    setNotes(storedNotes);
    setTodos(storedTodos);
    setThemeMode(storedTheme);
    setTrashedItems(validTrash);
    setPolicyAccepted(isPolicyConfirmed);

    if (pinEnabled || bioEnabled) {
      setIsLocked(true);
    }
    setInitialized(true);
  }, []);

  const handleChangeTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setLocalItem(STORAGE_KEYS.THEME_MODE, mode);
  };

  const navigateTo = (route: string) => {
    setCurrentRoute(route);
    setRouteHistory((prev) => [...prev, route]);
  };

  const handleBack = () => {
    if (routeHistory.length > 1) {
      const nextHistory = routeHistory.slice(0, -1);
      setRouteHistory(nextHistory);
      setCurrentRoute(nextHistory[nextHistory.length - 1]);
    } else {
      setCurrentRoute("home");
    }
  };

  const handleClearAllData = () => {
    // 30-Minute Wipe Recovery Snapshot saved before wiping
    saveWipeRecoverySnapshot({ passwords, notes, todos });
    setPasswords([]);
    setNotes([]);
    setTodos([]);
    setTrashedItems([]);
    localStorage.removeItem(STORAGE_KEYS.PASSWORDS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.TODOS);
    localStorage.removeItem(STORAGE_KEYS.RECOVERY_TRASH);
  };

  const handleRestoreWipeSnapshot = () => {
    const snap = getWipeRecoverySnapshot();
    if (!snap) return;
    setPasswords(snap.passwords);
    setNotes(snap.notes);
    setTodos(snap.todos);
    setLocalItem(STORAGE_KEYS.PASSWORDS, snap.passwords);
    setLocalItem(STORAGE_KEYS.NOTES, snap.notes);
    setLocalItem(STORAGE_KEYS.TODOS, snap.todos);
    clearWipeRecoverySnapshot();
  };

  const handleDataImported = (data: {
    passwords?: PasswordEntry[];
    notes?: Note[];
    todos?: Todo[];
  }) => {
    if (data.passwords) setPasswords(data.passwords);
    if (data.notes) setNotes(data.notes);
    if (data.todos) setTodos(data.todos);
  };

  // Total attached photos count
  const totalPhotosCount = notes.reduce(
    (acc, note) => acc + (note.images?.length || 0),
    0
  );

  if (!initialized) return null;

  return (
    <>
      {/* Policy Consent Screen on first launch if unaccepted */}
      {!policyAccepted && (
        <ConsentSplashScreen onAccept={() => setPolicyAccepted(true)} />
      )}

      {/* App Lock if PIN or Biometrics enabled */}
      {isLocked && <AppLockModal onUnlock={() => setIsLocked(false)} />}

      <AndroidFrame
        currentRoute={currentRoute}
        onBack={handleBack}
        themeMode={themeMode}
      >
        {currentRoute === "home" && (
          <HomeScreen
            onNavigate={navigateTo}
            counts={{
              passwords: passwords.length,
              notes: notes.length,
              todos: todos.length,
            }}
            totalPhotos={totalPhotosCount}
            onRestoreWipeSnapshot={handleRestoreWipeSnapshot}
          />
        )}

        {currentRoute === "passwords" && (
          <PasswordsScreen
            entries={passwords}
            onChange={setPasswords}
            themeMode={themeMode}
          />
        )}

        {currentRoute === "notes" && (
          <NotesScreen
            notes={notes}
            onChange={setNotes}
            themeMode={themeMode}
          />
        )}

        {currentRoute === "todos" && (
          <TodosScreen todos={todos} onChange={setTodos} />
        )}

        {currentRoute === "gallery" && (
          <GalleryScreen
            notes={notes}
            onChangeNotes={setNotes}
            onNavigateToNote={(id) => {
              navigateTo("notes");
            }}
          />
        )}

        {currentRoute === "generator" && <GeneratorScreen />}

        {currentRoute === "export" && (
          <ExportScreen
            passwords={passwords}
            notes={notes}
            todos={todos}
            onDataImported={handleDataImported}
            themeMode={themeMode}
          />
        )}

        {currentRoute === "search" && (
          <SearchScreen
            passwords={passwords}
            notes={notes}
            todos={todos}
            onNavigate={navigateTo}
          />
        )}

        {currentRoute === "settings" && (
          <SettingsScreen
            onNavigate={navigateTo}
            onClearAll={handleClearAllData}
            themeMode={themeMode}
            onChangeTheme={handleChangeTheme}
          />
        )}

        {currentRoute === "pin" && <PinScreen onBack={handleBack} />}

        {currentRoute === "about" && <AboutScreen />}
      </AndroidFrame>
    </>
  );
}
