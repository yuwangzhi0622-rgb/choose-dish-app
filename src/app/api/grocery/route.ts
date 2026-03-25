import { NextResponse } from "next/server";
import { splitDishField } from "@/lib/dish-fields";
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
        ingredients: true,
        description: true,
      },
    });

    const summaryItems = Array.from(
      new Set(dishes.flatMap((dish) => splitDishField(dish.ingredients)))
    );

    const groceryList = dishes.flatMap((dish) => {
      const ingredientItems = splitDishField(dish.ingredients);
      const noteParts = [] as string[];

      if (ingredientItems.length > 0) {
        noteParts.push(`食材：${ingredientItems.join("、")}`);
      }

      if (dish.description) {
        noteParts.push(`备注：${dish.description}`);
      }

      if (noteParts.length === 0) {
        return [];
      }

      return [
        {
          dishName: dish.name,
          note: noteParts.join("\n"),
        },
      ];
    });

    return NextResponse.json({ groceryList, summaryItems });
  } catch (error) {
    console.error("Failed to generate grocery list:", error);
    return NextResponse.json(
      { error: "生成食材清单失败" },
      { status: 500 }
    );
  }
}
