"use client";

import { useState, useEffect } from "react";
import { Trash2, CalendarDays, Users, ChefHat, Clock, ImagePlus, X, Star } from "lucide-react";
import {
  compressImage,
  getMealTypeLabel,
  getOrderStatusLabel,
} from "@/lib/image-utils";
import { CategoryIcon, MealTypeIcon, OrderStatusIcon } from "@/components/CategoryIcon";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MealDish {
  id: string;
  quantity: number;
  note: string | null;
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
    if (status === "accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "rejected") return "bg-red-50 text-red-600 border-red-200";
    if (status === "completed") return "bg-stone-100 text-stone-700 border-stone-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
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
        <div className="text-stone-400 font-medium tracking-wide">加载历史记录中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto pb-16">
      <div className="mb-8 mt-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          历史记录
        </h1>
        <p className="text-base text-stone-400">
          回顾过往的 <span className="font-semibold text-stone-700">{meals.length}</span> 次用餐
        </p>
      </div>

      {meals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
          <CalendarDays size={36} className="mx-auto mb-3 text-stone-300" strokeWidth={1.5} />
          <p className="text-xl font-semibold text-stone-900 mb-2">暂无用餐记录</p>
          <p className="text-stone-400 text-sm">去点菜页面生成搭配并记录吧</p>
        </div>
      ) : (
        <div className="space-y-6">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 group"
            >
              {(() => {
                const feedbackDraft = getFeedbackDraft(meal);

                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-lg font-semibold text-stone-900 tracking-tight">
                            {formatDate(meal.date)}
                          </span>
                          <span className="bg-stone-50 text-stone-600 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-stone-100">
                            <MealTypeIcon mealType={meal.mealType} size={13} className="text-stone-400" /> {getMealTypeLabel(meal.mealType)}
                          </span>
                          {meal.mealTime && (
                            <span className="flex items-center gap-1 text-xs font-medium text-stone-400">
                              <Clock size={12} strokeWidth={1.5} /> {meal.mealTime}
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusStyle(meal.orderStatus)}`}
                          >
                            <OrderStatusIcon status={meal.orderStatus} size={12} /> {getOrderStatusLabel(meal.orderStatus)}
                          </span>
                        </div>
                        <div className="text-xs text-stone-300">
                          {formatFullDate(meal.date)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDelete(meal.id)}
                        className="p-2 bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90 shrink-0 focus:outline-none focus:ring-2 focus:ring-stone-300 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                        aria-label="删除记录"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {meal.chef && (
                        <span className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 border border-stone-100">
                          <ChefHat size={13} strokeWidth={1.5} className="text-stone-400" /> {meal.chef.name}
                        </span>
                      )}
                      {meal.personCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 border border-stone-100">
                          <Users size={13} strokeWidth={1.5} className="text-stone-400" /> {meal.personCount}人
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 mb-5">
                      {meal.mealDishes.map((md) => (
                        <div key={md.id} className="flex flex-col">
                          <span className="bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-100 inline-flex items-center gap-1.5 w-max">
                            <CategoryIcon category={md.dish.category} size={13} className="text-stone-400" />
                            {md.dish.name}
                            {md.quantity > 1 ? <span className="text-stone-300 font-semibold">×{md.quantity}</span> : ""}
                          </span>
                          {md.note && (
                            <span className="text-[11px] text-stone-400 mt-0.5 ml-3">备注: {md.note}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {meal.note && (
                      <div className="mb-5 bg-stone-50 border border-stone-100 p-3 rounded-xl text-sm text-stone-600 leading-relaxed">
                        <span className="font-semibold text-stone-500 mr-1.5">备注:</span>{meal.note}
                      </div>
                    )}

                    {/* Order Status Actions */}
                    <div className="flex flex-wrap gap-2 mb-5 pt-4 border-t border-stone-100">
                      {meal.orderStatus === "pending" && (
                        <>
                          <button
                            onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                            disabled={updatingId === meal.id}
                            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                          >
                            厨师接单
                          </button>
                          <button
                            onClick={() => handlePatchMeal(meal.id, { orderStatus: "rejected" })}
                            disabled={updatingId === meal.id}
                            className="px-4 py-2 rounded-lg bg-white text-stone-600 border border-stone-200 text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                          >
                            拒绝接单
                          </button>
                        </>
                      )}
                      {meal.orderStatus === "accepted" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "completed" })}
                          disabled={updatingId === meal.id}
                          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
                        >
                          标记完成
                        </button>
                      )}
                      {meal.orderStatus === "rejected" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "pending" })}
                          disabled={updatingId === meal.id}
                          className="px-4 py-2 rounded-lg bg-white text-stone-600 border border-stone-200 text-sm font-semibold hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                        >
                          重新待接单
                        </button>
                      )}
                      {meal.orderStatus === "completed" && (
                        <button
                          onClick={() => handlePatchMeal(meal.id, { orderStatus: "accepted" })}
                          disabled={updatingId === meal.id}
                          className="px-4 py-2 rounded-lg bg-white text-stone-500 border border-stone-200 text-sm font-medium hover:bg-stone-50 hover:border-stone-300 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-300"
                        >
                          改回已接单
                        </button>
                      )}
                    </div>

                    {/* Feedback Section */}
                    {(meal.orderStatus === "completed" || meal.feedbackRating || meal.feedbackComment || meal.feedbackImages.length > 0) && (
                      <div className="mt-1 bg-stone-50 border border-stone-100 p-4 sm:p-5 rounded-xl">
                        <div className="text-sm font-semibold text-stone-700 mb-3">
                          {meal.chef ? `给 ${meal.chef.name} 的反馈` : "客户反馈"}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 w-max">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={`${meal.id}-star-${star}`}
                                  type="button"
                                  onClick={() => updateFeedbackDraft(meal.id, { rating: star })}
                                  className={`p-0.5 transition-all hover:scale-110 active:scale-95 focus:outline-none ${
                                    star <= feedbackDraft.rating ? "text-amber-400" : "text-stone-200"
                                  }`}
                                  aria-label={`${star}星`}
                                >
                                  <Star size={18} fill={star <= feedbackDraft.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                                </button>
                              ))}
                            </div>
                            <div className="text-xs font-medium text-stone-400 px-1">
                              {feedbackDraft.rating > 0 ? `${feedbackDraft.rating} 星` : "未评分"}
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col gap-3 w-full">
                            <textarea
                              value={feedbackDraft.comment}
                              onChange={(e) => updateFeedbackDraft(meal.id, { comment: e.target.value })}
                              placeholder="写下客户的真实反馈，比如口味、分量、改进建议..."
                              rows={2}
                              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none transition-all"
                            />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <label
                                  htmlFor={`feedback-images-${meal.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-stone-300 bg-white text-stone-600 text-xs font-medium hover:border-stone-400 hover:text-stone-800 active:scale-[0.97] transition-all cursor-pointer"
                                >
                                  <ImagePlus size={14} strokeWidth={1.5} /> 上传图片
                                </label>
                                <span className="text-xs text-stone-300">最多6张</span>
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
                                className="px-5 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 active:scale-[0.97] disabled:opacity-40 transition-all focus:outline-none focus:ring-2 focus:ring-stone-400"
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
