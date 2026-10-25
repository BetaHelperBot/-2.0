import React from "react";
import { ExternalLink } from "lucide-react";
import { DetectedLink } from "../lib/linkDetector.ts";

type Props = {
  link: DetectedLink;
  compact?: boolean;
};

export function LinkCardView({ link, compact }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold mr-1.5 mb-1.5 transition-opacity hover:opacity-85 active:scale-95 cursor-pointer"
        style={{
          backgroundColor: link.bgColor,
          borderColor: `${link.color}30`,
          color: link.color,
        }}
        title={link.url}
      >
        <span>{link.icon}</span>
        <span>{link.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center text-left rounded-xl p-2.5 mt-2 gap-3 transition-opacity hover:opacity-90 active:scale-98 cursor-pointer border-l-4 shadow-xs"
      style={{
        backgroundColor: link.bgColor,
        borderLeftColor: link.color,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-base"
        style={{
          backgroundColor: `${link.color}20`,
          color: link.color,
        }}
      >
        {link.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold leading-tight" style={{ color: link.color }}>
          {link.label}
        </div>
        {link.description && (
          <div className="text-xs text-[#424242] truncate font-medium mt-0.5">
            {link.description}
          </div>
        )}
        <div className="text-[11px] text-[#9e9e9e] truncate mt-0.5">
          {link.url}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 shrink-0 text-[#9e9e9e]" />
    </button>
  );
}
