"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Minus, Shuffle, X, Check } from "lucide-react";
import Link from "next/link";
import MealRecordDialog from "@/components/MealRecordDialog";
import { CATEGORIES, getCategoryEmoji } from "@/lib/categories";

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
}

interface CartItem {
  dish: Dish;
  quantity: number;
}

export default function Home() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showMealDialog, setShowMealDialog] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    const loadDishes = async () => {
      try {
        const res = await fetch("/api/dishes");
        if (!res.ok) return;
        const data: Dish[] = await res.json();
        if (!cancelled) setDishes(data);
      } catch {}
      if (!cancelled) setLoading(false);
    };
    void loadDishes();
    return () => { cancelled = true; };
  }, []);

  const getQuantity = (dishId: string) =>
    cart.find((c) => c.dish.id === dishId)?.quantity ?? 0;

  const updateCart = (dish: Dish, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.dish.id === dish.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter((c) => c.dish.id !== dish.id);
        return prev.map((c) =>
          c.dish.id === dish.id ? { ...c, quantity: newQty } : c
        );
      }
      if (delta > 0) return [...prev, { dish, quantity: delta }];
      return prev;
    });
  };

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  const scrollToCategory = (catValue: string) => {
    setActiveCategory(catValue);
    if (catValue === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = categoryRefs.current[catValue];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categorizedDishes = CATEGORIES.map((cat) => ({
    ...cat,
    dishes: dishes.filter((d) => d.category === cat.value),
  })).filter((cat) => cat.dishes.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">幸福里私房菜</h1>
          <p className="text-xs text-gray-400">幸福的味道，家的感觉</p>
        </div>
        <Link
          href="/recommend"
          className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium hover:bg-orange-100 transition-colors"
        >
          <Shuffle size={14} />
          随机推荐
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => scrollToCategory("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => {
          const count = dishes.filter((d) => d.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => scrollToCategory(cat.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.emoji} {cat.label}
              {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Dishes by category */}
      {dishes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">暂无菜品</p>
          <p className="text-sm">
            去
            <Link href="/dishes" className="text-orange-500 underline">
              管理页
            </Link>
            添加菜品吧
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categorizedDishes.map((cat) => (
            <div
              key={cat.value}
              ref={(el) => { categoryRefs.current[cat.value] = el; }}
            >
              <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                {cat.emoji} {cat.label}
                <span className="text-xs text-gray-400 font-normal">
                  ({cat.dishes.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {cat.dishes.map((dish) => {
                  const qty = getQuantity(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:border-orange-200 transition-colors"
                    >
                      {/* Dish image */}
                      <div className="aspect-[4/3] bg-gray-100 relative">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">
                            {getCategoryEmoji(dish.category)}
                          </div>
                        )}
                        {dish.spiceLevel > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-red-500/80 text-white text-xs px-1.5 py-0.5 rounded-full">
                            {"🌶️".repeat(dish.spiceLevel)}
                          </span>
                        )}
                      </div>

                      {/* Dish info + quantity */}
                      <div className="p-2.5">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {dish.name}
                        </div>
                        {dish.description && (
                          <div className="text-xs text-gray-400 truncate mt-0.5">
                            {dish.description}
                          </div>
                        )}

                        {/* Quantity control */}
                        <div className="flex items-center justify-end mt-2">
                          {qty > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCart(dish, -1)}
                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-5 text-center text-sm font-semibold text-orange-600">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateCart(dish, 1)}
                                className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => updateCart(dish, 1)}
                              className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto bg-orange-500 rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setShowCart(!showCart)}
              className="flex items-center gap-2 text-white"
            >
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm font-medium">
                已选 {totalItems} 项
              </span>
            </button>
            <button
              onClick={() => setShowMealDialog(true)}
              className="bg-white text-orange-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-orange-50 transition-colors"
            >
              确认下单
            </button>
          </div>
        </div>
      )}

      {/* Cart detail overlay */}
      {showCart && totalItems > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                已选菜品 ({totalItems})
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex items-center gap-3"
                >
                  {item.dish.imageUrl ? (
                    <img
                      src={item.dish.imageUrl}
                      alt={item.dish.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">
                      {getCategoryEmoji(item.dish.category)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.dish.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateCart(item.dish, -1)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCart(item.dish, 1)}
                      className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowMealDialog(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-orange-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
              >
                <Check size={18} />
                确认下单 ({totalItems} 项)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meal record dialog */}
      {showMealDialog && (
        <MealRecordDialog
          dishIds={cart.flatMap((c) =>
            Array(c.quantity).fill(c.dish.id)
          )}
          onClose={() => setShowMealDialog(false)}
          onSaved={() => {
            setShowMealDialog(false);
            setCart([]);
            setShowCart(false);
            alert("下单成功！已记录用餐！");
          }}
        />
      )}
    </div>
  );
}
