const express = require('express');
const User = require('../models/User');
const FoodEntry = require('../models/FoodEntry');
const WorkoutEntry = require('../models/WorkoutEntry');
const StudyEntry = require('../models/StudyEntry');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET all users with summary stats
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });

    // For each user, get their activity counts
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [foodCount, workoutCount, studyCount] = await Promise.all([
        FoodEntry.countDocuments({ user: user._id }),
        WorkoutEntry.countDocuments({ user: user._id }),
        StudyEntry.countDocuments({ user: user._id }),
      ]);

      // Get last activity date
      const lastFood = await FoodEntry.findOne({ user: user._id }).sort({ date: -1 });
      const lastWorkout = await WorkoutEntry.findOne({ user: user._id }).sort({ date: -1 });
      const lastStudy = await StudyEntry.findOne({ user: user._id }).sort({ date: -1 });

      const lastActivities = [lastFood?.date, lastWorkout?.date, lastStudy?.date].filter(Boolean);
      const lastActive = lastActivities.length > 0 ? new Date(Math.max(...lastActivities.map(d => new Date(d)))) : null;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastActive,
        stats: {
          foodEntries: foodCount,
          workoutEntries: workoutCount,
          studyEntries: studyCount,
          totalEntries: foodCount + workoutCount + studyCount,
        },
        goals: user.goals,
      };
    }));

    res.json({ success: true, data: usersWithStats, total: users.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single user full details
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Last 7 days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentFood, recentWorkout, recentStudy] = await Promise.all([
      FoodEntry.find({ user: user._id, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
      WorkoutEntry.find({ user: user._id, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
      StudyEntry.find({ user: user._id, date: { $gte: sevenDaysAgo } }).sort({ date: -1 }),
    ]);

    // All time totals
    const allFood = await FoodEntry.find({ user: user._id });
    const allWorkout = await WorkoutEntry.find({ user: user._id });
    const allStudy = await StudyEntry.find({ user: user._id });

    const totalCaloriesConsumed = allFood.reduce((sum, e) => sum + (e.totalDayCalories || 0), 0);
    const totalCaloriesBurned = allWorkout.reduce((sum, e) => sum + (e.totalCaloriesBurned || 0), 0);
    const totalStudyMinutes = allStudy.reduce((sum, e) => sum + ((e.totalActualDuration || 0) * 60), 0);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          goals: user.goals,
          preferences: user.preferences,
        },
        allTimeStats: {
          totalCaloriesConsumed: Math.round(totalCaloriesConsumed),
          totalCaloriesBurned: Math.round(totalCaloriesBurned),
          totalStudyHours: Math.round(totalStudyMinutes / 60),
          totalFoodDays: allFood.length,
          totalWorkoutDays: allWorkout.length,
          totalStudyDays: allStudy.length,
        },
        recentActivity: {
          food: recentFood,
          workout: recentWorkout,
          study: recentStudy,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET platform-wide stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalFood, totalWorkout, totalStudy] = await Promise.all([
      User.countDocuments(),
      FoodEntry.countDocuments(),
      WorkoutEntry.countDocuments(),
      StudyEntry.countDocuments(),
    ]);

    // New users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Active users this week (logged something)
    const activeUserIds = await FoodEntry.distinct('user', { date: { $gte: weekAgo } });
    const activeWorkoutIds = await WorkoutEntry.distinct('user', { date: { $gte: weekAgo } });
    const allActiveIds = new Set([...activeUserIds.map(String), ...activeWorkoutIds.map(String)]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFoodEntries: totalFood,
        totalWorkoutEntries: totalWorkout,
        totalStudyEntries: totalStudy,
        newUsersThisWeek,
        activeUsersThisWeek: allActiveIds.size,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE a user and all their data
router.delete('/users/:userId', async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't delete your own account from admin panel" });
    }
    await Promise.all([
      User.findByIdAndDelete(req.params.userId),
      FoodEntry.deleteMany({ user: req.params.userId }),
      WorkoutEntry.deleteMany({ user: req.params.userId }),
      StudyEntry.deleteMany({ user: req.params.userId }),
    ]);
    res.json({ success: true, message: 'User and all their data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH toggle admin status
router.patch('/users/:userId/toggle-admin', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ success: true, data: { isAdmin: user.isAdmin, name: user.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
