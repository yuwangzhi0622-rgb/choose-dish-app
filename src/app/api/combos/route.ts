import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const favoritesOnly = searchParams.get("favorites") === "true";

    const combos = await prisma.combo.findMany({
      where: favoritesOnly ? { isFavorite: true } : undefined,
      include: {
        comboDishes: {
          include: { dish: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(combos);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "加载搭配失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dishIds, isFavorite = true } = body as {
      name: string;
      dishIds: string[];
      isFavorite?: boolean;
    };

    if (!name || !dishIds?.length) {
      return NextResponse.json(
        { error: "名称和菜品不能为空" },
        { status: 400 }
      );
    }

    const combo = await prisma.combo.create({
      data: {
        name,
        isFavorite,
        comboDishes: {
          create: dishIds.map((dishId: string) => ({ dishId })),
        },
      },
      include: {
        comboDishes: { include: { dish: true } },
      },
    });

    return NextResponse.json(combo, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建搭配失败",
      },
      { status: 500 }
    );
  }
}
