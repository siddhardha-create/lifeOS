import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';
import { FOOD_DATABASE } from '../data/foodDatabase';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'orange' },
  { key: 'lunch', label: 'Lunch', icon: '☀️', color: 'yellow' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', color: 'blue' },
  { key: 'snacks', label: 'Snacks', icon: '🍎', color: 'green' },
];

const REGIONS = ['All', 'South Indian', 'North Indian', 'Indian Street Food', 'Indian Sweets', 'Chinese', 'Italian', 'Fast Food', 'Middle Eastern', 'Japanese', 'Mexican', 'Staples', 'Protein', 'Dairy', 'Vegetables', 'Fruits', 'Nuts & Seeds', 'Beverages', 'Snacks'];

const emptyItem = { name: '', quantity: 100, unit: 'g', calories: '', protein: '', carbs: '', fat: '' };

export default function FoodPage() {
  const [weekDays, setWeekDays] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState({ open: false, meal: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
  const [formItem, setFormItem] = useState(emptyItem);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [regionFilter, setRegionFilter] = useState('All');
  const suggestionRef = useRef(null);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/food/week', { params: { date: selectedDay } });
      const map = {};
      res.data.data.forEach(e => { map[formatDate(new Date(e.date))] = e; });
      setEntries(map);
    } catch {
      toast.error('Failed to load food data');
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

  const handleNameChange = (value) => {
    setFormItem(f => ({ ...f, name: value }));
    if (value.length > 1) {
      const filtered = FOOD_DATABASE.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(value.toLowerCase());
        const matchesRegion = regionFilter === 'All' || f.region === regionFilter;
        return matchesSearch && matchesRegion;
      }).slice(0, 7);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (food) => {
    const qty = formItem.quantity || 100;
    const scale = qty / 100;
    setFormItem(f => ({
      ...f,
      name: food.name,
      calories: Math.round(food.calories * scale),
      protein: Math.round(food.protein * scale * 10) / 10,
      carbs: Math.round(food.carbs * scale * 10) / 10,
      fat: Math.round(food.fat * scale * 10) / 10,
    }));
    setShowSuggestions(false);
    toast.success(`✨ Nutrition loaded!`);
  };

  const handleQuantityChange = (qty) => {
    setFormItem(f => {
      const dbFood = FOOD_DATABASE.find(db => db.name === f.name);
      if (dbFood && qty) {
        const scale = qty / 100;
        return {
          ...f,
          quantity: parseFloat(qty),
          calories: Math.round(dbFood.calories * scale),
          protein: Math.round(dbFood.protein * scale * 10) / 10,
          carbs: Math.round(dbFood.carbs * scale * 10) / 10,
          fat: Math.round(dbFood.fat * scale * 10) / 10,
        };
      }
      return { ...f, quantity: parseFloat(qty) };
    });
  };

  const handleAutoFetch = async () => {
    if (!formItem.name) { toast.error('Enter food name first'); return; }
    const localMatch = FOOD_DATABASE.find(f => f.name.toLowerCase().includes(formItem.name.toLowerCase()));
    if (localMatch) { handleSelectSuggestion(localMatch); return; }
    setFetching(true);
    try {
      const res = await api.post('/food/nutrition-lookup', {
        foodName: formItem.name, quantity: formItem.quantity || 100, unit: formItem.unit || 'g',
      });
      const d = res.data.data;
      setFormItem(f => ({ ...f, calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat }));
      toast.success('Nutrition fetched!');
    } catch {
      toast.error('Could not fetch nutrition data');
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = async () => {
    if (!formItem.name || !formItem.quantity) { toast.error('Name and quantity required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/food/entry', { date: selectedDay, meal: addModal.meal, items: [formItem] });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      setFormItem(emptyItem);
      setSuggestions([]);
      toast.success('Food added! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add food');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async ({ entryId, meal, itemId }) => {
    try {
      const res = await api.delete(`/food/entry/${entryId}/meal/${meal}/item/${itemId}`);
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      toast.success('Item removed');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const todayEntry = entries[selectedDay];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🍽️ Food Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">300+ foods · South Indian, North Indian, Chinese, Italian, Japanese & more</p>
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

      {/* Daily totals */}
      {todayEntry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Daily Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Calories', value: `${Math.round(todayEntry.totalDayCalories)} kcal`, icon: '🔥' },
              { label: 'Protein', value: `${Math.round(todayEntry.totalDayProtein)}g`, icon: '💪' },
              { label: 'Carbs', value: `${Math.round(todayEntry.totalDayCarbs)}g`, icon: '🌾' },
              { label: 'Fat', value: `${Math.round(todayEntry.totalDayFat)}g`, icon: '🥑' },
            ].map(item => (
              <div key={item.label} className="glass-dark rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="font-bold text-white">{item.value}</div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Meals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MEALS.map((meal) => {
            const mealData = todayEntry?.[meal.key];
            const items = mealData?.items || [];
            return (
              <motion.div key={meal.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meal.icon}</span>
                    <h3 className="font-semibold text-white">{meal.label}</h3>
                    {items.length > 0 && (
                      <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5">
                        {Math.round(mealData.totalCalories)} kcal
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setAddModal({ open: true, meal: meal.key }); setFormItem(emptyItem); setSuggestions([]); }}
                    className="w-8 h-8 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg flex items-center justify-center text-lg transition-colors"
                  >+</button>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-600">
                    <p className="text-2xl mb-1">🍽️</p>
                    <p className="text-sm">No items yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <motion.div key={item._id || idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.name}</p>
                          <p className="text-gray-500 text-xs">{item.quantity}{item.unit} · {Math.round(item.calories)} kcal</p>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-2 text-xs text-gray-400">
                          <span>P:{Math.round(item.protein)}g</span>
                          <span>C:{Math.round(item.carbs)}g</span>
                          <span>F:{Math.round(item.fat)}g</span>
                          <button onClick={() => setDeleteModal({ open: true, data: { entryId: todayEntry._id, meal: meal.key, itemId: item._id } })}
                            className="text-red-400 hover:text-red-300 ml-1">🗑️</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Food Modal */}
      <Modal
        isOpen={addModal.open}
        onClose={() => { setAddModal({ open: false, meal: null }); setFormItem(emptyItem); setSuggestions([]); }}
        title={`Add to ${MEALS.find(m => m.key === addModal.meal)?.label || ''}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Region filter chips */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Filter by cuisine</label>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {REGIONS.map(region => (
                <button key={region} onClick={() => setRegionFilter(region)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                    regionFilter === region ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >{region}</button>
              ))}
            </div>
          </div>

          {/* Search with autocomplete */}
          <div className="relative" ref={suggestionRef}>
            <label className="text-xs text-gray-400 mb-1 block">
              Food Name * <span className="text-blue-400">(type to search 300+ foods)</span>
            </label>
            <input
              className="input-field"
              value={formItem.name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="e.g., Masala Dosa, Biryani, Ramen, Pizza..."
              autoComplete="off"
            />
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                  {suggestions.map((food, i) => (
                    <button key={i} onMouseDown={() => handleSelectSuggestion(food)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white text-sm font-medium">{food.name}</span>
                          <span className="text-xs text-gray-500 ml-2 bg-white/5 rounded-full px-1.5">{food.region}</span>
                        </div>
                        <span className="text-orange-400 text-xs font-bold">{food.calories} kcal</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g <span className="text-gray-600">per 100g</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quantity *</label>
              <input className="input-field" type="number" value={formItem.quantity}
                onChange={e => handleQuantityChange(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unit</label>
              <select className="input-field" value={formItem.unit}
                onChange={e => setFormItem(f => ({ ...f, unit: e.target.value }))}>
                {['g', 'ml', 'oz', 'serving', 'cup', 'tbsp', 'tsp', 'piece'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleAutoFetch} disabled={fetching}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2">
            {fetching ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Fetching...</> : '✨ Auto-fill Nutrition'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories', label: 'Calories (kcal)', color: 'text-orange-400' },
              { key: 'protein', label: 'Protein (g)', color: 'text-blue-400' },
              { key: 'carbs', label: 'Carbs (g)', color: 'text-purple-400' },
              { key: 'fat', label: 'Fat (g)', color: 'text-green-400' },
            ].map(macro => (
              <div key={macro.key}>
                <label className={`text-xs mb-1 block ${macro.color}`}>{macro.label}</label>
                <input className="input-field" type="number" value={formItem[macro.key]}
                  onChange={e => setFormItem(f => ({ ...f, [macro.key]: parseFloat(e.target.value) || '' }))}
                  placeholder="0" />
              </div>
            ))}
          </div>

          {formItem.calories > 0 && (
            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between text-sm">
              <span className="text-gray-400">Preview:</span>
              <span className="text-orange-400 font-bold">{formItem.calories} kcal</span>
              <span className="text-blue-400">P: {formItem.protein}g</span>
              <span className="text-purple-400">C: {formItem.carbs}g</span>
              <span className="text-green-400">F: {formItem.fat}g</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setAddModal({ open: false, meal: null }); setFormItem(emptyItem); }} className="btn-secondary flex-1">Done</button>
            <button onClick={handleAddItem} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : '+ Add Item'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">Click "+ Add Item" to add more, "Done" when finished</p>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDeleteItem(deleteModal.data)}
        title="Remove Food Item" message="Remove this food item?" confirmText="Remove" danger
      />
    </div>
  );
}
