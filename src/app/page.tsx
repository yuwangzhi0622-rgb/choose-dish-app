"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Shuffle,
  Heart,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { getCategoryEmoji } from "@/lib/categories";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MealDish {
  id: string;
  dish: Dish;
}

interface MealRecord {
  id: string;
  date: string;
  mealDishes: MealDish[];
}

export default function Home() {
  const [dishCount, setDishCount] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [todayMeal, setTodayMeal] = useState<MealRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const [dishRes, comboRes, mealRes] = await Promise.all([
          fetch("/api/dishes"),
          fetch("/api/combos?favorites=true"),
          fetch("/api/meals"),
        ]);

        if (!dishRes.ok || !comboRes.ok || !mealRes.ok) {
          return;
        }

        const dishes = await dishRes.json();
        const combos = await comboRes.json();
        const meals: MealRecord[] = await mealRes.json();

        if (cancelled) {
          return;
        }

        setDishCount(dishes.length);
        setComboCount(combos.length);

        const today = new Date().toISOString().split("T")[0];
        const todayRecord = meals.find((m) => m.date === today);
        setTodayMeal(todayRecord || null);
      } catch {}
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🍽️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">今天吃什么？</h1>
        <p className="text-gray-500 text-sm">让选择困难症不再困难</p>
      </div>

      {/* Quick action */}
      <Link
        href="/recommend"
        className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl text-center font-semibold text-lg shadow-lg hover:from-orange-600 hover:to-red-600 transition-all mb-6"
      >
        <Shuffle size={22} className="inline mr-2 -mt-0.5" />
        一键随机推荐
      </Link>

      {/* Today's meal */}
      {todayMeal && (
        <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 font-semibold text-sm">
              ✅ 今日菜单已安排
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayMeal.mealDishes.map((md) => (
              <span
                key={md.id}
                className="bg-white text-gray-700 px-3 py-1 rounded-lg text-sm shadow-sm"
              >
                {getCategoryEmoji(md.dish.category)} {md.dish.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-orange-500">{dishCount}</div>
          <div className="text-sm text-gray-500 mt-1">菜品总数</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-pink-500">{comboCount}</div>
          <div className="text-sm text-gray-500 mt-1">收藏搭配</div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="space-y-2">
        {[
          {
            href: "/dishes",
            icon: UtensilsCrossed,
            label: "管理菜品库",
            desc: "添加、编辑你喜欢的菜品",
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            href: "/recommend",
            icon: Shuffle,
            label: "随机搭配推荐",
            desc: "设置规则，一键生成每日菜单",
            color: "text-red-500",
            bg: "bg-red-50",
          },
          {
            href: "/favorites",
            icon: Heart,
            label: "收藏的搭配",
            desc: "查看已收藏的搭配方案",
            color: "text-pink-500",
            bg: "bg-pink-50",
          },
          {
            href: "/history",
            icon: CalendarDays,
            label: "用餐记录",
            desc: "查看历史用餐记录",
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
              >
                <Icon size={20} className={item.color} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
