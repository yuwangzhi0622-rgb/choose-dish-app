import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const combo = await prisma.combo.update({
      where: { id },
      data: body,
      include: {
        comboDishes: { include: { dish: true } },
      },
    });

    return NextResponse.json(combo);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新搭配失败",
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
    await prisma.combo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除搭配失败",
      },
      { status: 500 }
    );
  }
}
