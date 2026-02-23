const express = require('express');
const FoodEntry = require('../models/FoodEntry');
const { protect } = require('../middleware/auth');
const { fetchNutritionData } = require('../utils/nutrition');

const router = express.Router();
router.use(protect);

// Helper: get date range for a week
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

// GET week food entries
router.get('/week', async (req, res) => {
  try {
    const { date } = req.query;
    const { monday, sunday } = getWeekRange(date || new Date());
    const entries = await FoodEntry.find({
      user: req.user._id,
      date: { $gte: monday, $lte: sunday },
    }).sort({ date: 1 });
    res.json({ success: true, data: entries, weekStart: monday, weekEnd: sunday });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single day entry
router.get('/day/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const entry = await FoodEntry.findOne({
      user: req.user._id,
      date: { $gte: date, $lte: endDate },
    });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST fetch nutrition for a food item
router.post('/nutrition-lookup', async (req, res) => {
  try {
    const { foodName, quantity = 100, unit = 'g' } = req.body;
    if (!foodName) return res.status(400).json({ success: false, message: 'Food name required' });
    const nutrition = await fetchNutritionData(foodName, quantity, unit);
    res.json({ success: true, data: nutrition });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/PUT upsert food entry for a day
router.post('/entry', async (req, res) => {
  try {
    const { date, meal, items, waterIntake, notes } = req.body;
    const entryDate = new Date(date);
    entryDate.setHours(12, 0, 0, 0);

    // Auto-fetch missing macros
    const processedItems = await Promise.all(
      (items || []).map(async (item) => {
        if (!item.calories && item.name) {
          const nutrition = await fetchNutritionData(item.name, item.quantity || 100, item.unit || 'g');
          return { ...item, ...nutrition, isAutoFetched: true };
        }
        return item;
      })
    );

    const updateData = {};
    if (meal && processedItems.length > 0) {
      updateData[meal] = { items: processedItems };
    }
    if (waterIntake !== undefined) updateData.waterIntake = waterIntake;
    if (notes) updateData.notes = notes;

    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    let entry = await FoodEntry.findOne({ user: req.user._id, date: { $gte: dayStart, $lte: dayEnd } });

    if (entry) {
      Object.assign(entry, updateData);
      await entry.save();
    } else {
      entry = await FoodEntry.create({
        user: req.user._id,
        date: entryDate,
        ...updateData,
      });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE a food item from a meal
router.delete('/entry/:entryId/meal/:meal/item/:itemId', async (req, res) => {
  try {
    const { entryId, meal, itemId } = req.params;
    const entry = await FoodEntry.findOne({ _id: entryId, user: req.user._id });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    entry[meal].items = entry[meal].items.filter(item => item._id.toString() !== itemId);
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE food entry for a day
router.delete('/entry/:entryId', async (req, res) => {
  try {
    await FoodEntry.findOneAndDelete({ _id: req.params.entryId, user: req.user._id });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
