export const FIXED_CHEF_NAMES = [
  "余老师",
  "杜老师",
  "33老师",
  "天边老师",
  "奶奶",
  "食堂",
  "网红探店",
] as const;

export type FixedChefName = (typeof FIXED_CHEF_NAMES)[number];

export function isFixedChefName(value: string): value is FixedChefName {
  return FIXED_CHEF_NAMES.includes(value as FixedChefName);
}

export function sortByChefCatalog<T extends { name: string }>(items: T[]) {
  const orderMap = new Map(FIXED_CHEF_NAMES.map((name, index) => [name, index]));
  return [...items].sort((a, b) => {
    const aIndex = orderMap.get(a.name as FixedChefName) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.get(b.name as FixedChefName) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex || a.name.localeCompare(b.name, "zh-CN");
  });
}
