import React from 'react';

type StatItem = {
  id: string;
  label: string;
  fullLabel?: string;
  emoji: string;
  value: string;
  percentile: number;
  color: string;
};

interface StatsDashboardProps {
  stats: StatItem[];
}

export default function StatsDashboard({ stats }: StatsDashboardProps) {
  return (
    <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in transition-colors">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {stats.map((stat, index) => {
          // If the value is explicitly a percentage (e.g. 50%), use that for the bar fill.
          // Otherwise, use the global percentile so it shows how "extreme" the value is.
          const fillPercentage = stat.value.includes('%') 
            ? parseFloat(stat.value) 
            : stat.percentile;

          return (
            <div 
              key={stat.id} 
              className="bg-gray-50 dark:bg-gray-700 p-1.5 rounded-lg flex flex-col items-center justify-center text-center shadow-inner hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors animate-flip-in border border-gray-100 dark:border-gray-600 relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
              title={`${stat.fullLabel || stat.label}\nValue: ${stat.value}\nGlobal Percentile: ${stat.percentile}th`}
            >
              <span className="text-lg sm:text-xl mb-0.5 z-10">{stat.emoji}</span>
              <span 
                className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 leading-tight line-clamp-1 z-10"
              >
                {stat.label}
              </span>
              <span 
                className="text-[10px] sm:text-xs font-bold tracking-wide z-10 mb-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              
              {/* Inline mini-chart / progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden mt-auto z-10">
                <div 
                  className="h-full rounded-full opacity-70"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, fillPercentage))}%`,
                    backgroundColor: stat.color
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">
        Colors reflect environmental impact: <span className="text-green-500 font-bold">Green = Better</span> | <span className="text-red-500 font-bold">Red = Worse</span>.
      </div>
    </div>
  );
}
