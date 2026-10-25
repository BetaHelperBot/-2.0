import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EasterEgg } from "@/components/EasterEgg";

const BIOMETRIC_KEY = "biometric_enabled";
const PIN_ENABLED_KEY = "pin_enabled";
const PIN_KEY = "pin_code";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Биометрия");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [easterEgg, setEasterEgg] = useState<null | { title: string; message: string; emoji: string; color: string }>(null);
  const footerTapCount = useRef(0);
  const footerTapTimer = useRef<any>(null);
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    checkBiometric();
    loadSettings();
  }, []);

  const checkBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Отпечаток пальца");
      } else {
        setBiometricType("Пароль устройства");
      }
    } catch {
      setBiometricAvailable(false);
    }
  };

  const loadSettings = async () => {
    try {
      const bio = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setBiometricEnabled(bio === "true");
      const pin = await AsyncStorage.getItem(PIN_ENABLED_KEY);
      setPinEnabled(pin === "true");
    } catch {}
  };

  const toggleBiometric = async (val: boolean) => {
    if (val) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Подтвердите для включения защиты",
          cancelLabel: "Отмена",
          disableDeviceFallback: false,
        });
        if (!result.success) return;
      } catch { return; }
    }
    setBiometricEnabled(val);
    await AsyncStorage.setItem(BIOMETRIC_KEY, val ? "true" : "false");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const togglePin = async (val: boolean) => {
    if (val) {
      router.push("/pin" as any);
      setPinEnabled(true);
    } else {
      Alert.alert("Отключить PIN?", "Приложение больше не будет блокироваться PIN-кодом.", [
        { text: "Отмена", style: "cancel" },
        {
          text: "Отключить",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem(PIN_ENABLED_KEY, "false");
            await AsyncStorage.removeItem(PIN_KEY);
            setPinEnabled(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]);
    }
  };

  const clearAllData = () => {
    Alert.alert("Удалить все данные?", "Пароли, заметки и задачи будут удалены. Это нельзя отменить.", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить всё",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["passwords", "notes", "todos"]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert("Готово", "Все данные удалены.");
        },
      },
    ]);
  };

  // Easter egg: tap footer 5 times
  const handleFooterTap = () => {
    footerTapCount.current += 1;
    clearTimeout(footerTapTimer.current);
    footerTapTimer.current = setTimeout(() => { footerTapCount.current = 0; }, 2000);
    if (footerTapCount.current >= 5) {
      footerTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEasterEgg({
        title: "Пасхалка #3",
        message: "Знаешь что? Пока шла разработка этого приложения, вышел тизер 2 сезона «При». Первая серия уже в эфире — но разработчик ещё не смотрел. Не спойлерь ему пожалуйста 🙏",
        emoji: "📺",
        color: "#E65100",
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 30 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionLabel}>БЕЗОПАСНОСТЬ</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
            <Feather name="hash" size={20} color="#2E7D32" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>PIN-код</Text>
            <Text style={styles.rowSubtitle}>
              {pinEnabled ? "Вход по 4-значному коду" : "Установить PIN для блокировки"}
            </Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={togglePin}
            trackColor={{ false: "#e0e0e0", true: "#a5d6a7" }}
            thumbColor={pinEnabled ? "#2E7D32" : "#9e9e9e"}
          />
        </View>

        {pinEnabled && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => router.push("/pin" as any)}>
              <View style={[styles.rowIcon, { backgroundColor: "#F3E5F5" }]}>
                <Feather name="edit-2" size={18} color="#6A1B9A" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Изменить PIN</Text>
                <Text style={styles.rowSubtitle}>Установить новый код</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#bdbdbd" />
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
            <Feather name="shield" size={20} color="#2E7D32" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Биометрия</Text>
            <Text style={styles.rowSubtitle}>
              {biometricAvailable ? biometricType : "Недоступно на этом устройстве"}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            disabled={!biometricAvailable}
            trackColor={{ false: "#e0e0e0", true: "#a5d6a7" }}
            thumbColor={biometricEnabled ? "#2E7D32" : "#9e9e9e"}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>ПРИВАТНОСТЬ</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: "#E3F2FD" }]}>
            <Feather name="database" size={20} color="#1565C0" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Локальное хранение</Text>
            <Text style={styles.rowSubtitle}>Данные не покидают телефон</Text>
          </View>
          <Feather name="check-circle" size={20} color="#2E7D32" />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: "#FCE4EC" }]}>
            <Feather name="wifi-off" size={20} color="#C62828" />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Без интернета</Text>
            <Text style={styles.rowSubtitle}>Работает полностью офлайн</Text>
          </View>
          <Feather name="check-circle" size={20} color="#2E7D32" />
        </View>
      </View>

      <Text style={styles.sectionLabel}>ДАННЫЕ</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={clearAllData}>
          <View style={[styles.rowIcon, { backgroundColor: "#FFEBEE" }]}>
            <Feather name="trash-2" size={20} color="#C62828" />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: "#C62828" }]}>Удалить все данные</Text>
            <Text style={styles.rowSubtitle}>Пароли, заметки и задачи</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#C62828" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleFooterTap} activeOpacity={1}>
        <Text style={styles.footer}>Heybo · v1.0{"\n"}© 2026</Text>
      </TouchableOpacity>

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
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#9e9e9e",
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a1a1a", marginBottom: 2 },
  rowSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  divider: { height: 1, backgroundColor: "#f5f5f5", marginHorizontal: 16 },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#bdbdbd",
    marginTop: 28,
    lineHeight: 20,
  },
});
