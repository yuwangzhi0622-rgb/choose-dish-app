import { getAllChefs } from "@/lib/chef-service";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const chefs = await getAllChefs();
    return NextResponse.json(chefs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "加载厨师列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body as { name?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "厨师名称不能为空" },
        { status: 400 }
      );
    }

    const existing = await prisma.chef.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该厨师名称已存在" },
        { status: 409 }
      );
    }

    const chef = await prisma.chef.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(chef, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建厨师失败" },
      { status: 500 }
    );
  }
}
