import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PIN_KEY = "pin_code";
const PIN_ENABLED_KEY = "pin_enabled";

const KEYS = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["","0","⌫"],
];

export default function PinSetupScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"enter"|"confirm">("enter");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      setTimeout(() => handleComplete(next), 100);
    }
  };

  const handleComplete = async (value: string) => {
    if (step === "enter") {
      setFirstPin(value);
      setPin("");
      setStep("confirm");
    } else {
      if (value !== firstPin) {
        shake();
        setError("PIN-коды не совпадают. Попробуйте снова.");
        setPin("");
        setStep("enter");
        setFirstPin("");
      } else {
        await AsyncStorage.setItem(PIN_KEY, value);
        await AsyncStorage.setItem(PIN_ENABLED_KEY, "true");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    }
  };

  const topPadVal = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadVal }]}>
      <View style={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <Text style={styles.title}>
          {step === "enter" ? "Введите PIN-код" : "Повторите PIN-код"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "enter"
            ? "Придумайте 4-значный код для входа"
            : "Введите тот же код для подтверждения"}
        </Text>

        {/* Dots */}
        <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
          {[0,1,2,3].map((i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i && styles.dotFilled]}
            />
          ))}
        </Animated.View>

        {error.length > 0 && (
          <Text style={styles.error}>{error}</Text>
        )}

        {/* Numpad */}
        <View style={styles.numpad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={styles.numRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[
                    styles.numKey,
                    key === "" && styles.numKeyEmpty,
                    key === "⌫" && styles.numKeyBack,
                  ]}
                  onPress={() => handleKey(key)}
                  disabled={key === ""}
                  activeOpacity={0.7}
                >
                  {key === "⌫" ? (
                    <Feather name="delete" size={22} color="#424242" />
                  ) : (
                    <Text style={styles.numKeyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#9e9e9e",
    textAlign: "center",
    marginBottom: 40,
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 12,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#2E7D32",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#2E7D32",
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#C62828",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  numpad: { marginTop: 32, gap: 12 },
  numRow: { flexDirection: "row", gap: 16 },
  numKey: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyBack: { backgroundColor: "#f5f5f5" },
  numKeyText: {
    fontSize: 26,
    fontFamily: "Inter_400Regular",
    color: "#1a1a1a",
  },
  cancelBtn: { marginTop: 28 },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#9e9e9e",
  },
});
