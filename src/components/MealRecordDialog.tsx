"use client";

import { useEffect, useState } from "react";
import { X, Check, Users, ChefHat } from "lucide-react";
import { MEAL_TYPES } from "@/lib/image-utils";

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
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-[2rem] w-full max-w-lg p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-8 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto flex flex-col gap-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">记录用餐</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="关闭"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Meal type */}
          <div>
            <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">用餐类型</label>
            <div className="flex gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMealType(m.value)}
                  className={`flex-1 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    mealType === m.value
                      ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Chef */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">用餐日期</label>
              <input
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] font-medium transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">用餐时间</label>
              <input
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] font-medium transition-all"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <ChefHat size={16} className="text-gray-400" /> 主厨是谁？
            </label>
            {loadingChefs ? (
              <div className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-[15px] text-gray-400">
                正在加载厨师列表...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {chefs.map((chef) => (
                  <button
                    key={chef.id}
                    type="button"
                    onClick={() => setChefId(chef.id)}
                    className={`px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      chefId === chef.id
                        ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
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
            <label className="text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={16} className="text-gray-400" /> 用餐人数
            </label>
            <div className="flex items-center gap-4 bg-gray-50 w-max p-1.5 rounded-full border border-gray-100">
              <button
                type="button"
                onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                -
              </button>
              <span className="text-xl font-bold text-gray-900 w-8 text-center tabular-nums">
                {personCount}
              </span>
              <button
                type="button"
                onClick={() => setPersonCount(Math.min(20, personCount + 1))}
                className="w-10 h-10 rounded-full bg-white shadow-sm hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[13px] font-bold text-gray-700 mb-2 block uppercase tracking-wider">补充备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="如：少盐、不要香菜、微辣..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] resize-none transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !mealDate || !chefId || loadingChefs}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-full text-[17px] font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                记录中...
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={2.5} />
                确认记录
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
