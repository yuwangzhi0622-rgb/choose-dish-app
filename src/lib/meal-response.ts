import { parseFeedbackImages } from "@/lib/chef-service";

interface ChefShape {
  id: string;
  name: string;
  avatar: string | null;
}

interface MealShape {
  feedbackImages?: string | null;
  chefName?: string | null;
  chef?: ChefShape | null;
}

export function serializeMealRecord<T extends MealShape>(meal: T) {
  const chef = meal.chef
    ? meal.chef
    : meal.chefName
      ? {
          id: "",
          name: meal.chefName,
          avatar: null,
        }
      : null;

  return {
    ...meal,
    chef,
    feedbackImages: parseFeedbackImages(meal.feedbackImages),
  };
}

export function serializeMealRecords<T extends MealShape>(meals: T[]) {
  return meals.map(serializeMealRecord);
}
