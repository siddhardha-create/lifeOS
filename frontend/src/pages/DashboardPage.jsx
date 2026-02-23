import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '../components/common/AnimatedCounter';
import ProgressBar from '../components/common/ProgressBar';
import { formatDate, DAY_SHORT } from '../utils/dateUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl p-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, trRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/trends'),
        ]);
        setOverview(ovRes.data.data);
        setTrends(trRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const goals = user?.goals || {};

  // Build weekly chart data
  const buildWeeklyData = () => {
    if (!overview) return [];
    const days = {};
    DAY_SHORT.forEach(d => { days[d] = { day: d, calories: 0, burned: 0, study: 0 }; });

    overview.weekly.food.forEach(item => {
      const d = new Date(item.date);
      const day = DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
      if (days[day]) days[day].calories = item.calories;
    });
    overview.weekly.workout.forEach(item => {
      const d = new Date(item.date);
      const day = DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
      if (days[day]) days[day].burned = item.caloriesBurned;
    });
    overview.weekly.study.forEach(item => {
      const d = new Date(item.date);
      const day = DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
      if (days[day]) days[day].study = parseFloat(item.hours.toFixed(1));
    });

    return Object.values(days);
  };

  const weeklyData = buildWeeklyData();

  // 30-day trend
  const trendData = (trends?.food || []).slice(-14).map((item, i) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    calories: item.calories,
    burned: trends?.workout?.[i]?.calories || 0,
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
    </div>
  );

  const todayFood = overview?.today?.food;
  const todayWorkout = overview?.today?.workout;
  const todayStudy = overview?.today?.study;

  const statCards = [
    {
      label: "Today's Calories",
      value: todayFood?.calories || 0,
      max: goals.dailyCalorieIntake || 2000,
      icon: '🔥',
      color: 'orange',
      suffix: ' kcal',
      gradient: 'from-orange-600/20 to-red-600/20',
      border: 'border-orange-500/20',
    },
    {
      label: 'Calories Burned',
      value: todayWorkout?.caloriesBurned || 0,
      max: goals.dailyCalorieBurn || 500,
      icon: '⚡',
      color: 'green',
      suffix: ' kcal',
      gradient: 'from-green-600/20 to-emerald-600/20',
      border: 'border-green-500/20',
    },
    {
      label: 'Study Hours',
      value: todayStudy?.hours || 0,
      max: goals.dailyStudyHours || 4,
      icon: '📚',
      color: 'blue',
      suffix: 'h',
      decimals: 1,
      gradient: 'from-blue-600/20 to-cyan-600/20',
      border: 'border-blue-500/20',
    },
    {
      label: 'Workout Days (Week)',
      value: overview?.weekly?.workoutDays || 0,
      max: goals.weeklyWorkoutDays || 5,
      icon: '🏋️',
      color: 'purple',
      suffix: ' days',
      gradient: 'from-purple-600/20 to-violet-600/20',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </motion.h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`stat-card bg-gradient-to-br ${card.gradient} border ${card.border}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-gray-500">
                {Math.round((card.value / card.max) * 100)}%
              </span>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              <AnimatedCounter value={card.value} decimals={card.decimals || 0} suffix={card.suffix} />
            </div>
            <p className="text-xs text-gray-400 mb-3">{card.label}</p>
            <ProgressBar value={card.value} max={card.max} color={card.color} showPercent={false} height="h-1.5" />
            <p className="text-xs text-gray-500 mt-1">Goal: {card.max}{card.suffix}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Overview Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Bar dataKey="calories" name="Intake" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="burned" name="Burned" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Study Hours Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="study" name="Hours" stroke="#3b82f6" fill="url(#studyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 14-day Calorie Trend */}
      {trendData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">14-Day Calorie Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <defs>
                <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Line type="monotone" dataKey="calories" name="Intake" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
              <Line type="monotone" dataKey="burned" name="Burned" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Macros */}
        {todayFood && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="card">
            <h3 className="font-semibold text-white mb-4">Today's Macros</h3>
            <div className="space-y-3">
              <ProgressBar value={todayFood.protein || 0} max={150} label={`Protein ${Math.round(todayFood.protein || 0)}g`} color="blue" />
              <ProgressBar value={todayFood.carbs || 0} max={250} label={`Carbs ${Math.round(todayFood.carbs || 0)}g`} color="orange" />
              <ProgressBar value={todayFood.fat || 0} max={65} label={`Fat ${Math.round(todayFood.fat || 0)}g`} color="purple" />
            </div>
          </motion.div>
        )}

        {/* Workout Summary */}
        {todayWorkout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="card">
            <h3 className="font-semibold text-white mb-4">Today's Workout</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Exercises</span>
                <span className="text-white font-medium">{todayWorkout.exercises}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-white font-medium">{todayWorkout.duration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Burned</span>
                <span className="text-green-400 font-medium">{todayWorkout.caloriesBurned} kcal</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Study Summary */}
        {todayStudy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="card">
            <h3 className="font-semibold text-white mb-4">Today's Study</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sessions</span>
                <span className="text-white font-medium">{todayStudy.sessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Hours</span>
                <span className="text-white font-medium">{todayStudy.hours.toFixed(1)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Productivity</span>
                <span className="text-blue-400 font-medium">{todayStudy.score}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state if no data */}
        {!todayFood && !todayWorkout && !todayStudy && (
          <div className="col-span-3 card text-center py-10">
            <p className="text-4xl mb-3">🌅</p>
            <p className="text-white font-medium">No data for today yet</p>
            <p className="text-gray-400 text-sm mt-1">Start logging your meals, workouts, and study sessions!</p>
          </div>
        )}
      </div>
    </div>
  );
}
