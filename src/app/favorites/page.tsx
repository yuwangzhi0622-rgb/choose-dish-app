"use client";

import { useState, useEffect } from "react";
import { Heart, Trash2, Save, HeartOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MealRecordDialog from "@/components/MealRecordDialog";
import { getCategoryLabel } from "@/lib/categories";
import { CategoryIcon, SpiceIndicator } from "@/components/CategoryIcon";

interface Dish {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  spiceLevel?: number;
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
  const [mealCombo, setMealCombo] = useState<Combo | null>(null);

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

  const handleUseCombo = (combo: Combo) => {
    setMealCombo(combo);
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
        <div className="text-stone-400 font-medium tracking-wide">加载中...</div>
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
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
          <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart size={22} strokeWidth={1.5} className="text-stone-300" />
          </div>
          <p className="text-lg font-semibold text-stone-900 mb-1">暂无收藏</p>
          <p className="text-sm text-stone-400">去推荐页面生成搭配并收藏吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combos.map((combo) => {
            const groups = groupDishes(combo.comboDishes);
            return (
              <div
                key={combo.id}
                className="bg-white rounded-2xl p-4 border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-900 text-sm">{combo.name}</h3>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleToggleFavorite(combo)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all active:scale-90"
                    >
                      {combo.isFavorite ? (
                        <Heart size={16} fill="currentColor" strokeWidth={1.5} className="text-stone-700" />
                      ) : (
                        <HeartOff size={16} strokeWidth={1.5} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id)}
                      className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {Object.entries(groups).map(([category, dishes]) => (
                    <div key={category} className="flex items-start gap-2">
                      <span className="text-[10px] text-stone-400 shrink-0 mt-0.5 w-14 flex items-center gap-1">
                        <CategoryIcon category={category} size={11} className="text-stone-400" />
                        {getCategoryLabel(category)}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dishes.map((dish) => (
                          <span
                            key={dish.id}
                            className="inline-flex items-center gap-1 bg-stone-50 text-stone-600 px-2 py-1 rounded-lg text-[10px] font-medium border border-stone-100"
                          >
                            {dish.imageUrl ? (
                              <img src={dish.imageUrl} alt={dish.name} className="w-3.5 h-3.5 rounded object-cover" />
                            ) : null}
                            {dish.name}
                            {(dish.spiceLevel ?? 0) > 0 && <SpiceIndicator level={dish.spiceLevel!} size={8} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUseCombo(combo)}
                  className="w-full flex items-center justify-center gap-1.5 bg-stone-900 text-white py-2 rounded-xl text-xs font-medium hover:bg-stone-800 active:scale-[0.98] transition-all"
                >
                  <Save size={13} strokeWidth={1.5} />
                  今天吃这个
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Meal record dialog */}
      {mealCombo && (
        <MealRecordDialog
          dishIds={mealCombo.comboDishes.map((cd) => cd.dish.id)}
          comboId={mealCombo.id}
          onClose={() => setMealCombo(null)}
          onSaved={() => {
            setMealCombo(null);
            alert("已记录到今日用餐！");
          }}
        />
      )}
    </div>
  );
}
