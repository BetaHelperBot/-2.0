import React from "react";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  isDestructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelText = "ОТМЕНА",
  confirmText = "УДАЛИТЬ",
  isDestructive = true,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div
        className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#1a1a1a] leading-snug">
          {title}
        </h3>
        
        {message && (
          <p className="mt-2 text-sm text-[#616161] leading-relaxed">
            {message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#757575] hover:bg-[#f5f5f5] active:scale-95 transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider active:scale-95 transition-all ${
              isDestructive
                ? "text-[#C62828] hover:bg-red-50"
                : "text-[#2E7D32] hover:bg-emerald-50"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
