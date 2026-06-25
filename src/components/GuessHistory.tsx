import React from 'react';

export interface GuessResult {
  id: string; // ISO3
  iso2?: string;
  name: string;
  distance: number;
  direction: string;
  proximity: number;
  isCorrect: boolean;
}

interface GuessHistoryProps {
  guesses: GuessResult[];
  isHardMode?: boolean;
}

function ProximitySquares({ proximity, isNew }: { proximity: number, isNew: boolean }) {
  const squares = [];
  for (let i = 0; i < 5; i++) {
    const threshold = (i + 1) * 20;
    const prevThreshold = i * 20;
    
    if (proximity >= threshold) {
      squares.push('bg-emerald-500');
    } else if (proximity > prevThreshold) {
      squares.push('bg-yellow-500');
    } else {
      squares.push('bg-gray-300 dark:bg-gray-700');
    }
  }

  return (
    <div className="flex space-x-1">
      {squares.map((colorClass, i) => (
        <div 
          key={i} 
          className={`w-3 h-4 sm:w-4 sm:h-5 rounded-[2px] ${colorClass} ${isNew ? 'animate-flip-in' : ''}`}
          style={isNew ? { animationDelay: `${i * 150}ms` } : {}}
        ></div>
      ))}
    </div>
  );
}

export default function GuessHistory({ guesses, isHardMode = false }: GuessHistoryProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="w-full max-w-lg mt-6 space-y-2">
      <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wider text-center">Guess History</h3>
      {guesses.map((guess, idx) => {
        const isNew = idx === 0;

        return (
          <div 
            key={`${guess.id}-${guesses.length - idx}`} 
            className={`flex items-center justify-between p-3 rounded-lg border ${
              guess.isCorrect ? 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            } ${isNew ? 'animate-fade-in' : ''}`}
          >
            <div className="flex items-center space-x-3 w-[45%]">
              {guess.iso2 && (
                <img 
                  src={`https://flagcdn.com/w40/${guess.iso2.toLowerCase()}.png`} 
                  srcSet={`https://flagcdn.com/w80/${guess.iso2.toLowerCase()}.png 2x`}
                  width="28" 
                  alt={`${guess.name} flag`} 
                  className="rounded-sm border border-gray-300 dark:border-gray-600 shadow-sm"
                />
              )}
              <span className="font-bold truncate text-gray-900 dark:text-white" title={guess.name}>{guess.name}</span>
            </div>
            
            <div className="flex items-center justify-end space-x-2 w-[55%]">
              <span className={`text-gray-700 dark:text-gray-300 text-sm text-right font-mono ${isNew ? 'animate-fade-in' : ''}`} style={isNew ? { animationDelay: '800ms', animationFillMode: 'both' } : {}}>
                {guess.isCorrect ? '0 km' : `${Math.round(guess.distance).toLocaleString()}km`}
              </span>
              {!isHardMode && (
                <span className={`text-xl w-6 text-center ${isNew ? 'animate-fade-in' : ''}`} title="Direction" style={isNew ? { animationDelay: '900ms', animationFillMode: 'both' } : {}}>
                  {guess.direction}
                </span>
              )}
              <ProximitySquares proximity={guess.proximity} isNew={isNew} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
