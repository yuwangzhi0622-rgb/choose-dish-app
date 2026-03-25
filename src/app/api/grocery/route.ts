import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { dishIds } = await request.json();

    if (!Array.isArray(dishIds) || dishIds.length === 0) {
      return NextResponse.json(
        { error: "请提供菜品ID" },
        { status: 400 }
      );
    }

    const dishes = await prisma.dish.findMany({
      where: {
        id: {
          in: dishIds,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    // Simple AI-like extraction logic based on the description
    // In a real app, you might want to use a real LLM API here, but for now we extract based on a simple regex or assumption
    // We will return the raw descriptions so the user can see them in one place, or simple keywords if possible.
    
    let groceryList: { dishName: string; note: string }[] = [];
    
    dishes.forEach((dish) => {
      if (dish.description) {
        groceryList.push({
          dishName: dish.name,
          note: dish.description,
        });
      }
    });

    return NextResponse.json({ groceryList });
  } catch (error) {
    console.error("Failed to generate grocery list:", error);
    return NextResponse.json(
      { error: "生成食材清单失败" },
      { status: 500 }
    );
  }
}
