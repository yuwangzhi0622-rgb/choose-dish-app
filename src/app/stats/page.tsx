"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChefHat,
  TrendingUp,
  UtensilsCrossed,
  CalendarDays,
  Heart
} from "lucide-react";
import { getMealTypeLabel } from "@/lib/image-utils";
import { CategoryIcon, MealTypeIcon } from "@/components/CategoryIcon";

interface StatData {
  totalMeals: number;
  totalDishes: number;
  averageDishesPerMeal: number;
  range: {
    start: string;
    end: string;
  };
  trend: {
    date: string;
    label: string;
    count: number;
  }[];
  mealTypes: {
    mealType: string;
    count: number;
  }[];
  chefs: {
    id: string;
    name: string;
    count: number;
    avgRating: number | null;
    ratingCount: number;
    topDishes: {
      id: string;
      name: string;
      count: number;
      category: string;
      imageUrl: string | null;
    }[];
  }[];
  topDishes: {
    name: string;
    count: number;
    category: string;
    imageUrl: string | null;
  }[];
}

export default function StatsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ period });

        if (startDate) {
          params.set("start", startDate);
        }

        if (endDate) {
          params.set("end", endDate);
        }

        const res = await fetch(`/api/stats?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [period, startDate, endDate]);

  const maxTrendCount = useMemo(
    () => Math.max(...(data?.trend.map((item) => item.count) ?? [1]), 1),
    [data]
  );

  return (
    <div className="max-w-[1024px] mx-auto pb-16">
      <div className="mb-8 mt-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          数据统计
        </h1>
        <p className="text-base text-stone-400">
          {data ? `${data.range.start} 至 ${data.range.end}` : "看看你最近都吃了些什么"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 p-0.5 bg-stone-100 rounded-xl w-max">
          {[
            { value: "week", label: "近一周" },
            { value: "month", label: "近一月" },
            { value: "all", label: "全部" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as "week" | "month" | "all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 ${
                period === p.value
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-400 hover:text-stone-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-stone-100">
          <CalendarDays size={14} strokeWidth={1.5} className="text-stone-300 shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-[120px] bg-transparent text-sm font-medium text-stone-600 focus:outline-none transition-colors"
          />
          <span className="text-stone-200">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-[120px] bg-transparent text-sm font-medium text-stone-600 focus:outline-none transition-colors"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-stone-400 hover:text-red-500 font-medium whitespace-nowrap transition-all active:scale-90 pl-1"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-stone-400 font-medium tracking-wide">加载统计数据中...</div>
        </div>
      ) : !data ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
          <BarChart3 size={36} className="mx-auto mb-3 text-stone-300" strokeWidth={1.5} />
          <p className="text-xl font-semibold text-stone-900 mb-2">暂无统计数据</p>
          <p className="text-stone-400 text-sm">这段时间还没有任何记录</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-stone-900 rounded-2xl p-5 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CalendarIcon size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 text-stone-400 mb-2">
                  <CalendarIcon size={14} strokeWidth={1.5} />
                  <span className="text-xs font-medium uppercase tracking-wider">总计用餐</span>
                </div>
                <div className="text-4xl font-bold tracking-tight">{data.totalMeals}</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-stone-100 group hover:border-stone-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 text-stone-400 mb-2">
                <UtensilsCrossed size={14} strokeWidth={1.5} />
                <span className="text-xs font-medium uppercase tracking-wider">总菜品份数</span>
              </div>
              <div className="text-4xl font-bold text-stone-900 tracking-tight">{data.totalDishes}</div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-stone-100 group hover:border-stone-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-1.5 text-stone-400 mb-2">
                <BarChart3 size={14} strokeWidth={1.5} />
                <span className="text-xs font-medium uppercase tracking-wider">平均每餐菜数</span>
              </div>
              <div className="text-4xl font-bold text-stone-900 tracking-tight">{data.averageDishesPerMeal}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
            {/* Trend Chart */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center">
                  <TrendingUp size={14} strokeWidth={1.5} className="text-stone-500" />
                </div>
                <h3 className="font-semibold text-stone-900 text-base tracking-tight">用餐趋势</h3>
              </div>

              {data.trend.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-sm">这段时间还没有记录哦</div>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-3 scrollbar-hide px-1">
                  {data.trend.map((item) => (
                    <div key={item.date} className="min-w-[40px] flex-1 flex flex-col items-center justify-end gap-2 group">
                      <span className="text-xs font-semibold text-stone-300 group-hover:text-stone-700 transition-colors">{item.count}</span>
                      <div className="w-full rounded-t-lg bg-stone-100 group-hover:bg-stone-900 transition-colors"
                        style={{ height: `${Math.max((item.count / maxTrendCount) * 140, 12)}px` }}
                      />
                      <span className="text-[10px] font-medium text-stone-300 whitespace-nowrap">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distribution Stats */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center">
                    <BarChart3 size={14} strokeWidth={1.5} className="text-stone-500" />
                  </div>
                  <h3 className="font-semibold text-stone-900 text-base tracking-tight">用餐类型分布</h3>
                </div>
                
                <div className="space-y-2">
                  {data.mealTypes.length === 0 ? (
                    <div className="text-xs text-stone-400 py-4 text-center">暂无餐次数据</div>
                  ) : (
                    data.mealTypes.map((item) => {
                      const percentage = Math.round((item.count / data.totalMeals) * 100);
                      return (
                        <div key={item.mealType} className="group relative overflow-hidden bg-stone-50 rounded-xl px-3 py-2.5 border border-transparent hover:border-stone-200 transition-all">
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-stone-100 transition-all duration-500 ease-out" 
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between text-sm">
                            <span className="text-stone-700 font-medium flex items-center gap-1.5">
                              <MealTypeIcon mealType={item.mealType} size={14} className="text-stone-400" />
                              {getMealTypeLabel(item.mealType)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-stone-300">{percentage}%</span>
                              <span className="font-semibold text-stone-900 text-xs w-8 text-right">{item.count}次</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center">
                    <ChefHat size={14} strokeWidth={1.5} className="text-stone-500" />
                  </div>
                  <h3 className="font-semibold text-stone-900 text-base tracking-tight">大厨贡献榜</h3>
                </div>
                
                <div className="space-y-2">
                  {data.chefs.length === 0 ? (
                    <div className="text-xs text-stone-400 py-4 text-center">还没有填写做饭人</div>
                  ) : (
                    data.chefs.map((chef, index) => (
                      <div key={chef.id} className="bg-stone-50 rounded-xl px-3 py-3 hover:bg-stone-100 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-stone-700 font-medium flex items-center gap-2 text-sm">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                index === 0 ? "bg-stone-900 text-white" :
                                index === 1 ? "bg-stone-200 text-stone-600" :
                                index === 2 ? "bg-stone-100 text-stone-500" :
                                "bg-white text-stone-400 border border-stone-200"
                              }`}>
                                {index + 1}
                              </span>
                              <span className="truncate">{chef.name}</span>
                            </span>
                            <div className="mt-1 text-xs text-stone-400 ml-7">{chef.count} 次</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-semibold text-stone-900 text-sm">
                              {chef.avgRating ? `${chef.avgRating}分` : "-"}
                            </div>
                            <div className="text-[10px] text-stone-300">
                              {chef.ratingCount > 0 ? `${chef.ratingCount}条` : "无评价"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1 ml-7">
                          {chef.topDishes.length > 0 ? (
                            chef.topDishes.map((dish) => (
                              <span
                                key={`${chef.id}-${dish.id}`}
                                className="inline-flex items-center gap-1 bg-white text-stone-600 px-2 py-1 rounded-lg text-[10px] font-medium border border-stone-100"
                              >
                                <CategoryIcon category={dish.category} size={10} className="text-stone-400" />
                                {dish.name}
                                <span className="text-stone-300">×{dish.count}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-stone-300">暂无数据</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-full bg-stone-50 flex items-center justify-center">
                <Heart size={14} strokeWidth={1.5} className="text-stone-500" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base tracking-tight">最常吃榜单</h3>
            </div>

            {data.topDishes.length === 0 ? (
              <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-400 text-sm">
                这段时间还没有记录哦
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {data.topDishes.map((dish, index) => (
                  <div
                    key={`${dish.name}-${index}`}
                    className="group relative bg-stone-50 rounded-xl p-3 border border-transparent hover:bg-white hover:border-stone-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 border-2 border-white bg-stone-100 text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                      {index + 1}
                    </div>

                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-stone-100">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CategoryIcon category={dish.category} size={28} className="text-stone-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="font-semibold text-stone-900 text-sm truncate tracking-tight">{dish.name}</div>
                      <div className="flex items-baseline gap-0.5 mt-1">
                        <span className="text-lg font-bold text-stone-900 tracking-tighter">{dish.count}</span>
                        <span className="text-[10px] font-medium text-stone-400">次</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
