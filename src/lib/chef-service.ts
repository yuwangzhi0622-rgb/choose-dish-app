import { prisma } from "@/lib/prisma";
import {
  FIXED_CHEF_NAMES,
  isFixedChefName,
  sortByChefCatalog,
} from "@/lib/chef-catalog";

export async function ensureFixedChefs() {
  const chefs = await Promise.all(
    FIXED_CHEF_NAMES.map((name) =>
      prisma.chef.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  return sortByChefCatalog(chefs);
}

export async function resolveChefForWrite(chefId?: string | null) {
  if (!chefId) {
    return {
      chefId: null,
      chefName: null,
    };
  }

  await ensureFixedChefs();

  const chef = await prisma.chef.findUnique({
    where: { id: chefId },
  });

  if (!chef || !isFixedChefName(chef.name)) {
    throw new Error("请选择有效的厨师");
  }

  return {
    chefId: chef.id,
    chefName: chef.name,
  };
}

export function parseFeedbackImages(value: string | null | undefined) {
  if (!value) {
    return [] as string[];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [] as string[];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [] as string[];
  }
}

export function serializeFeedbackImages(images: unknown) {
  if (!Array.isArray(images)) {
    return null;
  }

  const validImages = images.filter(
    (item): item is string => typeof item === "string" && item.startsWith("data:image/")
  );

  return validImages.length ? JSON.stringify(validImages) : null;
}

export function getMealChefDisplayName(meal: {
  chef?: { name: string } | null;
  chefName?: string | null;
}) {
  return meal.chef?.name ?? meal.chefName ?? null;
}
