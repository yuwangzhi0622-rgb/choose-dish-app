import { prisma } from "@/lib/prisma";
import { resolveChefForWrite } from "@/lib/chef-service";
import { serializeMealRecord } from "@/lib/meal-response";
import { NextRequest, NextResponse } from "next/server";

interface QuickDishInput {
  name: string;
  addToMenu: boolean;
  note?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, mealType, mealTime, chefId, personCount, note, dishes } =
      body as {
        date: string;
        mealType?: string;
        mealTime?: string;
        chefId: string;
        personCount?: number;
        note?: string;
        dishes: QuickDishInput[];
      };

    if (!date || !dishes?.length) {
      return NextResponse.json(
        { error: "日期和菜品不能为空" },
        { status: 400 }
      );
    }

    if (!chefId) {
      return NextResponse.json(
        { error: "请选择厨师" },
        { status: 400 }
      );
    }

    const chefData = await resolveChefForWrite(chefId);

    // Resolve each dish name to a Dish record
    const resolvedDishes: { dishId: string; note: string | null }[] = [];

    for (const entry of dishes) {
      const trimmedName = entry.name.trim();
      if (!trimmedName) continue;

      // Check if a dish with this exact name already exists
      let dish = await prisma.dish.findFirst({
        where: { name: trimmedName },
      });

      if (dish) {
        // If it was a quick entry but user now wants it in the menu, promote it
        if (dish.isQuickEntry && entry.addToMenu) {
          dish = await prisma.dish.update({
            where: { id: dish.id },
            data: { isQuickEntry: false },
          });
        }
      } else {
        // Create new dish
        dish = await prisma.dish.create({
          data: {
            name: trimmedName,
            category: "meat",
            isQuickEntry: !entry.addToMenu,
          },
        });
      }

      resolvedDishes.push({
        dishId: dish.id,
        note: entry.note?.trim() || null,
      });
    }

    if (!resolvedDishes.length) {
      return NextResponse.json(
        { error: "至少需要一道有效菜品" },
        { status: 400 }
      );
    }

    // Aggregate quantities for duplicate dish IDs
    const dishMap = new Map<string, { quantity: number; note: string | null }>();
    for (const rd of resolvedDishes) {
      const existing = dishMap.get(rd.dishId);
      if (existing) {
        existing.quantity += 1;
        // Keep the first non-null note
        if (!existing.note && rd.note) {
          existing.note = rd.note;
        }
      } else {
        dishMap.set(rd.dishId, { quantity: 1, note: rd.note });
      }
    }

    const meal = await prisma.mealRecord.create({
      data: {
        date,
        mealType: mealType || "lunch",
        mealTime: mealTime || null,
        chefId: chefData.chefId,
        chefName: chefData.chefName,
        personCount: personCount ?? 2,
        orderStatus: "pending",
        note: note || null,
        mealDishes: {
          create: Array.from(dishMap.entries()).map(
            ([dishId, { quantity, note: dishNote }]) => ({
              dishId,
              quantity,
              note: dishNote,
            })
          ),
        },
      },
      include: {
        chef: true,
        mealDishes: { include: { dish: true } },
      },
    });

    return NextResponse.json(serializeMealRecord(meal), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "快捷下单失败",
      },
      { status: 500 }
    );
  }
}
