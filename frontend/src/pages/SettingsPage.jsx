import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profile, setProfile] = useState({ name: user?.name || '' });
  const [goals, setGoals] = useState({
    dailyCalorieIntake: user?.goals?.dailyCalorieIntake || 2000,
    dailyCalorieBurn: user?.goals?.dailyCalorieBurn || 500,
    dailyStudyHours: user?.goals?.dailyStudyHours || 4,
    weeklyWorkoutDays: user?.goals?.weeklyWorkoutDays || 5,
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState({ profile: false, goals: false, password: false });

  const handleProfileSave = async () => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      await updateUser({ name: profile.name });
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(s => ({ ...s, profile: false })); }
  };

  const handleGoalsSave = async () => {
    setSaving(s => ({ ...s, goals: true }));
    try {
      await updateUser({ goals });
    } catch { toast.error('Failed to update goals'); }
    finally { setSaving(s => ({ ...s, goals: false })); }
  };

  const handlePasswordSave = async () => {
    if (passwords.new !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    if (passwords.new.length < 6) { toast.error('Password must be 6+ characters'); return; }
    setSaving(s => ({ ...s, password: true }));
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      toast.success('Password changed!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(s => ({ ...s, password: false }));
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <h3 className="font-semibold text-white mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
            <input
              className="input-field"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email</label>
            <input className="input-field opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving.profile}
            className="btn-primary text-sm"
          >
            {saving.profile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </motion.div>

      {/* Goals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h3 className="font-semibold text-white mb-4">Daily & Weekly Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'dailyCalorieIntake', label: 'Daily Calorie Intake', unit: 'kcal', icon: '🔥', min: 1000, max: 5000 },
            { key: 'dailyCalorieBurn', label: 'Daily Calorie Burn Goal', unit: 'kcal', icon: '⚡', min: 100, max: 3000 },
            { key: 'dailyStudyHours', label: 'Daily Study Hours', unit: 'hours', icon: '📚', min: 0.5, max: 16, step: 0.5 },
            { key: 'weeklyWorkoutDays', label: 'Weekly Workout Days', unit: 'days', icon: '🏋️', min: 1, max: 7 },
          ].map(goal => (
            <div key={goal.key}>
              <label className="text-xs text-gray-400 mb-1 block">
                {goal.icon} {goal.label} ({goal.unit})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={goal.min}
                  max={goal.max}
                  step={goal.step || 1}
                  value={goals[goal.key]}
                  onChange={e => setGoals(g => ({ ...g, [goal.key]: parseFloat(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-white font-bold w-16 text-right">{goals[goal.key]} {goal.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleGoalsSave}
          disabled={saving.goals}
          className="btn-primary text-sm mt-4"
        >
          {saving.goals ? 'Saving...' : 'Save Goals'}
        </button>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
        <h3 className="font-semibold text-white mb-4">Appearance</h3>
        <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl">
          <div>
            <p className="text-white text-sm font-medium">Theme</p>
            <p className="text-gray-500 text-xs">Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
          </div>
          <button onClick={toggleTheme} className="btn-secondary text-sm flex items-center gap-2">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
        <h3 className="font-semibold text-white mb-4">Change Password</h3>
        <div className="space-y-3">
          {[
            { key: 'current', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'new', label: 'New Password', placeholder: 'Min. 6 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
              <input
                type="password"
                className="input-field"
                value={passwords[field.key]}
                onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <button
            onClick={handlePasswordSave}
            disabled={saving.password}
            className="btn-primary text-sm"
          >
            {saving.password ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </motion.div>

      {/* App info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="card">
        <div className="text-center py-4">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-bold gradient-text text-lg">LifeOS v1.0</h3>
          <p className="text-gray-500 text-sm mt-1">Daily Activity & Goal Tracker</p>
          <p className="text-gray-600 text-xs mt-2">Built with React + Node.js + MongoDB</p>
        </div>
      </motion.div>
    </div>
  );
}
