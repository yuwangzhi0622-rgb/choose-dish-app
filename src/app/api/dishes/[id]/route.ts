import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      category,
      imageUrl,
      spiceLevel,
      sweetnessLevel,
      difficulty,
      prepTime,
      ingredients,
      tags,
      description,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "名称和分类不能为空" },
        { status: 400 }
      );
    }

    const dish = await prisma.dish.update({
      where: { id },
      data: {
        name,
        category,
        imageUrl: imageUrl === undefined ? undefined : (imageUrl || null),
        spiceLevel: spiceLevel ?? undefined,
        sweetnessLevel: sweetnessLevel ?? undefined,
        difficulty: difficulty || undefined,
        prepTime: prepTime === undefined ? undefined : (prepTime ?? null),
        ingredients: ingredients === undefined ? undefined : (ingredients || null),
        tags: tags === undefined ? undefined : (tags || null),
        description: description === undefined ? undefined : (description || null),
      },
    });

    return NextResponse.json(dish);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新菜品失败",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.dish.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除菜品失败",
      },
      { status: 500 }
    );
  }
}
