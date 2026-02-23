const mongoose = require('mongoose');

// MET values for common exercises
const MET_VALUES = {
  running: 9.8, cycling: 7.5, swimming: 8.0, walking: 3.5,
  weightlifting: 3.5, yoga: 2.5, hiit: 8.0, basketball: 6.5,
  soccer: 7.0, tennis: 7.3, rowing: 7.0, elliptical: 5.0,
  jumping_rope: 11.0, pilates: 3.0, dancing: 4.8, boxing: 7.8,
  default: 4.0,
};

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'sports', 'other'],
    default: 'other',
  },
  sets: { type: Number, min: 0, default: 0 },
  reps: { type: Number, min: 0, default: 0 },
  weight: { type: Number, min: 0, default: 0 }, // kg
  duration: { type: Number, min: 0, default: 0 }, // minutes
  caloriesBurned: { type: Number, default: 0 },
  isAutoCalculated: { type: Boolean, default: false },
  notes: { type: String, maxlength: 200 },
});

const workoutEntrySchema = new mongoose.Schema({
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
  exercises: [exerciseSchema],
  totalCaloriesBurned: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // minutes
  workoutType: { type: String, default: 'mixed' },
  intensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  notes: { type: String, maxlength: 500 },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

workoutEntrySchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate calories using MET formula: Calories = MET × weight(kg) × duration(hours)
workoutEntrySchema.methods.calculateCalories = function(exerciseName, durationMinutes, userWeightKg = 70) {
  const exerciseKey = exerciseName.toLowerCase().replace(/\s+/g, '_');
  const met = MET_VALUES[exerciseKey] || MET_VALUES.default;
  return Math.round(met * userWeightKg * (durationMinutes / 60));
};

workoutEntrySchema.pre('save', function(next) {
  let totalCals = 0, totalDur = 0;
  this.exercises.forEach(ex => {
    totalCals += ex.caloriesBurned || 0;
    totalDur += ex.duration || 0;
  });
  this.totalCaloriesBurned = totalCals;
  this.totalDuration = totalDur;
  next();
});

module.exports = mongoose.model('WorkoutEntry', workoutEntrySchema);
