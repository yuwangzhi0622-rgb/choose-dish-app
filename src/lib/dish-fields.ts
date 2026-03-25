export function splitDishField(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(/[\n,，、;；|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function splitFilterInput(value: string): string[] {
  return splitDishField(value);
}

export function normalizeDishField(value: string | null | undefined): string {
  return splitDishField(value).join("、");
}

export function matchesAnyTerm(source: string | null | undefined, terms: string[]): boolean {
  if (!source || terms.length === 0) {
    return false;
  }

  const normalized = source.toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term.toLocaleLowerCase()));
}

export function buildDishSearchText(dish: {
  name?: string;
  category?: string;
  description?: string | null;
  ingredients?: string | null;
  tags?: string | null;
}): string {
  return [dish.name, dish.category, dish.description, dish.ingredients, dish.tags]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}
