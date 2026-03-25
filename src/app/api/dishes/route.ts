import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const dishes = await prisma.dish.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dishes);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "加载菜品失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "名称和分类不能为空" },
        { status: 400 }
      );
    }

    const dish = await prisma.dish.create({
      data: { name, category },
    });

    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建菜品失败",
      },
      { status: 500 }
    );
  }
}
