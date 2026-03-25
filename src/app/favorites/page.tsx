"use client";

import { useState, useEffect } from "react";
import { Heart, Trash2, Save, HeartOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCategoryEmoji, getCategoryLabel } from "@/lib/categories";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface ComboDish {
  id: string;
  dish: Dish;
}

interface Combo {
  id: string;
  name: string;
  isFavorite: boolean;
  createdAt: string;
  comboDishes: ComboDish[];
}

export default function FavoritesPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCombos = async () => {
    const res = await fetch("/api/combos?favorites=true");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "加载收藏失败");
    }

    setCombos(data);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadCombos = async () => {
      try {
        const res = await fetch("/api/combos?favorites=true");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "加载收藏失败");
        }

        if (!cancelled) {
          setCombos(data);
        }
      } catch (error) {
        if (!cancelled) {
          alert(error instanceof Error ? error.message : "加载收藏失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCombos();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFavorite = async (combo: Combo) => {
    try {
      const res = await fetch(`/api/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !combo.isFavorite }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新收藏状态失败");
      }

      await fetchCombos();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新收藏状态失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这个搭配方案吗？")) return;

    try {
      const res = await fetch(`/api/combos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "删除搭配失败");
      }

      await fetchCombos();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除搭配失败");
    }
  };

  const handleUseCombo = async (combo: Combo) => {
    const today = new Date().toISOString().split("T")[0];
    const dishIds = combo.comboDishes.map((cd) => cd.dish.id);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, dishIds, comboId: combo.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "记录用餐失败");
      }

      alert("已记录到今日用餐！");
    } catch (error) {
      alert(error instanceof Error ? error.message : "记录用餐失败");
    }
  };

  // Group dishes by category for display
  const groupDishes = (comboDishes: ComboDish[]) => {
    const groups: Record<string, Dish[]> = {};
    comboDishes.forEach((cd) => {
      if (!groups[cd.dish.category]) groups[cd.dish.category] = [];
      groups[cd.dish.category].push(cd.dish);
    });
    return groups;
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
        title="收藏搭配"
        description={`共 ${combos.length} 个方案`}
      />

      {combos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Heart size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg mb-2">暂无收藏</p>
          <p className="text-sm">去推荐页面生成搭配并收藏吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combos.map((combo) => {
            const groups = groupDishes(combo.comboDishes);
            return (
              <div
                key={combo.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{combo.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFavorite(combo)}
                      className="p-2 text-pink-500 hover:text-pink-600 transition-colors"
                    >
                      {combo.isFavorite ? (
                        <Heart size={18} fill="currentColor" />
                      ) : (
                        <HeartOff size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {Object.entries(groups).map(([category, dishes]) => (
                    <div key={category} className="flex items-start gap-2">
                      <span className="text-xs text-gray-400 shrink-0 mt-0.5 w-16">
                        {getCategoryEmoji(category)}{" "}
                        {getCategoryLabel(category)}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dishes.map((dish) => (
                          <span
                            key={dish.id}
                            className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-medium"
                          >
                            {dish.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUseCombo(combo)}
                  className="w-full flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  <Save size={15} />
                  今天吃这个
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
