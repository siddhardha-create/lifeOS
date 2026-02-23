const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  plannedDuration: { type: Number, required: true, min: 0 }, // minutes
  actualDuration: { type: Number, default: 0, min: 0 }, // minutes
  completed: { type: Boolean, default: false },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  notes: { type: String, maxlength: 500 },
  resources: [{ type: String }], // URLs or resource names
});

const studyEntrySchema = new mongoose.Schema({
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
  sessions: [studySessionSchema],
  totalPlannedHours: { type: Number, default: 0 },
  totalActualHours: { type: Number, default: 0 },
  totalCompletedSessions: { type: Number, default: 0 },
  productivityScore: { type: Number, default: 0 }, // 0-100
  notes: { type: String, maxlength: 500 },
}, { timestamps: true });

studyEntrySchema.index({ user: 1, date: 1 }, { unique: true });

studyEntrySchema.pre('save', function(next) {
  let plannedTotal = 0, actualTotal = 0, completedCount = 0;
  this.sessions.forEach(s => {
    plannedTotal += s.plannedDuration || 0;
    actualTotal += s.actualDuration || 0;
    if (s.completed) completedCount++;
    // Auto-set completion percentage
    if (s.plannedDuration > 0) {
      s.completionPercentage = Math.min(100, Math.round((s.actualDuration / s.plannedDuration) * 100));
      s.completed = s.completionPercentage >= 80;
    }
  });
  this.totalPlannedHours = plannedTotal / 60;
  this.totalActualHours = actualTotal / 60;
  this.totalCompletedSessions = completedCount;
  this.productivityScore = plannedTotal > 0 ? Math.min(100, Math.round((actualTotal / plannedTotal) * 100)) : 0;
  next();
});

module.exports = mongoose.model('StudyEntry', studyEntrySchema);
