import { motion } from 'framer-motion';

export default function ProgressBar({ value, max, color = 'blue', label, showPercent = true, height = 'h-2', animate = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const colorMap = {
    blue: 'from-blue-500 to-blue-400',
    green: 'from-green-500 to-emerald-400',
    orange: 'from-orange-500 to-amber-400',
    purple: 'from-purple-500 to-violet-400',
    red: 'from-red-500 to-rose-400',
    pink: 'from-pink-500 to-rose-400',
    gradient: 'from-blue-500 via-purple-500 to-pink-500',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">{label}</span>
          {showPercent && <span className="text-xs font-medium text-white">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-white/5 rounded-full overflow-hidden`}>
        <motion.div
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`${height} bg-gradient-to-r ${colorMap[color] || colorMap.blue} rounded-full`}
        />
      </div>
    </div>
  );
}
