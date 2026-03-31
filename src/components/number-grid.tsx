"use client";

interface NumberGridProps {
  selected: number[];
  onToggle: (n: number) => void;
  maxSelect: number;
  disabled?: boolean;
}

const COLORS: Record<string, { bg: string; ring: string }> = {
  "1-10": { bg: "#facc15", ring: "ring-yellow-400" },
  "11-20": { bg: "#3b82f6", ring: "ring-blue-400" },
  "21-30": { bg: "#ef4444", ring: "ring-red-400" },
  "31-40": { bg: "#6b7280", ring: "ring-gray-400" },
  "41-45": { bg: "#22c55e", ring: "ring-green-400" },
};

function getColorGroup(n: number) {
  if (n <= 10) return COLORS["1-10"];
  if (n <= 20) return COLORS["11-20"];
  if (n <= 30) return COLORS["21-30"];
  if (n <= 40) return COLORS["31-40"];
  return COLORS["41-45"];
}

export default function NumberGrid({
  selected,
  onToggle,
  maxSelect,
  disabled = false,
}: NumberGridProps) {
  const selectedSet = new Set(selected);
  const isFull = selected.length >= maxSelect;

  return (
    <div className="grid grid-cols-9 gap-0.5 sm:gap-1">
      {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
        const isSelected = selectedSet.has(n);
        const color = getColorGroup(n);
        const isDisabled = disabled || (!isSelected && isFull);

        return (
          <button
            key={n}
            type="button"
            onClick={() => !isDisabled && onToggle(n)}
            disabled={isDisabled}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
              isSelected
                ? `ring-2 ${color.ring} scale-110 text-white shadow-md`
                : isDisabled
                  ? "opacity-30 cursor-not-allowed text-[var(--color-muted)]"
                  : "text-[var(--color-muted)] hover:scale-105"
            }`}
            style={{
              background: isSelected
                ? color.bg
                : "var(--color-surface)",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
