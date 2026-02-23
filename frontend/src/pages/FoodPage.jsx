import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅', color: 'orange' },
  { key: 'lunch', label: 'Lunch', icon: '☀️', color: 'yellow' },
  { key: 'dinner', label: 'Dinner', icon: '🌙', color: 'blue' },
  { key: 'snacks', label: 'Snacks', icon: '🍎', color: 'green' },
];

// Realistic food dataset (per 100g unless noted)
const FOOD_DATABASE = [
  // Grains & Staples
  { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: 'Brown Rice (cooked)', calories: 112, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: 'Chapati / Roti', calories: 297, protein: 8, carbs: 52, fat: 6 },
  { name: 'White Bread', calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  { name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 4.2 },
  { name: 'Oats (cooked)', calories: 71, protein: 2.5, carbs: 12, fat: 1.5 },
  { name: 'Idli', calories: 58, protein: 2, carbs: 11, fat: 0.5 },
  { name: 'Dosa', calories: 168, protein: 4, carbs: 25, fat: 5 },
  { name: 'Upma', calories: 110, protein: 3, carbs: 18, fat: 3 },
  { name: 'Poha', calories: 130, protein: 2.5, carbs: 26, fat: 2.5 },
  { name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: 'Noodles (cooked)', calories: 138, protein: 4.5, carbs: 25, fat: 2 },

  // Proteins
  { name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Chicken Leg (cooked)', calories: 185, protein: 26, carbs: 0, fat: 9 },
  { name: 'Egg (whole, boiled)', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: 'Egg White', calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { name: 'Tuna (canned)', calories: 116, protein: 26, carbs: 0, fat: 1 },
  { name: 'Salmon (grilled)', calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: 'Paneer', calories: 265, protein: 18, carbs: 3, fat: 20 },
  { name: 'Tofu', calories: 76, protein: 8, carbs: 2, fat: 4.8 },
  { name: 'Dal (cooked)', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: 'Rajma (cooked)', calories: 127, protein: 8.7, carbs: 22, fat: 0.5 },
  { name: 'Chole (cooked)', calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { name: 'Mutton (cooked)', calories: 294, protein: 25, carbs: 0, fat: 21 },

  // Dairy
  { name: 'Whole Milk', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: 'Skim Milk', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: 'Curd / Yogurt', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: 'Butter', calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },
  { name: 'Ghee', calories: 900, protein: 0, carbs: 0, fat: 100 },
  { name: 'Cheese (cheddar)', calories: 403, protein: 25, carbs: 1.3, fat: 33 },

  // Vegetables
  { name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: 'Carrot', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: 'Potato (boiled)', calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Onion', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { name: 'Cucumber', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: 'Capsicum', calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: 'Cauliflower', calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },

  // Fruits
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: 'Grapes', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: 'Watermelon', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: 'Papaya', calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
  { name: 'Pomegranate', calories: 83, protein: 1.7, carbs: 19, fat: 1.2 },

  // Nuts & Seeds
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: 'Walnuts', calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: 'Peanuts', calories: 567, protein: 26, carbs: 16, fat: 49 },
  { name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: 'Cashews', calories: 553, protein: 18, carbs: 30, fat: 44 },
  { name: 'Chia Seeds', calories: 486, protein: 17, carbs: 42, fat: 31 },

  // Indian Dishes
  { name: 'Sambar', calories: 55, protein: 3, carbs: 8, fat: 1.5 },
  { name: 'Biryani (chicken)', calories: 168, protein: 10, carbs: 22, fat: 4 },
  { name: 'Palak Paneer', calories: 150, protein: 8, carbs: 7, fat: 10 },
  { name: 'Butter Chicken', calories: 150, protein: 14, carbs: 7, fat: 8 },
  { name: 'Masala Dosa', calories: 206, protein: 5, carbs: 33, fat: 6 },
  { name: 'Pav Bhaji', calories: 180, protein: 5, carbs: 28, fat: 6 },
  { name: 'Samosa', calories: 262, protein: 5, carbs: 30, fat: 14 },
  { name: 'Vada', calories: 280, protein: 7, carbs: 30, fat: 15 },

  // Beverages
  { name: 'Tea with Milk (1 cup)', calories: 30, protein: 1, carbs: 4, fat: 1 },
  { name: 'Coffee with Milk (1 cup)', calories: 40, protein: 2, carbs: 4, fat: 2 },
  { name: 'Orange Juice (1 glass)', calories: 45, protein: 0.7, carbs: 10, fat: 0.2 },
  { name: 'Coconut Water (1 cup)', calories: 46, protein: 1.7, carbs: 9, fat: 0.5 },
  { name: 'Protein Shake (1 scoop)', calories: 120, protein: 24, carbs: 5, fat: 1.5 },

  // Snacks & Fast Food
  { name: 'Biscuit / Digestive', calories: 471, protein: 6.5, carbs: 69, fat: 18 },
  { name: 'Chips / Crisps', calories: 536, protein: 7, carbs: 53, fat: 35 },
  { name: 'Dark Chocolate', calories: 598, protein: 7.8, carbs: 46, fat: 43 },
  { name: 'Burger (plain)', calories: 295, protein: 17, carbs: 24, fat: 14 },
  { name: 'Pizza (1 slice)', calories: 266, protein: 11, carbs: 33, fat: 10 },
];

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
  const suggestionRef = useRef(null);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/food/week', { params: { date: selectedDay } });
      const map = {};
      res.data.data.forEach(e => { map[formatDate(new Date(e.date))] = e; });
      setEntries(map);
    } catch (err) {
      toast.error('Failed to load food data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekData();
    setWeekDays(getWeekDays(new Date(selectedDay)));
  }, [selectedDay]);

  // Close suggestions when clicking outside
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
      const filtered = FOOD_DATABASE.filter(f =>
        f.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (food) => {
    // Scale nutrition based on quantity
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
    toast.success('Nutrition filled from database! ✨');
  };

  // When quantity changes, rescale if food is from database
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
    // Check local DB first
    const localMatch = FOOD_DATABASE.find(f =>
      f.name.toLowerCase().includes(formItem.name.toLowerCase())
    );
    if (localMatch) {
      handleSelectSuggestion(localMatch);
      return;
    }
    setFetching(true);
    try {
      const res = await api.post('/food/nutrition-lookup', {
        foodName: formItem.name,
        quantity: formItem.quantity || 100,
        unit: formItem.unit || 'g',
      });
      const d = res.data.data;
      setFormItem(f => ({ ...f, calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat }));
      toast.success(`Fetched nutrition data!`);
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
      const res = await api.post('/food/entry', {
        date: selectedDay,
        meal: addModal.meal,
        items: [formItem],
      });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      setFormItem(emptyItem);
      setSuggestions([]);
      toast.success('Food added! 🎉');
      // Keep modal open so user can add more items
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add food');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAndClose = async () => {
    await handleAddItem();
    setAddModal({ open: false, meal: null });
    setFormItem(emptyItem);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🍽️ Food Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Track your daily nutrition</p>
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
                className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all duration-200 relative
                  ${isSelected ? 'bg-gradient-to-b from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/10'}
                  ${isToday && !isSelected ? 'border border-blue-500/50' : ''}
                `}
              >
                <span className="text-xs text-gray-400 mb-1">{DAY_SHORT[i]}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {day.getDate()}
                </span>
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
                  >
                    +
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-6 text-gray-600">
                    <p className="text-2xl mb-1">🍽️</p>
                    <p className="text-sm">No items yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <motion.div
                        key={item._id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.name}</p>
                          <p className="text-gray-500 text-xs">
                            {item.quantity}{item.unit} · {Math.round(item.calories)} kcal
                            {item.isAutoFetched && <span className="ml-1 text-blue-400">✨auto</span>}
                          </p>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-2 text-xs text-gray-400">
                          <span>P:{Math.round(item.protein)}g</span>
                          <span>C:{Math.round(item.carbs)}g</span>
                          <span>F:{Math.round(item.fat)}g</span>
                          <button
                            onClick={() => setDeleteModal({
                              open: true,
                              data: { entryId: todayEntry._id, meal: meal.key, itemId: item._id },
                            })}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            🗑️
                          </button>
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
          {/* Food name with autocomplete */}
          <div className="relative" ref={suggestionRef}>
            <label className="text-xs text-gray-400 mb-1 block">Food Name * <span className="text-blue-400">(start typing for suggestions)</span></label>
            <input
              className="input-field"
              value={formItem.name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="e.g., Brown Rice, Chicken Breast..."
              autoComplete="off"
            />
            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  {suggestions.map((food, i) => (
                    <button
                      key={i}
                      onMouseDown={() => handleSelectSuggestion(food)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{food.name}</span>
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
              <input
                className="input-field"
                type="number"
                value={formItem.quantity}
                onChange={e => handleQuantityChange(e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Unit</label>
              <select
                className="input-field"
                value={formItem.unit}
                onChange={e => setFormItem(f => ({ ...f, unit: e.target.value }))}
              >
                {['g', 'ml', 'oz', 'serving', 'cup', 'tbsp', 'tsp', 'piece'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto fetch button (for foods not in local DB) */}
          <button
            onClick={handleAutoFetch}
            disabled={fetching}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
          >
            {fetching ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Fetching...</>
            ) : '✨ Auto-fill Nutrition'}
          </button>

          {/* Macros */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'calories', label: 'Calories (kcal)', color: 'text-orange-400' },
              { key: 'protein', label: 'Protein (g)', color: 'text-blue-400' },
              { key: 'carbs', label: 'Carbs (g)', color: 'text-purple-400' },
              { key: 'fat', label: 'Fat (g)', color: 'text-green-400' },
            ].map(macro => (
              <div key={macro.key}>
                <label className={`text-xs mb-1 block ${macro.color}`}>{macro.label}</label>
                <input
                  className="input-field"
                  type="number"
                  value={formItem[macro.key]}
                  onChange={e => setFormItem(f => ({ ...f, [macro.key]: parseFloat(e.target.value) || '' }))}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* Show current macros preview if filled */}
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
            <button onClick={() => { setAddModal({ open: false, meal: null }); setFormItem(emptyItem); }} className="btn-secondary flex-1">
              Done
            </button>
            <button onClick={handleAddItem} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Adding...' : '+ Add Item'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">Click "+ Add Item" to add more items, or "Done" when finished</p>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDeleteItem(deleteModal.data)}
        title="Remove Food Item"
        message="Are you sure you want to remove this food item?"
        confirmText="Remove"
        danger
      />
    </div>
  );
}
