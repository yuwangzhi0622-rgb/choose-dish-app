"use client";

import { useState, useEffect } from "react";
import { Trash2, CalendarDays, Users, ChefHat, Clock, ImagePlus, X } from "lucide-react";
import { getCategoryEmoji } from "@/lib/categories";
import {
  compressImage,
  getMealTypeEmoji,
  getMealTypeLabel,
  getOrderStatusEmoji,
  getOrderStatusLabel,
} from "@/lib/image-utils";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MealDish {
  id: string;
  quantity: number;
  dish: Dish;
}

interface Chef {
  id: string;
  name: string;
  avatar: string | null;
}

interface MealRecord {
  id: string;
  date: string;
  mealType: string;
  mealTime: string | null;
  chef: Chef | null;
  personCount: number;
  orderStatus: string;
  feedbackRating: number | null;
  feedbackComment: string | null;
  feedbackImages: string[];
  note: string | null;
  createdAt: string;
  mealDishes: MealDish[];
}

interface FeedbackDraft {
  rating: number;
  comment: string;
  images: string[];
}

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, FeedbackDraft>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchMeals = async () => {
    const res = await fetch("/api/meals");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "加载用餐记录失败");
    }

    setMeals(data);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadMeals = async () => {
      try {
        const res = await fetch("/api/meals");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "加载用餐记录失败");
        }

        if (!cancelled) {
          setMeals(data);
        }
      } catch (error) {
        if (!cancelled) {
          alert(error instanceof Error ? error.message : "加载用餐记录失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMeals();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条用餐记录吗？")) return;

    try {
      const res = await fetch(`/api/meals/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "删除用餐记录失败");
      }

      await fetchMeals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除用餐记录失败");
    }
  };

  const updateFeedbackDraft = (
    mealId: string,
    patch: Partial<FeedbackDraft>
  ) => {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [mealId]: {
        rating: prev[mealId]?.rating ?? 0,
        comment: prev[mealId]?.comment ?? "",
        images: prev[mealId]?.images ?? [],
        ...patch,
      },
    }));
  };

  const getFeedbackDraft = (meal: MealRecord) => {
    return (
      feedbackDrafts[meal.id] ?? {
        rating: meal.feedbackRating ?? 0,
        comment: meal.feedbackComment ?? "",
        images: meal.feedbackImages ?? [],
      }
    );
  };

  const handlePatchMeal = async (
    id: string,
    payload: {
      orderStatus?: string;
      feedbackRating?: number | null;
      feedbackComment?: string | null;
      feedbackImages?: string[] | null;
    }
  ) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "更新用餐记录失败");
      }

      await fetchMeals();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新用餐记录失败");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveFeedback = async (meal: MealRecord) => {
    const draft = getFeedbackDraft(meal);

    if (draft.rating < 1 || draft.rating > 5) {
      alert("请先选择 1 到 5 星评分");
      return;
    }

    await handlePatchMeal(meal.id, {
      feedbackRating: draft.rating,
      feedbackComment: draft.comment.trim() || null,
      feedbackImages: draft.images,
    });
  };

  const handleFeedbackImageChange = async (
    mealId: string,
    files: FileList | null
  ) => {
    if (!files?.length) {
      return;
    }

    try {
      const draft = feedbackDrafts[mealId];
      const currentImages =
        draft?.images ?? meals.find((meal) => meal.id === mealId)?.feedbackImages ?? [];
      const remainingSlots = Math.max(0, 6 - currentImages.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const compressedImages = await Promise.all(
        selectedFiles.map((file) => compressImage(file, 1200, 0.82))
      );

      updateFeedbackDraft(mealId, {
        images: [...currentImages, ...compressedImages],
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "处理图片失败");
    }
  };

  const removeFeedbackImage = (mealId: string, imageIndex: number) => {
    const draft = feedbackDrafts[mealId];
    const currentImages =
      draft?.images ?? meals.find((meal) => meal.id === mealId)?.feedbackImages ?? [];

    updateFeedbackDraft(mealId, {
      images: currentImages.filter((_, index) => index !== imageIndex),
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays === 2) return "前天";

    return date.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const getStatusStyle = (status: string) => {
    if (status === "accepted") {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (status === "completed") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 font-medium tracking-wide">加载历史记录中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 mt-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-3">
            历史记录
          </h1>
          <p className="text-lg text-gray-500">
            回顾过往的 <span className="font-semibold text-gray-900">{meals.length}</span> 次美好用餐
          </p>
        </div>
      </div>

      {meals.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2rem] shadow-sm border border-gray-100">
          <CalendarDays size={48} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
          <p className="text-2xl font-semibold text-gray-900 mb-3">暂无用餐记录</p>
          <p className="text-gray-500 text-lg">去点菜页面生成搭配并记录吧</p>
        </div>
      ) : (
        <div className="space-y-6">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
            >
              {(() => {
                const feedbackDraft = getFeedbackDraft(meal);

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                            {formatDate(meal.date)}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 border border-gray-200/60">
                            {getMealTypeEmoji(meal.mealType)} {getMealTypeLabel(meal.mealType)}
                          </span>
                          {meal.mealTime && (
                            <span className="flex items-center gap-1 text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                              <Clock size={14} /> {meal.mealTime}
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold border flex items-center gap-1.5 ${getStatusStyle(meal.orderStatus)}`}
                          >
                            {getOrderStatusEmoji(meal.orderStatus)} {getOrderStatusLabel(meal.orderStatus)}
                          </span>
                        </div>
                        <div className="text-[15px] font-medium text-gray-400">
                          {formatFullDate(meal.date)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="p-2 sm:p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                        aria-label="删除记录"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 mb-5 text-[15px] text-gray-600 font-medium flex-wrap">
                      {meal.chef && (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          <ChefHat size={16} className="text-gray-400" /> {meal.chef.name}
                        </span>
                      )}
                      {meal.personCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          <Users size={16} className="text-gray-400" /> {meal.personCount} 人就餐
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5 mb-6">
                      {meal.mealDishes.map((md) => (
                        <span
                          key={md.id}
                          className="bg-gray-100 text-gray-800 px-4 py-2 rounded-xl text-[15px] font-medium border border-gray-200/60"
                        >
                          <span className="mr-1.5">{getCategoryEmoji(md.dish.category)}</span>
                          {md.dish.name}
                          {md.quantity > 1 ? <span className="text-gray-400 ml-1.5 font-bold">×{md.quantity}</span> : ""}
                        </span>
                      ))}
                    </div>

                    {meal.note && (
                      <div className="mb-6 bg-yellow-50/50 border border-yellow-100 p-4 rounded-2xl text-[15px] text-gray-700 leading-relaxed">
                        <span className="font-semibold text-yellow-700 mr-2">备注:</span> 
                        {meal.note}
                      </div>
                    )}

                    {/* Order Status Actions */}
                    <div className="flex flex-wrap gap-3 mb-6 pt-6 border-t border-gray-100">
                      {meal.orderStatus === "pending" && (
                        <>
                          <button
                            onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                            disabled={updatingId === meal.id}
                            className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-[15px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            厨师接单
                          </button>
                          <button
                            onClick={() => handlePatchMeal(meal.id, { orderStatus: "rejected" })}
                            disabled={updatingId === meal.id}
                            className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-[15px] font-bold hover:bg-red-100 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            拒绝接单
                          </button>
                        </>
                      )}
                      {meal.orderStatus === "accepted" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "completed" })}
                          disabled={updatingId === meal.id}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[15px] font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          标记完成
                        </button>
                      )}
                      {meal.orderStatus === "rejected" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "pending" })}
                          disabled={updatingId === meal.id}
                          className="px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[15px] font-bold hover:bg-amber-100 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          重新待接单
                        </button>
                      )}
                      {meal.orderStatus === "completed" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                          disabled={updatingId === meal.id}
                          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-[15px] font-bold hover:bg-gray-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          改回已接单
                        </button>
                      )}
                    </div>

                    {/* Feedback Section */}
                    {(meal.orderStatus === "completed" || meal.feedbackRating || meal.feedbackComment || meal.feedbackImages.length > 0) && (
                      <div className="mt-2 bg-gray-50/80 border border-gray-100 p-5 sm:p-6 rounded-[1.5rem] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <div className="text-[17px] font-bold text-gray-900 mb-4 tracking-tight">
                          {meal.chef ? `给 ${meal.chef.name} 的反馈` : "客户反馈"}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm inline-flex w-max">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={`${meal.id}-star-${star}`}
                                  type="button"
                                  onClick={() => updateFeedbackDraft(meal.id, { rating: star })}
                                  className={`text-2xl leading-none transition-transform hover:scale-110 focus:outline-none focus:scale-110 ${
                                    star <= feedbackDraft.rating ? "text-yellow-400 drop-shadow-sm" : "text-gray-200"
                                  }`}
                                  aria-label={`${star}星`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                            <div className="text-sm font-semibold text-gray-500 px-1">
                              {feedbackDraft.rating > 0 ? `${feedbackDraft.rating} 星评价` : "暂未评分"}
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col gap-3 w-full">
                            <textarea
                              value={feedbackDraft.comment}
                              onChange={(e) => updateFeedbackDraft(meal.id, { comment: e.target.value })}
                              placeholder="写下客户的真实反馈，比如口味、分量、改进建议..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow shadow-sm"
                            />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <label
                                  htmlFor={`feedback-images-${meal.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <ImagePlus size={16} /> 上传反馈图片
                                </label>
                                <span className="text-xs text-gray-400">最多 6 张，自动压缩</span>
                              </div>
                              <input
                                id={`feedback-images-${meal.id}`}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => {
                                  void handleFeedbackImageChange(meal.id, event.target.files);
                                  event.currentTarget.value = "";
                                }}
                              />
                              {feedbackDraft.images.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                  {feedbackDraft.images.map((image, imageIndex) => (
                                    <div key={`${meal.id}-feedback-image-${imageIndex}`} className="relative group">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(image)}
                                        className="block w-full aspect-square rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        <img
                                          src={image}
                                          alt={`反馈图片 ${imageIndex + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeFeedbackImage(meal.id, imageIndex)}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"
                                        aria-label="删除反馈图片"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSaveFeedback(meal)}
                                disabled={updatingId === meal.id}
                                className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[15px] font-bold hover:bg-black disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/50"
                              >
                                {updatingId === meal.id ? "保存中..." : "保存反馈"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="关闭图片预览"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="反馈图片预览"
              className="w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
