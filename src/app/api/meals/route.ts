import { prisma } from "@/lib/prisma";
import { ensureFixedChefs, resolveChefForWrite } from "@/lib/chef-service";
import { serializeMealRecord, serializeMealRecords } from "@/lib/meal-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await ensureFixedChefs();
    const meals = await prisma.mealRecord.findMany({
      include: {
        combo: {
          include: { comboDishes: { include: { dish: true } } },
        },
        chef: true,
        mealDishes: { include: { dish: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(serializeMealRecords(meals));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "加载用餐记录失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, dishIds, comboId, note, mealType, mealTime, chefId, personCount } = body as {
      date: string;
      dishIds: string[];
      comboId?: string;
      note?: string;
      mealType?: string;
      mealTime?: string;
      chefId: string;
      personCount?: number;
    };

    if (!date || !dishIds?.length) {
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

    const dishQuantities = dishIds.reduce<Record<string, number>>((acc, dishId) => {
      acc[dishId] = (acc[dishId] ?? 0) + 1;
      return acc;
    }, {});

    const meal = await prisma.mealRecord.create({
      data: {
        date,
        mealType: mealType || "lunch",
        mealTime: mealTime || null,
        chefId: chefData.chefId,
        chefName: chefData.chefName,
        personCount: personCount ?? 2,
        orderStatus: "pending",
        comboId,
        note: note || null,
        mealDishes: {
          create: Object.entries(dishQuantities).map(([dishId, quantity]) => ({
            dishId,
            quantity,
          })),
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
        error: error instanceof Error ? error.message : "记录用餐失败",
      },
      { status: 500 }
    );
  }
}
