import React, { useState } from "react";
import {
  Image as ImageIcon,
  Download,
  Trash2,
  CheckSquare,
  Square,
  FileText,
  X,
  ExternalLink,
} from "lucide-react";
import { Note, STORAGE_KEYS, setLocalItem } from "../lib/storage.ts";
import { Toast } from "../components/Toast.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";

type Props = {
  notes: Note[];
  onChangeNotes: (updated: Note[]) => void;
  onNavigateToNote?: (noteId: string) => void;
};

type GalleryItem = {
  noteId: string;
  noteTitle: string;
  imageIndex: number;
  dataUrl: string;
  createdAt: number;
};

export function GalleryScreen({ notes, onChangeNotes }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Extract all images from all notes
  const items: GalleryItem[] = [];
  notes.forEach((n) => {
    if (n.images && n.images.length > 0) {
      n.images.forEach((img, idx) => {
        items.push({
          noteId: n.id,
          noteTitle: n.title || "Заметка без названия",
          imageIndex: idx,
          dataUrl: img,
          createdAt: n.createdAt,
        });
      });
    }
  });

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedKeys.size === items.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(items.map((i) => `${i.noteId}_${i.imageIndex}`)));
    }
  };

  const downloadSelected = () => {
    const toDownload = items.filter((i) =>
      selectedKeys.has(`${i.noteId}_${i.imageIndex}`)
    );
    if (toDownload.length === 0) return;

    toDownload.forEach((item, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.dataUrl;
        a.download = `heybo_photo_${item.noteId}_${item.imageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200);
    });

    setToastMsg(`Скачивание ${toDownload.length} фото...`);
  };

  const downloadAll = () => {
    if (items.length === 0) return;
    items.forEach((item, index) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.dataUrl;
        a.download = `heybo_photo_${item.noteId}_${item.imageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 200);
    });
    setToastMsg(`Скачивание всех ${items.length} фото...`);
  };

  const confirmDeleteSelected = () => {
    const updatedNotes = notes.map((n) => {
      if (!n.images || n.images.length === 0) return n;
      const filtered = n.images.filter(
        (_, idx) => !selectedKeys.has(`${n.id}_${idx}`)
      );
      return { ...n, images: filtered };
    });

    onChangeNotes(updatedNotes);
    setLocalItem(STORAGE_KEYS.NOTES, updatedNotes);
    setSelectedKeys(new Set());
    setShowDeleteConfirm(false);
    setToastMsg("Выбранные фото удалены");
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#1565C0]" />
            <span>Галерея вложений</span>
          </h2>
          <p className="text-xs text-[#9e9e9e]">
            {items.length === 0
              ? "Нет прикреплённых изображений"
              : `Всего фото: ${items.length}`}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-medium text-[#424242] dark:text-[#e0e0e0] flex items-center gap-1 active:scale-95"
            >
              {selectedKeys.size === items.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-[#1565C0]" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>{selectedKeys.size === items.length ? "Снять" : "Все"}</span>
            </button>
            <button
              onClick={downloadAll}
              className="px-2.5 py-1.5 rounded-lg bg-[#1565C0] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#0d47a1] active:scale-95"
              title="Скачать все фотографии"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Все</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected Action Floating Bar */}
      {selectedKeys.size > 0 && (
        <div className="bg-[#1565C0] text-white rounded-2xl p-3 px-4 mb-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <span className="text-xs font-semibold">
            Выбрано: {selectedKeys.size} из {items.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSelected}
              className="px-3 py-1 rounded-xl bg-white text-[#1565C0] text-xs font-bold hover:bg-white/90 active:scale-95 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 active:scale-95 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      )}

      {/* Zero state */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 text-center border border-black/5 dark:border-white/10 mt-6">
          <div className="w-16 h-16 rounded-2xl bg-[#E3F2FD] dark:bg-[#1565C0]/20 text-[#1565C0] flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-[#1a1a1a] dark:text-white mb-1">
            Галерея пуста
          </h3>
          <p className="text-xs text-[#9e9e9e] max-w-xs mx-auto leading-relaxed">
            Прикрепляйте фотографии к заметкам — они автоматически появятся здесь с возможностью пакетного экспорта.
          </p>
        </div>
      ) : (
        /* Grid of photos */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => {
            const key = `${item.noteId}_${item.imageIndex}`;
            const isSelected = selectedKeys.has(key);

            return (
              <div
                key={key}
                className={`relative group bg-white dark:bg-[#181818] rounded-2xl overflow-hidden border shadow-xs transition-all ${
                  isSelected
                    ? "border-[#1565C0] ring-2 ring-[#1565C0]"
                    : "border-black/5 dark:border-white/10"
                }`}
              >
                {/* Image */}
                <div
                  className="aspect-square bg-black/5 dark:bg-white/5 cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(item.dataUrl)}
                >
                  <img
                    src={item.dataUrl}
                    alt={item.noteTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>

                {/* Checkbox badge */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(key);
                  }}
                  className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-90"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 fill-current" />
                  ) : (
                    <Square className="w-4 h-4 text-white/80" />
                  )}
                </button>

                {/* Caption / Note Title */}
                <div className="p-2 px-2.5">
                  <div className="text-[11px] font-semibold text-[#1a1a1a] dark:text-[#e0e0e0] truncate flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#1565C0] shrink-0" />
                    <span className="truncate">{item.noteTitle}</span>
                  </div>
                  <div className="text-[10px] text-[#9e9e9e]">
                    {new Date(item.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Удалить выбранные фото?"
        message={`Будет удалено фотографий: ${selectedKeys.size}. Изображения исчезнут из заметок.`}
        confirmText="УДАЛИТЬ"
        cancelText="ОТМЕНА"
        isDestructive={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteSelected}
      />

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg("")} />}
    </div>
  );
}
