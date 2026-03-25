export function compressImage(file: File, maxWidth = 400, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export const SPICE_LEVELS = [
  { value: 0, label: "不辣", emoji: "😊" },
  { value: 1, label: "微辣", emoji: "🌶️" },
  { value: 2, label: "中辣", emoji: "🌶️🌶️" },
  { value: 3, label: "特辣", emoji: "🌶️🌶️🌶️" },
] as const;

export const SWEETNESS_LEVELS = [
  { value: 0, label: "不甜", emoji: "😐" },
  { value: 1, label: "微甜", emoji: "🍬" },
  { value: 2, label: "中甜", emoji: "🍬🍬" },
  { value: 3, label: "很甜", emoji: "🍬🍬🍬" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "简单", emoji: "⭐" },
  { value: "medium", label: "中等", emoji: "⭐⭐" },
  { value: "hard", label: "困难", emoji: "⭐⭐⭐" },
] as const;

export const MEAL_TYPES = [
  { value: "breakfast", label: "早餐", emoji: "🌅" },
  { value: "lunch", label: "午餐", emoji: "☀️" },
  { value: "dinner", label: "晚餐", emoji: "🌙" },
  { value: "snack", label: "加餐", emoji: "🍪" },
] as const;

export function getSpiceLabel(level: number): string {
  return SPICE_LEVELS.find((s) => s.value === level)?.label ?? "不辣";
}

export function getSweetnessLabel(level: number): string {
  return SWEETNESS_LEVELS.find((s) => s.value === level)?.label ?? "不甜";
}

export function getDifficultyLabel(value: string): string {
  return DIFFICULTY_OPTIONS.find((d) => d.value === value)?.label ?? "中等";
}

export function getMealTypeLabel(value: string): string {
  return MEAL_TYPES.find((m) => m.value === value)?.label ?? "午餐";
}

export function getMealTypeEmoji(value: string): string {
  return MEAL_TYPES.find((m) => m.value === value)?.emoji ?? "☀️";
}
