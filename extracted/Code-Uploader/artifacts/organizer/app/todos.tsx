import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MONTHS_RU: Record<string, number> = {
  янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4, июн: 5,
  июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
};

function parseDueDate(str: string): Date | null {
  const s = str.trim().toLowerCase();
  const now = new Date();
  if (s === "сегодня") { const d = new Date(now); d.setHours(20, 0, 0, 0); return d; }
  if (s === "завтра") { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; }
  const inDays = s.match(/через (\d+) ден/);
  if (inDays) { const d = new Date(now); d.setDate(d.getDate() + parseInt(inDays[1])); d.setHours(9, 0, 0, 0); return d; }
  const ddmm = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (ddmm) {
    const year = ddmm[3] ? parseInt(ddmm[3]) : now.getFullYear();
    const d = new Date(year, parseInt(ddmm[2]) - 1, parseInt(ddmm[1]), 9, 0, 0);
    if (d > now) return d;
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  const ruDate = s.match(/^(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?$/);
  if (ruDate) {
    const month = MONTHS_RU[ruDate[2].slice(0, 3)];
    if (month !== undefined) {
      const year = ruDate[3] ? parseInt(ruDate[3]) : now.getFullYear();
      const d = new Date(year, month, parseInt(ruDate[1]), 9, 0, 0);
      if (d > now) return d;
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }
  return null;
}

function getSmartMessage(text: string): string {
  const l = text.toLowerCase();
  if (/спорт|трени|бег|отжи|качалк|зал|фитнес|пробеж/.test(l)) return `💪 Не забудь про тренировку: «${text.slice(0, 40)}»`;
  if (/разработ|код|программ|приложен|функци|баг|деплой|git|коммит/.test(l)) return `💻 Дедлайн по разработке: «${text.slice(0, 40)}»`;
  if (/учёб|учиться|учить|экзамен|реферат|курс|лекц|задание/.test(l)) return `📚 Учёба не ждёт: «${text.slice(0, 40)}»`;
  if (/встреч|звонок|созвон|митинг|встреч/.test(l)) return `📅 Не пропусти: «${text.slice(0, 40)}»`;
  if (/купить|магазин|заказ|доставк/.test(l)) return `🛒 Не забудь: «${text.slice(0, 40)}»`;
  return `⏰ Напоминание: «${text.slice(0, 50)}»`;
}

async function scheduleReminder(todo: { id: string; text: string; dueDate?: string }) {
  if (!todo.dueDate || Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const date = parseDueDate(todo.dueDate);
    if (!date) return;
    await Notifications.cancelScheduledNotificationAsync(todo.id).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: todo.id,
      content: {
        title: "Heybo — напоминание",
        body: getSmartMessage(todo.text),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {}
}

const STORAGE_KEY = "todos";

type Priority = "high" | "medium" | "low";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
};

const PRIORITIES: { id: Priority; label: string; color: string; icon: string }[] = [
  { id: "high", label: "Важно", color: "#C62828", icon: "alert-circle" },
  { id: "medium", label: "Обычно", color: "#F57F17", icon: "minus-circle" },
  { id: "low", label: "Когда-нибудь", color: "#2E7D32", icon: "circle" },
];

const getPriority = (id: Priority) => PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setTodos(JSON.parse(raw));
    } catch {}
  };

  const persist = async (updated: Todo[]) => {
    setTodos(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const addTodo = async () => {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      text: text.trim(),
      done: false,
      priority,
      createdAt: Date.now(),
      dueDate: dueDate.trim() || undefined,
    };
    await persist([newTodo, ...todos]);
    scheduleReminder(newTodo);
    setText("");
    setPriority("medium");
    setDueDate("");
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(newTodo.dueDate && parseDueDate(newTodo.dueDate) ? "Задача добавлена · напоминание создано 🔔" : "Задача добавлена");
  };

  const toggleDone = async (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    await persist(updated);
    const todo = todos.find((t) => t.id === id);
    if (todo && !todo.done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Готово! ✓");
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const deleteTodo = (id: string) => {
    Alert.alert("Удалить задачу?", "", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await persist(todos.filter((t) => t.id !== id));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const clearDone = () => {
    Alert.alert("Очистить выполненные?", "Будут удалены все завершённые задачи", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Очистить",
        style: "destructive",
        onPress: async () => {
          await persist(todos.filter((t) => !t.done));
          showToast("Выполненные удалены");
        },
      },
    ]);
  };

  const filtered = todos
    .filter((t) => {
      if (filter === "active") return !t.done;
      if (filter === "done") return t.done;
      return true;
    })
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  const doneCount = todos.filter((t) => t.done).length;
  const totalCount = todos.length;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Progress bar */}
      {totalCount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(doneCount / totalCount) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {doneCount} / {totalCount} выполнено
          </Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filters}>
        {(["all", "active", "done"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Готово"}
            </Text>
          </TouchableOpacity>
        ))}
        {doneCount > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearDone}>
            <Feather name="trash-2" size={16} color="#ef9a9a" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="check-square" size={48} color="#c8e6c9" />
            <Text style={styles.emptyTitle}>
              {filter === "done" ? "Нет выполненных задач" :
               filter === "active" ? "Все задачи выполнены!" :
               "Нет задач"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all" ? "Нажмите + чтобы добавить первую" : ""}
            </Text>
          </View>
        )}

        {filtered.map((todo) => {
          const p = getPriority(todo.priority);
          return (
            <TouchableOpacity
              key={todo.id}
              style={[styles.todoCard, todo.done && styles.todoCardDone]}
              onPress={() => toggleDone(todo.id)}
              onLongPress={() => deleteTodo(todo.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, todo.done && { backgroundColor: "#2E7D32", borderColor: "#2E7D32" }]}>
                {todo.done && <Feather name="check" size={14} color="#fff" />}
              </View>
              <View style={styles.todoContent}>
                <Text style={[styles.todoText, todo.done && styles.todoTextDone]}>
                  {todo.text}
                </Text>
                <View style={styles.todoMeta}>
                  <View style={[styles.priorityBadge, { backgroundColor: p.color + "18" }]}>
                    <Feather name={p.icon as any} size={11} color={p.color} />
                    <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
                  </View>
                  {todo.dueDate && (
                    <View style={styles.dueDateBadge}>
                      <Feather name="calendar" size={11} color="#9e9e9e" />
                      <Text style={styles.dueDateText}>{todo.dueDate}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteTodo(todo.id)} style={styles.deleteBtn}>
                <Feather name="x" size={16} color="#bdbdbd" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPad + 20 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Animated.View
        style={[styles.toast, { bottom: bottomPad + 80, opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
        pointerEvents="none"
      >
        <Feather name="check-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новая задача</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#9e9e9e" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.taskInput}
              placeholder="Что нужно сделать?"
              placeholderTextColor="#bdbdbd"
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />

            <Text style={styles.label}>Приоритет</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.priorityChip,
                    { borderColor: p.color },
                    priority === p.id && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPriority(p.id)}
                >
                  <Feather name={p.icon as any} size={14} color={priority === p.id ? "#fff" : p.color} />
                  <Text style={[styles.priorityChipText, priority === p.id && { color: "#fff" }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Срок (необязательно)</Text>
            <View style={styles.inputWrapper}>
              <Feather name="calendar" size={16} color="#9e9e9e" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateInput}
                placeholder="например: 20 мая"
                placeholderTextColor="#bdbdbd"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            <TouchableOpacity
              style={[styles.addBtn, !text.trim() && styles.addBtnDisabled]}
              onPress={addTodo}
              disabled={!text.trim()}
            >
              <Text style={styles.addBtnText}>ДОБАВИТЬ ЗАДАЧУ</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  progressSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9e9e9e",
    textAlign: "right",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#e8f5e9",
  },
  filterTabActive: { backgroundColor: "#2E7D32" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#2E7D32" },
  filterTextActive: { color: "#fff" },
  clearBtn: { marginLeft: "auto", padding: 6 },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: { alignItems: "center", paddingTop: 70, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#424242", marginTop: 12 },
  emptySubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  todoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  todoCardDone: { opacity: 0.65 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#bdbdbd",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    marginRight: 12,
  },
  todoContent: { flex: 1 },
  todoText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#1a1a1a",
    lineHeight: 21,
    marginBottom: 6,
  },
  todoTextDone: {
    textDecorationLine: "line-through",
    color: "#9e9e9e",
  },
  todoMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dueDateText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  deleteBtn: { padding: 4, marginLeft: 4 },
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
    elevation: 6,
  },
  toastText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a1a1a" },
  taskInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1a1a1a",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#757575",
    marginBottom: 8,
  },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  priorityChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#424242" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#4CAF50",
    marginBottom: 20,
    paddingBottom: 6,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1a1a1a",
  },
  addBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  addBtnDisabled: { backgroundColor: "#a5d6a7" },
  addBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
