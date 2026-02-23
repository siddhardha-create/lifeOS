const express = require('express');
const WorkoutEntry = require('../models/WorkoutEntry');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const MET_VALUES = {
  running: 9.8, cycling: 7.5, swimming: 8.0, walking: 3.5,
  weightlifting: 3.5, yoga: 2.5, hiit: 8.0, basketball: 6.5,
  soccer: 7.0, tennis: 7.3, rowing: 7.0, elliptical: 5.0,
  'jumping rope': 11.0, pilates: 3.0, dancing: 4.8, boxing: 7.8,
  pushups: 3.8, pullups: 4.0, squats: 5.0, lunges: 4.0,
  default: 4.0,
};

const estimateCalories = (exerciseName, durationMinutes, weightKg = 70) => {
  const key = Object.keys(MET_VALUES).find(k => exerciseName.toLowerCase().includes(k));
  const met = key ? MET_VALUES[key] : MET_VALUES.default;
  return Math.round(met * weightKg * (durationMinutes / 60));
};

const getWeekRange = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

// GET week workout entries
router.get('/week', async (req, res) => {
  try {
    const { date } = req.query;
    const { monday, sunday } = getWeekRange(date || new Date());
    const entries = await WorkoutEntry.find({
      user: req.user._id,
      date: { $gte: monday, $lte: sunday },
    }).sort({ date: 1 });
    res.json({ success: true, data: entries, weekStart: monday, weekEnd: sunday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single day
router.get('/day/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const entry = await WorkoutEntry.findOne({
      user: req.user._id,
      date: { $gte: date, $lte: endDate },
    });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/PUT workout entry
router.post('/entry', async (req, res) => {
  try {
    const { date, exercises, notes, completed, intensity, workoutType } = req.body;

    const processedExercises = (exercises || []).map(ex => {
      if (!ex.caloriesBurned && ex.duration) {
        return {
          ...ex,
          caloriesBurned: estimateCalories(ex.name, ex.duration),
          isAutoCalculated: true,
        };
      }
      return ex;
    });

    const entryDate = new Date(date);
    entryDate.setHours(12, 0, 0, 0);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    let entry = await WorkoutEntry.findOne({ user: req.user._id, date: { $gte: dayStart, $lte: dayEnd } });

    const updateData = {
      exercises: processedExercises,
      notes, completed, intensity, workoutType,
    };

    if (entry) {
      Object.assign(entry, updateData);
      await entry.save();
    } else {
      entry = await WorkoutEntry.create({ user: req.user._id, date: entryDate, ...updateData });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE workout entry
router.delete('/entry/:entryId', async (req, res) => {
  try {
    await WorkoutEntry.findOneAndDelete({ _id: req.params.entryId, user: req.user._id });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET workout statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const entries = await WorkoutEntry.find({
      user: req.user._id,
      date: { $gte: fromDate },
    }).sort({ date: 1 });

    const totalCalories = entries.reduce((sum, e) => sum + e.totalCaloriesBurned, 0);
    const totalDuration = entries.reduce((sum, e) => sum + e.totalDuration, 0);
    const daysWorkedOut = entries.length;

    res.json({
      success: true,
      data: {
        entries,
        summary: { totalCalories, totalDuration, daysWorkedOut, avgCaloriesPerSession: daysWorkedOut ? Math.round(totalCalories / daysWorkedOut) : 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
