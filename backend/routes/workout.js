const express = require('express');
const WorkoutEntry = require('../models/WorkoutEntry');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Accurate MET values from 2024 Compendium of Physical Activities
// Formula: Calories = MET × weight(kg) × duration(hours)
const MET_VALUES = {
  // Cardio
  'running': 9.8,
  'running (slow, 5mph)': 8.3,
  'running (moderate, 6mph)': 9.8,
  'running (fast, 7.5mph)': 11.0,
  'running (very fast, 10mph)': 14.5,
  'jogging': 7.0,
  'walking (slow)': 2.5,
  'walking (moderate)': 3.5,
  'walking (brisk)': 4.3,
  'walking (uphill)': 6.0,
  'cycling (leisure)': 4.0,
  'cycling (moderate, 12-14mph)': 8.0,
  'cycling (vigorous, 16-19mph)': 10.0,
  'cycling (stationary, moderate)': 5.5,
  'cycling (stationary, vigorous)': 8.8,
  'swimming (leisure)': 6.0,
  'swimming (laps, moderate)': 7.0,
  'swimming (laps, vigorous)': 10.0,
  'jump rope (moderate)': 10.0,
  'jump rope (fast)': 12.3,
  'stair climbing': 8.8,
  'elliptical (moderate)': 5.0,
  'elliptical (vigorous)': 6.5,
  'rowing (moderate)': 7.0,
  'rowing (vigorous)': 8.5,

  // HIIT & Cardio Classes
  'hiit': 8.0,
  'hiit (vigorous)': 10.0,
  'circuit training': 8.0,
  'aerobics (low impact)': 5.0,
  'aerobics (high impact)': 7.0,
  'zumba': 6.5,
  'cardio kickboxing': 7.0,
  'tabata': 8.0,
  'crossfit': 9.0,

  // Strength Training
  'weight training (general)': 3.5,
  'weight training (vigorous)': 6.0,
  'bench press': 3.8,
  'squat': 5.0,
  'deadlift': 6.0,
  'pull ups': 4.0,
  'push ups': 3.8,
  'sit ups': 2.8,
  'plank': 3.0,
  'dumbbell training': 3.5,
  'barbell training': 5.0,
  'kettlebell training': 8.0,
  'bodyweight exercises': 4.0,
  'resistance bands': 3.0,
  'powerlifting': 6.0,

  // Flexibility & Recovery
  'yoga (hatha)': 2.5,
  'yoga (vinyasa)': 4.0,
  'yoga (power)': 4.5,
  'stretching': 2.3,
  'pilates': 3.0,
  'pilates (vigorous)': 4.0,
  'foam rolling': 2.0,
  'meditation': 1.3,

  // Sports
  'football (soccer)': 7.0,
  'basketball': 6.5,
  'cricket': 4.8,
  'badminton': 5.5,
  'tennis (singles)': 8.0,
  'tennis (doubles)': 5.0,
  'table tennis': 4.0,
  'volleyball': 4.0,
  'boxing (sparring)': 9.0,
  'boxing (bag)': 6.0,
  'martial arts (general)': 8.0,
  'kabaddi': 7.0,
  'hockey': 7.5,
  'rugby': 8.3,

  // Other
  'dancing (general)': 5.0,
  'dancing (vigorous)': 7.0,
  'hiking': 6.0,
  'rock climbing': 8.0,
  'skateboarding': 5.0,
  'surfing': 3.0,
  'default': 4.0,
};

// Get MET value for an exercise by fuzzy matching
const getMET = (exerciseName) => {
  if (!exerciseName) return MET_VALUES['default'];
  const lower = exerciseName.toLowerCase().trim();
  // Exact match
  if (MET_VALUES[lower]) return MET_VALUES[lower];
  // Partial match
  const key = Object.keys(MET_VALUES).find(k => lower.includes(k) || k.includes(lower));
  return key ? MET_VALUES[key] : MET_VALUES['default'];
};

// Calculate calories burned using proper MET formula
// Calories = MET × weight(kg) × duration(hours)
const calculateCalories = (exerciseName, durationMinutes, weightKg = 70) => {
  const met = getMET(exerciseName);
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
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
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET workout stats
router.get('/stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const entries = await WorkoutEntry.find({
      user: req.user._id,
      date: { $gte: thirtyDaysAgo },
    });
    const totalCalories = entries.reduce((sum, e) => sum + (e.totalCaloriesBurned || 0), 0);
    const totalDuration = entries.reduce((sum, e) => sum + (e.totalDuration || 0), 0);
    res.json({ success: true, data: { totalCalories, totalDuration, totalSessions: entries.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET MET value lookup (for frontend to show estimated calories before saving)
router.get('/met-lookup', async (req, res) => {
  try {
    const { exercise, duration = 30, weight = 70 } = req.query;
    const met = getMET(exercise);
    const calories = calculateCalories(exercise, parseFloat(duration), parseFloat(weight));
    res.json({ success: true, data: { met, calories, exercise, duration, weight } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add a single exercise to a day's workout (APPENDS, does not replace)
router.post('/entry', async (req, res) => {
  try {
    const { date, exercise, userWeight = 70 } = req.body;

    const entryDate = new Date(date);
    entryDate.setHours(12, 0, 0, 0);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    // Auto-calculate calories if not provided, using proper MET formula
    const processedExercise = { ...exercise };
    if (!processedExercise.caloriesBurned && processedExercise.name && processedExercise.duration) {
      processedExercise.caloriesBurned = calculateCalories(
        processedExercise.name,
        processedExercise.duration,
        userWeight
      );
      processedExercise.met = getMET(processedExercise.name);
      processedExercise.isAutoCalculated = true;
    }

    let entry = await WorkoutEntry.findOne({ user: req.user._id, date: { $gte: dayStart, $lte: dayEnd } });

    if (entry) {
      // APPEND new exercise (fix for single-exercise bug)
      if (!entry.exercises) entry.exercises = [];
      entry.exercises.push(processedExercise);
      // Recalculate totals
      entry.totalCaloriesBurned = entry.exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
      entry.totalDuration = entry.exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
      entry.markModified('exercises');
      await entry.save();
    } else {
      const exercises = [processedExercise];
      entry = await WorkoutEntry.create({
        user: req.user._id,
        date: entryDate,
        exercises,
        totalCaloriesBurned: processedExercise.caloriesBurned || 0,
        totalDuration: processedExercise.duration || 0,
      });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE a specific exercise from a day
router.delete('/entry/:entryId/exercise/:exerciseId', async (req, res) => {
  try {
    const { entryId, exerciseId } = req.params;
    const entry = await WorkoutEntry.findOne({ _id: entryId, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    entry.exercises = entry.exercises.filter(e => e._id.toString() !== exerciseId);
    entry.totalCaloriesBurned = entry.exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
    entry.totalDuration = entry.exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
    entry.markModified('exercises');
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE full day entry
router.delete('/entry/:entryId', async (req, res) => {
  try {
    await WorkoutEntry.findOneAndDelete({ _id: req.params.entryId, user: req.user._id });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
