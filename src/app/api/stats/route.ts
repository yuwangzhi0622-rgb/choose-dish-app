import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatTrendLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // 'week' | 'month' | 'all'
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0); // default to beginning of time for 'all'
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (start) {
      startDate = new Date(`${start}T00:00:00`);
    } else if (period === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    if (end) {
      endDate = new Date(`${end}T00:00:00`);
    }

    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = toDateString(endDate);

    // Fetch meals within the period
    const meals = await prisma.mealRecord.findMany({
      where: {
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
      include: {
        mealDishes: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Compute stats
    const totalMeals = meals.length;
    const dishFrequency: Record<string, { count: number; name: string; category: string; imageUrl: string | null }> = {};
    const trendMap: Record<string, number> = {};
    const mealTypeMap: Record<string, number> = {};
    const chefMap: Record<string, number> = {};
    let totalDishes = 0;

    meals.forEach((meal) => {
      trendMap[meal.date] = (trendMap[meal.date] || 0) + 1;
      mealTypeMap[meal.mealType] = (mealTypeMap[meal.mealType] || 0) + 1;

      if (meal.chef) {
        chefMap[meal.chef] = (chefMap[meal.chef] || 0) + 1;
      }

      meal.mealDishes.forEach((md) => {
        totalDishes += md.quantity;

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

    const trend = Object.entries(trendMap).map(([date, count]) => ({
      date,
      count,
      label: formatTrendLabel(date),
    }));

    const mealTypes = Object.entries(mealTypeMap)
      .map(([mealType, count]) => ({ mealType, count }))
      .sort((a, b) => b.count - a.count);

    const chefs = Object.entries(chefMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalMeals,
      totalDishes,
      averageDishesPerMeal:
        totalMeals === 0 ? 0 : Number((totalDishes / totalMeals).toFixed(1)),
      range: {
        start: startDateStr,
        end: endDateStr,
      },
      trend,
      mealTypes,
      chefs,
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
