export interface DishIngredientItem {
  name: string;
  amount?: string;
  unit?: string;
  price?: string;
  note?: string;
}

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

export function parseIngredientDetails(
  value: string | null | undefined,
  fallbackIngredients?: string | null | undefined
): DishIngredientItem[] {
  if (value) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        const items = parsed
          .map<DishIngredientItem | null>((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const ingredient = item as Record<string, unknown>;
            const name = typeof ingredient.name === "string" ? ingredient.name.trim() : "";

            if (!name) {
              return null;
            }

            return {
              name,
              amount:
                typeof ingredient.amount === "string" ? ingredient.amount.trim() : "",
              unit: typeof ingredient.unit === "string" ? ingredient.unit.trim() : "",
              price:
                typeof ingredient.price === "string" ? ingredient.price.trim() : "",
              note: typeof ingredient.note === "string" ? ingredient.note.trim() : "",
            };
          })
          .filter((item): item is DishIngredientItem => item !== null);

        return items;
      }
    } catch {}
  }

  return splitDishField(fallbackIngredients).map((name) => ({ name }));
}

export function serializeIngredientDetails(
  items: DishIngredientItem[]
): string | null {
  const normalized = items
    .map((item) => ({
      name: item.name.trim(),
      amount: item.amount?.trim() || "",
      unit: item.unit?.trim() || "",
      price: item.price?.trim() || "",
      note: item.note?.trim() || "",
    }))
    .filter((item) => item.name);

  if (normalized.length === 0) {
    return null;
  }

  return JSON.stringify(normalized);
}

export function ingredientDetailsToIngredients(
  items: DishIngredientItem[]
): string {
  return normalizeDishField(items.map((item) => item.name).join("、"));
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
  chefNote?: string | null;
}): string {
  return [dish.name, dish.category, dish.description, dish.ingredients, dish.tags, dish.chefNote]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}
