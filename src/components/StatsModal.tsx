import React from 'react';

export interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
}

interface StatsModalProps {
  stats: GameStats;
  onClose: () => void;
}

export default function StatsModal({ stats, onClose }: StatsModalProps) {
  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-800 border border-gray-600 rounded-xl max-w-sm w-full p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-emerald-400 text-center uppercase tracking-widest">Statistics</h2>
        
        <div className="grid grid-cols-4 gap-2 text-center mb-6">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white">{stats.played}</span>
            <span className="text-xs text-gray-400">Played</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white">{winPct}</span>
            <span className="text-xs text-gray-400">Win %</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white">{stats.currentStreak}</span>
            <span className="text-xs text-gray-400">Current Streak</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white">{stats.maxStreak}</span>
            <span className="text-xs text-gray-400">Max Streak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
