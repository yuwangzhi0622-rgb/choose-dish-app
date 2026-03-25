import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const meals = await prisma.mealRecord.findMany({
      include: {
        combo: {
          include: { comboDishes: { include: { dish: true } } },
        },
        mealDishes: { include: { dish: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(meals);
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
    const { date, dishIds, comboId, note, mealType, mealTime, chef, personCount } = body as {
      date: string;
      dishIds: string[];
      comboId?: string;
      note?: string;
      mealType?: string;
      mealTime?: string;
      chef?: string;
      personCount?: number;
    };

    if (!date || !dishIds?.length) {
      return NextResponse.json(
        { error: "日期和菜品不能为空" },
        { status: 400 }
      );
    }

    const meal = await prisma.mealRecord.create({
      data: {
        date,
        mealType: mealType || "lunch",
        mealTime: mealTime || null,
        chef: chef || null,
        personCount: personCount ?? 2,
        comboId,
        note: note || null,
        mealDishes: {
          create: dishIds.map((dishId) => ({ dishId })),
        },
      },
      include: {
        mealDishes: { include: { dish: true } },
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "记录用餐失败",
      },
      { status: 500 }
    );
  }
}
