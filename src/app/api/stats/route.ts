import { NextResponse } from "next/server";
import { getAllChefs } from "@/lib/chef-service";
import { prisma } from "@/lib/prisma";

function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTrendLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

interface DishCounter {
  id: string;
  name: string;
  count: number;
  category: string;
  imageUrl: string | null;
}

interface ChefAccumulator {
  id: string;
  name: string;
  count: number;
  ratingSum: number;
  ratingCount: number;
  dishes: Record<string, DishCounter>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // 'week' | 'month' | 'all'
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const chefCatalog = await getAllChefs();
    const chefByName = new Map(chefCatalog.map((chef) => [chef.name, chef]));

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

    const startDateStr = toDateString(startDate);
    const endDateStr = toDateString(endDate);

    // Fetch meals within the period
    const meals = await prisma.mealRecord.findMany({
      where: {
        date: {
          gte: startDateStr,
          lte: endDateStr,
        },
        orderStatus: {
          not: "rejected",
        },
      },
      include: {
        chef: true,
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
    const chefMap = new Map<string, ChefAccumulator>();
    let totalDishes = 0;

    chefCatalog.forEach((chef) => {
      chefMap.set(chef.id, {
        id: chef.id,
        name: chef.name,
        count: 0,
        ratingSum: 0,
        ratingCount: 0,
        dishes: {},
      });
    });

    meals.forEach((meal) => {
      trendMap[meal.date] = (trendMap[meal.date] || 0) + 1;
      mealTypeMap[meal.mealType] = (mealTypeMap[meal.mealType] || 0) + 1;

      const matchedChef = meal.chef ?? (meal.chefName ? chefByName.get(meal.chefName) ?? null : null);

      if (matchedChef) {
        const existingChef =
          chefMap.get(matchedChef.id) ?? {
            id: matchedChef.id,
            name: matchedChef.name,
            count: 0,
            ratingSum: 0,
            ratingCount: 0,
            dishes: {},
          };

        existingChef.count += 1;

        if (meal.feedbackRating) {
          existingChef.ratingSum += meal.feedbackRating;
          existingChef.ratingCount += 1;
        }

        chefMap.set(matchedChef.id, existingChef);
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

        if (matchedChef) {
          const chefStat = chefMap.get(matchedChef.id);
          if (chefStat) {
            if (!chefStat.dishes[md.dishId]) {
              chefStat.dishes[md.dishId] = {
                id: md.dishId,
                count: 0,
                name: md.dish.name,
                category: md.dish.category,
                imageUrl: md.dish.imageUrl,
              };
            }
            chefStat.dishes[md.dishId].count += md.quantity;
          }
        }
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

    const chefs = Array.from(chefMap.values())
      .map((chef) => ({
        id: chef.id,
        name: chef.name,
        count: chef.count,
        avgRating:
          chef.ratingCount === 0
            ? null
            : Number((chef.ratingSum / chef.ratingCount).toFixed(1)),
        ratingCount: chef.ratingCount,
        topDishes: Object.values(chef.dishes)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.name.localeCompare(b.name, "zh-CN");
      });

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
