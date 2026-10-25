import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EasterEgg } from "@/components/EasterEgg";

type Section = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
  storageKey?: string;
};

const SECTIONS: Section[] = [
  { id: "passwords", title: "Пароли", subtitle: "Хранение и генерация", icon: "lock", route: "/passwords", color: "#2E7D32", storageKey: "passwords" },
  { id: "notes", title: "Заметки", subtitle: "Текст, идеи, фото", icon: "file-text", route: "/notes", color: "#1565C0", storageKey: "notes" },
  { id: "todos", title: "Задачи", subtitle: "Дела с приоритетами", icon: "check-square", route: "/todos", color: "#E65100", storageKey: "todos" },
  { id: "generator", title: "Генератор паролей", subtitle: "Сложный пароль за секунду", icon: "zap", route: "/generator", color: "#6A1B9A" },
  { id: "export", title: "Экспорт", subtitle: "Резервная копия данных", icon: "download", route: "/export", color: "#00695C" },
  { id: "about", title: "О приложении", subtitle: "v1.0 · Heybo", icon: "heart", route: "/about", color: "#C62828" },
];

type Tip = { text: string; icon: string; category: string; color: string };
const TIPS: Tip[] = [
  { icon: "🔐", category: "Безопасность", color: "#2E7D32", text: "Используй отдельный пароль для каждого сервиса. Если утечёт один — остальные в безопасности." },
  { icon: "🧠", category: "Продуктивность", color: "#1565C0", text: "Правило 2 минут: если задача займёт меньше 2 минут — сделай прямо сейчас, не откладывай." },
  { icon: "📵", category: "Цифровой детокс", color: "#E65100", text: "Первые 30 минут после сна и последние 30 перед сном — без телефона. Это буквально меняет качество дня." },
  { icon: "💪", category: "Здоровье", color: "#00695C", text: "20-20-20: каждые 20 минут смотри на предмет в 20 футах (~6 м) в течение 20 секунд. Спасает от усталости глаз." },
  { icon: "📝", category: "Заметки", color: "#6A1B9A", text: "Записывай идеи сразу — мозг не хранилище, а процессор. Хорошие мысли исчезают за несколько минут." },
  { icon: "⏰", category: "Время", color: "#F57F17", text: "Планируй день вечером накануне. Утром у тебя уже будет план — и ты начнёшь продуктивно, а не будешь думать с чего начать." },
  { icon: "🔄", category: "Привычки", color: "#00838F", text: "Хочешь выработать привычку — привяжи её к уже существующей. «После кофе — 5 минут чтения». Называется habit stacking." },
  { icon: "🎯", category: "Цели", color: "#C62828", text: "Разбивай большие цели на микрошаги. Не «изучить программирование», а «написать одну функцию сегодня»." },
  { icon: "🌙", category: "Сон", color: "#37474F", text: "Температура в спальне 16–18°C ускоряет засыпание. Холодное тело = сигнал мозгу ко сну." },
  { icon: "🔋", category: "Энергия", color: "#558B2F", text: "Не заряжай телефон до 100% и не разряжай до 0. Оптимальный диапазон 20–80% — батарея проживёт дольше." },
  { icon: "📸", category: "Лайфхак", color: "#1565C0", text: "Фотографируй, где припарковался, положил ключи, или как собрал что-то сложное — потом скажешь себе спасибо." },
  { icon: "💬", category: "Общение", color: "#AD1457", text: "Если нужно сказать что-то важное — скажи это в начале разговора, а не в конце. Люди запоминают начало и конец." },
  { icon: "🧘", category: "Стресс", color: "#4527A0", text: "Техника 4-7-8: вдох на 4 счёта, задержка на 7, выдох на 8. Снижает тревогу за 2 минуты." },
  { icon: "💡", category: "Обучение", color: "#E65100", text: "Объясни тему воображаемому человеку простыми словами. Где спотыкаешься — там пробел в знаниях. Метод Фейнмана." },
];

