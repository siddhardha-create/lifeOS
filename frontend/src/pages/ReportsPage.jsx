import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { ConfirmModal } from '../components/common/Modal';
import toast from 'react-hot-toast';

const months = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function ReportsPage() {
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [clearAfter, setClearAfter] = useState(false);
  const [loading, setLoading] = useState({ pdf: false, csv: '' });
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });
  const [cleanupModal, setCleanupModal] = useState(false);

  const downloadPDF = async () => {
    setLoading(l => ({ ...l, pdf: true }));
    try {
      const token = localStorage.getItem('lifeos_token');
      const response = await fetch(
        `/api/report/monthly-pdf?month=${reportMonth}&year=${reportYear}&clearAfter=${clearAfter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LifeOS_Report_${months[reportMonth - 1]}_${reportYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
      if (clearAfter) toast.success('Month data cleared after export');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(l => ({ ...l, pdf: false }));
    }
  };

  const downloadCSV = async (type) => {
    setLoading(l => ({ ...l, csv: type }));
    try {
      const token = localStorage.getItem('lifeos_token');
      const response = await fetch(`/api/report/csv/${type}?days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_data.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} CSV downloaded!`);
    } catch {
      toast.error('CSV export failed');
    } finally {
      setLoading(l => ({ ...l, csv: '' }));
    }
  };

  const handleCleanup = async () => {
    try {
      const res = await api.delete('/report/cleanup');
      toast.success(`Cleaned up old data: ${JSON.stringify(res.data.deleted)}`);
    } catch {
      toast.error('Cleanup failed');
    }
  };

  const years = [now.getFullYear() - 1, now.getFullYear()];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">📄 Reports & Exports</h1>
        <p className="text-gray-400 text-sm mt-1">Download your data as PDF or CSV</p>
      </div>

      {/* Monthly PDF Report */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-xl">📑</div>
          <div>
            <h3 className="font-semibold text-white">Monthly PDF Report</h3>
            <p className="text-xs text-gray-400">Complete monthly summary with charts and stats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Month</label>
            <select
              className="input-field"
              value={reportMonth}
              onChange={e => setReportMonth(parseInt(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Year</label>
            <select
              className="input-field"
              value={reportYear}
              onChange={e => setReportYear(parseInt(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={clearAfter}
                onChange={e => setClearAfter(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-gray-400">Clear data after export</span>
            </label>
          </div>
        </div>

        {clearAfter && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-400">
            ⚠️ Warning: This will permanently delete {months[reportMonth - 1]} {reportYear} data after PDF download.
          </div>
        )}

        <button
          onClick={clearAfter
            ? () => setConfirmModal({ open: true, action: downloadPDF })
            : downloadPDF
          }
          disabled={loading.pdf}
          className="btn-primary flex items-center gap-2"
        >
          {loading.pdf ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />Generating...</>
          ) : '📥 Download PDF Report'}
        </button>
      </motion.div>

      {/* CSV Exports */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mb-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-xl">📊</div>
          <div>
            <h3 className="font-semibold text-white">CSV Exports</h3>
            <p className="text-xs text-gray-400">Export last 30 days of data as CSV</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { type: 'food', icon: '🍽️', label: 'Food Data', desc: 'Daily calories & macros' },
            { type: 'workout', icon: '🏋️', label: 'Workout Data', desc: 'Exercises & calories burned' },
            { type: 'study', icon: '📚', label: 'Study Data', desc: 'Sessions & productivity' },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => downloadCSV(item.type)}
              disabled={loading.csv === item.type}
              className="card hover:border-white/20 transition-all text-left"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-medium text-white text-sm">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              {loading.csv === item.type && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full spinner" />
                  Exporting...
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">🗄️</div>
          <div>
            <h3 className="font-semibold text-white">Data Management</h3>
            <p className="text-xs text-gray-400">Manage your stored data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl">
            <div>
              <p className="text-white text-sm font-medium">Clean Up Old Data</p>
              <p className="text-gray-500 text-xs">Delete entries older than 30 days</p>
            </div>
            <button
              onClick={() => setCleanupModal(true)}
              className="btn-danger text-sm py-1.5 px-3"
            >
              Clean Up
            </button>
          </div>

          <div className="p-4 bg-white/3 rounded-xl">
            <p className="text-white text-sm font-medium mb-1">Data Retention Policy</p>
            <p className="text-gray-500 text-xs">LifeOS stores your data for a minimum of 30 days. Use the cleanup tool or export your data before it gets old. Monthly PDF reports include all your stats in one document.</p>
          </div>
        </div>
      </motion.div>

      {/* Confirm delete and clear modals */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null })}
        onConfirm={() => confirmModal.action?.()}
        title="Confirm Export & Delete"
        message={`This will download the PDF report for ${months[reportMonth - 1]} ${reportYear} and then permanently delete that month's data. This cannot be undone.`}
        confirmText="Download & Delete"
        danger
      />

      <ConfirmModal
        isOpen={cleanupModal}
        onClose={() => setCleanupModal(false)}
        onConfirm={handleCleanup}
        title="Clean Up Old Data"
        message="This will permanently delete all entries older than 30 days. Make sure to export your data first."
        confirmText="Clean Up"
        danger
      />
    </div>
  );
}
