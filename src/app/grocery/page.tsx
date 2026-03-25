"use client";

import { useState, useEffect, Suspense } from "react";
import { ShoppingBag, ChevronLeft, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

interface GroceryItem {
  dishName: string;
  note: string;
}

function GroceryContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [summaryItems, setSummaryItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dishIds = searchParams.getAll("id");
    
    if (dishIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchGroceryList = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/grocery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dishIds }),
        });
        
        if (!res.ok) throw new Error("获取失败");
        const data = await res.json();
        setItems(data.groceryList || []);
        setSummaryItems(data.summaryItems || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroceryList();
  }, [searchParams]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link 
          href="/"
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <PageHeader
          title="食材清单"
          description="优先基于你填写的食材字段生成"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">正在生成清单...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mt-4">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">未发现所需食材</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            你选择的菜品没有填写食材/备注，或者你还没有在首页选菜。
            <br />
            建议在「管理」页面为菜品补充主要食材和标签。
          </p>
          <Link 
            href="/"
            className="inline-block mt-6 px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            去点菜
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm flex gap-3 items-start">
            <ShoppingBag className="shrink-0 text-orange-500" size={20} />
            <p>
              这里优先提取了你选中菜品的食材字段，并附带备注说明。去买菜时可以直接对照以下清单。
            </p>
          </div>

          {summaryItems.length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="font-semibold text-gray-900 mb-3">汇总购买清单</div>
              <div className="flex flex-wrap gap-2">
                {summaryItems.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  {item.dishName}
                </div>
                <div className="text-gray-600 text-sm whitespace-pre-wrap pl-4 border-l-2 border-orange-100 ml-1 py-1">
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroceryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <GroceryContent />
    </Suspense>
  );
}
