"use client";

import { useState, useEffect } from "react";
import { Shuffle, Heart, Save, Minus, Plus, Clock, ChevronRight, X, Sparkles } from "lucide-react";
import MealRecordDialog from "@/components/MealRecordDialog";
import { splitDishField, splitFilterInput } from "@/lib/dish-fields";
import {
  CATEGORIES,
  getCategoryLabel,
} from "@/lib/categories";
import { getDifficultyLabel } from "@/lib/image-utils";
import { CategoryIcon, SpiceIndicator } from "@/components/CategoryIcon";

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

        const allDishes: Dish[] = await res.json();
        const dishes = allDishes.filter((d) => !(d as Dish & { isQuickEntry?: boolean }).isQuickEntry);
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
      <div className="text-center mb-8 mt-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          不知道吃什么？
        </h1>
        <p className="text-base text-stone-400">
          设定分类和数量，为你智能推荐今日最佳搭配
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-100 mb-6">
        {/* Category selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-stone-500 tracking-wide uppercase mb-3">1. 选择分类</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = rules.some((r) => r.category === cat.value);
              const count = dishCounts[cat.value] || 0;
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 active:scale-[0.97]"
                  }`}
                >
                  <CategoryIcon category={cat.value} size={15} className={isSelected ? "text-stone-400" : "text-stone-400"} />
                  <span>{cat.label}</span>
                  <span className={`text-xs ${isSelected ? "text-stone-400" : "text-stone-300"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count controls */}
        {rules.length > 0 && (
          <div className="mb-6 animate-in fade-in duration-300">
            <h3 className="text-sm font-semibold text-stone-500 tracking-wide uppercase mb-3">2. 设定数量</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rules.map((rule, index) => (
                <div
                  key={rule.category}
                  className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-100"
                >
                  <span className="text-sm font-medium text-stone-700 flex items-center gap-2">
                    <CategoryIcon category={rule.category} size={16} className="text-stone-400" />
                    {getCategoryLabel(rule.category)}
                  </span>
                  <div className="flex items-center gap-2.5 bg-white rounded-full p-0.5 border border-stone-200">
                    <button
                      onClick={() => updateRuleCount(index, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-50 text-stone-500 hover:bg-stone-100 active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                      aria-label="减少"
                    >
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <span className="w-4 text-center font-semibold text-stone-900 text-sm tabular-nums">
                      {rule.count}
                    </span>
                    <button
                      onClick={() => updateRuleCount(index, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-900 text-white hover:bg-stone-800 active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                      aria-label="增加"
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced options toggle */}
        <div className="border-t border-stone-100 pt-5 mb-5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-stone-700 active:scale-[0.98] transition-all focus:outline-none"
          >
            {showAdvanced ? "收起高级筛选项" : "展开高级筛选项"} 
            <ChevronRight size={14} className={`transition-transform duration-300 ${showAdvanced ? "rotate-90" : ""}`} />
          </button>
        </div>

        {/* Advanced options */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all duration-300 overflow-hidden ${showAdvanced ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"}`}>
          <div className="sm:col-span-1 bg-stone-50 p-4 rounded-xl border border-stone-100">
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">防重复天数</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="30"
                value={excludeDays}
                onChange={(e) => setExcludeDays(Math.max(0, Number(e.target.value || 0)))}
                className="w-16 px-3 py-2 rounded-lg border border-stone-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-400 text-center"
              />
              <span className="text-xs text-stone-400">天内不重复</span>
            </div>
          </div>
          <div className="sm:col-span-2 bg-stone-50 p-4 rounded-xl border border-stone-100">
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">排除口味 / 食材</label>
            <div className="space-y-2">
              <input
                type="text"
                value={avoidIngredients}
                onChange={(e) => setAvoidIngredients(e.target.value)}
                placeholder="如：香菜、肥肉、芹菜"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all"
              />
              <input
                type="text"
                value={avoidTags}
                onChange={(e) => setAvoidTags(e.target.value)}
                placeholder="如：油炸、辛辣、重口"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleRecommend}
          disabled={loading || rules.filter((r) => r.count > 0).length === 0}
          className="w-full group flex items-center justify-center gap-2 bg-stone-900 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在为你精心搭配...
            </>
          ) : (
            <>
              <Shuffle size={16} className="group-hover:rotate-180 transition-transform duration-500" strokeWidth={2} />
              一键生成搭配
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result.length > 0 && (
        <div id="recommend-result" className="scroll-mt-24 bg-white rounded-2xl p-5 sm:p-7 border border-stone-100 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <h3 className="text-lg font-semibold text-stone-900 tracking-tight flex items-center gap-2">
              <Sparkles size={18} strokeWidth={1.5} className="text-stone-400" />
              今日最佳搭配
            </h3>
            <span className="text-sm text-stone-300 font-medium tabular-nums">
              共 {result.reduce((sum, group) => sum + group.dishes.length, 0)} 道
            </span>
          </div>
          
          <div className="space-y-6">
            {result.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-3">
                  <CategoryIcon category={group.category} size={16} className="text-stone-400" />
                  <h4 className="text-sm font-semibold text-stone-700">
                    {getCategoryLabel(group.category)}
                  </h4>
                  <span className="text-xs text-stone-300 tabular-nums">{group.dishes.length}</span>
                </div>
                
                {group.dishes.length === 0 ? (
                  <div className="bg-stone-50 rounded-xl p-5 text-center text-sm text-stone-400 border border-dashed border-stone-200">
                    该分类下没有找到符合条件的菜品，请调整规则或添加新菜。
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {group.dishes.map((dish) => (
                      <div key={dish.id} className="flex gap-3 p-3 rounded-xl bg-white border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all group">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt={dish.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-stone-50 flex items-center justify-center shrink-0 border border-stone-100 group-hover:scale-105 transition-transform">
                            <CategoryIcon category={dish.category} size={24} className="text-stone-300" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <div className="text-sm font-semibold text-stone-900 tracking-tight truncate mb-1">
                            {dish.name}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400 mb-1.5">
                            <span className="font-medium text-stone-500">{getDifficultyLabel(dish.difficulty || "medium")}</span>
                            {dish.prepTime && (
                              <>
                                <span className="text-stone-200">·</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock size={11} strokeWidth={1.5} />{dish.prepTime}m
                                </span>
                              </>
                            )}
                            {(dish.spiceLevel ?? 0) > 0 && (
                              <>
                                <span className="text-stone-200">·</span>
                                <SpiceIndicator level={dish.spiceLevel!} size={11} />
                              </>
                            )}
                          </div>

                          {(splitDishField(dish.ingredients).length > 0 || splitDishField(dish.tags).length > 0) && (
                            <div className="flex flex-wrap gap-1">
                              {splitDishField(dish.ingredients).slice(0, 3).map((item) => (
                                <span key={`${dish.id}-ing-${item}`} className="px-1.5 py-0.5 rounded bg-stone-50 text-stone-500 text-[11px] font-medium border border-stone-100">
                                  {item}
                                </span>
                              ))}
                              {splitDishField(dish.tags).slice(0, 2).map((item) => (
                                <span key={`${dish.id}-tag-${item}`} className="text-[11px] text-stone-400 font-medium">
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

          {/* Action Footer - fixed overlap by using proper stacking layout */}
          <div className="mt-8 pt-5 border-t border-stone-100 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={comboName}
                onChange={(e) => setComboName(e.target.value)}
                placeholder="搭配方案名称..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50 focus:bg-white transition-all"
              />
              <button
                onClick={handleSaveCombo}
                disabled={saved || !comboName.trim()}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 active:scale-[0.97] shrink-0 ${
                  saved 
                    ? "bg-stone-100 text-stone-500 cursor-not-allowed" 
                    : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <Heart size={15} fill={saved ? "currentColor" : "none"} strokeWidth={1.5} />
                {saved ? "已收藏" : "收藏"}
              </button>
            </div>
            
            <button
              onClick={handleSaveAsMeal}
              className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              就吃这个！确认下单 <ChevronRight size={16} strokeWidth={2} />
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
