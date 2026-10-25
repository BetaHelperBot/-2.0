import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React, { useRef, useState } from "react";
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
import { EasterEgg } from "@/components/EasterEgg";

const SITE_URL = "https://clck.ru/3TeBYT";
const VERSION = "1.0.0";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");
  const [easterEgg, setEasterEgg] = useState<null | { title: string; message: string; emoji: string; color: string }>(null);
  const versionTapCount = useRef(0);
  const versionTapTimer = useRef<any>(null);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<any>(null);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const openSite = () => {
    Linking.openURL(SITE_URL).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const copySite = async () => {
    await Clipboard.setStringAsync(SITE_URL);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast("Ссылка скопирована");
  };

  // Easter egg 1: tap version badge 7 times → про 17 лет
  const handleVersionTap = () => {
    versionTapCount.current += 1;
    clearTimeout(versionTapTimer.current);
    versionTapTimer.current = setTimeout(() => { versionTapCount.current = 0; }, 2000);
    if (versionTapCount.current >= 7) {
      versionTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEasterEgg({
        title: "А ты настойчивый!",
        message: "Создателю этого приложения 17 лет. Да-да, всё это написал обычный школьник. Если ты нашёл этот секрет — уважение тебе, серьёзно 🫡",
        emoji: "🎂",
        color: "#6A1B9A",
      });
    }
  };

  // Easter egg 2: tap "heybo" name 3 times → про При S2
  const handleLogoTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 1500);
    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEasterEgg({
        title: "Тссс, это секрет",
        message: "Пока разработчик писал это приложение — вышел тизер 2 сезона «При». Первая серия уже вышла, а он ещё не смотрел. А ты уже знаешь чем всё закончилось? 👀",
        emoji: "🎬",
        color: "#C62828",
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 30 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.9}>
          <Text style={styles.heroName}>Heybo</Text>
        </TouchableOpacity>
        <Text style={styles.heroTagline}>Личный органайзер — всё твоё, только на устройстве</Text>
        <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.85}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{VERSION}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Site */}
      <View style={styles.siteCard}>
        <View style={styles.siteCardTop}>
          <Feather name="globe" size={18} color="#2E7D32" />
          <Text style={styles.siteCardTitle}>Сайт автора</Text>
        </View>
        <TouchableOpacity style={styles.siteRow} onPress={openSite} activeOpacity={0.8}>
          <Text style={styles.siteUrl} numberOfLines={1}>{SITE_URL}</Text>
          <TouchableOpacity onPress={copySite} style={styles.copyBtn}>
            <Feather name="copy" size={15} color="#9e9e9e" />
          </TouchableOpacity>
        </TouchableOpacity>
        <TouchableOpacity style={styles.openBtn} onPress={openSite} activeOpacity={0.85}>
          <Feather name="external-link" size={15} color="#fff" />
          <Text style={styles.openBtnText}>Открыть</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy */}
      <View style={styles.privacyCard}>
        <Feather name="shield" size={18} color="#2E7D32" />
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Данные не покидают устройство</Text>
          <Text style={styles.privacyDesc}>Никаких серверов, никакой облачной синхронизации.</Text>
        </View>
      </View>

      <Text style={styles.footer}>© 2026 Heybo</Text>

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
  hero: {
    backgroundColor: "#1a1a1a",
    alignItems: "flex-start",
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  heroName: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 10,
  },
  heroTagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 21,
    maxWidth: 260,
    marginBottom: 20,
  },
  versionBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  versionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  siteCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  siteCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  siteCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a1a" },
  siteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  siteUrl: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#2E7D32" },
  copyBtn: { padding: 4 },
  openBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  openBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  privacyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyText: { flex: 1 },
  privacyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1a1a1a", marginBottom: 2 },
  privacyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#bdbdbd",
    marginTop: 24,
  },
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
