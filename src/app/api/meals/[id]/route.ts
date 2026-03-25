import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { orderStatus, feedbackRating, feedbackComment } = body as {
      orderStatus?: string;
      feedbackRating?: number | null;
      feedbackComment?: string | null;
    };

    const validStatuses = ["pending", "accepted", "rejected", "completed"];

    if (orderStatus !== undefined && !validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: "无效的接单状态" },
        { status: 400 }
      );
    }

    if (
      feedbackRating !== undefined &&
      feedbackRating !== null &&
      (!Number.isInteger(feedbackRating) || feedbackRating < 1 || feedbackRating > 5)
    ) {
      return NextResponse.json(
        { error: "评分需为 1 到 5 星" },
        { status: 400 }
      );
    }

    const meal = await prisma.mealRecord.update({
      where: { id },
      data: {
        orderStatus: orderStatus ?? undefined,
        feedbackRating:
          feedbackRating === undefined ? undefined : (feedbackRating ?? null),
        feedbackComment:
          feedbackComment === undefined ? undefined : (feedbackComment || null),
      },
      include: {
        mealDishes: { include: { dish: true } },
      },
    });

    return NextResponse.json(meal);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新用餐记录失败",
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
    await prisma.mealRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除用餐记录失败",
      },
      { status: 500 }
    );
  }
}
