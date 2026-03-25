"use client";

import { useState, useEffect } from "react";
import { Trash2, CalendarDays, Users, ChefHat, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCategoryEmoji } from "@/lib/categories";
import {
  getMealTypeEmoji,
  getMealTypeLabel,
  getOrderStatusEmoji,
  getOrderStatusLabel,
} from "@/lib/image-utils";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MealDish {
  id: string;
  quantity: number;
  dish: Dish;
}

interface MealRecord {
  id: string;
  date: string;
  mealType: string;
  mealTime: string | null;
  chef: string | null;
  personCount: number;
  orderStatus: string;
  feedbackRating: number | null;
  feedbackComment: string | null;
  note: string | null;
  createdAt: string;
  mealDishes: MealDish[];
}

interface FeedbackDraft {
  rating: number;
  comment: string;
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, FeedbackDraft>>({});

  const fetchMeals = async () => {
    const res = await fetch("/api/meals");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "加载用餐记录失败");
    }

    setMeals(data);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadMeals = async () => {
      try {
        const res = await fetch("/api/meals");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "加载用餐记录失败");
        }

        if (!cancelled) {
          setMeals(data);
        }
      } catch (error) {
        if (!cancelled) {
          alert(error instanceof Error ? error.message : "加载用餐记录失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMeals();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条用餐记录吗？")) return;

    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "删除用餐记录失败");
      }

      await fetchMeals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除用餐记录失败");
    }
  };

  const updateFeedbackDraft = (
    mealId: string,
    patch: Partial<FeedbackDraft>
  ) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [mealId]: {
        rating: prev[mealId]?.rating ?? 0,
        comment: prev[mealId]?.comment ?? "",
        ...patch,
      },
    }));
  };

  const getFeedbackDraft = (meal: MealRecord) => {
    return (
      feedbackDrafts[meal.id] ?? {
        rating: meal.feedbackRating ?? 0,
        comment: meal.feedbackComment ?? "",
      }
    );
  };

  const handlePatchMeal = async (
    id: string,
    payload: {
      orderStatus?: string;
      feedbackRating?: number | null;
      feedbackComment?: string | null;
    }
  ) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新用餐记录失败");
      }

      await fetchMeals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新用餐记录失败");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveFeedback = async (meal: MealRecord) => {
    const draft = getFeedbackDraft(meal);

    if (draft.rating < 1 || draft.rating > 5) {
      alert("请先选择 1 到 5 星评分");
      return;
    }

    await handlePatchMeal(meal.id, {
      feedbackRating: draft.rating,
      feedbackComment: draft.comment.trim() || null,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays === 2) return "前天";

    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const getStatusClassName = (status: string) => {
    if (status === "accepted") {
      return "bg-green-50 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-50 text-red-700";
    }

    if (status === "completed") {
      return "bg-blue-50 text-blue-700";
    }

    return "bg-amber-50 text-amber-700";
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="用餐记录"
        description={`共 ${meals.length} 条记录`}
      />

      {meals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-2">暂无用餐记录</p>
          <p className="text-sm">去推荐页面生成搭配并记录吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              {(() => {
                const feedbackDraft = getFeedbackDraft(meal);

                return (
                  <>
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-orange-600">
                      {formatDate(meal.date)}
                    </span>
                    <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {getMealTypeEmoji(meal.mealType)} {getMealTypeLabel(meal.mealType)}
                    </span>
                    {meal.mealTime && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-500">
                        <Clock size={10} /> {meal.mealTime}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClassName(meal.orderStatus)}`}
                    >
                      {getOrderStatusEmoji(meal.orderStatus)} {getOrderStatusLabel(meal.orderStatus)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatFullDate(meal.date)}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-0.5">
                  <CalendarDays size={12} /> {meal.date}
                </span>
                {!meal.mealTime && (
                  <span className="flex items-center gap-0.5 text-gray-400">
                    <Clock size={12} /> 未填写时间
                  </span>
                )}
                {meal.chef && (
                  <span className="flex items-center gap-0.5">
                    <ChefHat size={12} /> {meal.chef}
                  </span>
                )}
                {meal.personCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Users size={12} /> {meal.personCount}人
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {meal.orderStatus === "pending" && (
                  <>
                    <button
                      onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                      disabled={updatingId === meal.id}
                      className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                    >
                      厨师接单
                    </button>
                    <button
                      onClick={() => handlePatchMeal(meal.id, { orderStatus: "rejected" })}
                      disabled={updatingId === meal.id}
                      className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      拒绝接单
                    </button>
                  </>
                )}
                {meal.orderStatus === "accepted" && (
                  <button
                    onClick={() => handlePatchMeal(meal.id, { orderStatus: "completed" })}
                    disabled={updatingId === meal.id}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
                  >
                    标记完成
                  </button>
                )}
                {meal.orderStatus === "rejected" && (
                  <button
                    onClick={() => handlePatchMeal(meal.id, { orderStatus: "pending" })}
                    disabled={updatingId === meal.id}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 disabled:opacity-50"
                  >
                    重新待接单
                  </button>
                )}
                {meal.orderStatus === "completed" && (
                  <button
                    onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                    disabled={updatingId === meal.id}
                    className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                  >
                    改回已接单
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {meal.mealDishes.map((md) => (
                  <span
                    key={md.id}
                    className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                  >
                    {getCategoryEmoji(md.dish.category)} {md.dish.name}
                    {md.quantity > 1 ? ` ×${md.quantity}` : ""}
                  </span>
                ))}
              </div>
              {meal.note && (
                <p className="text-xs text-gray-400 mt-2">📝 {meal.note}</p>
              )}

              {(meal.orderStatus === "completed" || meal.feedbackRating || meal.feedbackComment) && (
                <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-3">
                  <div className="text-sm font-medium text-gray-900">客户反馈</div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`${meal.id}-star-${star}`}
                        type="button"
                        onClick={() => updateFeedbackDraft(meal.id, { rating: star })}
                        className={`text-xl leading-none ${star <= feedbackDraft.rating ? "text-yellow-500" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-gray-500">
                      {feedbackDraft.rating > 0 ? `${feedbackDraft.rating} 星` : "未评分"}
                    </span>
                  </div>
                  <textarea
                    value={feedbackDraft.comment}
                    onChange={(e) => updateFeedbackDraft(meal.id, { comment: e.target.value })}
                    placeholder="写下客户反馈，比如口味、分量、建议..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveFeedback(meal)}
                      disabled={updatingId === meal.id}
                      className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                      保存反馈
                    </button>
                  </div>
                </div>
              )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
