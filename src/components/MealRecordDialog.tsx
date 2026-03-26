"use client";

import { useEffect, useState } from "react";
import { X, Check, Users, ChefHat, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
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

  if (hour < 10) {
    return "breakfast";
  }

  if (hour < 15) {
    return "lunch";
  }

  if (hour < 21) {
    return "dinner";
  }

  return "snack";
}

const COMMON_REMARK_TAGS = [
  "少盐", "少油", "不要辣", "微辣", "多放葱", "不要香菜",
  "少糖", "多加醋", "不要蒜", "清淡", "多放肉", "少放肉",
  "要嫩一点", "老一点", "加蛋", "不要味精",
];

interface DishInfo {
  id: string;
  name: string;
  category: string;
}

interface MealRecordDialogProps {
  dishIds: string[];
  comboId?: string;
  onClose: () => void;
  onSaved: () => void;
}

interface Chef {
  id: string;
  name: string;
  avatar: string | null;
}

export default function MealRecordDialog({
  dishIds,
  comboId,
  onClose,
  onSaved,
}: MealRecordDialogProps) {
  const [mealDate, setMealDate] = useState(getDefaultMealDate);
  const [mealType, setMealType] = useState(getDefaultMealType);
  const [mealTime, setMealTime] = useState(getDefaultMealTime);
  const [chefId, setChefId] = useState("");
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(true);
  const [personCount, setPersonCount] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [dishes, setDishes] = useState<DishInfo[]>([]);
  const [dishNotes, setDishNotes] = useState<Record<string, string>>({});
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    const loadDishes = async () => {
      try {
        const res = await fetch("/api/dishes");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) {
          const uniqueIds = [...new Set(dishIds)];
          const dishMap = new Map(data.map((d: DishInfo) => [d.id, d]));
          setDishes(uniqueIds.map((id) => dishMap.get(id)).filter(Boolean) as DishInfo[]);
        }
      } catch {
        // silent fail, dish names are a nice-to-have
      }
    };

    void loadDishes();

    return () => { cancelled = true; };
  }, [dishIds]);

  useEffect(() => {
    let cancelled = false;

    const loadChefs = async () => {
      try {
        const response = await fetch("/api/chefs");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "加载厨师列表失败");
        }

        if (!cancelled) {
          setChefs(data);
        }
      } catch (error) {
        if (!cancelled) {
          alert(error instanceof Error ? error.message : "加载厨师列表失败");
        }
      } finally {
        if (!cancelled) {
          setLoadingChefs(false);
        }
      }
    };

    void loadChefs();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!dishIds.length || !mealDate || !chefId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: mealDate,
          dishIds,
          comboId,
          mealType,
          mealTime: mealTime || null,
          chefId,
          personCount,
          note: note.trim() || null,
          dishNotes: Object.fromEntries(
            Object.entries(dishNotes).filter(([, v]) => v.trim())
          ),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "记录用餐失败");
      }

      onSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : "记录用餐失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-7 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto flex flex-col gap-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-900 tracking-tight">记录用餐</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
            aria-label="关闭"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Meal type */}
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">用餐类型</label>
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
                  <MealTypeIcon mealType={m.value} size={14} className={mealType === m.value ? "text-stone-400" : "text-stone-400"} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Chef */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">用餐日期</label>
              <input
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">用餐时间</label>
              <input
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium transition-all"
              />
            </div>
          </div>
          
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

          {/* Per-dish remarks */}
          {dishes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} strokeWidth={1.5} className="text-stone-400" /> 菜品备注
              </label>
              <div className="space-y-1.5">
                {dishes.map((dish) => {
                  const isExpanded = expandedDishId === dish.id;
                  const currentNote = dishNotes[dish.id] || "";
                  return (
                    <div key={dish.id} className="rounded-xl border border-stone-100 overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedDishId(isExpanded ? null : dish.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-stone-50 hover:bg-stone-100 transition-all text-left"
                      >
                        <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                          {dish.name}
                          {currentNote && <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />}
                        </span>
                        {isExpanded ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
                      </button>
                      {isExpanded && (
                        <div className="px-3 py-3 bg-white space-y-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {COMMON_REMARK_TAGS.map((tag) => {
                              const isActive = currentNote.includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    if (isActive) {
                                      setDishNotes((prev) => ({
                                        ...prev,
                                        [dish.id]: prev[dish.id]?.replace(tag, "").replace(/[，,]\s*[，,]/g, "，").replace(/^[，,\s]+|[，,\s]+$/g, "").trim() || "",
                                      }));
                                    } else {
                                      setDishNotes((prev) => ({
                                        ...prev,
                                        [dish.id]: prev[dish.id] ? `${prev[dish.id]}，${tag}` : tag,
                                      }));
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
                            value={currentNote}
                            onChange={(e) => setDishNotes((prev) => ({ ...prev, [dish.id]: e.target.value }))}
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

          {/* General Notes */}
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">整体备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="整体要求或特殊说明..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm resize-none transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !mealDate || !chefId || loadingChefs}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                记录中...
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2} />
                确认记录
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
