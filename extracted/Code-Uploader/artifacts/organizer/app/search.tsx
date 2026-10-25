import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EasterEgg } from "@/components/EasterEgg";

type Result = {
  id: string;
  section: "passwords" | "notes" | "todos";
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  route: string;
};

const SECTION_META = {
  passwords: { color: "#2E7D32", icon: "lock", label: "Пароли", route: "/passwords" },
  notes:     { color: "#1565C0", icon: "file-text", label: "Заметки", route: "/notes" },
  todos:     { color: "#E65100", icon: "check-square", label: "Задачи", route: "/todos" },
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [easterEgg, setEasterEgg] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = async (q: string) => {
    const lower = q.toLowerCase();

    // Easter egg: search "heybo"
    if (lower === "heybo") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEasterEgg(true);
      setResults([]);
      setSearched(true);
      return;
    }

    const found: Result[] = [];
    try {
      const rawP = await AsyncStorage.getItem("passwords");
      const passwords = rawP ? JSON.parse(rawP) : [];
      for (const p of passwords) {
        if (p.title?.toLowerCase().includes(lower) || p.category?.toLowerCase().includes(lower)) {
          found.push({ id: `p_${p.id}`, section: "passwords", title: p.title, subtitle: p.category ?? "Без категории", ...SECTION_META.passwords, route: SECTION_META.passwords.route });
        }
      }

      const rawN = await AsyncStorage.getItem("notes");
      const notes = rawN ? JSON.parse(rawN) : [];
      for (const n of notes) {
        if (n.title?.toLowerCase().includes(lower) || n.body?.toLowerCase().includes(lower)) {
          found.push({ id: `n_${n.id}`, section: "notes", title: n.title || "Без заголовка", subtitle: n.body ? n.body.slice(0, 60) : "", ...SECTION_META.notes, route: SECTION_META.notes.route });
        }
      }

      const rawT = await AsyncStorage.getItem("todos");
      const todos = rawT ? JSON.parse(rawT) : [];
      for (const t of todos) {
        if (t.text?.toLowerCase().includes(lower)) {
          found.push({ id: `t_${t.id}`, section: "todos", title: t.text, subtitle: t.done ? "Выполнено" : "Активная задача", ...SECTION_META.todos, route: SECTION_META.todos.route });
        }
      }
    } catch {}

    setResults(found);
    setSearched(true);
  };

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    if (!acc[r.section]) acc[r.section] = [];
    acc[r.section].push(r);
    return acc;
  }, {});

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.searchBox}>
        <Feather name="search" size={20} color="#9e9e9e" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Найти в паролях, заметках, задачах..."
          placeholderTextColor="#9e9e9e"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x" size={18} color="#9e9e9e" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 20, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.trim().length < 2 && (
          <View style={styles.hintBox}>
            <Feather name="search" size={40} color="#e0e0e0" />
            <Text style={styles.hintTitle}>Глобальный поиск</Text>
            <Text style={styles.hintSub}>Введите минимум 2 символа</Text>
            <View style={styles.hintChips}>
              {Object.entries(SECTION_META).map(([key, meta]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.hintChip, { backgroundColor: meta.color + "15" }]}
                  onPress={() => router.push(meta.route as any)}
                >
                  <Feather name={meta.icon as any} size={14} color={meta.color} />
                  <Text style={[styles.hintChipText, { color: meta.color }]}>{meta.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {searched && results.length === 0 && query.trim().length >= 2 && query.toLowerCase() !== "heybo" && (
          <View style={styles.hintBox}>
            <Feather name="frown" size={40} color="#e0e0e0" />
            <Text style={styles.hintTitle}>Ничего не найдено</Text>
            <Text style={styles.hintSub}>Попробуйте другой запрос</Text>
          </View>
        )}

        {Object.entries(grouped).map(([section, items]) => {
          const meta = SECTION_META[section as keyof typeof SECTION_META];
          return (
            <View key={section} style={styles.group}>
              <TouchableOpacity style={styles.groupHeader} onPress={() => router.push(meta.route as any)}>
                <View style={[styles.groupIconWrap, { backgroundColor: meta.color + "18" }]}>
                  <Feather name={meta.icon as any} size={16} color={meta.color} />
                </View>
                <Text style={[styles.groupTitle, { color: meta.color }]}>{meta.label}</Text>
                <Text style={styles.groupCount}>{items.length}</Text>
                <Feather name="chevron-right" size={14} color={meta.color} />
              </TouchableOpacity>
              <View style={styles.groupCards}>
                {items.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.resultCard}
                    onPress={() => router.push(r.route as any)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.resultDot, { backgroundColor: r.color }]} />
                    <View style={styles.resultText}>
                      <Text style={styles.resultTitle} numberOfLines={1}>{r.title}</Text>
                      {r.subtitle.length > 0 && (
                        <Text style={styles.resultSub} numberOfLines={1}>{r.subtitle}</Text>
                      )}
                    </View>
                    <Feather name="arrow-right" size={16} color="#bdbdbd" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <EasterEgg
        visible={easterEgg}
        onClose={() => { setEasterEgg(false); setQuery(""); }}
        title="Нашёл меня!"
        message="Ты искал «heybo» — и нашёл. Это я, создатель. Привет! Спасибо что пользуешься этим приложением. Надеюсь оно тебе помогает 💚"
        emoji="🫡"
        color="#2E7D32"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a1a1a" },
  hintBox: { alignItems: "center", paddingTop: 60, gap: 10 },
  hintTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#424242", marginTop: 8 },
  hintSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  hintChips: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" },
  hintChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  hintChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  group: { marginBottom: 16 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  groupTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  groupCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  groupCards: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultText: { flex: 1 },
  resultTitle: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#1a1a1a" },
  resultSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e", marginTop: 2 },
});
