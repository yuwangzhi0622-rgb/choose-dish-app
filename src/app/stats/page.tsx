"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChefHat,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
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
    name: string;
    count: number;
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
    <div>
      <PageHeader
        title="数据统计"
        description={
          data
            ? `${data.range.start} 至 ${data.range.end}`
            : "看看你最近都吃了些什么"
        }
      />

      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
        {[
          { value: "week", label: "近一周" },
          { value: "month", label: "近一月" },
          { value: "all", label: "全部" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value as "week" | "month" | "all")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              period === p.value
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <CalendarIcon size={16} className="text-orange-500" />
          自定义日期范围
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            清空自定义日期
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
              <div className="flex items-center gap-2 text-orange-100 mb-2">
                <CalendarIcon size={18} />
                <span className="text-sm font-medium">总计用餐次数</span>
              </div>
              <div className="text-4xl font-bold">{data.totalMeals}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <UtensilsCrossed size={18} className="text-orange-500" />
                <span className="text-sm font-medium">总菜品份数</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.totalDishes}</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <BarChart3 size={18} className="text-orange-500" />
                <span className="text-sm font-medium">平均每餐菜数</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{data.averageDishesPerMeal}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4 px-1">
                <TrendingUp className="text-orange-500" size={20} />
                <h3 className="font-bold text-gray-900 text-lg">用餐趋势</h3>
              </div>

              {data.trend.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">这段时间还没有记录哦</div>
              ) : (
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {data.trend.map((item) => (
                    <div key={item.date} className="min-w-[48px] flex-1 flex flex-col items-center justify-end gap-2">
                      <span className="text-xs font-medium text-gray-500">{item.count}</span>
                      <div className="w-full rounded-t-xl bg-gradient-to-t from-orange-500 to-orange-300"
                        style={{ height: `${Math.max((item.count / maxTrendCount) * 120, 12)}px` }}
                      />
                      <span className="text-[11px] text-gray-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                  <BarChart3 size={18} className="text-orange-500" />
                  用餐类型分布
                </div>
                <div className="space-y-2">
                  {data.mealTypes.length === 0 ? (
                    <div className="text-sm text-gray-400">暂无餐次数据</div>
                  ) : (
                    data.mealTypes.map((item) => (
                      <div key={item.mealType} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                        <span className="text-gray-700">
                          {getMealTypeEmoji(item.mealType)} {getMealTypeLabel(item.mealType)}
                        </span>
                        <span className="font-semibold text-orange-600">{item.count} 次</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold">
                  <ChefHat size={18} className="text-orange-500" />
                  做饭人排行
                </div>
                <div className="space-y-2">
                  {data.chefs.length === 0 ? (
                    <div className="text-sm text-gray-400">还没有填写做饭人</div>
                  ) : (
                    data.chefs.map((chef, index) => (
                      <div key={chef.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                        <span className="text-gray-700">#{index + 1} {chef.name}</span>
                        <span className="font-semibold text-orange-600">{chef.count} 次</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <TrendingUp className="text-orange-500" size={20} />
              <h3 className="font-bold text-gray-900 text-lg">最常吃菜品排行榜</h3>
            </div>

            {data.topDishes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
                这段时间还没有记录哦
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {data.topDishes.map((dish, index) => (
                  <div
                    key={`${dish.name}-${index}`}
                    className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-orange-50/50 transition-colors"
                  >
                    <div
                      className={`w-6 text-center font-bold ${
                        index === 0
                          ? "text-yellow-500 text-lg"
                          : index === 1
                            ? "text-gray-400 text-lg"
                            : index === 2
                              ? "text-amber-700 text-lg"
                              : "text-gray-300 text-sm"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    {dish.imageUrl ? (
                      <img src={dish.imageUrl} alt={dish.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                        {getCategoryEmoji(dish.category)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{dish.name}</div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-orange-600">{dish.count}</span>
                      <span className="text-[10px] text-gray-400">次</span>
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
