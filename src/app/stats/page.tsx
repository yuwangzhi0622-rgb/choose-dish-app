"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCategoryEmoji } from "@/lib/categories";

interface StatData {
  totalMeals: number;
  topDishes: {
    name: string;
    count: number;
    category: string;
    imageUrl: string | null;
  }[];
}

export default function StatsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  return (
    <div>
      <PageHeader
        title="数据统计"
        description="看看你最近都吃了些什么"
      />

      {/* Period Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
        {[
          { value: "week", label: "近一周" },
          { value: "month", label: "近一月" },
          { value: "all", label: "全部" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value as any)}
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">加载中...</div>
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-gray-400">暂无数据</div>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-200">
            <div className="flex items-center gap-2 text-orange-100 mb-2">
              <CalendarIcon size={18} />
              <span className="text-sm font-medium">总计用餐次数</span>
            </div>
            <div className="text-4xl font-bold">{data.totalMeals} <span className="text-xl font-normal opacity-80">次</span></div>
          </div>

          {/* Top Dishes */}
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
                    key={dish.name}
                    className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className={`w-6 text-center font-bold ${
                      index === 0 ? "text-yellow-500 text-lg" :
                      index === 1 ? "text-gray-400 text-lg" :
                      index === 2 ? "text-amber-700 text-lg" :
                      "text-gray-300 text-sm"
                    }`}>
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
