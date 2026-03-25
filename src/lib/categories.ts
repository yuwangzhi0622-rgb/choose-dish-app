export const CATEGORIES = [
  { value: "meat", label: "荤菜", emoji: "🥩" },
  { value: "vegetable", label: "素菜", emoji: "🥬" },
  { value: "soup", label: "汤", emoji: "🍲" },
  { value: "staple", label: "主食", emoji: "🍚" },
  { value: "cold", label: "凉菜", emoji: "🥗" },
  { value: "snack", label: "小吃", emoji: "🥟" },
  { value: "drink", label: "饮料酒水", emoji: "🍺" },
  { value: "poker", label: "扑克牌", emoji: "🃏" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryEmoji(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.emoji ?? "🍽️";
}
