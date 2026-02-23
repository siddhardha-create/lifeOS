const mongoose = require('mongoose');

const weeklySummarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  food: {
    totalCalories: { type: Number, default: 0 },
    avgDailyCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
  },
  workout: {
    totalCaloriesBurned: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    daysWorkedOut: { type: Number, default: 0 },
    totalExercises: { type: Number, default: 0 },
  },
  study: {
    totalHours: { type: Number, default: 0 },
    avgDailyHours: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    subjectBreakdown: [{ subject: String, hours: Number }],
  },
  overallScore: { type: Number, default: 0 }, // 0-100
  exportedAt: { type: Date },
}, { timestamps: true });

weeklySummarySchema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklySummary', weeklySummarySchema);
