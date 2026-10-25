import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, type = "success", onClose, duration = 2000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-white font-medium text-sm max-w-sm w-full mx-auto ${
        type === "success" ? "bg-[#2E7D32]" : "bg-[#C62828]"
      }`}>
        {type === "success" ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
        )}
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
