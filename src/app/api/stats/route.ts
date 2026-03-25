import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // 'week' | 'month' | 'all'

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // default to beginning of time for 'all'

    if (period === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch meals within the period
    const meals = await prisma.mealRecord.findMany({
      where: {
        date: {
          gte: startDateStr,
        },
      },
      include: {
        mealDishes: {
          include: {
            dish: true,
          },
        },
      },
    });

    // Compute stats
    let totalMeals = meals.length;
    let dishFrequency: Record<string, { count: number; name: string; category: string; imageUrl: string | null }> = {};

    meals.forEach((meal) => {
      meal.mealDishes.forEach((md) => {
        if (!dishFrequency[md.dishId]) {
          dishFrequency[md.dishId] = {
            count: 0,
            name: md.dish.name,
            category: md.dish.category,
            imageUrl: md.dish.imageUrl,
          };
        }
        dishFrequency[md.dishId].count += md.quantity;
      });
    });

    const topDishes = Object.values(dishFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return NextResponse.json({
      totalMeals,
      topDishes,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
