const axios = require('axios');

/**
 * Fetch nutrition data from Edamam API
 * Fallback to Nutritionix if Edamam not configured
 * Final fallback to basic estimation
 */
const fetchNutritionData = async (foodName, quantity = 100, unit = 'g') => {
  // Try Edamam first
  if (process.env.EDAMAM_APP_ID && process.env.EDAMAM_APP_KEY) {
    try {
      const query = `${quantity}${unit} ${foodName}`;
      const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
        params: {
          app_id: process.env.EDAMAM_APP_ID,
          app_key: process.env.EDAMAM_APP_KEY,
          ingr: query,
          'nutrition-type': 'logging',
        },
        timeout: 5000,
      });

      const hints = response.data?.hints;
      if (hints && hints.length > 0) {
        const food = hints[0].food;
        const nutrients = food.nutrients;
        const factor = quantity / 100;

        return {
          calories: Math.round((nutrients.ENERC_KCAL || 0) * factor),
          protein: parseFloat(((nutrients.PROCNT || 0) * factor).toFixed(1)),
          carbs: parseFloat(((nutrients.CHOCDF || 0) * factor).toFixed(1)),
          fat: parseFloat(((nutrients.FAT || 0) * factor).toFixed(1)),
          fiber: parseFloat(((nutrients.FIBTG || 0) * factor).toFixed(1)),
          source: 'edamam',
        };
      }
    } catch (err) {
      console.error('Edamam API error:', err.message);
    }
  }

  // Try Nutritionix
  if (process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_API_KEY) {
    try {
      const response = await axios.post(
        'https://trackapi.nutritionix.com/v2/natural/nutrients',
        { query: `${quantity}g ${foodName}` },
        {
          headers: {
            'x-app-id': process.env.NUTRITIONIX_APP_ID,
            'x-app-key': process.env.NUTRITIONIX_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      const foods = response.data?.foods;
      if (foods && foods.length > 0) {
        const f = foods[0];
        return {
          calories: Math.round(f.nf_calories || 0),
          protein: parseFloat((f.nf_protein || 0).toFixed(1)),
          carbs: parseFloat((f.nf_total_carbohydrate || 0).toFixed(1)),
          fat: parseFloat((f.nf_total_fat || 0).toFixed(1)),
          fiber: parseFloat((f.nf_dietary_fiber || 0).toFixed(1)),
          source: 'nutritionix',
        };
      }
    } catch (err) {
      console.error('Nutritionix API error:', err.message);
    }
  }

  // Basic estimation fallback (per 100g averages)
  const basicEstimates = {
    rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
    bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
    milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
    apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
    banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
    pasta: { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
    beef: { calories: 250, protein: 26, carbs: 0, fat: 15 },
    fish: { calories: 100, protein: 20, carbs: 0, fat: 2 },
    default: { calories: 100, protein: 5, carbs: 15, fat: 3 },
  };

  const key = Object.keys(basicEstimates).find(k => foodName.toLowerCase().includes(k)) || 'default';
  const base = basicEstimates[key];
  const factor = quantity / 100;

  return {
    calories: Math.round(base.calories * factor),
    protein: parseFloat((base.protein * factor).toFixed(1)),
    carbs: parseFloat((base.carbs * factor).toFixed(1)),
    fat: parseFloat((base.fat * factor).toFixed(1)),
    fiber: 0,
    source: 'estimated',
  };
};

module.exports = { fetchNutritionData };
