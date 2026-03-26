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
import { getCategoryEmoji } from "@/lib/categories";
import { getMealTypeEmoji, getMealTypeLabel } from "@/lib/image-utils";

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 mt-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3">
            数据统计
          </h1>
          <p className="text-lg text-gray-500">
            {data ? `${data.range.start} 至 ${data.range.end}` : "看看你最近都吃了些什么"}
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-3 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-1 p-1.5 bg-gray-100/80 rounded-2xl">
          {[
            { value: "week", label: "近一周" },
            { value: "month", label: "近一月" },
            { value: "all", label: "全部" },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as "week" | "month" | "all")}
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                period === p.value
                  ? "bg-white text-gray-900 shadow-sm scale-[1.02]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 px-2 sm:px-4 sm:border-l border-gray-200">
          <div className="flex items-center gap-2 flex-1">
            <CalendarDays size={18} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-[130px] bg-transparent text-[15px] font-medium text-gray-700 focus:outline-none focus:text-blue-600 transition-colors"
            />
          </div>
          <span className="text-gray-300 font-bold">-</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-[130px] bg-transparent text-[15px] font-medium text-gray-700 focus:outline-none focus:text-blue-600 transition-colors"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-[13px] text-gray-400 hover:text-red-500 font-medium whitespace-nowrap transition-colors pl-2"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-gray-400 font-medium tracking-wide">加载统计数据中...</div>
        </div>
      ) : !data ? (
        <div className="text-center py-24 bg-white rounded-[2rem] shadow-sm border border-gray-100">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
          <p className="text-2xl font-semibold text-gray-900 mb-3">暂无统计数据</p>
          <p className="text-gray-500 text-lg">这段时间还没有任何记录</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl shadow-gray-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <CalendarIcon size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <CalendarIcon size={18} />
                  <span className="text-[15px] font-semibold uppercase tracking-wider">总计用餐次数</span>
                </div>
                <div className="text-6xl font-bold tracking-tight">{data.totalMeals}</div>
              </div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <UtensilsCrossed size={18} className="text-blue-500" />
                <span className="text-[15px] font-semibold uppercase tracking-wider">总菜品份数</span>
              </div>
              <div className="text-5xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">{data.totalDishes}</div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <BarChart3 size={18} className="text-purple-500" />
                <span className="text-[15px] font-semibold uppercase tracking-wider">平均每餐菜数</span>
              </div>
              <div className="text-5xl font-bold text-gray-900 tracking-tight group-hover:text-purple-600 transition-colors">{data.averageDishesPerMeal}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8">
            {/* Trend Chart */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp size={18} strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-xl tracking-tight">用餐趋势</h3>
              </div>

              {data.trend.length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-medium">这段时间还没有记录哦</div>
              ) : (
                <div className="flex items-end gap-3 h-56 overflow-x-auto pb-4 scrollbar-hide px-2">
                  {data.trend.map((item) => (
                    <div key={item.date} className="min-w-[48px] flex-1 flex flex-col items-center justify-end gap-3 group">
                      <span className="text-sm font-bold text-gray-400 group-hover:text-blue-600 transition-colors">{item.count}</span>
                      <div className="w-full rounded-t-xl bg-gray-100 group-hover:bg-blue-500 transition-colors relative overflow-hidden"
                        style={{ height: `${Math.max((item.count / maxTrendCount) * 160, 16)}px` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Distribution Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <BarChart3 size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl tracking-tight">用餐类型分布</h3>
                </div>
                
                <div className="space-y-3">
                  {data.mealTypes.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无餐次数据</div>
                  ) : (
                    data.mealTypes.map((item) => {
                      const percentage = Math.round((item.count / data.totalMeals) * 100);
                      return (
                        <div key={item.mealType} className="group relative overflow-hidden bg-gray-50 rounded-2xl px-4 py-3 border border-transparent hover:border-gray-200 transition-colors">
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-green-100/50 transition-all duration-500 ease-out" 
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative z-10 flex items-center justify-between text-[15px]">
                            <span className="text-gray-800 font-medium flex items-center gap-2">
                              <span className="text-xl">{getMealTypeEmoji(item.mealType)}</span>
                              {getMealTypeLabel(item.mealType)}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400">{percentage}%</span>
                              <span className="font-bold text-gray-900 w-10 text-right">{item.count} 次</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <ChefHat size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xl tracking-tight">大厨贡献榜</h3>
                </div>
                
                <div className="space-y-3">
                  {data.chefs.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4 text-center">还没有填写做饭人</div>
                  ) : (
                    data.chefs.map((chef, index) => (
                      <div key={chef.id} className="bg-gray-50 rounded-2xl px-4 py-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <span className="text-gray-800 font-medium flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? "bg-yellow-100 text-yellow-700" :
                                index === 1 ? "bg-gray-200 text-gray-600" :
                                index === 2 ? "bg-amber-100/50 text-amber-700" :
                                "bg-white text-gray-400 shadow-sm"
                              }`}>
                                {index + 1}
                              </span>
                              <span className="truncate">{chef.name}</span>
                            </span>
                            <div className="mt-2 text-sm text-gray-500 font-medium">做饭 {chef.count} 次</div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-amber-500 text-lg leading-none tracking-[0.2em]">
                              {chef.avgRating ? "★★★★★".slice(0, Math.round(chef.avgRating)) : "-"}
                            </div>
                            <div className="mt-1 font-bold text-gray-900">
                              {chef.avgRating ? `${chef.avgRating} 分` : "暂无评分"}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {chef.ratingCount > 0 ? `${chef.ratingCount} 条评分` : "暂无评价"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {chef.topDishes.length > 0 ? (
                            chef.topDishes.map((dish) => (
                              <span
                                key={`${chef.id}-${dish.id}`}
                                className="inline-flex items-center gap-1.5 bg-white text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200"
                              >
                                <span>{getCategoryEmoji(dish.category)}</span>
                                <span>{dish.name}</span>
                                <span className="text-gray-400">×{dish.count}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">还没有拿手菜数据</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-200">
                  <Heart size={20} strokeWidth={2.5} fill="currentColor" className="opacity-80" />
                </div>
                <h3 className="font-bold text-gray-900 text-2xl tracking-tight">最常吃榜单</h3>
              </div>
            </div>

            {data.topDishes.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 border-dashed text-gray-400 font-medium">
                这段时间还没有记录哦
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {data.topDishes.map((dish, index) => (
                  <div
                    key={`${dish.name}-${index}`}
                    className="group relative bg-gray-50 rounded-2xl p-4 border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-black z-10 shadow-sm border-2 border-white bg-gray-100 text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                      {index + 1}
                    </div>

                    <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-gray-100">
                      {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl transition-transform duration-700 group-hover:scale-110">
                          {getCategoryEmoji(dish.category)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="font-bold text-gray-900 text-lg truncate tracking-tight mb-1">{dish.name}</div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[13px] font-medium text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-md">吃过</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900 tracking-tighter">{dish.count}</span>
                          <span className="text-[13px] font-bold text-gray-400">次</span>
                        </div>
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
