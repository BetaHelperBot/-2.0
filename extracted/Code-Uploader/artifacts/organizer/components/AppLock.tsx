import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_KEY = "biometric_enabled";
const PIN_KEY = "pin_code";
const PIN_ENABLED_KEY = "pin_enabled";

const KEYS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["","0","⌫"],
];

type Props = { onUnlock: () => void };

export function LockScreen({ onUnlock }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState<"biometric"|"pin">("biometric");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    initLock();
  }, []);

  const initLock = async () => {
    const pinEnabled = await AsyncStorage.getItem(PIN_ENABLED_KEY);
    const saved = await AsyncStorage.getItem(PIN_KEY);
    const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_KEY);

    if (pinEnabled === "true" && saved) {
      setStoredPin(saved);
      setMode("pin");
    } else if (bioEnabled === "true") {
      setMode("biometric");
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
      tryBiometric();
    }
  };

  const tryBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Войдите в Личный Органайзер",
        cancelLabel: "Отмена",
        disableDeviceFallback: false,
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      }
    } catch {}
  };

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key: string) => {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (key === "") return;
    const next = (pin + key).slice(0, 4);
    setPin(next);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 100);
    }
  };

  const checkPin = (entered: string) => {
    if (entered === storedPin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      shake();
      setError("Неверный PIN");
      setPin("");
    }
  };

  if (mode === "pin") {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Feather name="lock" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Heybo</Text>
          <Text style={styles.subtitle}>Введите PIN-код</Text>

          <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
            ))}
          </Animated.View>

          {error.length > 0 && <Text style={styles.pinError}>{error}</Text>}

          <View style={styles.numpad}>
            {KEYS.map((row, ri) => (
              <View key={ri} style={styles.numRow}>
                {row.map((key, ki) => (
                  <TouchableOpacity
                    key={ki}
                    style={[styles.numKey, key === "" && styles.numKeyEmpty]}
                    onPress={() => handleKey(key)}
                    disabled={key === ""}
                    activeOpacity={0.7}
                  >
                    {key === "⌫" ? (
                      <Feather name="delete" size={22} color="rgba(255,255,255,0.8)" />
                    ) : (
                      <Text style={styles.numKeyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.footer}>© 2026 heybo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <Feather name="lock" size={36} color="#fff" />
        </Animated.View>
        <Text style={styles.title}>Heybo</Text>
        <Text style={styles.subtitle}>Подтвердите личность для входа</Text>
        <TouchableOpacity style={styles.authBtn} onPress={tryBiometric} activeOpacity={0.85}>
          <Feather name="shield" size={20} color="#2E7D32" />
          <Text style={styles.authBtnText}>Разблокировать</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>© 2026 Heybo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B5E20",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  content: { alignItems: "center", flex: 1, justifyContent: "center" },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 36,
  },
  dots: { flexDirection: "row", gap: 18, marginBottom: 8 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#fff", borderColor: "#fff" },
  pinError: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#ef9a9a",
    marginTop: 8,
    marginBottom: 4,
  },
  numpad: { marginTop: 28, gap: 12 },
  numRow: { flexDirection: "row", gap: 16 },
  numKey: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyText: {
    fontSize: 26,
    fontFamily: "Inter_400Regular",
    color: "#fff",
  },
  authBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  authBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#2E7D32",
  },
  footer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    paddingBottom: 36,
  },
});
