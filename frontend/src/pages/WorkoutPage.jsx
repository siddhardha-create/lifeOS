import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';

const CATEGORIES = ['All', 'cardio', 'strength', 'hiit', 'flexibility', 'sports'];
const CATEGORY_COLORS = {
  cardio: 'text-orange-400 bg-orange-400/10',
  strength: 'text-blue-400 bg-blue-400/10',
  hiit: 'text-red-400 bg-red-400/10',
  flexibility: 'text-green-400 bg-green-400/10',
  sports: 'text-purple-400 bg-purple-400/10',
};
const CATEGORY_LABELS = {
  cardio: '🏃 Cardio',
  strength: '🏋️ Strength',
  hiit: '🔥 HIIT',
  flexibility: '🧘 Flexibility',
  sports: '⚽ Sports',
};

const emptyExercise = { name: '', duration: 30, sets: '', reps: '', weight: '', caloriesBurned: '', notes: '' };
const DEFAULT_USER_WEIGHT = 70;

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
  const [categoryFilter, setCategoryFilter] = useState('All');
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

  // Live calorie calculation
  useEffect(() => {
    if (formExercise.name && formExercise.duration) {
      const match = EXERCISE_DATABASE.find(e =>
        e.name.toLowerCase() === formExercise.name.toLowerCase() ||
        e.name.toLowerCase().includes(formExercise.name.toLowerCase())
      );
      if (match) {
        const cal = Math.round(match.met * userWeight * (formExercise.duration / 60));
        setLiveCalories({ calories: cal, met: match.met, name: match.name });
      } else {
        const cal = Math.round(4.0 * userWeight * (formExercise.duration / 60));
        setLiveCalories({ calories: cal, met: 4.0, name: null });
      }
    } else {
      setLiveCalories(null);
    }
  }, [formExercise.name, formExercise.duration, userWeight]);

  const handleNameChange = (value) => {
    setFormExercise(f => ({ ...f, name: value, caloriesBurned: '' }));
    if (value.length > 1) {
      const filtered = EXERCISE_DATABASE.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(value.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
        return matchesSearch && matchesCategory;
      }).slice(0, 8);
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
    setLiveCalories({ calories: cal, met: exercise.met, name: exercise.name });
    setShowSuggestions(false);
    toast.success(`${exercise.icon} ${exercise.name} selected!`);
  };

  const handleAddExercise = async () => {
    if (!formExercise.name || !formExercise.duration) {
      toast.error('Exercise name and duration are required');
      return;
    }
    setSaving(true);
    try {
      const exerciseData = { ...formExercise };
      if (!exerciseData.caloriesBurned && liveCalories) {
        exerciseData.caloriesBurned = liveCalories.calories;
      }
      const res = await api.post('/workout/entry', { date: selectedDay, exercise: exerciseData, userWeight });
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
          <p className="text-gray-400 text-sm mt-1">150+ exercises · Running, Strength, HIIT, Cricket, Yoga & more</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <span className="text-gray-400 text-xs">Your weight:</span>
          <input type="number" value={userWeight}
            onChange={e => setUserWeight(parseFloat(e.target.value) || 70)}
            className="w-14 bg-transparent text-white text-sm font-bold text-center outline-none" />
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
              <motion.button key={dayStr} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(dayStr)}
                className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                  ${isSelected ? 'bg-gradient-to-b from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/10'}
                  ${isToday && !isSelected ? 'border border-blue-500/50' : ''}`}
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
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} · {todayEntry.totalDuration} min ·{' '}
                <span className="text-orange-400 font-medium">{todayEntry.totalCaloriesBurned} kcal burned</span>
              </p>
            )}
          </div>
          <button onClick={() => { setAddModal(true); setFormExercise(emptyExercise); setLiveCalories(null); setSuggestions([]); }}
            className="btn-primary text-sm px-4 py-2">+ Add Exercise</button>
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
            {exercises.map((ex, idx) => {
              const dbEx = EXERCISE_DATABASE.find(e => e.name === ex.name);
              return (
                <motion.div key={ex._id || idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {dbEx && <span>{dbEx.icon}</span>}
                      <p className="text-white font-medium">{ex.name}</p>
                      {dbEx && (
                        <span className={`text-xs rounded-full px-2 py-0.5 ${CATEGORY_COLORS[dbEx.category]}`}>
                          {dbEx.category}
                        </span>
                      )}
                      {ex.isAutoCalculated && <span className="text-xs text-blue-400 bg-blue-400/10 rounded-full px-2 py-0.5">MET auto ✨</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
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
                  >🗑️</button>
                </motion.div>
              );
            })}
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
          {/* Category filter chips */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Filter by category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1 rounded-full transition-all ${
                    categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}>
                  {cat === 'All' ? '🌐 All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise name with autocomplete */}
          <div className="relative" ref={suggestionRef}>
            <label className="text-xs text-gray-400 mb-1 block">
              Exercise Name * <span className="text-blue-400">(type to search 150+ exercises)</span>
            </label>
            <input
              className="input-field"
              value={formExercise.name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="e.g., Running, Bench Press, Cricket, Yoga..."
              autoComplete="off"
            />
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                  {suggestions.map((ex, i) => {
                    const previewCal = Math.round(ex.met * userWeight * (formExercise.duration / 60));
                    return (
                      <button key={i} onMouseDown={() => handleSelectSuggestion(ex)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{ex.icon}</span>
                            <span className="text-white text-sm font-medium">{ex.name}</span>
                            <span className={`text-xs rounded-full px-1.5 py-0.5 ${CATEGORY_COLORS[ex.category]}`}>{ex.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-orange-400 text-xs font-bold">~{previewCal} kcal</span>
                            <span className="text-gray-600 text-xs ml-1">MET:{ex.met}</span>
                          </div>
                        </div>
                        {ex.description && <p className="text-gray-600 text-xs mt-0.5 ml-6">{ex.description}</p>}
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
            <input className="input-field" type="number" value={formExercise.duration}
              onChange={e => setFormExercise(f => ({ ...f, duration: parseFloat(e.target.value) || 0, caloriesBurned: '' }))}
              placeholder="30" />
          </div>

          {/* Live calorie preview */}
          <AnimatePresence>
            {liveCalories && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 font-bold text-lg">🔥 ~{liveCalories.calories} kcal</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      MET {liveCalories.met} × {userWeight}kg × {(formExercise.duration / 60).toFixed(2)}h
                      {!liveCalories.name && <span className="text-yellow-500 ml-1">(default MET — select from list for accuracy)</span>}
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
              <input className="input-field" type="number" value={formExercise.sets}
                onChange={e => setFormExercise(f => ({ ...f, sets: e.target.value }))} placeholder="3" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reps</label>
              <input className="input-field" type="number" value={formExercise.reps}
                onChange={e => setFormExercise(f => ({ ...f, reps: e.target.value }))} placeholder="12" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
              <input className="input-field" type="number" value={formExercise.weight}
                onChange={e => setFormExercise(f => ({ ...f, weight: e.target.value }))} placeholder="60" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Calories Burned (override)</label>
            <input className="input-field" type="number" value={formExercise.caloriesBurned}
              onChange={e => setFormExercise(f => ({ ...f, caloriesBurned: parseFloat(e.target.value) || '' }))}
              placeholder={liveCalories ? `Auto: ${liveCalories.calories}` : 'Leave blank to auto-calculate'} />
            <p className="text-xs text-gray-600 mt-1">Leave blank to use MET-based auto-calculation</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setAddModal(false); setFormExercise(emptyExercise); setLiveCalories(null); }} className="btn-secondary flex-1">Done</button>
            <button onClick={handleAddExercise} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Logging...' : '+ Log Exercise'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">Click "+ Log Exercise" to add more, "Done" when finished</p>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDeleteExercise(deleteModal.data)}
        title="Remove Exercise" message="Remove this exercise?" confirmText="Remove" danger
      />
    </div>
  );
}
