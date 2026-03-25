import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules, excludeDays = 3 } = body as {
      rules: { category: string; count: number }[];
      excludeDays?: number;
    };

    if (!rules?.length) {
      return NextResponse.json({ error: "请设置搭配规则" }, { status: 400 });
    }

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - excludeDays);
    const recentDateStr = recentDate.toISOString().split("T")[0];

    const recentMeals = await prisma.mealRecord.findMany({
      where: { date: { gte: recentDateStr } },
      include: { mealDishes: { select: { dishId: true } } },
    });

    const recentDishIds = new Set(
      recentMeals.flatMap((m) => m.mealDishes.map((md) => md.dishId))
    );

    const allDishes = await prisma.dish.findMany();
    const result: { category: string; dishes: typeof allDishes }[] = [];

    for (const rule of rules) {
      const categoryDishes = allDishes.filter(
        (d) => d.category === rule.category && !recentDishIds.has(d.id)
      );

      const pool =
        categoryDishes.length >= rule.count
          ? categoryDishes
          : allDishes.filter((d) => d.category === rule.category);

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
