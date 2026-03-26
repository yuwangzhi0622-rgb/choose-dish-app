"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Minus, Shuffle, X, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import MealRecordDialog from "@/components/MealRecordDialog";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon, DifficultyIndicator, SpiceIndicator } from "@/components/CategoryIcon";

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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (showCart) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCart]);

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
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const categorizedDishes = CATEGORIES.map((cat) => ({
    ...cat,
    dishes: dishes.filter((d) => d.category === cat.value),
  })).filter((cat) => cat.dishes.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-stone-400 font-medium tracking-wide">正在加载菜单...</div>
      </div>
    );
  }

  return (
    <div className="pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-[1024px] mx-auto">
      {/* Hero Section */}
      <section className="text-center py-14 sm:py-20">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-stone-900 mb-3">
          幸福里 · 今日菜单
        </h1>
        <p className="text-base sm:text-lg text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
          精心搭配的私房好菜，选择你喜欢的菜品开始点餐
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/recommend"
            className="inline-flex items-center justify-center gap-1.5 bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            <Shuffle size={15} strokeWidth={1.5} />
            随机推荐
          </Link>
          <Link
            href="/dishes"
            className="inline-flex items-center justify-center bg-white text-stone-700 border border-stone-200 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          >
            管理菜品
          </Link>
        </div>
      </section>

      {/* Sticky Category Nav */}
      <div className="sticky top-12 sm:top-14 z-40 bg-stone-50/90 backdrop-blur-xl border-b border-stone-200/50 py-3 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => scrollToCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 ${
              activeCategory === "all"
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.97]"
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => {
            const count = dishes.filter((d) => d.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => scrollToCategory(cat.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 flex items-center gap-1.5 ${
                  activeCategory === cat.value
                    ? "bg-stone-900 text-white shadow-sm"
                    : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.97]"
                }`}
              >
                <CategoryIcon category={cat.value} size={15} className={activeCategory === cat.value ? "text-stone-300" : "text-stone-400"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dishes Grid */}
      {dishes.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-stone-100">
          <p className="text-xl font-semibold text-stone-900 mb-2">暂无菜品</p>
          <p className="text-stone-400 mb-6 text-sm">先去添加一些拿手好菜吧</p>
          <Link 
            href="/dishes" 
            className="inline-flex items-center justify-center bg-stone-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 active:scale-[0.97] transition-all"
          >
            去添加
          </Link>
        </div>
      ) : (
        <div className="space-y-14">
          {categorizedDishes.map((cat) => (
            <div
              key={cat.value}
              ref={(el) => { categoryRefs.current[cat.value] = el; }}
              className="scroll-mt-32"
            >
              <div className="flex items-center gap-3 mb-5 px-1">
                <CategoryIcon category={cat.value} size={20} className="text-stone-400" />
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900">
                  {cat.label}
                </h2>
                <span className="text-sm text-stone-300 font-medium tabular-nums">
                  {cat.dishes.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cat.dishes.map((dish) => {
                  const qty = getQuantity(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-stone-400 focus-within:ring-offset-1"
                      tabIndex={0}
                    >
                      {/* Image Area */}
                      <div className="aspect-[4/3] bg-stone-50 relative overflow-hidden">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                            <CategoryIcon category={dish.category} size={48} className="text-stone-300" />
                          </div>
                        )}
                        {dish.spiceLevel > 0 && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full">
                            <SpiceIndicator level={dish.spiceLevel} />
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="mb-3 flex-1">
                          <h3 className="text-base font-semibold text-stone-900 tracking-tight mb-1 line-clamp-1">
                            {dish.name}
                          </h3>
                          {dish.description ? (
                            <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed">
                              {dish.description}
                            </p>
                          ) : (
                            <p className="text-sm text-stone-300 italic">暂无描述</p>
                          )}
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-50">
                          <DifficultyIndicator difficulty={dish.difficulty} />
                          
                          <div className="flex items-center justify-end">
                            {qty > 0 ? (
                              <div className="flex items-center gap-2 bg-stone-50 rounded-full p-0.5 border border-stone-100">
                                <button
                                  onClick={() => updateCart(dish, -1)}
                                  className="w-7 h-7 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-400"
                                  aria-label="减少数量"
                                >
                                  <Minus size={14} strokeWidth={2} />
                                </button>
                                <span className="w-5 text-center text-sm font-semibold text-stone-900 tabular-nums">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateCart(dish, 1)}
                                  className="w-7 h-7 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-white transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-stone-400"
                                  aria-label="增加数量"
                                >
                                  <Plus size={14} strokeWidth={2} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => updateCart(dish, 1)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 text-stone-700 text-sm font-medium transition-all active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-stone-400"
                              >
                                添加 <Plus size={14} strokeWidth={2} />
                              </button>
                            )}
                          </div>
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

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-[1024px] mx-auto flex justify-center sm:justify-end">
            <div className="pointer-events-auto flex items-center gap-2.5 bg-stone-900/95 backdrop-blur-xl p-1.5 rounded-full shadow-2xl shadow-stone-900/30 border border-stone-700/50">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 pl-4 pr-3 py-2 text-white/90 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full"
              >
                <div className="relative">
                  <ShoppingCart size={18} strokeWidth={1.5} />
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-stone-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <span className="text-sm font-medium tracking-wide hidden sm:inline">
                  已选 {totalItems} 项
                </span>
              </button>
              
              <div className="w-px h-5 bg-stone-600"></div>
              
              <button
                onClick={() => setShowMealDialog(true)}
                className="bg-white text-stone-900 px-5 py-2 rounded-full text-sm font-semibold hover:bg-stone-100 active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                去下单
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart detail overlay */}
      {showCart && totalItems > 0 && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-opacity"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] sm:max-h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-stone-900 tracking-tight">
                已选菜品 <span className="text-stone-300 font-normal ml-1">({totalItems})</span>
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCart([])}
                  className="text-sm font-medium text-stone-400 hover:text-red-500 transition-colors focus:outline-none"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
              {cart.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  {item.dish.imageUrl ? (
                    <img
                      src={item.dish.imageUrl}
                      alt={item.dish.name}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-lg bg-stone-50 flex items-center justify-center shrink-0 border border-stone-100">
                      <CategoryIcon category={item.dish.category} size={22} className="text-stone-300" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-stone-900 truncate">
                      {item.dish.name}
                    </div>
                    {item.dish.description && (
                      <div className="text-xs text-stone-400 truncate mt-0.5">
                        {item.dish.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 rounded-full p-0.5 border border-stone-100 shrink-0">
                    <button
                      onClick={() => updateCart(item.dish, -1)}
                      className="w-7 h-7 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-all active:scale-90"
                    >
                      <Minus size={13} strokeWidth={2} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-stone-900 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCart(item.dish, 1)}
                      className="w-7 h-7 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-white transition-all active:scale-90"
                    >
                      <Plus size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  const query = cart.map(c => `id=${c.dish.id}`).join("&");
                  window.location.href = `/grocery?${query}`;
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-stone-700 border border-stone-200 py-3 rounded-xl text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-stone-200"
              >
                生成食材清单
              </button>
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowMealDialog(true);
                }}
                className="flex-[2] flex items-center justify-center gap-2 bg-stone-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-stone-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-stone-400 shadow-sm"
              >
                继续下单 <ChevronRight size={16} strokeWidth={2} />
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
