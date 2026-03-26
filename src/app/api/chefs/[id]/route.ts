import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "厨师名称不能为空" },
        { status: 400 }
      );
    }

    const existing = await prisma.chef.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "厨师不存在" },
        { status: 404 }
      );
    }

    if (existing.name !== name.trim()) {
      const duplicate = await prisma.chef.findUnique({
        where: { name: name.trim() },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "该厨师名称已存在" },
          { status: 409 }
        );
      }
    }

    const chef = await prisma.chef.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(chef);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新厨师失败" },
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

    const existing = await prisma.chef.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "厨师不存在" },
        { status: 404 }
      );
    }

    await prisma.mealRecord.updateMany({
      where: { chefId: id },
      data: { chefId: null },
    });

    await prisma.chef.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除厨师失败" },
      { status: 500 }
    );
  }
}
