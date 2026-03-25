import { NextResponse } from "next/server";
import { parseIngredientDetails, splitDishField } from "@/lib/dish-fields";
import { prisma } from "@/lib/prisma";

function formatIngredientLine(item: {
  name: string;
  amount?: string;
  unit?: string;
  price?: string;
  note?: string;
}) {
  const amountText = `${item.amount || ""}${item.unit || ""}`.trim();
  const parts = [item.name];

  if (amountText) {
    parts.push(amountText);
  }

  if (item.price) {
    parts.push(`￥${item.price}`);
  }

  if (item.note) {
    parts.push(item.note);
  }

  return parts.join(" / ");
}

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
        ingredientDetails: true,
        description: true,
      },
    });

    const summaryItems = Array.from(
      new Set(
        dishes.flatMap((dish) => {
          const detailItems = parseIngredientDetails(
            dish.ingredientDetails,
            dish.ingredients
          );

          if (detailItems.length > 0) {
            return detailItems.map((item) => formatIngredientLine(item));
          }

          return splitDishField(dish.ingredients);
        })
      )
    );

    const groceryList = dishes.flatMap((dish) => {
      const detailItems = parseIngredientDetails(
        dish.ingredientDetails,
        dish.ingredients
      );
      const noteParts = [] as string[];

      if (detailItems.length > 0) {
        noteParts.push(`食材：\n${detailItems.map((item) => `- ${formatIngredientLine(item)}`).join("\n")}`);
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
