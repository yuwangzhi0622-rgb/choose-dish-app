import { prisma } from "@/lib/prisma";
import { matchesAnyTerm, splitFilterInput } from "@/lib/dish-fields";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rules,
      excludeDays = 3,
      avoidIngredients = [],
      avoidTags = [],
    } = body as {
      rules: { category: string; count: number }[];
      excludeDays?: number;
      avoidIngredients?: string[];
      avoidTags?: string[];
    };

    if (!rules?.length) {
      return NextResponse.json({ error: "请设置搭配规则" }, { status: 400 });
    }

    const ingredientTerms = Array.isArray(avoidIngredients)
      ? avoidIngredients.flatMap((value) => splitFilterInput(String(value)))
      : [];
    const tagTerms = Array.isArray(avoidTags)
      ? avoidTags.flatMap((value) => splitFilterInput(String(value)))
      : [];

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - excludeDays);
    const recentDateStr = recentDate.toISOString().split("T")[0];

    const recentMeals = await prisma.mealRecord.findMany({
      where: {
        date: { gte: recentDateStr },
        orderStatus: { not: "rejected" },
      },
      include: { mealDishes: { select: { dishId: true } } },
    });

    const recentDishIds = new Set(
      recentMeals.flatMap((m) => m.mealDishes.map((md) => md.dishId))
    );

    const allDishes = await prisma.dish.findMany({
      orderBy: { createdAt: "desc" },
    });
    const result: { category: string; dishes: typeof allDishes }[] = [];

    for (const rule of rules) {
      const matchesPreferences = (dish: (typeof allDishes)[number]) =>
        !matchesAnyTerm(dish.ingredients, ingredientTerms) &&
        !matchesAnyTerm(dish.tags, tagTerms);

      const categoryDishes = allDishes.filter(
        (d) =>
          d.category === rule.category &&
          matchesPreferences(d) &&
          !recentDishIds.has(d.id)
      );

      const pool =
        categoryDishes.length >= rule.count
          ? categoryDishes
          : allDishes.filter(
              (d) => d.category === rule.category && matchesPreferences(d)
            );

      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      result.push({
        category: rule.category,
        dishes: shuffled.slice(0, rule.count),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "推荐失败",
      },
      { status: 500 }
    );
  }
}