function getTodayTip(): Tip {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return TIPS[dayOfYear % TIPS.length];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [easterEgg, setEasterEgg] = useState<null | { title: string; message: string; emoji: string; color: string }>(null);
  const titleTapCount = useRef(0);
  const titleTapTimer = useRef<any>(null);
  const shieldTapTimer = useRef<any>(null);
  const shieldTapCount = useRef(0);

  // Card entrance animations
  const cardAnims = useRef(SECTIONS.map(() => new Animated.Value(0))).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }).start();
    Animated.stagger(
      70,
      cardAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true })
      )
    ).start();
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const results: Record<string, number> = {};
      for (const s of SECTIONS) {
        if (s.storageKey) {
          const raw = await AsyncStorage.getItem(s.storageKey);
          results[s.id] = raw ? JSON.parse(raw).length : 0;
        }
      }
      setCounts(results);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => { loadCounts(); }, [loadCounts])
  );

  // Easter egg: tap "heybo" 5 times
  const handleTitleTap = () => {
    titleTapCount.current += 1;
    clearTimeout(titleTapTimer.current);
    titleTapTimer.current = setTimeout(() => { titleTapCount.current = 0; }, 1500);
    if (titleTapCount.current >= 5) {
      titleTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEasterEgg({
        title: "Привет, дорогой пользователь!",
        message: "Ты только что нашёл пасхалку — случайно или специально, не знаю. Красавчик. Это приложение сделано с душой специально для тебя. Береги свои данные 💚",
        emoji: "👋",
        color: "#2E7D32",
      });
    }
  };

  // Easter egg: long press shield
  const handleShieldLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setEasterEgg({
      title: "Секрет раскрыт",
      message: "Данные хранятся только на устройстве. Серьёзно — никакого облака, никакой слежки, никаких серверов. Даже разработчик не знает что у тебя там написано 🔒",
      emoji: "🛡️",
      color: "#1565C0",
    });
  };

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalPasswords = counts.passwords ?? 0;
  const totalNotes = counts.notes ?? 0;
  const totalTodos = counts.todos ?? 0;
  const hasAny = totalPasswords + totalNotes + totalTodos > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View
        style={[styles.headerRow, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <TouchableOpacity onPress={handleTitleTap} activeOpacity={1}>
            <Text style={styles.greetingTitle} numberOfLines={1}>Heybo</Text>
          </TouchableOpacity>
          <Text style={styles.greetingSubtitle} numberOfLines={1}>личный органайзер</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/search" as any)}>
            <Feather name="search" size={20} color="#616161" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/settings" as any)}>
            <Feather name="settings" size={20} color="#616161" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Stats */}
      {hasAny && (
        <View style={styles.statsRow}>
          {totalPasswords > 0 && (
            <View style={[styles.statItem, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="lock" size={14} color="#2E7D32" />
              <Text style={[styles.statNum, { color: "#2E7D32" }]}>{totalPasswords}</Text>
              <Text style={[styles.statLabel, { color: "#2E7D32" }]}>паролей</Text>
            </View>
          )}
          {totalNotes > 0 && (
            <View style={[styles.statItem, { backgroundColor: "#E3F2FD" }]}>
              <Feather name="file-text" size={14} color="#1565C0" />
              <Text style={[styles.statNum, { color: "#1565C0" }]}>{totalNotes}</Text>
              <Text style={[styles.statLabel, { color: "#1565C0" }]}>заметок</Text>
            </View>
          )}
          {totalTodos > 0 && (
            <View style={[styles.statItem, { backgroundColor: "#FBE9E7" }]}>
              <Feather name="check-square" size={14} color="#E65100" />
              <Text style={[styles.statNum, { color: "#E65100" }]}>{totalTodos}</Text>
              <Text style={[styles.statLabel, { color: "#E65100" }]}>задач</Text>
            </View>
          )}
        </View>
      )}

      {/* Sections with stagger animation */}
      <View style={styles.sectionsGrid}>
        {SECTIONS.map((section, i) => (
          <Animated.View
            key={section.id}
            style={{
              opacity: cardAnims[i],
              transform: [
                { scale: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                { translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
              ],
            }}
          >
            <TouchableOpacity
              style={[styles.sectionCard, { borderLeftColor: section.color }]}
              onPress={() => router.push(section.route as any)}
              activeOpacity={0.72}
            >
              <View style={[styles.iconCircle, { backgroundColor: section.color + "15" }]}>
                <Feather name={section.icon as any} size={22} color={section.color} />
              </View>
              <View style={styles.sectionText}>
                <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
                <Text style={styles.sectionSubtitle} numberOfLines={1}>{section.subtitle}</Text>
              </View>
              <View style={styles.sectionRight}>
                {counts[section.id] != null && counts[section.id]! > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: section.color }]}>
                    <Text style={styles.countText}>{counts[section.id]}</Text>
                  </View>
                )}
                <Feather name="chevron-right" size={18} color="#bdbdbd" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Tip of the day */}
      {(() => {
        const tip = getTodayTip();
        return (
          <View style={[styles.tipCard, { borderLeftColor: tip.color }]}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipEmoji}>{tip.icon}</Text>
              <View>
                <Text style={[styles.tipCategory, { color: tip.color }]}>{tip.category}</Text>
                <Text style={styles.tipLabel}>Совет дня</Text>
              </View>
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        );
      })()}

      {/* Bottom */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.bottomLink} onPress={() => router.push("/settings" as any)}>
          <Feather name="settings" size={14} color="#9e9e9e" />
          <Text style={styles.bottomLinkText}>Настройки</Text>
        </TouchableOpacity>
        <TouchableOpacity onLongPress={handleShieldLongPress} delayLongPress={600} activeOpacity={0.9}>
          <View style={styles.privacyPill}>
            <Feather name="shield" size={13} color="#2E7D32" />
            <Text style={styles.privacyText}>Только на устройстве</Text>
          </View>
        </TouchableOpacity>
      </View>

      <EasterEgg
        visible={!!easterEgg}
        onClose={() => setEasterEgg(null)}
        title={easterEgg?.title ?? ""}
        message={easterEgg?.message ?? ""}
        emoji={easterEgg?.emoji ?? "🎉"}
        color={easterEgg?.color ?? "#2E7D32"}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  greetingTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#9e9e9e",
  },
  headerBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  statItem: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 3 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionsGrid: { gap: 10, marginBottom: 18 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sectionText: { flex: 1 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  sectionSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  sectionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: {
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  bottomLinkText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  privacyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  privacyText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#2E7D32" },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  tipEmoji: { fontSize: 26 },
  tipCategory: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  tipLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  tipText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#424242", lineHeight: 20 },
});
