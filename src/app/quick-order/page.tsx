"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  ChefHat,
  Users,
  Check,
  Plus,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MEAL_TYPES } from "@/lib/image-utils";
import { MealTypeIcon } from "@/components/CategoryIcon";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getDefaultMealDate() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function getDefaultMealTime() {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function getDefaultMealType() {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 21) return "dinner";
  return "snack";
}

const COMMON_REMARK_TAGS = [
  "少盐", "少油", "不要辣", "微辣", "多放葱", "不要香菜",
  "少糖", "多加醋", "不要蒜", "清淡", "多放肉", "加蛋",
];

interface Chef {
  id: string;
  name: string;
  avatar: string | null;
}

interface ParsedDish {
  name: string;
  addToMenu: boolean;
  note: string;
}

export default function QuickOrderPage() {
  const [rawText, setRawText] = useState("");
  const [dishes, setDishes] = useState<ParsedDish[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const [mealDate, setMealDate] = useState(getDefaultMealDate);
  const [mealType, setMealType] = useState(getDefaultMealType);
  const [mealTime, setMealTime] = useState(getDefaultMealTime);
  const [chefId, setChefId] = useState("");
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(true);
  const [personCount, setPersonCount] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Parse textarea into dish list
  useEffect(() => {
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    setDishes((prev) => {
      const newDishes: ParsedDish[] = lines.map((name) => {
        const existing = prev.find((d) => d.name === name);
        return existing || { name, addToMenu: false, note: "" };
      });
      return newDishes;
    });
  }, [rawText]);

  useEffect(() => {
    let cancelled = false;
    const loadChefs = async () => {
      try {
        const res = await fetch("/api/chefs");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载厨师列表失败");
        if (!cancelled) setChefs(data);
      } catch (error) {
        if (!cancelled) alert(error instanceof Error ? error.message : "加载厨师列表失败");
      } finally {
        if (!cancelled) setLoadingChefs(false);
      }
    };
    void loadChefs();
    return () => { cancelled = true; };
  }, []);

  const updateDish = (idx: number, patch: Partial<ParsedDish>) => {
    setDishes((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const handleSubmit = async () => {
    if (!dishes.length || !mealDate || !chefId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: mealDate,
          mealType,
          mealTime: mealTime || null,
          chefId,
          personCount,
          note: note.trim() || null,
          dishes: dishes.map((d) => ({
            name: d.name,
            addToMenu: d.addToMenu,
            note: d.note.trim() || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "快捷下单失败");
      setSuccess(true);
      setRawText("");
      setNote("");
      setDishes([]);
    } catch (error) {
      alert(error instanceof Error ? error.message : "快捷下单失败");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={28} strokeWidth={1.5} className="text-stone-700" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900 mb-2">下单成功</h2>
        <p className="text-sm text-stone-400 mb-8">已记录到用餐历史</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setSuccess(false)}
            className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.97] transition-all"
          >
            <Plus size={14} className="inline mr-1.5" />
            继续下单
          </button>
          <a
            href="/history"
            className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 active:scale-[0.97] transition-all"
          >
            查看记录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      {/* Header */}
      <div className="pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
            <Zap size={15} strokeWidth={1.5} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">快捷下单</h1>
        </div>
        <p className="text-xs text-stone-400 mt-1 ml-[42px]">
          直接输入菜名，无需从菜品库选择
        </p>
      </div>

      <div className="space-y-5">
        {/* Dish name input */}
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
            输入菜名（一行一个）
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"红烧肉\n西红柿炒蛋\n紫菜蛋花汤\n米饭"}
            rows={5}
            className="w-full px-3 py-3 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm leading-relaxed resize-none transition-all font-mono"
          />
        </div>

        {/* Parsed dish list with addToMenu + notes */}
        {dishes.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
              菜品确认（{dishes.length} 道）
            </label>
            <div className="space-y-1.5">
              {dishes.map((dish, idx) => {
                const isExpanded = expandedIdx === idx;
                return (
                  <div
                    key={`${dish.name}-${idx}`}
                    className="rounded-xl border border-stone-100 overflow-hidden transition-all"
                  >
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50">
                      <span className="text-sm font-medium text-stone-700 flex-1 flex items-center gap-1.5">
                        {dish.name}
                        {dish.note && <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
                      </span>

                      {/* Add to menu toggle */}
                      <button
                        type="button"
                        onClick={() => updateDish(idx, { addToMenu: !dish.addToMenu })}
                        className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                          dish.addToMenu
                            ? "bg-stone-900 text-white"
                            : "bg-white text-stone-400 border border-stone-200 hover:text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        {dish.addToMenu ? "已加入菜单" : "加入菜单"}
                      </button>

                      {/* Expand note */}
                      <button
                        type="button"
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        className="shrink-0 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-all"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <MessageSquare size={14} />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-3 py-3 bg-white space-y-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_REMARK_TAGS.map((tag) => {
                            const isActive = dish.note.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    const cleaned = dish.note
                                      .replace(tag, "")
                                      .replace(/[，,]\s*[，,]/g, "，")
                                      .replace(/^[，,\s]+|[，,\s]+$/g, "")
                                      .trim();
                                    updateDish(idx, { note: cleaned });
                                  } else {
                                    updateDish(idx, {
                                      note: dish.note ? `${dish.note}，${tag}` : tag,
                                    });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                                  isActive
                                    ? "bg-stone-900 text-white"
                                    : "bg-stone-50 text-stone-500 border border-stone-100 hover:bg-stone-100 hover:border-stone-200"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={dish.note}
                          onChange={(e) => updateDish(idx, { note: e.target.value })}
                          placeholder="自定义备注..."
                          className="w-full px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm transition-all"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Meal type */}
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
            用餐类型
          </label>
          <div className="flex gap-1.5">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMealType(m.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 flex items-center justify-center gap-1.5 ${
                  mealType === m.value
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100 hover:border-stone-200 active:scale-[0.97]"
                }`}
              >
                <MealTypeIcon
                  mealType={m.value}
                  size={14}
                  className={mealType === m.value ? "text-stone-400" : "text-stone-400"}
                />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
              用餐日期
            </label>
            <input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
              用餐时间
            </label>
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium transition-all"
            />
          </div>
        </div>

        {/* Chef */}
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <ChefHat size={14} strokeWidth={1.5} className="text-stone-400" /> 主厨是谁？
          </label>
          {loadingChefs ? (
            <div className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 text-sm text-stone-400">
              正在加载厨师列表...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {chefs.map((chef) => (
                <button
                  key={chef.id}
                  type="button"
                  onClick={() => setChefId(chef.id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                    chefId === chef.id
                      ? "bg-stone-900 text-white shadow-sm"
                      : "bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100 hover:border-stone-200 active:scale-[0.97]"
                  }`}
                >
                  {chef.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Person count */}
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={14} strokeWidth={1.5} className="text-stone-400" /> 用餐人数
          </label>
          <div className="flex items-center gap-3 bg-stone-50 w-max p-0.5 rounded-full border border-stone-100">
            <button
              type="button"
              onClick={() => setPersonCount(Math.max(1, personCount - 1))}
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center text-lg font-medium transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              -
            </button>
            <span className="text-lg font-semibold text-stone-900 w-6 text-center tabular-nums">
              {personCount}
            </span>
            <button
              type="button"
              onClick={() => setPersonCount(Math.min(20, personCount + 1))}
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center text-lg font-medium transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              +
            </button>
          </div>
        </div>

        {/* General note */}
        <div>
          <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">
            整体备注
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="整体要求或特殊说明..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm resize-none transition-all"
          />
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            onClick={handleSubmit}
            disabled={saving || !dishes.length || !mealDate || !chefId || loadingChefs}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                下单中...
              </>
            ) : (
              <>
                <Zap size={16} strokeWidth={2} />
                确认下单
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
