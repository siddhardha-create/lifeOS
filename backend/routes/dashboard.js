const express = require('express');
const FoodEntry = require('../models/FoodEntry');
const WorkoutEntry = require('../models/WorkoutEntry');
const StudyEntry = require('../models/StudyEntry');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET dashboard overview (today + week)
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    const [todayFood, todayWorkout, todayStudy, weekFood, weekWorkout, weekStudy] = await Promise.all([
      FoodEntry.findOne({ user: req.user._id, date: { $gte: today, $lte: todayEnd } }),
      WorkoutEntry.findOne({ user: req.user._id, date: { $gte: today, $lte: todayEnd } }),
      StudyEntry.findOne({ user: req.user._id, date: { $gte: today, $lte: todayEnd } }),
      FoodEntry.find({ user: req.user._id, date: { $gte: weekStart } }),
      WorkoutEntry.find({ user: req.user._id, date: { $gte: weekStart } }),
      StudyEntry.find({ user: req.user._id, date: { $gte: weekStart } }),
    ]);

    const weeklyFoodCalories = weekFood.map(e => ({
      date: e.date,
      calories: e.totalDayCalories,
      protein: e.totalDayProtein,
      carbs: e.totalDayCarbs,
      fat: e.totalDayFat,
    }));

    const weeklyWorkoutCalories = weekWorkout.map(e => ({
      date: e.date,
      caloriesBurned: e.totalCaloriesBurned,
      duration: e.totalDuration,
    }));

    const weeklyStudyHours = weekStudy.map(e => ({
      date: e.date,
      hours: e.totalActualHours,
      score: e.productivityScore,
    }));

    res.json({
      success: true,
      data: {
        today: {
          food: todayFood ? {
            calories: todayFood.totalDayCalories,
            protein: todayFood.totalDayProtein,
            carbs: todayFood.totalDayCarbs,
            fat: todayFood.totalDayFat,
          } : null,
          workout: todayWorkout ? {
            caloriesBurned: todayWorkout.totalCaloriesBurned,
            duration: todayWorkout.totalDuration,
            exercises: todayWorkout.exercises.length,
          } : null,
          study: todayStudy ? {
            hours: todayStudy.totalActualHours,
            sessions: todayStudy.sessions.length,
            score: todayStudy.productivityScore,
          } : null,
        },
        weekly: {
          food: weeklyFoodCalories,
          workout: weeklyWorkoutCalories,
          study: weeklyStudyHours,
          workoutDays: weekWorkout.length,
        },
        goals: req.user.goals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET 30-day trend data
router.get('/trends', async (req, res) => {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const [foodEntries, workoutEntries, studyEntries] = await Promise.all([
      FoodEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 }),
      WorkoutEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 }),
      StudyEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 }),
    ]);

    res.json({
      success: true,
      data: {
        food: foodEntries.map(e => ({ date: e.date, calories: e.totalDayCalories, protein: e.totalDayProtein })),
        workout: workoutEntries.map(e => ({ date: e.date, calories: e.totalCaloriesBurned, duration: e.totalDuration })),
        study: studyEntries.map(e => ({ date: e.date, hours: e.totalActualHours, score: e.productivityScore })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
