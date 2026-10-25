import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ExportSection = {
  id: string;
  title: string;
  icon: string;
  color: string;
  storageKey: string;
  description: string;
};

const SECTIONS: ExportSection[] = [
  { id: "passwords", title: "Пароли", icon: "lock", color: "#2E7D32", storageKey: "passwords", description: "Все сохранённые пароли" },
  { id: "notes", title: "Заметки", icon: "file-text", color: "#1565C0", storageKey: "notes", description: "Все заметки (без картинок)" },
  { id: "todos", title: "Задачи", icon: "check-square", color: "#E65100", storageKey: "todos", description: "Все задачи и их статус" },
];

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const date = new Date().toLocaleDateString("ru-RU", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      let text = `ЛИЧНЫЙ ОРГАНАЙЗЕР — РЕЗЕРВНАЯ КОПИЯ\n`;
      text += `Дата: ${date}\n`;
      text += `${"─".repeat(40)}\n\n`;

      for (const section of SECTIONS) {
        try {
          const raw = await AsyncStorage.getItem(section.storageKey);
          const data = raw ? JSON.parse(raw) : [];
          text += `${section.title.toUpperCase()} (${data.length})\n${"─".repeat(30)}\n`;

          if (section.id === "passwords") {
            for (const p of data) {
              text += `• ${p.title}\n  Пароль: ${p.password}\n  Категория: ${p.category}\n\n`;
            }
          } else if (section.id === "notes") {
            for (const n of data) {
              if (n.title) text += `• ${n.title}\n`;
              if (n.body) text += `  ${n.body}\n`;
              text += "\n";
            }
          } else if (section.id === "todos") {
            for (const t of data) {
              const status = t.done ? "✓" : "○";
              text += `${status} ${t.text}`;
              if (t.dueDate) text += ` (срок: ${t.dueDate})`;
              text += "\n";
            }
            text += "\n";
          }
        } catch {}
      }

      text += `\n${"─".repeat(40)}\nЛичный Органайзер v1.0 · heybo\n`;

      if (Platform.OS === "web") {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `organizer_backup_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Файл скачан!");
        return;
      }

      const path = `${FileSystem.cacheDirectory}organizer_backup.txt`;
      await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: "text/plain",
          dialogTitle: "Сохранить резервную копию",
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast("Готово!");
      } else {
        Alert.alert("Готово", `Файл создан: ${path}`);
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось создать резервную копию.");
    } finally {
      setExporting(false);
    }
  };

  const exportSection = async (section: ExportSection) => {
    setExporting(true);
    try {
      const raw = await AsyncStorage.getItem(section.storageKey);
      const data = raw ? JSON.parse(raw) : [];
      if (data.length === 0) {
        showToast(`В разделе «${section.title}» нет данных`);
        setExporting(false);
        return;
      }

      const date = new Date().toLocaleDateString("ru-RU");
      let text = `${section.title.toUpperCase()} · ${date}\n${"─".repeat(30)}\n\n`;

      if (section.id === "passwords") {
        for (const p of data) {
          text += `Название: ${p.title}\nПароль: ${p.password}\nКатегория: ${p.category}\n\n`;
        }
      } else if (section.id === "notes") {
        for (const n of data) {
          if (n.title) text += `# ${n.title}\n`;
          if (n.body) text += `${n.body}\n`;
          text += "\n";
        }
      } else if (section.id === "todos") {
        const done = data.filter((t: any) => t.done);
        const active = data.filter((t: any) => !t.done);
        text += `Активные (${active.length}):\n`;
        for (const t of active) text += `○ ${t.text}\n`;
        text += `\nВыполнено (${done.length}):\n`;
        for (const t of done) text += `✓ ${t.text}\n`;
      }

      text += `\nЛичный Органайзер · heybo`;

      if (Platform.OS === "web") {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${section.id}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Файл скачан!");
        return;
      }

      const path = `${FileSystem.cacheDirectory}${section.id}_export.txt`;
      await FileSystem.writeAsStringAsync(path, text, { encoding: FileSystem.EncodingType.UTF8 });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: "text/plain", dialogTitle: `Экспорт: ${section.title}` });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast("Файл отправлен!");
      }
    } catch {
      Alert.alert("Ошибка", "Не удалось экспортировать данные.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 30 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Full backup */}
      <View style={styles.mainCard}>
        <View style={styles.mainCardTop}>
          <View style={styles.mainIcon}>
            <Feather name="download" size={26} color="#fff" />
          </View>
          <View style={styles.mainCardText}>
            <Text style={styles.mainCardTitle}>Полная резервная копия</Text>
            <Text style={styles.mainCardDesc}>
              Пароли, заметки и задачи в одном .txt файле
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
          onPress={exportAll}
          disabled={exporting}
        >
          <Feather name="share" size={18} color="#fff" />
          <Text style={styles.exportBtnText}>
            {exporting ? "Создание..." : "Экспортировать всё"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Экспорт по разделам</Text>

      {SECTIONS.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={styles.sectionCard}
          onPress={() => exportSection(section)}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <View style={[styles.sectionIcon, { backgroundColor: section.color + "18" }]}>
            <Feather name={section.icon as any} size={22} color={section.color} />
          </View>
          <View style={styles.sectionText}>
            <Text style={styles.sectionCardTitle}>{section.title}</Text>
            <Text style={styles.sectionCardDesc}>{section.description}</Text>
          </View>
          <Feather name="share-2" size={18} color={section.color} />
        </TouchableOpacity>
      ))}

      {/* Info */}
      <View style={styles.infoCard}>
        <Feather name="info" size={16} color="#1565C0" />
        <Text style={styles.infoText}>
          Данные экспортируются в текстовый файл. Вы можете отправить его себе в мессенджер, на почту или сохранить в облако. Изображения из заметок не включаются.
        </Text>
      </View>

      <Animated.View
        style={[styles.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}
        pointerEvents="none"
      >
        <Feather name="check-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  mainCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 14 },
  mainIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardText: { flex: 1 },
  mainCardTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#1a1a1a", marginBottom: 3 },
  mainCardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  exportBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  exportBtnDisabled: { backgroundColor: "#a5d6a7" },
  exportBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sectionText: { flex: 1 },
  sectionCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a1a", marginBottom: 2 },
  sectionCardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  infoCard: {
    backgroundColor: "#E3F2FD",
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#1565C0", lineHeight: 20 },
  toast: {
    position: "absolute",
    bottom: 30,
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
});
