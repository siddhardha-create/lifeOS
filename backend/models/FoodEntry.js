const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'g', enum: ['g', 'ml', 'oz', 'serving', 'cup', 'tbsp', 'tsp', 'piece'] },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  isAutoFetched: { type: Boolean, default: false },
});

const mealSchema = new mongoose.Schema({
  items: [foodItemSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
});

const foodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  breakfast: mealSchema,
  lunch: mealSchema,
  dinner: mealSchema,
  snacks: mealSchema,
  totalDayCalories: { type: Number, default: 0 },
  totalDayProtein: { type: Number, default: 0 },
  totalDayCarbs: { type: Number, default: 0 },
  totalDayFat: { type: Number, default: 0 },
  waterIntake: { type: Number, default: 0 }, // in ml
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });

foodEntrySchema.index({ user: 1, date: 1 }, { unique: true });

// Auto-calculate day totals
foodEntrySchema.pre('save', function(next) {
  const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
  let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;

  meals.forEach(meal => {
    if (this[meal] && this[meal].items) {
      let mealCals = 0, mealProt = 0, mealCarbs = 0, mealFat = 0;
      this[meal].items.forEach(item => {
        mealCals += item.calories || 0;
        mealProt += item.protein || 0;
        mealCarbs += item.carbs || 0;
        mealFat += item.fat || 0;
      });
      this[meal].totalCalories = mealCals;
      this[meal].totalProtein = mealProt;
      this[meal].totalCarbs = mealCarbs;
      this[meal].totalFat = mealFat;
      totalCals += mealCals;
      totalProt += mealProt;
      totalCarbs += mealCarbs;
      totalFat += mealFat;
    }
  });

  this.totalDayCalories = totalCals;
  this.totalDayProtein = totalProt;
  this.totalDayCarbs = totalCarbs;
  this.totalDayFat = totalFat;
  next();
});

module.exports = mongoose.model('FoodEntry', foodEntrySchema);
