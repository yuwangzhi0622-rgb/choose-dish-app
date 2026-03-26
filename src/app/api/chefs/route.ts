import { ensureFixedChefs } from "@/lib/chef-service";
import { isFixedChefName } from "@/lib/chef-catalog";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const chefs = await ensureFixedChefs();
    return NextResponse.json(chefs);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "加载厨师列表失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar } = body as {
      name?: string;
      avatar?: string | null;
    };

    if (!name || !isFixedChefName(name)) {
      return NextResponse.json(
        { error: "只能使用预设厨师名单" },
        { status: 400 }
      );
    }

    const chef = await prisma.chef.upsert({
      where: { name },
      update: {
        avatar: avatar || null,
      },
      create: {
        name,
        avatar: avatar || null,
      },
    });

    return NextResponse.json(chef, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "保存厨师失败",
      },
      { status: 500 }
    );
  }
}
