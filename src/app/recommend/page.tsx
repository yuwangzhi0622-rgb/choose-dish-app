"use client";

import { useState, useEffect } from "react";
import { Shuffle, Heart, Save, Minus, Plus, Clock, ChevronRight, X } from "lucide-react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      
      // Scroll to result slightly delayed for smooth effect
      setTimeout(() => {
        document.getElementById("recommend-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
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
    <div className="max-w-[800px] mx-auto pb-16">
      <div className="text-center mb-10 mt-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3">
          不知道吃什么？
        </h1>
        <p className="text-lg text-gray-500">
          设定分类和数量，为你智能推荐今日最佳搭配
        </p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100 mb-8 transition-all">
        {/* Category selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">1. 选择想要吃的分类</h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = rules.some((r) => r.category === cat.value);
              const count = dishCounts[cat.value] || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-4 py-2.5 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent hover:border-gray-300"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[13px] ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count controls */}
        {rules.length > 0 && (
          <div className="mb-8 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4">2. 设定数量</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rules.map((rule, index) => (
                <div
                  key={rule.category}
                  className="flex items-center justify-between bg-gray-50/80 rounded-2xl px-5 py-3 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
                >
                  <span className="text-[15px] font-semibold text-gray-800 flex items-center gap-2">
                    <span className="text-xl">{getCategoryEmoji(rule.category)}</span>
                    {getCategoryLabel(rule.category)}
                  </span>
                  <div className="flex items-center gap-4 bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                    <button
                      onClick={() => updateRuleCount(index, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="减少"
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </button>
                    <span className="w-4 text-center font-bold text-gray-900 text-base">
                      {rule.count}
                    </span>
                    <button
                      onClick={() => updateRuleCount(index, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="增加"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced options toggle */}
        <div className="border-t border-gray-100 pt-6 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-[15px] font-medium text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus:text-blue-600"
          >
            {showAdvanced ? "收起高级筛选项" : "展开高级筛选项"} 
            <ChevronRight size={16} className={`transition-transform duration-300 ${showAdvanced ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Advanced options */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-300 overflow-hidden ${showAdvanced ? "max-h-[500px] opacity-100 mb-8" : "max-h-0 opacity-0 mb-0"}`}>
          <div className="sm:col-span-1 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500">
            <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">防重复天数</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="30"
                value={excludeDays}
                onChange={(e) => setExcludeDays(Math.max(0, Number(e.target.value || 0)))}
                className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-base font-semibold focus:outline-none focus:border-blue-500 text-center"
              />
              <span className="text-sm text-gray-500 font-medium">天内吃过的不再推荐</span>
            </div>
          </div>
          <div className="sm:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500">
            <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">排除特定口味或食材</label>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={avoidIngredients}
                  onChange={(e) => setAvoidIngredients(e.target.value)}
                  placeholder="如：香菜、肥肉、芹菜 (顿号分隔)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[15px] focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={avoidTags}
                  onChange={(e) => setAvoidTags(e.target.value)}
                  placeholder="如：油炸、辛辣、重口 (顿号分隔)"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[15px] focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleRecommend}
          disabled={loading || rules.filter((r) => r.count > 0).length === 0}
          className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-gray-900 text-white py-4 sm:py-5 rounded-2xl text-[17px] font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-gray-900/20 focus:outline-none focus:ring-4 focus:ring-gray-900/30"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在为你精心搭配...
            </>
          ) : (
            <>
              <Shuffle size={20} className="group-hover:rotate-180 transition-transform duration-500" strokeWidth={2.5} />
              一键生成搭配
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result.length > 0 && (
        <div id="recommend-result" className="scroll-mt-24 bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="text-3xl">✨</span> 今日最佳搭配
            </h3>
            <div className="text-gray-400 font-medium">
              共 {result.reduce((sum, group) => sum + group.dishes.length, 0)} 道菜
            </div>
          </div>
          
          <div className="space-y-8">
            {result.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{getCategoryEmoji(group.category)}</span>
                  <h4 className="text-lg font-bold text-gray-800 tracking-tight">
                    {getCategoryLabel(group.category)}
                  </h4>
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-semibold ml-1">
                    {group.dishes.length}
                  </span>
                </div>
                
                {group.dishes.length === 0 ? (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-500 border border-gray-100 border-dashed">
                    该分类下没有找到符合条件的菜品，请调整规则或添加新菜。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.dishes.map((dish) => (
                      <div key={dish.id} className="flex gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt={dish.name} className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center text-4xl shrink-0 border border-gray-100 group-hover:scale-105 transition-transform">
                            {getCategoryEmoji(dish.category)}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <div className="text-lg font-bold text-gray-900 tracking-tight truncate mb-1">
                            {dish.name}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500 mb-2">
                            <span className="font-medium text-gray-600">{getDifficultyLabel(dish.difficulty || "medium")}</span>
                            {dish.prepTime && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock size={12} />{dish.prepTime}m
                                </span>
                              </>
                            )}
                            {(dish.spiceLevel ?? 0) > 0 && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-red-500 text-[10px]">{"🌶️".repeat(dish.spiceLevel!)}</span>
                              </>
                            )}
                          </div>

                          {(splitDishField(dish.ingredients).length > 0 || splitDishField(dish.tags).length > 0) && (
                            <div className="flex flex-wrap gap-1.5">
                              {splitDishField(dish.ingredients).slice(0, 3).map((item) => (
                                <span key={`${dish.id}-ing-${item}`} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium">
                                  {item}
                                </span>
                              ))}
                              {splitDishField(dish.tags).slice(0, 2).map((item) => (
                                <span key={`${dish.id}-tag-${item}`} className="text-[11px] text-blue-600 font-medium">
                                  #{item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-[40%] flex gap-2">
              <input
                type="text"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="搭配方案名称..."
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
              />
              <button
                onClick={handleSaveCombo}
                disabled={saved || !comboName.trim()}
                className={`flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl text-[15px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                  saved 
                    ? "bg-pink-100 text-pink-600 cursor-not-allowed" 
                    : "bg-white text-pink-600 border border-pink-200 hover:bg-pink-50 shadow-sm"
                }`}
              >
                <Heart size={18} fill={saved ? "currentColor" : "none"} />
                {saved ? "已收藏" : "收藏"}
              </button>
            </div>
            
            <button
              onClick={handleSaveAsMeal}
              className="w-full sm:w-[60%] flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl text-[17px] font-bold hover:bg-blue-700 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/30"
            >
              就吃这个！确认下单 <ChevronRight size={18} strokeWidth={2.5} />
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
            alert("下单成功！已记录今日用餐！");
          }}
        />
      )}
    </div>
  );
}
