"use client";

import { useState, useEffect } from "react";
import { Shuffle, Heart, Save, Minus, Plus, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import MealRecordDialog from "@/components/MealRecordDialog";
import { splitDishField, splitFilterInput } from "@/lib/dish-fields";
import {
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/categories";
import { getDifficultyLabel } from "@/lib/image-utils";

interface Dish {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  spiceLevel?: number;
  sweetnessLevel?: number;
  difficulty?: string;
  prepTime?: number | null;
  ingredients?: string | null;
  tags?: string | null;
  description?: string | null;
}

interface RecommendResult {
  category: string;
  dishes: Dish[];
}

interface Rule {
  category: string;
  count: number;
}

const DEFAULT_RULES: Rule[] = [
  { category: "meat", count: 2 },
  { category: "vegetable", count: 1 },
  { category: "soup", count: 1 },
];

export default function RecommendPage() {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [result, setResult] = useState<RecommendResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [comboName, setComboName] = useState("");
  const [saved, setSaved] = useState(false);
  const [dishCounts, setDishCounts] = useState<Record<string, number>>({});
  const [showMealDialog, setShowMealDialog] = useState(false);
  const [avoidIngredients, setAvoidIngredients] = useState("");
  const [avoidTags, setAvoidTags] = useState("");
  const [excludeDays, setExcludeDays] = useState(3);

  useEffect(() => {
    let cancelled = false;

    const loadDishCounts = async () => {
      try {
        const res = await fetch("/api/dishes");
        if (!res.ok) {
          return;
        }

        const dishes: Dish[] = await res.json();
        const counts: Record<string, number> = {};
        dishes.forEach((d) => {
          counts[d.category] = (counts[d.category] || 0) + 1;
        });

        if (!cancelled) {
          setDishCounts(counts);
        }
      } catch {}
    };

    void loadDishCounts();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateRuleCount = (index: number, delta: number) => {
    setRules((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, count: Math.max(0, r.count + delta) } : r
      )
    );
  };

  const toggleCategory = (categoryValue: string) => {
    setRules((prev) => {
      const exists = prev.find((r) => r.category === categoryValue);
      if (exists) {
        return prev.filter((r) => r.category !== categoryValue);
      }
      return [...prev, { category: categoryValue, count: 1 }];
    });
  };

  const handleRecommend = async () => {
    const activeRules = rules.filter((r) => r.count > 0);
    if (activeRules.length === 0) return;

    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: activeRules,
          excludeDays,
          avoidIngredients: splitFilterInput(avoidIngredients),
          avoidTags: splitFilterInput(avoidTags),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "推荐失败，请重试");
      }

      setResult(data);

      // Auto-generate combo name
      const dateStr = new Date().toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
      });
      setComboName(`${dateStr}推荐`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "推荐失败，请重试");
      setResult([]);
      setComboName("");
    }
    setLoading(false);
  };

  const handleSaveCombo = async () => {
    const dishIds = result.flatMap((r) => r.dishes.map((d) => d.id));
    if (!dishIds.length || !comboName.trim()) return;

    try {
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: comboName.trim(), dishIds, isFavorite: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "收藏失败，请重试");
      }

      setSaved(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "收藏失败，请重试");
    }
  };

  const handleSaveAsMeal = () => {
    const dishIds = result.flatMap((r) => r.dishes.map((d) => d.id));
    if (!dishIds.length) return;
    setShowMealDialog(true);
  };

  return (
    <div>
      <PageHeader title="随机推荐" description="设置搭配规则，一键生成今日菜单" />

      {/* Category selection */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">选择搭配分类</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = rules.some((r) => r.category === cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isSelected
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.emoji} {cat.label}
                {dishCounts[cat.value]
                  ? ` (${dishCounts[cat.value]})`
                  : " (0)"}
              </button>
            );
          })}
        </div>

        {/* Count controls */}
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div
              key={rule.category}
              className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5"
            >
              <span className="text-sm font-medium text-gray-700">
                {getCategoryEmoji(rule.category)}{" "}
                {getCategoryLabel(rule.category)}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateRuleCount(index, -1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center font-semibold text-gray-900">
                  {rule.count}
                </span>
                <button
                  onClick={() => updateRuleCount(index, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-gray-500 mb-1 block">最近几天不重复</label>
            <input
              type="number"
              min="0"
              max="30"
              value={excludeDays}
              onChange={(e) => setExcludeDays(Math.max(0, Number(e.target.value || 0)))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">排除食材</label>
            <input
              type="text"
              value={avoidIngredients}
              onChange={(e) => setAvoidIngredients(e.target.value)}
              placeholder="如：香菜、肥肉、芹菜"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-500 mb-1 block">排除标签</label>
            <input
              type="text"
              value={avoidTags}
              onChange={(e) => setAvoidTags(e.target.value)}
              placeholder="如：油炸、辛辣、重口"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleRecommend}
        disabled={loading || rules.filter((r) => r.count > 0).length === 0}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-2xl text-base font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md mb-4"
      >
        <Shuffle size={20} className={loading ? "animate-spin" : ""} />
        {loading ? "生成中..." : "一键生成搭配"}
      </button>

      {/* Results */}
      {result.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">🎉 推荐搭配</h3>
          <div className="space-y-3">
            {result.map((group) => (
              <div key={group.category}>
                <div className="text-xs font-medium text-gray-400 mb-1.5">
                  {getCategoryEmoji(group.category)}{" "}
                  {getCategoryLabel(group.category)}
                </div>
                <div className="space-y-1.5">
                  {group.dishes.map((dish) => (
                    <div key={dish.id}>
                      <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt={dish.name} className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <span className="text-base">{getCategoryEmoji(dish.category)}</span>
                        )}
                        <span className="text-sm font-medium text-orange-700">{dish.name}</span>
                        <div className="flex items-center gap-1.5 ml-auto text-xs text-gray-400">
                          {(dish.spiceLevel ?? 0) > 0 && <span className="text-red-500">{"🌶️".repeat(dish.spiceLevel!)}</span>}
                          {dish.prepTime && <span className="flex items-center gap-0.5"><Clock size={10} />{dish.prepTime}min</span>}
                          {dish.difficulty && <span>{getDifficultyLabel(dish.difficulty)}</span>}
                        </div>
                      </div>
                      {(splitDishField(dish.ingredients).length > 0 || splitDishField(dish.tags).length > 0) && (
                        <div className="pl-10 flex flex-wrap gap-1.5 mt-1">
                          {splitDishField(dish.ingredients).slice(0, 4).map((item) => (
                            <span
                              key={`${dish.id}-ingredient-${item}`}
                              className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px]"
                            >
                              {item}
                            </span>
                          ))}
                          {splitDishField(dish.tags).slice(0, 4).map((item) => (
                            <span
                              key={`${dish.id}-tag-${item}`}
                              className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px]"
                            >
                              #{item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {group.dishes.length === 0 && (
                    <span className="text-sm text-gray-400">
                      该分类暂无符合条件的菜品
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save actions */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="搭配方案名称"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={handleSaveCombo}
                disabled={saved}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 disabled:opacity-50 transition-colors"
              >
                <Heart size={16} />
                {saved ? "已收藏" : "收藏"}
              </button>
            </div>
            <button
              onClick={handleSaveAsMeal}
              className="w-full flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
            >
              <Save size={16} />
              就吃这个！记录到今天
            </button>
          </div>
        </div>
      )}

      {/* Meal record dialog */}
      {showMealDialog && (
        <MealRecordDialog
          dishIds={result.flatMap((r) => r.dishes.map((d) => d.id))}
          onClose={() => setShowMealDialog(false)}
          onSaved={() => {
            setShowMealDialog(false);
            alert("已记录到今日用餐！");
          }}
        />
      )}
    </div>
  );
}
