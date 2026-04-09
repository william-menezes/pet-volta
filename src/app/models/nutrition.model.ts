export type NutritionLog = {
  id: string;
  pet_id: string;
  owner_id: string;
  food_name: string;
  portion_grams: number | null;
  calories: number | null;
  meal_time: string;
  notes: string | null;
  created_at: string;
};

export type NutritionLogCreateInput = Omit<NutritionLog, 'id' | 'owner_id' | 'created_at'>;
