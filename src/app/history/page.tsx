"use client";

import { useState, useEffect } from "react";
import { Trash2, CalendarDays, Users, ChefHat, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCategoryEmoji } from "@/lib/categories";
import { getMealTypeEmoji, getMealTypeLabel } from "@/lib/image-utils";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MealDish {
  id: string;
  dish: Dish;
}

interface MealRecord {
  id: string;
  date: string;
  mealType: string;
  mealTime: string | null;
  chef: string | null;
  personCount: number;
  note: string | null;
  createdAt: string;
  mealDishes: MealDish[];
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-orange-600">
                    {formatDate(meal.date)}
                  </span>
                  <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {getMealTypeEmoji(meal.mealType)} {getMealTypeLabel(meal.mealType)}
                  </span>
                  {meal.mealTime && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400">
                      <Clock size={10} /> {meal.mealTime}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(meal.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Meta info: chef & person count */}
              <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                <span className="text-gray-400">{meal.date}</span>
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

              <div className="flex flex-wrap gap-2">
                {meal.mealDishes.map((md) => (
                  <span
                    key={md.id}
                    className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                  >
                    {getCategoryEmoji(md.dish.category)} {md.dish.name}
                  </span>
                ))}
              </div>
              {meal.note && (
                <p className="text-xs text-gray-400 mt-2">📝 {meal.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
