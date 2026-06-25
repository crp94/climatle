import React from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';
import { geoRobinson } from 'd3-geo-projection';
import { GuessResult } from './GuessHistory';
import countriesData from '../data/countries.json';

interface MapRevealProps {
  targetCountry: {
    lat: number;
    lng: number;
    name: string;
    iso2: string;
  };
  guesses: GuessResult[];
}

const geoUrl = '/features.json';

// Create a custom projection using d3-geo-projection
const projection = geoRobinson()
  .scale(130)
  .translate([400, 250]); // Standard SVG dimensions for ComposableMap is 800x600

export default function MapReveal({ targetCountry, guesses }: MapRevealProps) {
  // We want to draw a line connecting guesses in chronological order, ending at the target
  const chronologicalGuesses = [...guesses].reverse();
  
  // Convert guesses to coordinates
  const coordinatesList = chronologicalGuesses.map(g => {
    const cData = countriesData.find(c => c.id === g.id);
    return cData ? [cData.lng, cData.lat] : null;
  }).filter(Boolean) as [number, number][];

  // Add the target country as the final destination if it wasn't the last guess
  const lastGuess = chronologicalGuesses[chronologicalGuesses.length - 1];
  if (lastGuess && !lastGuess.isCorrect) {
    coordinatesList.push([targetCountry.lng, targetCountry.lat]);
  }

  return (
    <div className="w-full h-64 sm:h-80 bg-[#e0f2fe] dark:bg-gray-800 rounded-xl overflow-hidden shadow-inner border border-blue-200 dark:border-gray-600 mb-6 relative">
      <ComposableMap 
        projection={projection}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#d1d5db"
                className="dark:fill-gray-700 outline-none hover:outline-none"
                stroke="#f9fafb"
                strokeWidth={0.5}
              />
            ))
          }
        </Geographies>

        {/* Draw Trajectory Lines */}
        {coordinatesList.length > 1 && (
          <Line
            coordinates={coordinatesList}
            stroke="#ef4444" // red-500
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 4"
            className="opacity-70 animate-fade-in"
          />
        )}

        {/* Draw Markers for Guesses */}
        {coordinatesList.slice(0, -1).map((coord, i) => (
          <Marker key={i} coordinates={coord}>
            <circle r={3} fill="#ef4444" />
          </Marker>
        ))}

        {/* Target Country Marker */}
        <Marker coordinates={[targetCountry.lng, targetCountry.lat]}>
          <circle r={8} fill="#10b981" stroke="#fff" strokeWidth={2} className="animate-ping" style={{ animationDuration: '2s' }} />
          <circle r={5} fill="#10b981" />
        </Marker>
      </ComposableMap>
    </div>
  );
}
