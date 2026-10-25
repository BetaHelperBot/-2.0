import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Options = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  special: boolean;
};

function buildPassword(opts: Options): string {
  let chars = "";
  if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (opts.digits) chars += "0123456789";
  if (opts.special) chars += "!@#$%^&*()-_=+[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  let pass = "";
  for (let i = 0; i < opts.length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

function getStrength(pass: string): { label: string; color: string; score: number } {
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (pass.length >= 16) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 2) return { label: "Слабый", color: "#C62828", score };
  if (score <= 4) return { label: "Средний", color: "#F57F17", score };
  if (score <= 6) return { label: "Хороший", color: "#2E7D32", score };
  return { label: "Отличный", color: "#1B5E20", score };
}

const HISTORY_LIMIT = 10;

export default function GeneratorScreen() {
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<Options>({ length: 14, upper: true, lower: true, digits: true, special: true });
  const [password, setPassword] = useState(buildPassword({ length: 14, upper: true, lower: true, digits: true, special: true }));
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedMain, setCopiedMain] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");
  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const generate = () => {
    const newPass = buildPassword(opts);
    setPassword(newPass);
    setHistory((h) => [newPass, ...h].slice(0, HISTORY_LIMIT));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopiedMain(false);
  };

  const copyMain = async () => {
    await Clipboard.setStringAsync(password);
    setCopiedMain(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast("Скопировано!");
    setTimeout(() => setCopiedMain(false), 2000);
  };

  const copyHistory = async (pass: string, idx: number) => {
    await Clipboard.setStringAsync(pass);
    setCopiedIdx(idx);
    showToast("Скопировано!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const strength = getStrength(password);

  const updateOpt = <K extends keyof Options>(key: K, val: Options[K]) => {
    const newOpts = { ...opts, [key]: val };
    setOpts(newOpts);
    const newPass = buildPassword(newOpts);
    setPassword(newPass);
    setHistory((h) => [newPass, ...h].slice(0, HISTORY_LIMIT));
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Password display */}
      <View style={styles.passCard}>
        <Text style={styles.passCardLabel}>Сгенерированный пароль</Text>
        <Text style={styles.passText} selectable>{password}</Text>

        {/* Strength */}
        <View style={styles.strengthRow}>
          <View style={styles.strengthBars}>
            {[1,2,3,4,5,6,7].map((i) => (
              <View
                key={i}
                style={[
                  styles.strengthBar,
                  { backgroundColor: i <= strength.score ? strength.color : "#e0e0e0" },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>

        <View style={styles.passActions}>
          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: strength.color }]} onPress={copyMain}>
            <Feather name={copiedMain ? "check" : "copy"} size={18} color="#fff" />
            <Text style={styles.copyBtnText}>{copiedMain ? "Скопировано" : "Копировать"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.regenBtn} onPress={generate}>
            <Feather name="refresh-cw" size={20} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <Text style={styles.sectionTitle}>Настройки</Text>
      <View style={styles.settingsCard}>
        {/* Length */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Длина: {opts.length} символов</Text>
        </View>
        <View style={styles.sliderRow}>
          {[8, 10, 12, 14, 16, 20, 24, 32].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.lengthBtn, opts.length === n && styles.lengthBtnActive]}
              onPress={() => updateOpt("length", n)}
            >
              <Text style={[styles.lengthBtnText, opts.length === n && styles.lengthBtnTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {[
          { key: "upper" as keyof Options, label: "Заглавные буквы", example: "A–Z" },
          { key: "lower" as keyof Options, label: "Строчные буквы", example: "a–z" },
          { key: "digits" as keyof Options, label: "Цифры", example: "0–9" },
          { key: "special" as keyof Options, label: "Спецсимволы", example: "!@#$%" },
        ].map((item) => (
          <View key={item.key} style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>{item.label}</Text>
              <Text style={styles.switchExample}>{item.example}</Text>
            </View>
            <Switch
              value={opts[item.key] as boolean}
              onValueChange={(v) => updateOpt(item.key, v)}
              trackColor={{ false: "#e0e0e0", true: "#a5d6a7" }}
              thumbColor={opts[item.key] ? "#2E7D32" : "#9e9e9e"}
            />
          </View>
        ))}
      </View>

      {/* History */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>История ({history.length})</Text>
          <View style={styles.historyCard}>
            {history.map((pass, idx) => (
              <View key={idx} style={[styles.historyRow, idx < history.length - 1 && styles.historyRowBorder]}>
                <Text style={styles.historyPass} numberOfLines={1}>{pass}</Text>
                <TouchableOpacity onPress={() => copyHistory(pass, idx)} style={styles.historyBtn}>
                  <Feather
                    name={copiedIdx === idx ? "check" : "copy"}
                    size={16}
                    color={copiedIdx === idx ? "#2E7D32" : "#9e9e9e"}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <Animated.View
        style={[styles.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }]
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
  passCard: {
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
  passCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#9e9e9e",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  passText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    letterSpacing: 2,
    marginBottom: 16,
    lineHeight: 32,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  passActions: { flexDirection: "row", gap: 10 },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  copyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  regenBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 10,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: { marginBottom: 8 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1a1a1a" },
  sliderRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  lengthBtn: {
    width: 46,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  lengthBtnActive: { backgroundColor: "#2E7D32" },
  lengthBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#424242" },
  lengthBtnTextActive: { color: "#fff" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#1a1a1a" },
  switchExample: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  historyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  historyPass: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#424242",
    letterSpacing: 0.5,
  },
  historyBtn: { padding: 4, marginLeft: 8 },
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
