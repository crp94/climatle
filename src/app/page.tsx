"use client";

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatsDashboard from '../components/StatsDashboard';
import GuessInput from '../components/GuessInput';
import GuessHistory, { GuessResult } from '../components/GuessHistory';
import GameOverModal from '../components/GameOverModal';
import StatsModal, { GameStats } from '../components/StatsModal';
import SettingsModal from '../components/SettingsModal';
import countriesData from '../data/countries.json';
import { getDistance, getBearing, getProximity } from '../utils/math';

const DEFAULT_STATS: GameStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0
};

export default function Home() {
  const [targetCountry, setTargetCountry] = useState<any>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [showSources, setShowSources] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isHardMode, setIsHardMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('climatle_stats');
    if (savedStats) setStats(JSON.parse(savedStats));

    const savedDarkMode = localStorage.getItem('climatle_dark_mode');
    if (savedDarkMode !== null) setIsDarkMode(JSON.parse(savedDarkMode));

    const savedHardMode = localStorage.getItem('climatle_hard_mode');
    if (savedHardMode !== null) setIsHardMode(JSON.parse(savedHardMode));

    const savedState = localStorage.getItem('climatle_state');
    
    // Check for target in URL (Challenge Mode)
    const urlParams = new URLSearchParams(window.location.search);
    const challengeTarget = urlParams.get('target');

    if (challengeTarget) {
      const target = countriesData.find(c => c.id === challengeTarget.toUpperCase());
      if (target) {
        setTargetCountry(target);
        setGuesses([]);
        setIsGameOver(false);
        setIsLoaded(true);
        return;
      }
    }

    if (savedState) {
      const parsed = JSON.parse(savedState);
      setTargetCountry(parsed.targetCountry);
      setGuesses(parsed.guesses);
      setIsGameOver(parsed.isGameOver);
    } else {
      startNewGame(false); // Don't save stats yet
    }
    setIsLoaded(true);
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (isLoaded && targetCountry) {
      localStorage.setItem('climatle_state', JSON.stringify({
        targetCountry,
        guesses,
        isGameOver
      }));
    }
  }, [targetCountry, guesses, isGameOver, isLoaded]);

  // Save stats whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('climatle_stats', JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  // Save settings whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('climatle_dark_mode', JSON.stringify(isDarkMode));
      localStorage.setItem('climatle_hard_mode', JSON.stringify(isHardMode));
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, isHardMode, isLoaded]);

  const startNewGame = (trackLossIfActive: boolean = true) => {
    // If user is abandoning an active game, count as loss
    if (trackLossIfActive && !isGameOver && guesses.length > 0) {
       updateStats(false);
    }

    // Clear URL params if any
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const index = Math.floor(Math.random() * countriesData.length);
    setTargetCountry(countriesData[index]);
    setGuesses([]);
    setIsGameOver(false);
  };

  const updateStats = (won: boolean) => {
    setStats(prev => {
      const newStreak = won ? prev.currentStreak + 1 : 0;
      return {
        played: prev.played + 1,
        won: prev.won + (won ? 1 : 0),
        currentStreak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak)
      };
    });
  };

  const handleGuess = (countryId: string) => {
    if (isGameOver || !targetCountry) return;

    const guessedCountry = countriesData.find((c) => c.id === countryId);
    if (!guessedCountry) return;

    if (guesses.find((g) => g.id === countryId)) return;

    const isCorrect = guessedCountry.id === targetCountry.id;
    const distance = getDistance(guessedCountry.lat, guessedCountry.lng, targetCountry.lat, targetCountry.lng);
    const direction = isCorrect ? '✅' : getBearing(guessedCountry.lat, guessedCountry.lng, targetCountry.lat, targetCountry.lng);
    const proximity = getProximity(distance);

    const newGuess: GuessResult = {
      id: guessedCountry.id,
      iso2: guessedCountry.iso2,
      name: guessedCountry.name,
      distance,
      direction,
      proximity,
      isCorrect
    };

    const newGuesses = [newGuess, ...guesses];
    setGuesses(newGuesses);

    const maxGuesses = isHardMode ? 4 : 6;

    if (isCorrect) {
      setIsGameOver(true);
      updateStats(true);
    } else if (newGuesses.length >= maxGuesses) { 
      setIsGameOver(true);
      updateStats(false);
    }
  };

  const handleShare = async () => {
    const totalGuesses = guesses.length;
    const maxGuesses = isHardMode ? 4 : 6;
    const didWin = guesses[0]?.isCorrect;
    const scoreText = didWin ? `${totalGuesses}/${maxGuesses}` : `X/${maxGuesses}`;
    const modeStar = isHardMode ? '*' : '';
    
    // Construct the challenge URL
    const url = new URL(window.location.href);
    url.searchParams.set('target', targetCountry.id);
    const shareUrl = url.toString();

    let text = `Climatle - ${scoreText}${modeStar}\n🌍 ${shareUrl}\n\n`;
    
    const chronological = [...guesses].reverse();
    
    for (const g of chronological) {
      let line = '';
      for (let i = 0; i < 5; i++) {
        const threshold = (i + 1) * 20;
        const prevThreshold = i * 20;
        if (g.proximity >= threshold) {
          line += '🟩';
        } else if (g.proximity > prevThreshold) {
          line += '🟨';
        } else {
          line += '⬛';
        }
      }
      if (!isHardMode) {
        line += ` ${g.direction}`;
      }
      text += line + '\n';
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Climatle Challenge',
          text: text
        });
      } catch (err) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  if (!isLoaded || !targetCountry) return <div className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 transition-colors">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center pb-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-sans relative transition-colors">
      <Header 
        onHelpClick={() => alert(`Guess the country from its 24 climate stats! You have ${isHardMode ? '4' : '6'} tries. The hints will guide you with distance${!isHardMode ? ' and direction' : ''}.`)} 
        onSourcesClick={() => setShowSources(true)} 
        onStatsClick={() => setShowStats(true)}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      {showSources && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl max-w-lg w-full p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowSources(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">About & Sources</h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm">
              <p>
                Climatle is built using accurate, thoroughly validated climate and energy data to raise awareness.
              </p>
              <div>
                <strong className="text-gray-900 dark:text-white block mb-1">Data Density Notice</strong>
                <p>
                  To provide a uniform and rich experience, we extract exactly 24 dense variables. 
                  Any country (mostly micro-states) missing even a single data point has been strictly excluded from the game.
                </p>
              </div>
              <div className="pt-2">
                <strong className="text-gray-900 dark:text-white block mb-1">Our World in Data (OWID)</strong>
                <p>Provides robust per-capita and baseline climate variables from rigorous CO₂ and Energy datasets.</p>
                <div className="mt-2 flex space-x-4">
                  <a href="https://github.com/owid/co2-data" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">CO₂ Dataset</a>
                  <a href="https://github.com/owid/energy-data" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">Energy Dataset</a>
                </div>
              </div>
              <div className="pt-2">
                <strong className="text-gray-900 dark:text-white block mb-1">Global Data Lab (GDL) Projections</strong>
                <p>Provides 6 distinct projections (2000 vs 2050) for extreme weather like Heatwaves and Precipitation.</p>
                <p className="mt-1 text-gray-500 dark:text-gray-400 italic">
                  Data represents a robust ensemble average across all available CMIP6 climate models (e.g., CAN-ESM5, CNRM-CM6) and all major SSP scenarios (SSP1-2.6 through SSP5-8.5).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStats && (
        <StatsModal stats={stats} onClose={() => setShowStats(false)} />
      )}

      {showSettings && (
        <SettingsModal 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          isHardMode={isHardMode} 
          setIsHardMode={setIsHardMode} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      <div className="mt-4 w-full flex justify-center">
        <StatsDashboard stats={targetCountry.stats} />
      </div>

      <GuessInput 
        countries={countriesData.map((c: any) => ({ id: c.id, name: c.name }))} 
        onGuess={handleGuess} 
        disabled={isGameOver} 
      />

      <GuessHistory guesses={guesses} isHardMode={isHardMode} />

      {isGameOver && (
        <GameOverModal 
          targetCountry={targetCountry} 
          guesses={guesses} 
          onShare={handleShare} 
          onPlayAgain={() => startNewGame(false)} 
        />
      )}
    </main>
  );
}
