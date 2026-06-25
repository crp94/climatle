import React from 'react';
import { GuessResult } from './GuessHistory';
import MapReveal from './MapReveal';

interface GameOverModalProps {
  targetCountry: any;
  guesses: GuessResult[];
  onShare: () => void;
  onPlayAgain: () => void;
}

export default function GameOverModal({ targetCountry, guesses, onShare, onPlayAgain }: GameOverModalProps) {
  const didWin = guesses[0]?.isCorrect;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl max-w-sm w-full p-8 relative shadow-2xl flex flex-col items-center animate-flip-in">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {didWin ? '🎉 You got it!' : '❌ Game Over!'}
        </h2>
        
        <MapReveal targetCountry={targetCountry} guesses={guesses} />
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
          The country was <br />
          <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-2xl tracking-wide">{targetCountry.name}</span>
        </p>
        
        <div className="flex flex-col space-y-3 w-full">
          <button 
            onClick={onShare}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 text-lg shadow-lg"
          >
            <span>📤 Share Result</span>
          </button>
          
          <button 
            onClick={onPlayAgain}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-4 rounded-xl transition-colors text-lg shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
