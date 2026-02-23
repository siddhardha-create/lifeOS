import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { getWeekDays, formatDate, DAY_SHORT } from '../utils/dateUtils';
import Modal, { ConfirmModal } from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#06b6d4', '#84cc16'];
const emptySession = { subject: '', topic: '', plannedDuration: 60, actualDuration: 0, difficulty: 'medium', notes: '' };

export default function StudyPage() {
  const [weekDays, setWeekDays] = useState(getWeekDays());
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState({});
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false });
  const [form, setForm] = useState(emptySession);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, data: null });

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const [weekRes, statsRes] = await Promise.all([
        api.get('/study/week', { params: { date: selectedDay } }),
        api.get('/study/stats', { params: { days: 30 } }),
      ]);
      const map = {};
      weekRes.data.data.forEach(e => { map[formatDate(new Date(e.date))] = e; });
      setEntries(map);
      setStatsData(statsRes.data.data);
    } catch { toast.error('Failed to load study data'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchWeekData();
    setWeekDays(getWeekDays(new Date(selectedDay)));
  }, [selectedDay]);

  const todayEntry = entries[selectedDay];
  const sessions = todayEntry?.sessions || [];

  const handleSave = async () => {
    if (!form.subject || !form.topic) { toast.error('Subject and topic required'); return; }
    setSaving(true);
    try {
      const existingSessions = todayEntry?.sessions || [];
      const res = await api.post('/study/entry', {
        date: selectedDay,
        sessions: [...existingSessions, {
          ...form,
          plannedDuration: parseInt(form.plannedDuration) || 60,
          actualDuration: parseInt(form.actualDuration) || 0,
        }],
      });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      setModal({ open: false });
      setForm(emptySession);
      toast.success('Study session logged!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateActual = async (idx, actualDuration) => {
    try {
      const updatedSessions = todayEntry.sessions.map((s, i) =>
        i === idx ? { ...s, actualDuration: parseInt(actualDuration) || 0 } : s
      );
      const res = await api.post('/study/entry', { date: selectedDay, sessions: updatedSessions });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (idx) => {
    try {
      const updatedSessions = todayEntry.sessions.filter((_, i) => i !== idx);
      const res = await api.post('/study/entry', { date: selectedDay, sessions: updatedSessions });
      const updatedDate = formatDate(new Date(res.data.data.date));
      setEntries(e => ({ ...e, [updatedDate]: res.data.data }));
      toast.success('Session removed');
    } catch { toast.error('Failed to remove'); }
  };

  const subjectBreakdown = statsData?.summary?.subjectBreakdown || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📚 Study Tracker</h1>
        <p className="text-gray-400 text-sm mt-1">Track your study sessions and progress</p>
      </div>

      {/* Week selector */}
      <div className="card mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, i) => {
            const dayStr = formatDate(day);
            const isSelected = dayStr === selectedDay;
            return (
              <motion.button
                key={dayStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(dayStr)}
                className={`flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all
                  ${isSelected ? 'bg-gradient-to-b from-blue-600 to-indigo-700' : 'hover:bg-white/10'}
                `}
              >
                <span className="text-xs text-gray-400 mb-1">{DAY_SHORT[i]}</span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{day.getDate()}</span>
                {entries[dayStr] && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sessions list */}
        <div className="xl:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Study Sessions</h3>
                {todayEntry && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {todayEntry.totalActualHours.toFixed(1)}h actual / {todayEntry.totalPlannedHours.toFixed(1)}h planned
                    · Score: {todayEntry.productivityScore}%
                  </p>
                )}
              </div>
              <button
                onClick={() => { setModal({ open: true }); setForm(emptySession); }}
                className="btn-primary text-sm py-2 px-4"
              >
                + Add Session
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full spinner" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📚</p>
                <p className="text-gray-400">No sessions logged yet</p>
                <p className="text-gray-600 text-sm mt-1">Plan your study sessions for today!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s, idx) => {
                  const pct = s.plannedDuration > 0 ? Math.min(100, Math.round((s.actualDuration / s.plannedDuration) * 100)) : 0;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white/3 rounded-xl group hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{s.subject}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full
                              ${s.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                s.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'}`}
                            >
                              {s.difficulty}
                            </span>
                            {s.completed && <span className="text-green-400 text-xs">✅ Done</span>}
                          </div>
                          <p className="text-gray-400 text-sm">{s.topic}</p>
                        </div>
                        <button
                          onClick={() => setDeleteModal({ open: true, data: idx })}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="mb-2">
                        <ProgressBar value={s.actualDuration} max={s.plannedDuration} color={pct >= 80 ? 'green' : 'blue'} showPercent={false} height="h-1.5" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Actual: {s.actualDuration} min</span>
                          <span>{pct}% of {s.plannedDuration} min goal</span>
                        </div>
                      </div>

                      {/* Quick update actual */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">Update actual:</span>
                        <input
                          type="number"
                          defaultValue={s.actualDuration}
                          onBlur={e => handleUpdateActual(idx, e.target.value)}
                          className="input-field text-xs py-1 px-2 w-20"
                          placeholder="min"
                        />
                        <span className="text-xs text-gray-500">min</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-white mb-4">30-Day Subject Breakdown</h3>
            {subjectBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={subjectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="hours"
                      nameKey="subject"
                    >
                      {subjectBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}h`, '']}
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {subjectBreakdown.map((s, i) => (
                    <div key={s.subject} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-300">{s.subject}</span>
                      </div>
                      <span className="text-white font-medium">{s.hours}h</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No study data yet</p>
              </div>
            )}
          </div>

          {statsData && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3">30-Day Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Hours</span>
                  <span className="text-white font-medium">{statsData.summary.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Daily</span>
                  <span className="text-white font-medium">{statsData.summary.avgDailyHours}h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Session Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false })} title="Log Study Session">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subject *</label>
            <input
              className="input-field"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g., Mathematics, Chemistry"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Topic *</label>
            <input
              className="input-field"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g., Calculus - Derivatives"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Planned Duration (min)</label>
              <input
                className="input-field"
                type="number"
                value={form.plannedDuration}
                onChange={e => setForm(f => ({ ...f, plannedDuration: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Actual Duration (min)</label>
              <input
                className="input-field"
                type="number"
                value={form.actualDuration}
                onChange={e => setForm(f => ({ ...f, actualDuration: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Difficulty</label>
            <select
              className="input-field"
              value={form.difficulty}
              onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Key takeaways, resources..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal({ open: false })} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : 'Log Session'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={() => handleDelete(deleteModal.data)}
        title="Remove Session"
        message="Remove this study session?"
        confirmText="Remove"
        danger
      />
    </div>
  );
}
