"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Camera, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/categories";
import {
  compressImage,
  SPICE_LEVELS,
  SWEETNESS_LEVELS,
  DIFFICULTY_OPTIONS,
  getDifficultyLabel,
} from "@/lib/image-utils";

interface Dish {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  spiceLevel: number;
  sweetnessLevel: number;
  difficulty: string;
  prepTime: number | null;
  description: string | null;
  createdAt: string;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("meat");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [sweetnessLevel, setSweetnessLevel] = useState(0);
  const [difficulty, setDifficulty] = useState("medium");
  const [prepTime, setPrepTime] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDishes = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/dishes");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "加载菜品失败");
      }

      setDishes(data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "加载菜品失败"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: name.trim(),
        category,
        imageUrl,
        spiceLevel,
        sweetnessLevel,
        difficulty,
        prepTime,
        description: description.trim() || null,
      };

      const res = editingDish
        ? await fetch(`/api/dishes/${editingDish.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/dishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "保存菜品失败");
      }

      resetForm();
      await fetchDishes();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "保存菜品失败"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
    } catch {
      setError("图片处理失败，请重试");
    }
  };

  const handleEdit = (dish: Dish) => {
    setError("");
    setEditingDish(dish);
    setName(dish.name);
    setCategory(dish.category);
    setImageUrl(dish.imageUrl);
    setSpiceLevel(dish.spiceLevel ?? 0);
    setSweetnessLevel(dish.sweetnessLevel ?? 0);
    setDifficulty(dish.difficulty ?? "medium");
    setPrepTime(dish.prepTime);
    setDescription(dish.description ?? "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这道菜吗？")) return;

    try {
      setError("");
      const res = await fetch(`/api/dishes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "删除菜品失败");
      }

      await fetchDishes();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除菜品失败"
      );
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingDish(null);
    setName("");
    setCategory("meat");
    setImageUrl(null);
    setSpiceLevel(0);
    setSweetnessLevel(0);
    setDifficulty("medium");
    setPrepTime(null);
    setDescription("");
  };

  const cancelForm = () => {
    setError("");
    resetForm();
  };

  const filteredDishes =
    filterCategory === "all"
      ? dishes
      : dishes.filter((d) => d.category === filterCategory);

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: dishes.filter((d) => d.category === cat.value).length,
  }));

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
        title="菜品库"
        description={`共 ${dishes.length} 道菜`}
        action={
          <button
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={18} />
            添加菜品
          </button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => setFilterCategory("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          全部 ({dishes.length})
        </button>
        {categoryCounts.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterCategory === cat.value
                ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.emoji} {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {editingDish ? "编辑菜品" : "添加新菜品"}
                </h3>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

            {/* Image upload */}
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors overflow-hidden shrink-0"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="菜品图片" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入菜品名称"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    category === cat.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Spice & Sweetness */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">辣度</label>
                <div className="flex gap-1">
                  {SPICE_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSpiceLevel(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                        spiceLevel === s.value
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">甜度</label>
                <div className="flex gap-1">
                  {SWEETNESS_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSweetnessLevel(s.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                        sweetnessLevel === s.value
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Difficulty & Prep time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">烹饪难度</label>
                <div className="flex gap-1">
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDifficulty(d.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                        difficulty === d.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">烹饪时间(分钟)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={prepTime ?? ""}
                  onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="如 30"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="备注说明（可选，如做法、食材、忌口提示等）"
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm resize-none"
            />

            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="w-full flex items-center justify-center gap-1.5 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={18} />
              {submitting
                ? "保存中..."
                : editingDish
                  ? "保存修改"
                  : "添加菜品"}
            </button>
          </form>
        </div>
      )}

      {/* Dishes list */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">暂无菜品</p>
          <p className="text-sm">点击右上角添加你喜欢的菜品吧</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-50 hover:border-gray-200 transition-colors"
            >
              {/* Image or emoji */}
              {dish.imageUrl ? (
                <img
                  src={dish.imageUrl}
                  alt={dish.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <span className="text-2xl w-12 h-12 flex items-center justify-center shrink-0">
                  {getCategoryEmoji(dish.category)}
                </span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{dish.name}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400">
                  <span>{getCategoryLabel(dish.category)}</span>
                  {dish.spiceLevel > 0 && (
                    <span className="text-red-500">{"🌶️".repeat(dish.spiceLevel)}</span>
                  )}
                  {dish.sweetnessLevel > 0 && (
                    <span>{"🍬".repeat(dish.sweetnessLevel)}</span>
                  )}
                  <span>{getDifficultyLabel(dish.difficulty)}</span>
                  {dish.prepTime && (
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {dish.prepTime}分钟
                    </span>
                  )}
                </div>
                {dish.description && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {dish.description}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(dish)}
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(dish.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
