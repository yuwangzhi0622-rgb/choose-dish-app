"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Camera, Clock, Search, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  CATEGORIES,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/categories";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 font-medium tracking-wide">加载菜品库中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            菜品库
          </h1>
          <p className="text-gray-500 text-lg">
            共收录 <span className="font-semibold text-gray-900">{dishes.length}</span> 道私房好菜
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
        >
          <Plus size={18} strokeWidth={2.5} />
          添加新菜品
        </button>
      </div>

      {error ? (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50/50 px-6 py-4 text-[15px] font-medium text-red-600 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="p-1 hover:bg-red-100 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_200px] gap-4 mb-8 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-gray-200/60 shadow-sm">
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow shadow-sm">
          <Search size={20} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索菜名、食材、标签、备注..."
            className="w-full bg-transparent text-[15px] text-gray-900 focus:outline-none placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "name" | "prepTime")}
            className="w-full appearance-none bg-white rounded-2xl border border-gray-100 px-4 py-3 text-[15px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm cursor-pointer"
          >
            <option value="newest">按最新添加排序</option>
            <option value="name">按菜品名称排序</option>
            <option value="prepTime">按烹饪时间排序</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[60px] sm:top-[68px] z-30 bg-gray-50/90 backdrop-blur-xl border-b border-gray-200/50 py-3 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              filterCategory === "all"
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60"
            }`}
          >
            全部 <span className={filterCategory === "all" ? "text-gray-300 ml-1" : "text-gray-400 ml-1"}>({dishes.length})</span>
          </button>
          {categoryCounts.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1.5 ${
                filterCategory === cat.value
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              <span className={filterCategory === cat.value ? "text-gray-300 ml-0.5" : "text-gray-400 ml-0.5"}>({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4 transition-opacity">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {editingDish ? "编辑菜品" : "添加新菜品"}
              </h3>
              <button
                type="button"
                onClick={cancelForm}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="dish-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Image upload */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors overflow-hidden shrink-0 group relative"
                  >
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="菜品图片" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={24} className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
                        <Camera size={28} className="mb-1" />
                        <span className="text-[10px] font-medium">上传图片</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">菜品名称 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：红烧肉"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-shadow"
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
                  <label className="text-sm font-medium text-gray-700 mb-2.5 block">所属分类 *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          category === cat.value
                            ? "bg-gray-900 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                  {/* Spice & Sweetness */}
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center justify-between">
                        <span>辣度级别</span>
                        <span className="text-xs text-gray-400 font-normal">{SPICE_LEVELS.find(s => s.value === spiceLevel)?.label}</span>
                      </label>
                      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                        {SPICE_LEVELS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSpiceLevel(s.value)}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              spiceLevel === s.value
                                ? "bg-white text-red-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            {s.value === 0 ? s.label : "🌶️".repeat(s.value)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center justify-between">
                        <span>甜度级别</span>
                        <span className="text-xs text-gray-400 font-normal">{SWEETNESS_LEVELS.find(s => s.value === sweetnessLevel)?.label}</span>
                      </label>
                      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                        {SWEETNESS_LEVELS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setSweetnessLevel(s.value)}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              sweetnessLevel === s.value
                                ? "bg-white text-amber-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            {s.value === 0 ? s.label : "🍬".repeat(s.value)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Difficulty & Prep time */}
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">烹饪难度</label>
                      <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => setDifficulty(d.value)}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              difficulty === d.value
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">预计用时 (分钟)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Clock size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={prepTime ?? ""}
                          onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="例如：30"
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[15px] transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">食材信息</h4>
                      <p className="text-sm text-gray-500">完善的食材信息有助于自动生成采购清单</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-200/80 bg-gray-50 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-gray-900">结构化明细</div>
                        <div className="text-xs text-gray-500 mt-0.5">推荐方式，可填写用量和价格</div>
                      </div>
                      <button
                        type="button"
                        onClick={addIngredientItem}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      >
                        <Plus size={16} /> 新增
                      </button>
                    </div>

                    {ingredientItems.length === 0 ? (
                      <div className="text-sm text-gray-500 rounded-2xl border border-dashed border-gray-300 bg-white/50 px-4 py-8 text-center">
                        尚未添加结构化食材，点击右上角新增
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {ingredientItems.map((item, index) => (
                          <div key={`ing-${index}`} className="group rounded-2xl bg-white border border-gray-200 p-4 shadow-sm relative overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">名称</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateIngredientItem(index, "name", e.target.value)}
                                  placeholder="如: 五花肉"
                                  className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 px-1 py-1.5 text-[15px] text-gray-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">用量</label>
                                <input
                                  type="text"
                                  value={item.amount ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "amount", e.target.value)}
                                  placeholder="如: 300"
                                  className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 px-1 py-1.5 text-[15px] text-gray-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">单位</label>
                                <input
                                  type="text"
                                  value={item.unit ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "unit", e.target.value)}
                                  placeholder="如: g"
                                  className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 px-1 py-1.5 text-[15px] text-gray-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">预估价 (￥)</label>
                                <input
                                  type="text"
                                  value={item.price ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "price", e.target.value)}
                                  placeholder="如: 15"
                                  className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 px-1 py-1.5 text-[15px] text-gray-900 focus:outline-none transition-colors"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-4">
                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">备注</label>
                                <input
                                  type="text"
                                  value={item.note ?? ""}
                                  onChange={(e) => updateIngredientItem(index, "note", e.target.value)}
                                  placeholder="采购或处理建议，如: 切片、去皮..."
                                  className="w-full bg-transparent border-b border-gray-200 focus:border-blue-500 px-1 py-1.5 text-[15px] text-gray-900 focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeIngredientItem(index)}
                              className="absolute top-3 right-3 p-1.5 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-100 transition-all focus:outline-none"
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
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">简单文本食材 (补充)</label>
                    <input
                      type="text"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="如：土豆、牛肉（若上方已填写明细，此处可留空）"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[15px] transition-shadow"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-5 border-t border-gray-100 pt-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">更多信息</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">分类标签</label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="如：下饭、快手、清淡 (多个用顿号或空格分隔)"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[15px] transition-shadow"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between block">
                      厨师备注 
                      <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">仅厨师可见</span>
                    </label>
                    <textarea
                      value={chefNote}
                      onChange={(e) => setChefNote(e.target.value)}
                      placeholder="记录成本核算、特殊采购渠道、制作秘诀等..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-amber-200/60 bg-amber-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-[15px] resize-none transition-all placeholder:text-amber-900/30"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">公开描述</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="给食客的温馨提示、口味介绍..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[15px] resize-none transition-shadow"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10 flex gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="px-6 py-3.5 rounded-full text-[15px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                form="dish-form"
                disabled={!name.trim() || submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-full text-[15px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    保存中...
                  </span>
                ) : (
                  <>
                    <Check size={18} strokeWidth={2.5} />
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
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Search size={28} />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">未找到匹配菜品</p>
          <p className="text-gray-500">试试调整搜索词或分类筛选</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="group flex bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              tabIndex={0}
            >
              {/* Image Column */}
              <div className="w-32 sm:w-40 bg-gray-50 relative overflow-hidden shrink-0">
                {dish.imageUrl ? (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-700 group-hover:scale-110">
                    {getCategoryEmoji(dish.category)}
                  </div>
                )}
                {dish.spiceLevel > 0 && (
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full shadow-sm text-[10px]">
                    {"🌶️".repeat(dish.spiceLevel)}
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="p-4 flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="text-[17px] font-bold text-gray-900 tracking-tight truncate">
                    {dish.name}
                  </h3>
                  {/* Actions (visible on hover/focus) */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity -mt-1 -mr-1">
                    <button
                      onClick={() => handleEdit(dish)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="编辑菜品"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(dish.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="删除菜品"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mb-2.5">
                  <span className="font-medium text-gray-700">{getCategoryLabel(dish.category)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{getDifficultyLabel(dish.difficulty)}</span>
                  {dish.prepTime && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={11} />
                        {dish.prepTime}分钟
                      </span>
                    </>
                  )}
                  {dish.sweetnessLevel > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{"🍬".repeat(dish.sweetnessLevel)}</span>
                    </>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {/* Ingredients preview */}
                  {parseIngredientDetails(dish.ingredientDetails, dish.ingredients).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parseIngredientDetails(dish.ingredientDetails, dish.ingredients)
                        .slice(0, 3)
                        .map((item, i) => (
                          <span
                            key={`detail-${i}`}
                            className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium"
                          >
                            {item.name}
                            {item.amount ? ` ${item.amount}${item.unit || ""}` : ""}
                          </span>
                        ))}
                      {parseIngredientDetails(dish.ingredientDetails, dish.ingredients).length > 3 && (
                        <span className="px-1 py-0.5 text-gray-400 text-[11px]">...</span>
                      )}
                    </div>
                  ) : splitDishField(dish.ingredients).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {splitDishField(dish.ingredients).slice(0, 3).map((item, i) => (
                        <span
                          key={`ing-${i}`}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Tags */}
                  {splitDishField(dish.tags).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {splitDishField(dish.tags).slice(0, 3).map((item, i) => (
                        <span
                          key={`tag-${i}`}
                          className="text-[11px] text-blue-600"
                        >
                          #{item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chef Note preview */}
                {(dish.chefNote || dish.description) && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1">
                    {dish.chefNote && (
                      <div className="text-[11px] text-amber-600 bg-amber-50/50 px-2 py-1 rounded line-clamp-1">
                        <span className="font-semibold mr-1">注:</span> {dish.chefNote}
                      </div>
                    )}
                    {dish.description && !dish.chefNote && (
                      <div className="text-[11px] text-gray-400 line-clamp-1 italic">
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
    </div>
  );
}
