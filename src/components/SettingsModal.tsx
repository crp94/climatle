import React from 'react';

interface SettingsModalProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isHardMode: boolean;
  setIsHardMode: (val: boolean) => void;
  onClose: () => void;
}

export default function SettingsModal({
  isDarkMode, setIsDarkMode,
  isHardMode, setIsHardMode,
  onClose
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl max-w-sm w-full p-6 relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-6 text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-widest">Settings</h2>
        
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Dark Theme</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light appearance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Hard Mode</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Only 4 guesses. No direction hints.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isHardMode} onChange={(e) => setIsHardMode(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
