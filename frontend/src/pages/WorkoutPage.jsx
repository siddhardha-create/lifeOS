import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';

// Exercise database with accurate MET values (from 2024 Compendium of Physical Activities)
// Calories = MET × weight(kg) × duration(hours)  [default 70kg]
const EXERCISE_DATABASE = [
  // Cardio
  { name: 'Running (moderate, 6mph)', category: 'cardio', met: 9.8, icon: '🏃' },
  { name: 'Running (slow, 5mph)', category: 'cardio', met: 8.3, icon: '🏃' },
  { name: 'Running (fast, 7.5mph)', category: 'cardio', met: 11.0, icon: '🏃' },
  { name: 'Jogging', category: 'cardio', met: 7.0, icon: '🏃' },
  { name: 'Walking (brisk)', category: 'cardio', met: 4.3, icon: '🚶' },
  { name: 'Walking (moderate)', category: 'cardio', met: 3.5, icon: '🚶' },
  { name: 'Walking (uphill)', category: 'cardio', met: 6.0, icon: '🚶' },
  { name: 'Cycling (moderate, 12-14mph)', category: 'cardio', met: 8.0, icon: '🚴' },
  { name: 'Cycling (leisure)', category: 'cardio', met: 4.0, icon: '🚴' },
  { name: 'Cycling (vigorous, 16-19mph)', category: 'cardio', met: 10.0, icon: '🚴' },
  { name: 'Cycling (stationary, moderate)', category: 'cardio', met: 5.5, icon: '🚴' },
  { name: 'Cycling (stationary, vigorous)', category: 'cardio', met: 8.8, icon: '🚴' },
  { name: 'Swimming (laps, moderate)', category: 'cardio', met: 7.0, icon: '🏊' },
  { name: 'Swimming (leisure)', category: 'cardio', met: 6.0, icon: '🏊' },
  { name: 'Swimming (laps, vigorous)', category: 'cardio', met: 10.0, icon: '🏊' },
  { name: 'Jump Rope (moderate)', category: 'cardio', met: 10.0, icon: '⚡' },
  { name: 'Jump Rope (fast)', category: 'cardio', met: 12.3, icon: '⚡' },
  { name: 'Stair Climbing', category: 'cardio', met: 8.8, icon: '🪜' },
  { name: 'Elliptical (moderate)', category: 'cardio', met: 5.0, icon: '🔄' },
  { name: 'Elliptical (vigorous)', category: 'cardio', met: 6.5, icon: '🔄' },
  { name: 'Rowing (moderate)', category: 'cardio', met: 7.0, icon: '🚣' },
  { name: 'Rowing (vigorous)', category: 'cardio', met: 8.5, icon: '🚣' },

  // HIIT & Classes
  { name: 'HIIT', category: 'hiit', met: 8.0, icon: '🔥' },
  { name: 'HIIT (vigorous)', category: 'hiit', met: 10.0, icon: '🔥' },
  { name: 'Tabata', category: 'hiit', met: 8.0, icon: '🔥' },
  { name: 'CrossFit', category: 'hiit', met: 9.0, icon: '🔥' },
  { name: 'Circuit Training', category: 'hiit', met: 8.0, icon: '🔄' },
  { name: 'Aerobics (high impact)', category: 'cardio', met: 7.0, icon: '💃' },
  { name: 'Aerobics (low impact)', category: 'cardio', met: 5.0, icon: '💃' },
  { name: 'Zumba', category: 'cardio', met: 6.5, icon: '💃' },
  { name: 'Cardio Kickboxing', category: 'cardio', met: 7.0, icon: '🥊' },

  // Strength Training
  { name: 'Weight Training (general)', category: 'strength', met: 3.5, icon: '🏋️' },
  { name: 'Weight Training (vigorous)', category: 'strength', met: 6.0, icon: '🏋️' },
  { name: 'Bench Press', category: 'strength', met: 3.8, icon: '🏋️' },
  { name: 'Squat', category: 'strength', met: 5.0, icon: '🏋️' },
  { name: 'Deadlift', category: 'strength', met: 6.0, icon: '🏋️' },
  { name: 'Pull Ups', category: 'strength', met: 4.0, icon: '💪' },
  { name: 'Push Ups', category: 'strength', met: 3.8, icon: '💪' },
  { name: 'Dumbbell Training', category: 'strength', met: 3.5, icon: '🏋️' },
  { name: 'Barbell Training', category: 'strength', met: 5.0, icon: '🏋️' },
  { name: 'Kettlebell Training', category: 'strength', met: 8.0, icon: '🏋️' },
  { name: 'Bodyweight Exercises', category: 'strength', met: 4.0, icon: '💪' },
  { name: 'Powerlifting', category: 'strength', met: 6.0, icon: '🏋️' },
  { name: 'Sit Ups', category: 'strength', met: 2.8, icon: '💪' },
  { name: 'Plank', category: 'strength', met: 3.0, icon: '💪' },

  // Flexibility
  { name: 'Yoga (hatha)', category: 'flexibility', met: 2.5, icon: '🧘' },
  { name: 'Yoga (vinyasa)', category: 'flexibility', met: 4.0, icon: '🧘' },
  { name: 'Yoga (power)', category: 'flexibility', met: 4.5, icon: '🧘' },
  { name: 'Stretching', category: 'flexibility', met: 2.3, icon: '🧘' },
  { name: 'Pilates', category: 'flexibility', met: 3.0, icon: '🧘' },
  { name: 'Pilates (vigorous)', category: 'flexibility', met: 4.0, icon: '🧘' },

  // Sports
  { name: 'Football (Soccer)', category: 'sports', met: 7.0, icon: '⚽' },
  { name: 'Basketball', category: 'sports', met: 6.5, icon: '🏀' },
  { name: 'Cricket', category: 'sports', met: 4.8, icon: '🏏' },
  { name: 'Badminton', category: 'sports', met: 5.5, icon: '🏸' },
  { name: 'Tennis (singles)', category: 'sports', met: 8.0, icon: '🎾' },
  { name: 'Tennis (doubles)', category: 'sports', met: 5.0, icon: '🎾' },
  { name: 'Table Tennis', category: 'sports', met: 4.0, icon: '🏓' },
  { name: 'Volleyball', category: 'sports', met: 4.0, icon: '🏐' },
  { name: 'Boxing (sparring)', category: 'sports', met: 9.0, icon: '🥊' },
  { name: 'Boxing (bag)', category: 'sports', met: 6.0, icon: '🥊' },
  { name: 'Martial Arts', category: 'sports', met: 8.0, icon: '🥋' },
  { name: 'Kabaddi', category: 'sports', met: 7.0, icon: '🤼' },
  { name: 'Hockey', category: 'sports', met: 7.5, icon: '🏑' },
  { name: 'Hiking', category: 'sports', met: 6.0, icon: '⛰️' },
  { name: 'Rock Climbing', category: 'sports', met: 8.0, icon: '🧗' },
  { name: 'Dancing', category: 'sports', met: 5.0, icon: '💃' },
];

