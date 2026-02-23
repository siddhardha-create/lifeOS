import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null, name: '' });
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card text-center py-16 px-10">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Only</h2>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchUserDetail = async (userId) => {
    setLoadingDetail(true);
    setSelectedUser(userId);
    setActiveTab('detail');
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setUserDetail(res.data.data);
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${deleteModal.userId}`);
      setUsers(u => u.filter(u => u._id !== deleteModal.userId));
      if (selectedUser === deleteModal.userId) { setSelectedUser(null); setUserDetail(null); setActiveTab('overview'); }
      toast.success('User deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-admin`);
      setUsers(u => u.map(u => u._id === userId ? { ...u, isAdmin: res.data.data.isAdmin } : u));
      toast.success(`${res.data.data.name} is now ${res.data.data.isAdmin ? 'an admin' : 'a regular user'}`);
    } catch {
      toast.error('Failed to update admin status');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const timeAgo = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🛡️ Admin Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage users and monitor platform activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'users', label: '👥 All Users' },
          ...(selectedUser ? [{ key: 'detail', label: '🔍 User Detail' }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'from-blue-600/20 to-cyan-600/20', border: 'border-blue-500/20' },
              { label: 'Active This Week', value: stats.activeUsersThisWeek, icon: '⚡', color: 'from-green-600/20 to-emerald-600/20', border: 'border-green-500/20' },
              { label: 'New This Week', value: stats.newUsersThisWeek, icon: '🆕', color: 'from-purple-600/20 to-violet-600/20', border: 'border-purple-500/20' },
              { label: 'Food Entries', value: stats.totalFoodEntries, icon: '🍽️', color: 'from-orange-600/20 to-red-600/20', border: 'border-orange-500/20' },
              { label: 'Workout Entries', value: stats.totalWorkoutEntries, icon: '🏋️', color: 'from-yellow-600/20 to-orange-600/20', border: 'border-yellow-500/20' },
              { label: 'Study Entries', value: stats.totalStudyEntries, icon: '📚', color: 'from-pink-600/20 to-rose-600/20', border: 'border-pink-500/20' },
            ].map(stat => (
              <div key={stat.label} className={`card bg-gradient-to-br ${stat.color} border ${stat.border}`}>
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Users Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Recently Joined Users</h3>
              <button onClick={() => setActiveTab('users')} className="text-blue-400 text-sm hover:text-blue-300">View all →</button>
            </div>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{u.name} {u.isAdmin && <span className="text-xs bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 ml-1">Admin</span>}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Joined {formatDate(u.createdAt)}</p>
                    <p className="text-xs text-gray-600">{u.stats.totalEntries} entries</p>
                  </div>
                  <button onClick={() => fetchUserDetail(u._id)} className="ml-4 text-blue-400 hover:text-blue-300 text-sm">View →</button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ALL USERS TAB */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">All Users ({users.length})</h3>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-white/3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">{u.name}</p>
                      {u.isAdmin && <span className="text-xs bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 flex-shrink-0">Admin</span>}
                      {u._id === user.id && <span className="text-xs bg-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 flex-shrink-0">You</span>}
                    </div>
                    <p className="text-gray-500 text-xs truncate">{u.email}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 mx-4 text-xs text-gray-400">
                  <div className="text-center">
                    <p className="text-white font-medium">{u.stats.foodEntries}</p>
                    <p>Food</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{u.stats.workoutEntries}</p>
                    <p>Workouts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{u.stats.studyEntries}</p>
                    <p>Study</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{timeAgo(u.lastActive)}</p>
                    <p>Last Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">{formatDate(u.createdAt)}</p>
                    <p>Joined</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => fetchUserDetail(u._id)}
                    className="text-xs px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  {u._id !== user.id && (
                    <>
                      <button
                        onClick={() => handleToggleAdmin(u._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          u.isAdmin
                            ? 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400'
                        }`}
                      >
                        {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, userId: u._id, name: u.name })}
                        className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* USER DETAIL TAB */}
      {activeTab === 'detail' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
            </div>
          ) : userDetail ? (
            <>
              {/* User Profile Card */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {userDetail.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{userDetail.user.name}</h2>
                        {userDetail.user.isAdmin && <span className="text-xs bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5">Admin</span>}
                      </div>
                      <p className="text-gray-400">{userDetail.user.email}</p>
                      <p className="text-gray-600 text-sm mt-1">Joined {formatDate(userDetail.user.createdAt)} · ID: {userDetail.user._id}</p>
                    </div>
                  </div>
                  {userDetail.user._id !== user.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmin(userDetail.user._id)}
                        className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                          userDetail.user.isAdmin
                            ? 'bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400'
                        }`}
                      >
                        {userDetail.user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, userId: userDetail.user._id, name: userDetail.user.name })}
                        className="text-sm px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl transition-colors"
                      >
                        Delete User
                      </button>
                    </div>
                  )}
                </div>

                {/* Goals */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-3">User Goals</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Daily Calories', value: `${userDetail.user.goals?.dailyCalorieIntake || 2000} kcal` },
                      { label: 'Calorie Burn Goal', value: `${userDetail.user.goals?.dailyCalorieBurn || 500} kcal` },
                      { label: 'Study Goal', value: `${userDetail.user.goals?.dailyStudyHours || 4}h/day` },
                      { label: 'Workout Goal', value: `${userDetail.user.goals?.weeklyWorkoutDays || 5} days/week` },
                    ].map(g => (
                      <div key={g.label} className="glass-dark rounded-xl p-3">
                        <p className="text-white font-medium text-sm">{g.value}</p>
                        <p className="text-gray-500 text-xs">{g.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* All-time stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Calories Consumed', value: userDetail.allTimeStats.totalCaloriesConsumed.toLocaleString(), icon: '🍽️' },
                  { label: 'Calories Burned', value: userDetail.allTimeStats.totalCaloriesBurned.toLocaleString(), icon: '🔥' },
                  { label: 'Study Hours', value: userDetail.allTimeStats.totalStudyHours, icon: '📚' },
                  { label: 'Food Days Logged', value: userDetail.allTimeStats.totalFoodDays, icon: '📅' },
                  { label: 'Workout Days', value: userDetail.allTimeStats.totalWorkoutDays, icon: '🏋️' },
                  { label: 'Study Days', value: userDetail.allTimeStats.totalStudyDays, icon: '🎓' },
                ].map(stat => (
                  <div key={stat.label} className="card text-center">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recent Food */}
                <div className="card">
                  <h3 className="font-semibold text-white mb-3">🍽️ Recent Food (7 days)</h3>
                  {userDetail.recentActivity.food.length === 0 ? (
                    <p className="text-gray-600 text-sm">No food logged recently</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.recentActivity.food.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{formatDate(entry.date)}</span>
                          <span className="text-orange-400 font-medium">{Math.round(entry.totalDayCalories)} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Workouts */}
                <div className="card">
                  <h3 className="font-semibold text-white mb-3">🏋️ Recent Workouts (7 days)</h3>
                  {userDetail.recentActivity.workout.length === 0 ? (
                    <p className="text-gray-600 text-sm">No workouts logged recently</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.recentActivity.workout.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{formatDate(entry.date)}</span>
                          <span className="text-green-400 font-medium">{entry.totalCaloriesBurned} kcal burned</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Study */}
                <div className="card">
                  <h3 className="font-semibold text-white mb-3">📚 Recent Study (7 days)</h3>
                  {userDetail.recentActivity.study.length === 0 ? (
                    <p className="text-gray-600 text-sm">No study logged recently</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.recentActivity.study.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{formatDate(entry.date)}</span>
                          <span className="text-blue-400 font-medium">{(entry.totalActualDuration || 0).toFixed(1)}h studied</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </motion.div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, userId: null, name: '' })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteModal.name} and ALL their data? This cannot be undone.`}
        confirmText="Delete Permanently"
        danger
      />
    </div>
  );
}
