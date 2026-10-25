import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { extractLinks } from "@/lib/linkDetector";
import { LinkCard } from "@/components/LinkCard";
import {
  Alert,
  Animated,
  Image,
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

const STORAGE_KEY = "notes";

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  color: string;
  images?: string[];
};

const NOTE_COLORS = ["#E8F5E9", "#E3F2FD", "#FFF8E1", "#FCE4EC", "#EDE7F6"];
const NOTE_ACCENT = ["#2E7D32", "#1565C0", "#F57F17", "#C62828", "#4527A0"];

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setNotes(JSON.parse(raw));
    } catch {}
  };

  const persist = async (updated: Note[]) => {
    setNotes(updated);
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

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Нет доступа", "Разрешите доступ к галерее в настройках телефона.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        const newImages = result.assets
          .filter((a) => a.base64)
          .map((a) => `data:image/jpeg;base64,${a.base64}`);
        setImages((prev) => [...prev, ...newImages].slice(0, 6));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      Alert.alert("Ошибка", "Не удалось загрузить изображение.");
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const openNew = () => {
    setSelectedNote(null);
    setTitle("");
    setBody("");
    setImages([]);
    setColorIdx(Math.floor(Math.random() * NOTE_COLORS.length));
    setModalVisible(true);
  };

  const openEdit = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setBody(note.body);
    setImages(note.images ?? []);
    setColorIdx(NOTE_COLORS.indexOf(note.color));
    setModalVisible(true);
  };

  const saveNote = async () => {
    if (!title.trim() && !body.trim() && images.length === 0) return;
    if (selectedNote) {
      const updated = notes.map((n) =>
        n.id === selectedNote.id
          ? { ...n, title: title.trim(), body: body.trim(), color: NOTE_COLORS[colorIdx], images }
          : n
      );
      await persist(updated);
      showToast("Заметка обновлена");
    } else {
      const newNote: Note = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        title: title.trim(),
        body: body.trim(),
        color: NOTE_COLORS[colorIdx],
        createdAt: Date.now(),
        images,
      };
      await persist([newNote, ...notes]);
      showToast("Заметка сохранена");
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  };

  const deleteNote = (id: string) => {
    Alert.alert("Удалить заметку?", "Это действие нельзя отменить", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await persist(notes.filter((n) => n.id !== id));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setModalVisible(false);
          showToast("Удалено");
        },
      },
    ]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
  );

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.searchRow}>
        <Feather name="search" size={18} color="#9e9e9e" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по заметкам..."
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
            <Feather name="file-text" size={48} color="#bbdefb" />
            <Text style={styles.emptyTitle}>
              {notes.length === 0 ? "Нет заметок" : "Ничего не найдено"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {notes.length === 0 ? "Нажмите + чтобы создать первую" : "Попробуйте другой запрос"}
            </Text>
          </View>
        )}

        <View style={styles.grid}>
          {filtered.map((note) => {
            const accent = NOTE_ACCENT[NOTE_COLORS.indexOf(note.color)] ?? "#2E7D32";
            const hasImages = note.images && note.images.length > 0;
            return (
              <TouchableOpacity
                key={note.id}
                style={[styles.noteCard, { backgroundColor: note.color }]}
                onPress={() => openEdit(note)}
                activeOpacity={0.8}
              >
                {hasImages && (
                  <Image
                    source={{ uri: note.images![0] }}
                    style={styles.noteThumb}
                    resizeMode="cover"
                  />
                )}
                {note.title.length > 0 && (
                  <Text style={[styles.noteTitle, { color: accent }]} numberOfLines={2}>
                    {note.title}
                  </Text>
                )}
                {note.body.length > 0 && (
                  <Text style={styles.noteBody} numberOfLines={hasImages ? 2 : 4}>
                    {note.body}
                  </Text>
                )}
                {/* Link chips */}
                {(() => {
                  const links = extractLinks(note.body);
                  if (links.length === 0) return null;
                  return (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                      {links.slice(0, 2).map((l, i) => (
                        <LinkCard key={i} link={l} compact />
                      ))}
                    </View>
                  );
                })()}
                <View style={styles.noteFooter}>
                  <Text style={[styles.noteDate, { color: accent + "99" }]}>
                    {formatDate(note.createdAt)}
                  </Text>
                  {hasImages && (
                    <View style={styles.imageBadge}>
                      <Feather name="image" size={11} color={accent} />
                      <Text style={[styles.imageBadgeText, { color: accent }]}>
                        {note.images!.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPad + 20 }]}
        onPress={openNew}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Animated.View
        style={[styles.toast, {
          bottom: bottomPad + 80,
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}
        pointerEvents="none"
      >
        <Feather name="check-circle" size={16} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      {/* Image preview modal */}
      <Modal visible={!!previewImage} animationType="fade" transparent onRequestClose={() => setPreviewImage(null)}>
        <TouchableOpacity
          style={styles.previewOverlay}
          onPress={() => setPreviewImage(null)}
          activeOpacity={1}
        >
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewImage(null)}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit / Create modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalBox, { backgroundColor: NOTE_COLORS[colorIdx] }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.headerBtn}>
                <Feather name="x" size={22} color="#424242" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedNote ? "Редактировать" : "Новая заметка"}
              </Text>
              <View style={styles.headerRight}>
                {selectedNote && (
                  <TouchableOpacity onPress={() => deleteNote(selectedNote.id)} style={styles.headerBtn}>
                    <Feather name="trash-2" size={20} color="#ef9a9a" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={saveNote}
                  style={[styles.saveBtn, { backgroundColor: NOTE_ACCENT[colorIdx] }]}
                >
                  <Text style={styles.saveBtnText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Color picker */}
            <View style={styles.colorRow}>
              {NOTE_COLORS.map((c, i) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: NOTE_ACCENT[i] }, colorIdx === i && styles.colorDotActive]}
                  onPress={() => setColorIdx(i)}
                />
              ))}
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Feather name="image" size={18} color={NOTE_ACCENT[colorIdx]} />
                <Text style={[styles.addImageText, { color: NOTE_ACCENT[colorIdx] }]}>
                  Фото {images.length > 0 ? `(${images.length})` : ""}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Image previews */}
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {images.map((img, i) => (
                  <View key={i} style={styles.imageThumbWrapper}>
                    <TouchableOpacity onPress={() => setPreviewImage(img)}>
                      <Image source={{ uri: img }} style={styles.imageThumb} resizeMode="cover" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeImage(i)}>
                      <Feather name="x" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TextInput
              style={styles.titleInput}
              placeholder="Заголовок"
              placeholderTextColor="#9e9e9e"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <TextInput
              style={styles.bodyInput}
              placeholder="Начните писать..."
              placeholderTextColor="#9e9e9e"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
            {/* Smart link preview */}
            {(() => {
              const links = extractLinks(body);
              if (links.length === 0) return null;
              return (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: "#9e9e9e", marginBottom: 4 }}>
                    ОБНАРУЖЕНЫ ССЫЛКИ
                  </Text>
                  {links.slice(0, 3).map((l, i) => (
                    <LinkCard key={i} link={l} />
                  ))}
                </View>
              );
            })()}
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
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a1a1a" },
  list: { flex: 1, paddingHorizontal: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#424242", marginTop: 12 },
  emptySubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9e9e9e" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  noteCard: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  noteThumb: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  noteTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  noteBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#424242", lineHeight: 18, flex: 1 },
  noteFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  noteDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  imageBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  imageBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  fab: {
    position: "absolute",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "#1565C0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    elevation: 6,
  },
  toastText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 14 },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "95%", height: "75%" },
  previewClose: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 420,
    maxHeight: "93%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  headerBtn: { padding: 4 },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#1a1a1a",
    textAlign: "center",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  colorRow: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "center" },
  colorDot: { width: 22, height: 22, borderRadius: 11, opacity: 0.6 },
  colorDotActive: { opacity: 1, transform: [{ scale: 1.25 }] },
  addImageBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addImageText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  imageRow: { marginBottom: 12 },
  imageThumbWrapper: { marginRight: 8, position: "relative" },
  imageThumb: { width: 72, height: 72, borderRadius: 10 },
  imageRemoveBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#C62828",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleInput: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#1a1a1a",
    marginBottom: 10,
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#424242",
    lineHeight: 22,
    flex: 1,
    minHeight: 180,
  },
});
