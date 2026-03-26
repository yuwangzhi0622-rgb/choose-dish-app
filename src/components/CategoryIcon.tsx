"use client";

import {
  Beef,
  Leaf,
  CookingPot,
  Wheat,
  Snowflake,
  Cookie,
  Wine,
  Dices,
  UtensilsCrossed,
  Flame,
  Star,
  Sunrise,
  Sun,
  Moon,
  CandyOff,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDashed,
  PartyPopper,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  meat: Beef,
  vegetable: Leaf,
  soup: CookingPot,
  staple: Wheat,
  cold: Snowflake,
  snack: Cookie,
  drink: Wine,
  poker: Dices,
};

export function CategoryIcon({
  category,
  size = 18,
  className = "",
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const Icon = CATEGORY_ICON_MAP[category] ?? UtensilsCrossed;
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}

const MEAL_TYPE_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

export function MealTypeIcon({
  mealType,
  size = 16,
  className = "",
}: {
  mealType: string;
  size?: number;
  className?: string;
}) {
  const Icon = MEAL_TYPE_ICON_MAP[mealType] ?? Sun;
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}

export function SpiceIndicator({ level, size = 14 }: { level: number; size?: number }) {
  if (level <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} size={size} strokeWidth={1.5} className="text-stone-400" />
      ))}
    </span>
  );
}

export function DifficultyIndicator({ difficulty }: { difficulty: string }) {
  const count = difficulty === "easy" ? 1 : difficulty === "hard" ? 3 : 2;
  const label = difficulty === "easy" ? "简单" : difficulty === "hard" ? "困难" : "中等";
  return (
    <span className="inline-flex items-center gap-1 text-stone-400">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} strokeWidth={1.5} fill="currentColor" />
      ))}
      <span className="text-[13px] font-medium ml-0.5">{label}</span>
    </span>
  );
}

const ORDER_STATUS_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  pending: CircleDashed,
  accepted: CheckCircle2,
  rejected: XCircle,
  completed: PartyPopper,
};

export function OrderStatusIcon({
  status,
  size = 14,
  className = "",
}: {
  status: string;
  size?: number;
  className?: string;
}) {
  const Icon = ORDER_STATUS_ICON_MAP[status] ?? CircleDashed;
  return <Icon size={size} strokeWidth={1.5} className={className} />;
}
