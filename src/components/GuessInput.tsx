import React, { useState, useEffect, useRef } from 'react';

interface Country {
  id: string;
  name: string;
}

interface GuessInputProps {
  countries: Country[];
  onGuess: (countryId: string) => void;
  disabled: boolean;
}

export default function GuessInput({ countries, onGuess, disabled }: GuessInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Country[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 0) {
      const filtered = countries.filter(c => c.name.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (countryId: string, name: string) => {
    setQuery(name);
    setShowSuggestions(false);
    onGuess(countryId);
    setTimeout(() => setQuery(''), 100);
  };

  return (
    <div className="relative w-full max-w-lg mt-6" ref={wrapperRef}>
      <input
        type="text"
        disabled={disabled}
        value={query}
        onChange={handleChange}
        placeholder={disabled ? "Game Over" : "Guess a country..."}
        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((country) => (
            <li
              key={country.id}
              onClick={() => handleSelect(country.id, country.name)}
              className="p-3 cursor-pointer hover:bg-gray-600 border-b border-gray-600 last:border-0"
            >
              {country.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
