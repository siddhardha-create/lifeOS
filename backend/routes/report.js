const express = require('express');
const PDFDocument = require('pdfkit');
const FoodEntry = require('../models/FoodEntry');
const WorkoutEntry = require('../models/WorkoutEntry');
const StudyEntry = require('../models/StudyEntry');
const WeeklySummary = require('../models/WeeklySummary');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET monthly PDF report
router.get('/monthly-pdf', async (req, res) => {
  try {
    const { month, year, clearAfter } = req.query;
    const reportMonth = parseInt(month) || new Date().getMonth() + 1;
    const reportYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);

    const [foodEntries, workoutEntries, studyEntries] = await Promise.all([
      FoodEntry.find({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
      WorkoutEntry.find({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
      StudyEntry.find({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 }),
    ]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    // Calculate summaries
    const totalFoodCalories = foodEntries.reduce((s, e) => s + e.totalDayCalories, 0);
    const totalCaloriesBurned = workoutEntries.reduce((s, e) => s + e.totalCaloriesBurned, 0);
    const totalStudyHours = studyEntries.reduce((s, e) => s + e.totalActualHours, 0);
    const workoutDays = workoutEntries.length;

    // Subject breakdown
    const subjectMap = {};
    studyEntries.forEach(e => {
      e.sessions.forEach(s => {
        subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.actualDuration / 60;
      });
    });

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LifeOS_Report_${monthNames[reportMonth - 1]}_${reportYear}.pdf`);

    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 100).fill('#1a1a2e');
    doc.fillColor('#e2e8f0').fontSize(28).font('Helvetica-Bold')
      .text('LifeOS Monthly Report', 50, 30);
    doc.fillColor('#94a3b8').fontSize(14)
      .text(`${monthNames[reportMonth - 1]} ${reportYear} | ${req.user.name}`, 50, 65);

    doc.fillColor('#1e293b').moveDown(3);

    // Summary Cards
    const cardY = 120;
    const cards = [
      { label: 'Calories Consumed', value: totalFoodCalories.toLocaleString(), unit: 'kcal', color: '#f97316' },
      { label: 'Calories Burned', value: totalCaloriesBurned.toLocaleString(), unit: 'kcal', color: '#22c55e' },
      { label: 'Study Hours', value: parseFloat(totalStudyHours.toFixed(1)), unit: 'hrs', color: '#3b82f6' },
      { label: 'Workout Days', value: workoutDays, unit: 'days', color: '#a855f7' },
    ];

    cards.forEach((card, i) => {
      const x = 50 + (i % 2) * 240;
      const y = cardY + Math.floor(i / 2) * 90;
      doc.rect(x, y, 220, 75).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(card.color).fontSize(22).font('Helvetica-Bold')
        .text(`${card.value} ${card.unit}`, x + 10, y + 12);
      doc.fillColor('#64748b').fontSize(11).font('Helvetica')
        .text(card.label, x + 10, y + 48);
    });

    doc.y = cardY + 200;

    // Food Section
    doc.fillColor('#1e293b').fontSize(18).font('Helvetica-Bold').text('🍽 Food Tracking', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#475569');

    const avgCalories = foodEntries.length > 0 ? Math.round(totalFoodCalories / foodEntries.length) : 0;
    const totalProtein = foodEntries.reduce((s, e) => s + e.totalDayProtein, 0);
    const totalCarbs = foodEntries.reduce((s, e) => s + e.totalDayCarbs, 0);
    const totalFat = foodEntries.reduce((s, e) => s + e.totalDayFat, 0);

    doc.text(`Days Tracked: ${foodEntries.length}  |  Avg Daily Calories: ${avgCalories} kcal`);
    doc.text(`Total Protein: ${Math.round(totalProtein)}g  |  Total Carbs: ${Math.round(totalCarbs)}g  |  Total Fat: ${Math.round(totalFat)}g`);
    doc.moveDown();

    // Daily food table (first 10 entries)
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Daily Breakdown (first 10 days):');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#475569');
    foodEntries.slice(0, 10).forEach(entry => {
      const d = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      doc.text(`${d}: ${entry.totalDayCalories} kcal | P: ${Math.round(entry.totalDayProtein)}g | C: ${Math.round(entry.totalDayCarbs)}g | F: ${Math.round(entry.totalDayFat)}g`);
    });

    doc.moveDown();

    // Workout Section
    doc.fillColor('#1e293b').fontSize(18).font('Helvetica-Bold').text('🏋 Workout Tracking');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#475569');
    const totalWorkoutDuration = workoutEntries.reduce((s, e) => s + e.totalDuration, 0);
    doc.text(`Workout Days: ${workoutDays}  |  Total Duration: ${Math.round(totalWorkoutDuration / 60)} hours  |  Total Burned: ${totalCaloriesBurned.toLocaleString()} kcal`);
    doc.moveDown(0.3);
    doc.fontSize(9);
    workoutEntries.slice(0, 10).forEach(entry => {
      const d = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      doc.text(`${d}: ${entry.totalCaloriesBurned} kcal burned | ${entry.totalDuration} min | ${entry.exercises.length} exercises`);
    });

    doc.moveDown();

    // Study Section
    doc.fillColor('#1e293b').fontSize(18).font('Helvetica-Bold').text('📚 Study Tracking');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#475569');
    doc.text(`Study Days: ${studyEntries.length}  |  Total Hours: ${parseFloat(totalStudyHours.toFixed(1))} hrs`);
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold').text('Subject Breakdown:');
    doc.fontSize(9).font('Helvetica');
    Object.entries(subjectMap).forEach(([subject, hours]) => {
      doc.text(`  ${subject}: ${parseFloat(hours.toFixed(1))} hours`);
    });

    // Footer
    doc.moveDown(2);
    doc.fillColor('#94a3b8').fontSize(9)
      .text(`Generated by LifeOS on ${new Date().toLocaleDateString()} | Data retained for 30 days`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();

    // Clear data if requested
    if (clearAfter === 'true') {
      await Promise.all([
        FoodEntry.deleteMany({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }),
        WorkoutEntry.deleteMany({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }),
        StudyEntry.deleteMany({ user: req.user._id, date: { $gte: startDate, $lte: endDate } }),
      ]);
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET CSV export
router.get('/csv/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 30 } = req.query;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(days));

    let csvContent = '';
    let filename = '';

    if (type === 'food') {
      const entries = await FoodEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 });
      csvContent = 'Date,Total Calories,Protein (g),Carbs (g),Fat (g),Water (ml)\n';
      entries.forEach(e => {
        csvContent += `${new Date(e.date).toLocaleDateString()},${e.totalDayCalories},${Math.round(e.totalDayProtein)},${Math.round(e.totalDayCarbs)},${Math.round(e.totalDayFat)},${e.waterIntake}\n`;
      });
      filename = 'food_data.csv';
    } else if (type === 'workout') {
      const entries = await WorkoutEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 });
      csvContent = 'Date,Calories Burned,Duration (min),Exercises Count\n';
      entries.forEach(e => {
        csvContent += `${new Date(e.date).toLocaleDateString()},${e.totalCaloriesBurned},${e.totalDuration},${e.exercises.length}\n`;
      });
      filename = 'workout_data.csv';
    } else if (type === 'study') {
      const entries = await StudyEntry.find({ user: req.user._id, date: { $gte: fromDate } }).sort({ date: 1 });
      csvContent = 'Date,Planned Hours,Actual Hours,Sessions,Productivity Score\n';
      entries.forEach(e => {
        csvContent += `${new Date(e.date).toLocaleDateString()},${e.totalPlannedHours.toFixed(1)},${e.totalActualHours.toFixed(1)},${e.sessions.length},${e.productivityScore}\n`;
      });
      filename = 'study_data.csv';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE old data (30+ days)
router.delete('/cleanup', async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const [food, workout, study] = await Promise.all([
      FoodEntry.deleteMany({ user: req.user._id, date: { $lt: cutoff } }),
      WorkoutEntry.deleteMany({ user: req.user._id, date: { $lt: cutoff } }),
      StudyEntry.deleteMany({ user: req.user._id, date: { $lt: cutoff } }),
    ]);

    res.json({
      success: true,
      message: 'Old data cleaned up',
      deleted: { food: food.deletedCount, workout: workout.deletedCount, study: study.deletedCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
