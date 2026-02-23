import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';

const EXERCISE_CATEGORIES = ['strength', 'cardio', 'flexibility', 'sports', 'other'];
const emptyExercise = { name: '', category: 'strength', sets: '', reps: '', weight: '', duration: '', caloriesBurned: '', notes: '' };

export default function WorkoutPage() {
  const [weekDays, setWeekDays] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false });
  const [form, setForm] = useState(emptyExercise);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, data: null });

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workout/week', { params: { date: selectedDay } });
      const map = {};
      res.data.data.forEach(e => { map[formatDate(new Date(e.date))] = e; });
      setEntries(map);
    } catch { toast.error('Failed to load workout data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchWeekData();
    setWeekDays(getWeekDays(new Date(selectedDay)));
  }, [selectedDay]);

  const todayEntry = entries[selectedDay];
  const exercises = todayEntry?.exercises || [];

  const handleSave = async () => {
    if (!form.name) { toast.error('Exercise name required'); return; }
    setSaving(true);
    try {
      const existingExercises = todayEntry?.exercises || [];
      const newExercise = {
        ...form,
        sets: parseInt(form.sets) || 0,
        reps: parseInt(form.reps) || 0,
        weight: parseFloat(form.weight) || 0,
        duration: parseInt(form.duration) || 0,
        caloriesBurned: parseInt(form.caloriesBurned) || 0,
      };
      const res = await api.post('/workout/entry', {
        date: selectedDay,
        exercises: [...existingExercises, newExercise],
      });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      setModal({ open: false });
      setForm(emptyExercise);
      toast.success('Exercise logged!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (exerciseIdx) => {
    try {
      const updatedExercises = todayEntry.exercises.filter((_, i) => i !== exerciseIdx);
      const res = await api.post('/workout/entry', {
        date: selectedDay,
        exercises: updatedExercises,
      });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      toast.success('Exercise removed');
    } catch { toast.error('Failed to remove'); }
  };

  const categoryColors = {
    strength: 'text-red-400 bg-red-500/10',
    cardio: 'text-green-400 bg-green-500/10',
    flexibility: 'text-blue-400 bg-blue-500/10',
    sports: 'text-yellow-400 bg-yellow-500/10',
    other: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🏋️ Workout Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Log your exercises and track progress</p>
      </div>

      {/* Week selector */}
      <div className="card mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, i) => {
            const dayStr = formatDate(day);
            const hasData = !!entries[dayStr];
            const isSelected = dayStr === selectedDay;
            return (
              <motion.button
                key={dayStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(dayStr)}
                className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                  ${isSelected ? 'bg-gradient-to-b from-green-600 to-emerald-700' : 'hover:bg-white/10'}
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

      {/* Summary */}
      {todayEntry && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Exercises', value: exercises.length, icon: '🏋️' },
            { label: 'Duration', value: `${todayEntry.totalDuration} min`, icon: '⏱️' },
            { label: 'Burned', value: `${todayEntry.totalCaloriesBurned} kcal`, icon: '🔥' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-bold text-white text-lg">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Exercises</h3>
          <button
            onClick={() => { setModal({ open: true }); setForm(emptyExercise); }}
            className="btn-primary text-sm py-2 px-4"
          >
            + Add Exercise
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full spinner" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-gray-400">No exercises logged yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first exercise for today!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{ex.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[ex.category]}`}>
                        {ex.category}
                      </span>
                      {ex.isAutoCalculated && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">✨ auto</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      {ex.sets > 0 && <span>🔢 {ex.sets} sets × {ex.reps} reps</span>}
                      {ex.weight > 0 && <span>⚖️ {ex.weight} kg</span>}
                      {ex.duration > 0 && <span>⏱️ {ex.duration} min</span>}
                      {ex.caloriesBurned > 0 && <span className="text-green-400">🔥 {ex.caloriesBurned} kcal</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteModal({ open: true, data: idx })}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all ml-2"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Exercise Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title="Log Exercise">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Exercise Name *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Bench Press, Running"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select
              className="input-field"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {EXERCISE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sets</label>
              <input className="input-field" type="number" value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} placeholder="3" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reps</label>
              <input className="input-field" type="number" value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} placeholder="10" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
              <input className="input-field" type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="60" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Duration (min)</label>
              <input className="input-field" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Calories Burned</label>
              <input className="input-field" type="number" value={form.caloriesBurned} onChange={e => setForm(f => ({ ...f, caloriesBurned: e.target.value }))} placeholder="Auto-calculated" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
            <input className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." />
          </div>

          <p className="text-xs text-gray-500">💡 Calories will be auto-estimated if not provided</p>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Log Exercise'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDeleteExercise(deleteModal.data)}
        title="Remove Exercise"
        message="Remove this exercise from today's log?"
        confirmText="Remove"
        danger
      />
    </div>
  );
}
