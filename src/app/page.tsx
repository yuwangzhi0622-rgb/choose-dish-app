"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart, Plus, Minus, Shuffle, X, Check, ChevronRight } from "lucide-react";
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
        <div className="text-gray-400 font-medium tracking-wide">正在加载菜单...</div>
      </div>
    );
  }

  return (
    <div className="pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-[1024px] mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16 sm:py-24">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-4">
          来看看 幸福里 最新阵容
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
          精心搭配的私房好菜，让每一餐都充满家的味道。选择你喜欢的菜品，开始点餐吧。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/recommend"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            随机推荐 <ChevronRight size={16} className="ml-1" />
          </Link>
          <Link
            href="/dishes"
            className="inline-flex items-center justify-center bg-white text-blue-600 border border-blue-600 px-6 py-2.5 rounded-full font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            管理菜品
          </Link>
        </div>
      </section>

      {/* Sticky Category Nav */}
      <div className="sticky top-12 sm:top-14 z-40 bg-gray-50/90 backdrop-blur-xl border-b border-gray-200/50 py-3 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => scrollToCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeCategory === "all"
                ? "bg-gray-900 text-white shadow-md scale-105"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                className={`shrink-0 px-4 py-2 rounded-full text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1.5 ${
                  activeCategory === cat.value
                    ? "bg-gray-900 text-white shadow-md scale-105"
                    : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dishes Grid */}
      {dishes.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-2xl font-semibold text-gray-900 mb-3">暂无菜品</p>
          <p className="text-gray-500 mb-6">先去添加一些拿手好菜吧</p>
          <Link 
            href="/dishes" 
            className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            去添加
          </Link>
        </div>
      ) : (
        <div className="space-y-16">
          {categorizedDishes.map((cat) => (
            <div
              key={cat.value}
              ref={(el) => { categoryRefs.current[cat.value] = el; }}
              className="scroll-mt-32"
            >
              <div className="flex items-baseline gap-3 mb-6 px-2 sm:px-0">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  {cat.label}
                </h2>
                <span className="text-lg text-gray-400 font-medium">
                  {cat.dishes.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {cat.dishes.map((dish) => {
                  const qty = getQuantity(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                      tabIndex={0}
                    >
                      {/* Image Area */}
                      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl transition-transform duration-700 group-hover:scale-110">
                            {getCategoryEmoji(dish.category)}
                          </div>
                        )}
                        {dish.spiceLevel > 0 && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
                            <span className="text-xs">{"🌶️".repeat(dish.spiceLevel)}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="mb-4 flex-1">
                          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-1 line-clamp-1">
                            {dish.name}
                          </h3>
                          {dish.description ? (
                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                              {dish.description}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">暂无描述</p>
                          )}
                        </div>

                        {/* Action Area */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                          <span className="text-[13px] font-medium text-gray-400 flex items-center gap-1">
                            {dish.difficulty === 'easy' ? '⭐ 简单' : dish.difficulty === 'medium' ? '⭐⭐ 中等' : '⭐⭐⭐ 困难'}
                          </span>
                          
                          <div className="flex items-center justify-end">
                            {qty > 0 ? (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                                <button
                                  onClick={() => updateCart(dish, -1)}
                                  className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label="减少数量"
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <span className="w-6 text-center text-[15px] font-bold text-gray-900">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateCart(dish, 1)}
                                  className="w-8 h-8 rounded-full bg-blue-600 shadow-sm hover:bg-blue-700 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  aria-label="增加数量"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => updateCart(dish, 1)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-900 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                添加 <Plus size={16} strokeWidth={2.5} />
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

      {/* Floating Apple-style Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-[1024px] mx-auto flex justify-center sm:justify-end">
            <div className="pointer-events-auto flex items-center gap-3 bg-gray-900/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-gray-700/50">
              <button
                onClick={() => setShowCart(!showCart)}
                className="flex items-center gap-2 pl-4 pr-3 py-2 text-white hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              >
                <div className="relative">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                </div>
                <span className="text-[15px] font-medium tracking-wide hidden sm:inline">
                  已选 {totalItems} 项
                </span>
              </button>
              
              <div className="w-[1px] h-6 bg-gray-700"></div>
              
              <button
                onClick={() => setShowMealDialog(true)}
                className="bg-white text-gray-900 px-6 py-2.5 rounded-full text-[15px] font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center transition-opacity"
          onClick={() => setShowCart(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] sm:max-h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                已选菜品 <span className="text-gray-400 text-lg font-normal ml-1">({totalItems})</span>
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCart([])}
                  className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:underline"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
              {cart.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                >
                  {item.dish.imageUrl ? (
                    <img
                      src={item.dish.imageUrl}
                      alt={item.dish.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                  ) : (
                    <span className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {getCategoryEmoji(item.dish.category)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-gray-900 truncate tracking-tight">
                      {item.dish.name}
                    </div>
                    {item.dish.description && (
                      <div className="text-sm text-gray-500 truncate mt-0.5">
                        {item.dish.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-full p-1 border border-gray-200 shadow-sm shrink-0">
                    <button
                      onClick={() => updateCart(item.dish, -1)}
                      className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCart(item.dish, 1)}
                      className="w-7 h-7 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center text-white transition-colors"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const query = cart.map(c => `id=${c.dish.id}`).join("&");
                  window.location.href = `/grocery?${query}`;
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
              >
                生成食材清单
              </button>
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowMealDialog(true);
                }}
                className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-2xl text-[15px] font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
              >
                继续下单 <ChevronRight size={18} />
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
