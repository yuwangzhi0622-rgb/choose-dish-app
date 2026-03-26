export const CATEGORIES = [
  { value: "meat", label: "荤菜" },
  { value: "vegetable", label: "素菜" },
  { value: "soup", label: "汤" },
  { value: "staple", label: "主食" },
  { value: "cold", label: "凉菜" },
  { value: "snack", label: "小吃" },
  { value: "drink", label: "饮料酒水" },
  { value: "poker", label: "扑克牌" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