const CATEGORIES = ['all', 'cardio', 'strength', 'hiit', 'flexibility', 'sports'];
const CATEGORY_COLORS = {
  cardio: 'text-orange-400',
  strength: 'text-blue-400',
  hiit: 'text-red-400',
  flexibility: 'text-green-400',
  sports: 'text-purple-400',
};

const emptyExercise = { name: '', duration: 30, sets: '', reps: '', weight: '', caloriesBurned: '', notes: '' };
const DEFAULT_USER_WEIGHT = 70; // kg

export default function WorkoutPage() {
  const [weekDays, setWeekDays] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
  const [formExercise, setFormExercise] = useState(emptyExercise);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveCalories, setLiveCalories] = useState(null);
  const [userWeight, setUserWeight] = useState(DEFAULT_USER_WEIGHT);
  const suggestionRef = useRef(null);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workout/week', { params: { date: selectedDay } });
      const map = {};
      res.data.data.forEach(e => { map[formatDate(new Date(e.date))] = e; });
      setEntries(map);
    } catch {
      toast.error('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekData();
    setWeekDays(getWeekDays(new Date(selectedDay)));
  }, [selectedDay]);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Live calorie calculation as user types name/duration
  useEffect(() => {
    if (formExercise.name && formExercise.duration) {
      const match = EXERCISE_DATABASE.find(e =>
        e.name.toLowerCase().includes(formExercise.name.toLowerCase()) ||
        formExercise.name.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])
      );
      if (match) {
        const cal = Math.round(match.met * userWeight * (formExercise.duration / 60));
        setLiveCalories({ calories: cal, met: match.met, exerciseName: match.name });
      } else {
        // Default MET 4.0 for unknown exercise
        const cal = Math.round(4.0 * userWeight * (formExercise.duration / 60));
        setLiveCalories({ calories: cal, met: 4.0, exerciseName: null });
      }
    } else {
      setLiveCalories(null);
    }
  }, [formExercise.name, formExercise.duration, userWeight]);

  const handleNameChange = (value) => {
    setFormExercise(f => ({ ...f, name: value, caloriesBurned: '' }));
    if (value.length > 1) {
      const filtered = EXERCISE_DATABASE.filter(e =>
        e.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 7);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (exercise) => {
    const cal = Math.round(exercise.met * userWeight * (formExercise.duration / 60));
    setFormExercise(f => ({ ...f, name: exercise.name, caloriesBurned: cal }));
    setLiveCalories({ calories: cal, met: exercise.met, exerciseName: exercise.name });
    setShowSuggestions(false);
    toast.success(`${exercise.name} selected — MET: ${exercise.met} 💪`);
  };

  const handleAddExercise = async () => {
    if (!formExercise.name || !formExercise.duration) {
      toast.error('Exercise name and duration are required');
      return;
    }
    setSaving(true);
    try {
      const exerciseData = { ...formExercise };
      // Use live calories if user hasn't manually set them
      if (!exerciseData.caloriesBurned && liveCalories) {
        exerciseData.caloriesBurned = liveCalories.calories;
      }
      const res = await api.post('/workout/entry', {
        date: selectedDay,
        exercise: exerciseData,
        userWeight,
      });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      setFormExercise(emptyExercise);
      setLiveCalories(null);
      setSuggestions([]);
      toast.success('Exercise logged! 💪');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async ({ entryId, exerciseId }) => {
    try {
      const res = await api.delete(`/workout/entry/${entryId}/exercise/${exerciseId}`);
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      toast.success('Exercise removed');
    } catch {
      toast.error('Failed to delete exercise');
    }
  };

  const todayEntry = entries[selectedDay];
  const exercises = todayEntry?.exercises || [];

  const weeklyStats = Object.values(entries).reduce((acc, e) => ({
    calories: acc.calories + (e.totalCaloriesBurned || 0),
    duration: acc.duration + (e.totalDuration || 0),
    sessions: acc.sessions + 1,
  }), { calories: 0, duration: 0, sessions: 0 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🏋️ Workout Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Calories calculated using accurate MET values</p>
        </div>
        {/* User weight input for accurate calorie calc */}
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <span className="text-gray-400 text-xs">Your weight:</span>
          <input
            type="number"
            value={userWeight}
            onChange={e => setUserWeight(parseFloat(e.target.value) || 70)}
            className="w-14 bg-transparent text-white text-sm font-bold text-center outline-none"
          />
          <span className="text-gray-400 text-xs">kg</span>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Week Calories Burned', value: `${weeklyStats.calories} kcal`, icon: '🔥', color: 'from-orange-600/20 to-red-600/20', border: 'border-orange-500/20' },
          { label: 'Week Duration', value: `${weeklyStats.duration} min`, icon: '⏱️', color: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/20' },
          { label: 'Sessions This Week', value: weeklyStats.sessions, icon: '📅', color: 'from-purple-600/20 to-violet-600/20', border: 'border-purple-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`card bg-gradient-to-br ${stat.color} border ${stat.border}`}>
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Week selector */}
      <div className="card mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, i) => {
            const dayStr = formatDate(day);
            const hasData = !!entries[dayStr];
            const isSelected = dayStr === selectedDay;
            const isToday = dayStr === formatDate(new Date());
            return (
              <motion.button
                key={dayStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(dayStr)}
                className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                  ${isSelected ? 'bg-gradient-to-b from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/10'}
                  ${isToday && !isSelected ? 'border border-blue-500/50' : ''}
                `}
              >
                <span className="text-xs text-gray-400 mb-1">{DAY_SHORT[i]}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{day.getDate()}</span>
                {hasData && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">Today's Exercises</h3>
            {todayEntry && (
              <p className="text-sm text-gray-400 mt-0.5">
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {todayEntry.totalDuration} min · <span className="text-orange-400 font-medium">{todayEntry.totalCaloriesBurned} kcal burned</span>
              </p>
            )}
          </div>
          <button
            onClick={() => { setAddModal(true); setFormExercise(emptyExercise); setLiveCalories(null); setSuggestions([]); }}
            className="btn-primary text-sm px-4 py-2"
          >
            + Add Exercise
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="font-medium text-gray-400">No exercises logged yet</p>
            <p className="text-sm mt-1">Click "+ Add Exercise" to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <motion.div
                key={ex._id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{ex.name}</p>
                    {ex.isAutoCalculated && <span className="text-xs text-blue-400 bg-blue-400/10 rounded-full px-2 py-0.5">MET auto ✨</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>⏱️ {ex.duration} min</span>
                    {ex.sets && <span>📋 {ex.sets} sets</span>}
                    {ex.reps && <span>🔁 {ex.reps} reps</span>}
                    {ex.weight && <span>🏋️ {ex.weight}kg</span>}
                    <span className="text-orange-400 font-bold">🔥 {ex.caloriesBurned} kcal</span>
                    {ex.met && <span className="text-gray-600">MET: {ex.met}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteModal({ open: true, data: { entryId: todayEntry._id, exerciseId: ex._id } })}
                  className="hidden group-hover:block text-red-400 hover:text-red-300 ml-4 text-lg"
                >
                  🗑️
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => { setAddModal(false); setFormExercise(emptyExercise); setLiveCalories(null); setSuggestions([]); }}
        title="Log Exercise"
        size="md"
      >
        <div className="space-y-4">
          {/* Exercise name with autocomplete */}
          <div className="relative" ref={suggestionRef}>
            <label className="text-xs text-gray-400 mb-1 block">Exercise Name * <span className="text-blue-400">(start typing for suggestions)</span></label>
            <input
              className="input-field"
              value={formExercise.name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="e.g., Running, Bench Press, Cricket..."
              autoComplete="off"
            />
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  {suggestions.map((ex, i) => {
                    const previewCal = Math.round(ex.met * userWeight * (formExercise.duration / 60));
                    return (
                      <button
                        key={i}
                        onMouseDown={() => handleSelectSuggestion(ex)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{ex.icon}</span>
                            <span className="text-white text-sm font-medium">{ex.name}</span>
                            <span className={`text-xs ${CATEGORY_COLORS[ex.category]}`}>{ex.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-orange-400 text-xs font-bold">~{previewCal} kcal</span>
                            <span className="text-gray-600 text-xs ml-1">MET:{ex.met}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Duration (minutes) *</label>
            <input
              className="input-field"
              type="number"
              value={formExercise.duration}
              onChange={e => setFormExercise(f => ({ ...f, duration: parseFloat(e.target.value) || 0, caloriesBurned: '' }))}
              placeholder="30"
            />
          </div>

          {/* Live calorie preview */}
          <AnimatePresence>
            {liveCalories && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 font-bold text-lg">🔥 ~{liveCalories.calories} kcal</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      MET: {liveCalories.met} × {userWeight}kg × {(formExercise.duration/60).toFixed(2)}h
                      {!liveCalories.exerciseName && <span className="text-yellow-500"> (using default MET — select from suggestions for accuracy)</span>}
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optional fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sets</label>
              <input className="input-field" type="number" value={formExercise.sets} onChange={e => setFormExercise(f => ({ ...f, sets: e.target.value }))} placeholder="3" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reps</label>
              <input className="input-field" type="number" value={formExercise.reps} onChange={e => setFormExercise(f => ({ ...f, reps: e.target.value }))} placeholder="12" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
              <input className="input-field" type="number" value={formExercise.weight} onChange={e => setFormExercise(f => ({ ...f, weight: e.target.value }))} placeholder="60" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Calories Burned (override)</label>
            <input
              className="input-field"
              type="number"
              value={formExercise.caloriesBurned}
              onChange={e => setFormExercise(f => ({ ...f, caloriesBurned: parseFloat(e.target.value) || '' }))}
              placeholder={liveCalories ? `Auto: ${liveCalories.calories}` : "Leave blank for auto-calculate"}
            />
            <p className="text-xs text-gray-600 mt-1">Leave blank to use MET-based auto-calculation</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setAddModal(false); setFormExercise(emptyExercise); setLiveCalories(null); }} className="btn-secondary flex-1">Done</button>
            <button onClick={handleAddExercise} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Logging...' : '+ Log Exercise'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">Click "+ Log Exercise" to add more, or "Done" when finished</p>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDeleteExercise(deleteModal.data)}
        title="Remove Exercise"
        message="Are you sure you want to remove this exercise?"
        confirmText="Remove"
        danger
      />
    </div>
  );
}
