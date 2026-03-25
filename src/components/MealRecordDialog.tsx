"use client";

import { useState } from "react";
import { X, Check, Users, ChefHat } from "lucide-react";
import { MEAL_TYPES } from "@/lib/image-utils";

interface MealRecordDialogProps {
  dishIds: string[];
  comboId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function MealRecordDialog({
  dishIds,
  comboId,
  onClose,
  onSaved,
}: MealRecordDialogProps) {
  const [mealType, setMealType] = useState("lunch");
  const [mealTime, setMealTime] = useState("");
  const [chef, setChef] = useState("");
  const [personCount, setPersonCount] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!dishIds.length) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          dishIds,
          comboId,
          mealType,
          mealTime: mealTime || null,
          chef: chef.trim() || null,
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
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">记录用餐</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Meal type */}
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">用餐类型</label>
          <div className="flex gap-2">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMealType(m.value)}
                className={`flex-1 py-2 rounded-xl text-sm transition-colors ${
                  mealType === m.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time & Chef */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">用餐时间</label>
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 flex items-center gap-1">
              <ChefHat size={14} /> 厨师
            </label>
            <input
              type="text"
              value={chef}
              onChange={(e) => setChef(e.target.value)}
              placeholder="谁做的？"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
            />
          </div>
        </div>

        {/* Person count */}
        <div>
          <label className="text-sm text-gray-600 mb-1.5 flex items-center gap-1">
            <Users size={14} /> 用餐人数
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPersonCount(Math.max(1, personCount - 1))}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-medium"
            >
              -
            </button>
            <span className="text-lg font-semibold text-gray-900 w-8 text-center">
              {personCount}
            </span>
            <button
              type="button"
              onClick={() => setPersonCount(Math.min(20, personCount + 1))}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
            <span className="text-sm text-gray-400">人</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm text-gray-600 mb-1.5 block">备注（忌口、特殊要求等）</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="如：少盐、不要香菜、微辣..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <Check size={18} />
          {saving ? "记录中..." : "确认记录"}
        </button>
      </div>
    </div>
  );
}
