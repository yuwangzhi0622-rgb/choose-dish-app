"use client";

import { useState, useEffect } from "react";
import { Shuffle, Heart, Save, Minus, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/categories";

interface Dish {
  id: string;
  name: string;
  category: string;
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
        body: JSON.stringify({ rules: activeRules }),
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

  const handleSaveAsMeal = async () => {
    const dishIds = result.flatMap((r) => r.dishes.map((d) => d.id));
    if (!dishIds.length) return;

    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, dishIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "记录用餐失败，请重试");
      }

      alert("已记录到今日用餐！");
    } catch (error) {
      alert(error instanceof Error ? error.message : "记录用餐失败，请重试");
    }
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
                <div className="flex flex-wrap gap-2">
                  {group.dishes.map((dish) => (
                    <span
                      key={dish.id}
                      className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      {dish.name}
                    </span>
                  ))}
                  {group.dishes.length === 0 && (
                    <span className="text-sm text-gray-400">
                      该分类暂无菜品
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
    </div>
  );
}
