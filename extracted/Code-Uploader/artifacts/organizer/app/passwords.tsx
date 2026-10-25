import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_KEY = "passwords";

type Category = "social" | "email" | "game" | "bank" | "other";

type PasswordEntry = {
  id: string;
  title: string;
  password: string;
  category: Category;
  createdAt: number;
};

const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: "social", label: "Соцсеть", icon: "users", color: "#1565C0" },
  { id: "email", label: "Почта", icon: "mail", color: "#E65100" },
  { id: "game", label: "Игра", icon: "zap", color: "#6A1B9A" },
  { id: "bank", label: "Банк", icon: "credit-card", color: "#2E7D32" },
  { id: "other", label: "Другое", icon: "key", color: "#37474F" },
];

function getCat(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[4];
}

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;
  let pass = "";
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  pass += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 14; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

export default function PasswordsScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [showPassword, setShowPassword] = useState(false);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  };

  const save = async (updated: PasswordEntry[]) => {
    setEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const addEntry = async () => {
    if (!title.trim() || !password.trim()) return;
    const newEntry: PasswordEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: title.trim(),
      password: password.trim(),
      category,
      createdAt: Date.now(),
    };
    const updated = [newEntry, ...entries];
    await save(updated);
    setTitle("");
    setPassword("");
    setCategory("other");
    setShowPassword(false);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast("Пароль сохранён");
  };

  const deleteEntry = (id: string) => {
    Alert.alert("Удалить пароль?", "Это действие нельзя отменить", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          const updated = entries.filter((e) => e.id !== id);
          await save(updated);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          showToast("Удалено");
        },
      },
    ]);
  };

  const copyPassword = async (entry: PasswordEntry) => {
    await Clipboard.setStringAsync(entry.password);
    setCopiedId(entry.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`Скопировано: ${entry.title}`);
    setTimeout(() => setCopiedId(null), 2000);
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

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Feather name="search" size={18} color="#9e9e9e" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию или категории..."
          placeholderTextColor="#9e9e9e"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={18} color="#9e9e9e" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="lock" size={48} color="#c8e6c9" />
            <Text style={styles.emptyTitle}>
              {entries.length === 0 ? "Нет сохранённых паролей" : "Ничего не найдено"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {entries.length === 0
                ? "Нажмите + чтобы добавить первый"
                : "Попробуйте другой запрос"}
            </Text>
          </View>
        )}

        {filtered.map((entry) => {
          const cat = getCat(entry.category);
          const isVisible = visibleIds.has(entry.id);
          const isCopied = copiedId === entry.id;
          return (
            <View key={entry.id} style={styles.card}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + "18" }]}>
                <Feather name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + "15" }]}>
                    <Text style={[styles.catLabel, { color: cat.color }]}>{cat.label}</Text>
                  </View>
                </View>
                <View style={styles.passRow}>
                  <Text style={styles.passText} numberOfLines={1}>
                    {isVisible ? entry.password : "••••••••••"}
                  </Text>
                  <TouchableOpacity onPress={() => toggleVisible(entry.id)} style={styles.iconBtn}>
                    <Feather name={isVisible ? "eye-off" : "eye"} size={18} color="#9e9e9e" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => copyPassword(entry)} style={styles.iconBtn}>
                    <Feather
                      name={isCopied ? "check" : "copy"}
                      size={18}
                      color={isCopied ? "#2E7D32" : "#9e9e9e"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)} style={styles.iconBtn}>
                    <Feather name="trash-2" size={18} color="#ef9a9a" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPad + 20 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          { bottom: bottomPad + 80, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
        ]}
        pointerEvents="none"
      >
        <Feather name="check-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Сохранить пароль</Text>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    category === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Feather
                    name={cat.icon as any}
                    size={14}
                    color={category === cat.id ? "#fff" : cat.color}
                  />
                  <Text style={[styles.catChipText, category === cat.id && { color: "#fff" }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name field */}
            <View style={styles.inputWrapper}>
              <Feather name="tag" size={16} color="#9e9e9e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Название (например, ВКонтакте)"
                placeholderTextColor="#bdbdbd"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="none"
              />
            </View>

            {/* Password field */}
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={16} color="#9e9e9e" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Пароль"
                placeholderTextColor="#bdbdbd"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#9e9e9e" />
              </TouchableOpacity>
            </View>

            {/* Generate button */}
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => {
                const gen = generatePassword();
                setPassword(gen);
                setShowPassword(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="zap" size={15} color="#2E7D32" />
              <Text style={styles.generateText}>Сгенерировать надёжный пароль</Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setTitle("");
                  setPassword("");
                  setCategory("other");
                }}
              >
                <Text style={styles.cancelText}>ОТМЕНА</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!title.trim() || !password.trim()) && styles.saveBtnDisabled]}
                onPress={addEntry}
                disabled={!title.trim() || !password.trim()}
              >
                <Text style={styles.saveText}>СОХРАНИТЬ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#1a1a1a",
  },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#424242",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9e9e9e",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  catIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  catBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#616161",
    letterSpacing: 1,
  },
  iconBtn: { padding: 6 },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  catScroll: { marginBottom: 14 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    gap: 5,
    backgroundColor: "#fff",
  },
  catChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#424242",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#4CAF50",
    marginBottom: 16,
    paddingBottom: 6,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1a1a1a",
    paddingVertical: 4,
  },
  eyeBtn: { padding: 4 },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  generateText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#2E7D32",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  cancelBtn: { padding: 10 },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#9e9e9e",
  },
  saveBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveBtnDisabled: { backgroundColor: "#a5d6a7" },
  saveText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
