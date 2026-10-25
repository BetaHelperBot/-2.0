import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DetectedLink } from "@/lib/linkDetector";

type Props = {
  link: DetectedLink;
  compact?: boolean;
};

export function LinkCard({ link, compact }: Props) {
  const open = () => {
    Linking.openURL(link.url).catch(() => {});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.chip, { backgroundColor: link.bgColor, borderColor: link.color + "30" }]}
        onPress={open}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipIcon, { color: link.color }]}>{link.icon}</Text>
        <Text style={[styles.chipLabel, { color: link.color }]}>{link.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: link.bgColor, borderLeftColor: link.color }]}
      onPress={open}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: link.color + "20" }]}>
        <Text style={[styles.icon, { color: link.color }]}>{link.icon}</Text>
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.platform, { color: link.color }]}>{link.label}</Text>
        {link.description && (
          <Text style={styles.description} numberOfLines={1}>{link.description}</Text>
        )}
        <Text style={styles.url} numberOfLines={1}>{link.url}</Text>
      </View>
      <Text style={[styles.arrow, { color: link.color }]}>↗</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderLeftWidth: 3,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 18, fontWeight: "bold" },
  textBox: { flex: 1 },
  platform: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 1 },
  description: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#424242", marginBottom: 1 },
  url: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  arrow: { fontSize: 18, fontWeight: "bold" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 4,
  },
  chipIcon: { fontSize: 12, fontWeight: "bold" },
  chipLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
