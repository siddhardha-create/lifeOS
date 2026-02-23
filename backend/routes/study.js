const express = require('express');
const StudyEntry = require('../models/StudyEntry');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

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

// GET week study entries
router.get('/week', async (req, res) => {
  try {
    const { date } = req.query;
    const { monday, sunday } = getWeekRange(date || new Date());
    const entries = await StudyEntry.find({
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
    const endDate = new Date(date); endDate.setHours(23, 59, 59, 999);
    const entry = await StudyEntry.findOne({ user: req.user._id, date: { $gte: date, $lte: endDate } });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST/PUT study entry
router.post('/entry', async (req, res) => {
  try {
    const { date, sessions, notes } = req.body;
    const entryDate = new Date(date); entryDate.setHours(12, 0, 0, 0);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    let entry = await StudyEntry.findOne({ user: req.user._id, date: { $gte: dayStart, $lte: dayEnd } });

    if (entry) {
      entry.sessions = sessions || entry.sessions;
      if (notes) entry.notes = notes;
      await entry.save();
    } else {
      entry = await StudyEntry.create({ user: req.user._id, date: entryDate, sessions: sessions || [], notes });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE study entry
router.delete('/entry/:entryId', async (req, res) => {
  try {
    await StudyEntry.findOneAndDelete({ _id: req.params.entryId, user: req.user._id });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET study statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    const entries = await StudyEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 });

    // Subject breakdown
    const subjectMap = {};
    entries.forEach(entry => {
      entry.sessions.forEach(s => {
        if (!subjectMap[s.subject]) subjectMap[s.subject] = 0;
        subjectMap[s.subject] += s.actualDuration / 60;
      });
    });

    const totalHours = entries.reduce((sum, e) => sum + e.totalActualHours, 0);
    const subjectBreakdown = Object.entries(subjectMap).map(([subject, hours]) => ({
      subject, hours: parseFloat(hours.toFixed(1)),
    }));

    res.json({
      success: true,
      data: {
        entries,
        summary: { totalHours: parseFloat(totalHours.toFixed(1)), subjectBreakdown, avgDailyHours: entries.length ? parseFloat((totalHours / entries.length).toFixed(1)) : 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
