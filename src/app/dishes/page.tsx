"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
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
  createdAt: string;
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("meat");
  const [filterCategory, setFilterCategory] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      const res = editingDish
        ? await fetch(`/api/dishes/${editingDish.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), category }),
          })
        : await fetch("/api/dishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim(), category }),
          });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "保存菜品失败");
      }

      setName("");
      setCategory("meat");
      setShowForm(false);
      setEditingDish(null);
      await fetchDishes();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "保存菜品失败"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dish: Dish) => {
    setError("");
    setEditingDish(dish);
    setName(dish.name);
    setCategory(dish.category);
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

  const cancelForm = () => {
    setError("");
    setShowForm(false);
    setEditingDish(null);
    setName("");
    setCategory("meat");
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
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入菜品名称"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
              autoFocus
            />
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
              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-50 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {getCategoryEmoji(dish.category)}
                </span>
                <div>
                  <div className="font-medium text-gray-900">{dish.name}</div>
                  <div className="text-xs text-gray-400">
                    {getCategoryLabel(dish.category)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
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
