"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Camera, Clock, Search, ChevronRight, ChefHat } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  CATEGORIES,
  getCategoryLabel,
} from "@/lib/categories";
import { CategoryIcon, SpiceIndicator } from "@/components/CategoryIcon";
import {
  buildDishSearchText,
  DishIngredientItem,
  ingredientDetailsToIngredients,
  normalizeDishField,
  parseIngredientDetails,
  serializeIngredientDetails,
  splitDishField,
} from "@/lib/dish-fields";
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
  ingredients: string | null;
  ingredientDetails: string | null;
  tags: string | null;
  chefNote: string | null;
  description: string | null;
  createdAt: string;
}

interface Chef {
  id: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export default function DishesPage() {
  const [activeTab, setActiveTab] = useState<"dishes" | "chefs">("dishes");

  // ----- Chef management state -----
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [chefsLoading, setChefsLoading] = useState(true);
  const [chefError, setChefError] = useState("");
  const [showChefForm, setShowChefForm] = useState(false);
  const [editingChef, setEditingChef] = useState<Chef | null>(null);
  const [chefName, setChefName] = useState("");
  const [chefSubmitting, setChefSubmitting] = useState(false);

  // ----- Dish management state -----
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
  const [ingredients, setIngredients] = useState("");
  const [ingredientItems, setIngredientItems] = useState<DishIngredientItem[]>([]);
  const [tags, setTags] = useState("");
  const [chefNote, setChefNote] = useState("");
  const [description, setDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "prepTime">("newest");
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

      setDishes(Array.isArray(data) ? data.filter((d: { isQuickEntry?: boolean }) => !d.isQuickEntry) : data);
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

  // ----- Chef CRUD -----
  const fetchChefs = useCallback(async () => {
    try {
      setChefError("");
      const res = await fetch("/api/chefs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载厨师失败");
      setChefs(data);
    } catch (err) {
      setChefError(err instanceof Error ? err.message : "加载厨师失败");
    } finally {
      setChefsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChefs();
  }, [fetchChefs]);

  const handleChefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chefName.trim()) return;
    try {
      setChefSubmitting(true);
      setChefError("");
      const res = editingChef
        ? await fetch(`/api/chefs/${editingChef.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: chefName.trim() }),
          })
        : await fetch("/api/chefs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: chefName.trim() }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存厨师失败");
      resetChefForm();
      await fetchChefs();
    } catch (err) {
      setChefError(err instanceof Error ? err.message : "保存厨师失败");
    } finally {
      setChefSubmitting(false);
    }
  };

  const handleChefDelete = async (id: string) => {
    if (!confirm("确定删除这位厨师吗？关联的历史记录将取消厨师关联。")) return;
    try {
      setChefError("");
      const res = await fetch(`/api/chefs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "删除厨师失败");
      await fetchChefs();
    } catch (err) {
      setChefError(err instanceof Error ? err.message : "删除厨师失败");
    }
  };

  const handleChefEdit = (chef: Chef) => {
    setChefError("");
    setEditingChef(chef);
    setChefName(chef.name);
    setShowChefForm(true);
  };

  const resetChefForm = () => {
    setShowChefForm(false);
    setEditingChef(null);
    setChefName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const serializedIngredientDetails = serializeIngredientDetails(ingredientItems);
      const normalizedIngredients = serializedIngredientDetails
        ? ingredientDetailsToIngredients(ingredientItems)
        : normalizeDishField(ingredients);

      const payload = {
        name: name.trim(),
        category,
        imageUrl,
        spiceLevel,
        sweetnessLevel,
        difficulty,
        prepTime,
        ingredients: normalizedIngredients,
        ingredientDetails: serializedIngredientDetails,
        tags: normalizeDishField(tags),
        chefNote: chefNote.trim() || null,
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
    setIngredients(dish.ingredients ?? "");
    setIngredientItems(parseIngredientDetails(dish.ingredientDetails, dish.ingredients));
    setTags(dish.tags ?? "");
    setChefNote(dish.chefNote ?? "");
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
    setIngredients("");
    setIngredientItems([]);
    setTags("");
    setChefNote("");
    setDescription("");
  };

  const addIngredientItem = () => {
    setIngredientItems((prev) => [
      ...prev,
      { name: "", amount: "", unit: "", price: "", note: "" },
    ]);
  };

  const updateIngredientItem = (
    index: number,
    field: keyof DishIngredientItem,
    value: string
  ) => {
    setIngredientItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const removeIngredientItem = (index: number) => {
    setIngredientItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const cancelForm = () => {
    setError("");
    resetForm();
  };

  const filteredDishes = dishes
    .filter((d) => filterCategory === "all" || d.category === filterCategory)
    .filter((d) => {
      if (!searchTerm.trim()) {
        return true;
      }

      return buildDishSearchText(d).includes(searchTerm.trim().toLocaleLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "zh-CN");
      }

      if (sortBy === "prepTime") {
        return (a.prepTime ?? Number.MAX_SAFE_INTEGER) - (b.prepTime ?? Number.MAX_SAFE_INTEGER);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: dishes.filter((d) => d.category === cat.value).length,
  }));

  if (loading && chefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-stone-400 font-medium tracking-wide">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto">
      {/* Page header with tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 mt-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-3">
            {activeTab === "dishes" ? "菜品库" : "厨师管理"}
          </h1>
          <div className="flex gap-1 p-0.5 bg-stone-100 rounded-xl w-max">
            <button
              onClick={() => setActiveTab("dishes")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                activeTab === "dishes"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              菜品 ({dishes.length})
            </button>
            <button
              onClick={() => setActiveTab("chefs")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                activeTab === "chefs"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              厨师 ({chefs.length})
            </button>
          </div>
        </div>
        {activeTab === "dishes" ? (
          <button
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            <Plus size={16} strokeWidth={2} />
            添加新菜品
          </button>
        ) : (
          <button
            onClick={() => {
              setChefError("");
              setShowChefForm(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            <Plus size={16} strokeWidth={2} />
            添加新厨师
          </button>
        )}
      </div>

      {/* ========== CHEF TAB ========== */}
      {activeTab === "chefs" && (
        <>
          {chefError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-center justify-between">
              <span>{chefError}</span>
              <button onClick={() => setChefError("")} className="p-1 hover:bg-red-100 rounded-full transition-all active:scale-90">
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ) : null}

          {showChefForm && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 transition-opacity">
              <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                  <h3 className="text-lg font-semibold text-stone-900 tracking-tight">
                    {editingChef ? "编辑厨师" : "添加新厨师"}
                  </h3>
                  <button
                    type="button"
                    onClick={resetChefForm}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
                <form onSubmit={handleChefSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">厨师名称 *</label>
                    <input
                      type="text"
                      value={chefName}
                      onChange={(e) => setChefName(e.target.value)}
                      placeholder="例如：余老师"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetChefForm}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={!chefName.trim() || chefSubmitting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                    >
                      {chefSubmitting ? "保存中..." : (
                        <>
                          <Check size={16} strokeWidth={2} />
                          {editingChef ? "保存修改" : "确认添加"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {chefsLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="text-stone-400 font-medium tracking-wide">加载厨师列表中...</div>
            </div>
          ) : chefs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
              <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChefHat size={24} strokeWidth={1.5} className="text-stone-300" />
              </div>
              <p className="text-lg font-semibold text-stone-900 mb-1">还没有添加厨师</p>
              <p className="text-stone-400 text-sm">点击右上角「添加新厨师」开始管理</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {chefs.map((chef) => (
                <div
                  key={chef.id}
                  className="group bg-white rounded-2xl p-4 border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center shrink-0">
                        <ChefHat size={18} strokeWidth={1.5} className="text-stone-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-900 truncate tracking-tight">{chef.name}</div>
                        <div className="text-xs text-stone-300">
                          {new Date(chef.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} 加入
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleChefEdit(chef)}
                        className="p-1.5 text-stone-300 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        aria-label="编辑厨师"
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => handleChefDelete(chef.id)}
                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
                        aria-label="删除厨师"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== DISHES TAB ========== */}
      {activeTab === "dishes" && (
        <>
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="p-1 hover:bg-red-100 rounded-full transition-all active:scale-90">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-2 mb-6">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-100 px-3 py-2.5 focus-within:ring-2 focus-within:ring-stone-400 focus-within:border-stone-300 transition-all">
          <Search size={16} strokeWidth={1.5} className="text-stone-300 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索菜名、食材、标签..."
            className="w-full bg-transparent text-sm text-stone-900 focus:outline-none placeholder:text-stone-300"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "name" | "prepTime")}
            className="w-full appearance-none bg-white rounded-xl border border-stone-100 px-3 py-2.5 text-sm font-medium text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all cursor-pointer hover:border-stone-200"
          >
            <option value="newest">最新添加</option>
            <option value="name">菜品名称</option>
            <option value="prepTime">烹饪时间</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[48px] sm:top-[56px] z-30 bg-stone-50/90 backdrop-blur-xl border-b border-stone-100 py-2.5 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
              filterCategory === "all"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-100"
            }`}
          >
            全部 <span className={filterCategory === "all" ? "text-stone-400 ml-0.5" : "text-stone-300 ml-0.5"}>({dishes.length})</span>
          </button>
          {categoryCounts.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 flex items-center gap-1 ${
                filterCategory === cat.value
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-700 border border-stone-100"
              }`}
            >
              <CategoryIcon category={cat.value} size={13} className={filterCategory === cat.value ? "text-stone-400" : "text-stone-400"} />
              <span>{cat.label}</span>
              <span className={filterCategory === cat.value ? "text-stone-400 ml-0.5" : "text-stone-300 ml-0.5"}>({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-stone-900 tracking-tight">
                {editingDish ? "编辑菜品" : "添加新菜品"}
              </h3>
              <button
                type="button"
                onClick={cancelForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form id="dish-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Image upload */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all overflow-hidden shrink-0 group relative"
                  >
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="菜品图片" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-stone-300 group-hover:text-stone-500 transition-colors">
                        <Camera size={22} strokeWidth={1.5} className="mb-0.5" />
                        <span className="text-[9px] font-medium">上传图片</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">菜品名称 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：红烧肉"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm transition-all"
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
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">所属分类 *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 flex items-center gap-1 ${
                          category === cat.value
                            ? "bg-stone-900 text-white"
                            : "bg-stone-50 text-stone-600 border border-stone-100 hover:bg-stone-100 hover:border-stone-200 active:scale-[0.97]"
                        }`}
                      >
                        <CategoryIcon category={cat.value} size={13} className={category === cat.value ? "text-stone-400" : "text-stone-400"} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-stone-50 p-4 rounded-xl border border-stone-100">
                  {/* Spice & Sweetness */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-2 block flex items-center justify-between uppercase tracking-wider">
                        <span>辣度级别</span>
                        <span className="text-[10px] text-stone-400 font-normal normal-case">{SPICE_LEVELS.find(s => s.value === spiceLevel)?.label}</span>
                      </label>
                      <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
                        {SPICE_LEVELS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSpiceLevel(s.value)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                              spiceLevel === s.value
                                ? "bg-white text-stone-900 shadow-sm"
                                : "text-stone-400 hover:text-stone-600"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-2 block flex items-center justify-between uppercase tracking-wider">
                        <span>甜度级别</span>
                        <span className="text-[10px] text-stone-400 font-normal normal-case">{SWEETNESS_LEVELS.find(s => s.value === sweetnessLevel)?.label}</span>
                      </label>
                      <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
                        {SWEETNESS_LEVELS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSweetnessLevel(s.value)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                              sweetnessLevel === s.value
                                ? "bg-white text-stone-900 shadow-sm"
                                : "text-stone-400 hover:text-stone-600"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty & Prep time */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">烹饪难度</label>
                      <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => setDifficulty(d.value)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                              difficulty === d.value
                                ? "bg-white text-stone-900 shadow-sm"
                                : "text-stone-400 hover:text-stone-600"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-2 block uppercase tracking-wider">预计用时 (分钟)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock size={14} strokeWidth={1.5} className="text-stone-300" />
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={prepTime ?? ""}
                          onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="例如：30"
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900">食材信息</h4>
                      <p className="text-xs text-stone-400">完善的食材信息有助于自动生成采购清单</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-stone-700">结构化明细</div>
                        <div className="text-xs text-stone-400 mt-0.5">推荐方式，可填写用量和价格</div>
                      </div>
                      <button
                        type="button"
                        onClick={addIngredientItem}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 text-xs font-medium hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                      >
                        <Plus size={14} strokeWidth={1.5} /> 新增
                      </button>
                    </div>

                    {ingredientItems.length === 0 ? (
                      <div className="text-xs text-stone-400 rounded-xl border border-dashed border-stone-200 bg-white/50 px-4 py-6 text-center">
                        尚未添加结构化食材，点击右上角新增
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ingredientItems.map((item, index) => (
                          <div key={`ing-${index}`} className="group rounded-xl bg-white border border-stone-200 p-3 relative overflow-hidden transition-all focus-within:ring-2 focus-within:ring-stone-400 focus-within:border-transparent">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">名称</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateIngredientItem(index, "name", e.target.value)}
                                  placeholder="如: 五花肉"
                                  className="w-full bg-transparent border-b border-stone-200 focus:border-stone-500 px-1 py-1 text-sm text-stone-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">用量</label>
                                <input
                                  type="text"
                                  value={item.amount ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "amount", e.target.value)}
                                  placeholder="如: 300"
                                  className="w-full bg-transparent border-b border-stone-200 focus:border-stone-500 px-1 py-1 text-sm text-stone-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">单位</label>
                                <input
                                  type="text"
                                  value={item.unit ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "unit", e.target.value)}
                                  placeholder="如: g"
                                  className="w-full bg-transparent border-b border-stone-200 focus:border-stone-500 px-1 py-1 text-sm text-stone-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">预估价 (￥)</label>
                                <input
                                  type="text"
                                  value={item.price ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "price", e.target.value)}
                                  placeholder="如: 15"
                                  className="w-full bg-transparent border-b border-stone-200 focus:border-stone-500 px-1 py-1 text-sm text-stone-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-4">
                                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">备注</label>
                                <input
                                  type="text"
                                  value={item.note ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "note", e.target.value)}
                                  placeholder="采购或处理建议，如: 切片、去皮..."
                                  className="w-full bg-transparent border-b border-stone-200 focus:border-stone-500 px-1 py-1 text-sm text-stone-900 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeIngredientItem(index)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-stone-50 text-stone-300 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 focus:outline-none"
                              aria-label="删除食材"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">简单文本食材 (补充)</label>
                    <input
                      type="text"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="如：土豆、牛肉（若上方已填写明细，此处可留空）"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-4 border-t border-stone-100 pt-5">
                  <h4 className="text-sm font-semibold text-stone-900 mb-1">更多信息</h4>
                  
                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">分类标签</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="如：下饭、快手、清淡 (多个用顿号或空格分隔)"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 flex items-center justify-between block uppercase tracking-wider">
                      厨师备注 
                      <span className="text-[10px] font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full normal-case">仅厨师可见</span>
                    </label>
                    <textarea
                      value={chefNote}
                      onChange={(e) => setChefNote(e.target.value)}
                      placeholder="记录成本核算、特殊采购渠道、制作秘诀等..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm resize-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-500 mb-1.5 block uppercase tracking-wider">公开描述</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="给食客的温馨提示、口味介绍..."
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm resize-none transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 sticky bottom-0 z-10 flex gap-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                取消
              </button>
              <button
                type="submit"
                form="dish-form"
                disabled={!name.trim() || submitting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2} />
                    {editingDish ? "保存修改" : "确认添加"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
          <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={22} strokeWidth={1.5} className="text-stone-300" />
          </div>
          <p className="text-lg font-semibold text-stone-900 mb-1">未找到匹配菜品</p>
          <p className="text-stone-400 text-sm">试试调整搜索词或分类筛选</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="group flex bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-300 focus-within:ring-2 focus-within:ring-stone-400"
              tabIndex={0}
            >
              {/* Image Column */}
              <div className="w-28 sm:w-36 bg-stone-50 relative overflow-hidden shrink-0">
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <CategoryIcon category={dish.category} size={32} className="text-stone-300" />
                  </div>
                )}
                {dish.spiceLevel > 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                    <SpiceIndicator level={dish.spiceLevel} size={10} />
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="p-3.5 flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight truncate">
                    {dish.name}
                  </h3>
                  <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity -mt-0.5 -mr-0.5">
                    <button
                      onClick={() => handleEdit(dish)}
                      className="p-1 text-stone-300 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      aria-label="编辑菜品"
                    >
                      <Pencil size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-300"
                      aria-label="删除菜品"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-stone-400 mb-2">
                  <span className="font-medium text-stone-600">{getCategoryLabel(dish.category)}</span>
                  <span className="text-stone-200">•</span>
                  <span>{getDifficultyLabel(dish.difficulty)}</span>
                  {dish.prepTime && (
                    <>
                      <span className="text-stone-200">•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} strokeWidth={1.5} />
                        {dish.prepTime}分钟
                      </span>
                    </>
                  )}
                  {dish.sweetnessLevel > 0 && (
                    <>
                      <span className="text-stone-200">•</span>
                      <span>甜度{dish.sweetnessLevel}</span>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  {parseIngredientDetails(dish.ingredientDetails, dish.ingredients).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {parseIngredientDetails(dish.ingredientDetails, dish.ingredients)
                        .slice(0, 3)
                        .map((item, i) => (
                          <span
                            key={`detail-${i}`}
                            className="px-1.5 py-0.5 rounded bg-stone-50 text-stone-500 text-[10px] font-medium border border-stone-100"
                          >
                            {item.name}
                            {item.amount ? ` ${item.amount}${item.unit || ""}` : ""}
                          </span>
                        ))}
                      {parseIngredientDetails(dish.ingredientDetails, dish.ingredients).length > 3 && (
                        <span className="px-1 py-0.5 text-stone-300 text-[10px]">...</span>
                      )}
                    </div>
                  ) : splitDishField(dish.ingredients).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {splitDishField(dish.ingredients).slice(0, 3).map((item, i) => (
                        <span
                          key={`ing-${i}`}
                          className="px-1.5 py-0.5 rounded bg-stone-50 text-stone-500 text-[10px] font-medium border border-stone-100"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {splitDishField(dish.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {splitDishField(dish.tags).slice(0, 3).map((item, i) => (
                        <span
                          key={`tag-${i}`}
                          className="text-[10px] text-stone-400"
                        >
                          #{item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(dish.chefNote || dish.description) && (
                  <div className="mt-2 pt-2 border-t border-stone-50 flex flex-col gap-0.5">
                    {dish.chefNote && (
                      <div className="text-[10px] text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded line-clamp-1">
                        <span className="font-semibold mr-0.5">注:</span>{dish.chefNote}
                      </div>
                    )}
                    {dish.description && !dish.chefNote && (
                      <div className="text-[10px] text-stone-300 line-clamp-1">
                        {dish.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
