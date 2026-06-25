/**
 * fixData.js
 * 1. Removes countries with bad/zero GDL projection data
 * 2. Converts Spanish-locale number formatting to en-US
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../src/data/countries.json');

// Countries confirmed to have all-zero OR implausible projection values
const EXCLUDE_IDS = new Set([
  // All-zero projections (TM, RR, HW all = 0 — missing GDL model data)
  'ATG', // Antigua and Barbuda
  'BRB', // Barbados
  'COK', // Cook Islands
  'COM', // Comoros
  'CPV', // Cape Verde
  'DMA', // Dominica
  'GRD', // Grenada
  'KIR', // Kiribati
  'KNA', // Saint Kitts and Nevis
  'LCA', // Saint Lucia
  'MDV', // Maldives
  'MLT', // Malta
  'SHN', // Saint Helena, Ascension and Tristan da Cunha
  'STP', // Sao Tome and Principe
  'SYC', // Seychelles
  'TCA', // Turks and Caicos Islands
  'TON', // Tonga
  'VCT', // Saint Vincent and the Grenadines
  'VGB', // Virgin Islands, British
  'WSM', // Samoa
  // Implausible projections (TM_2050 < TM_2000, temperatures too low for geography)
  'ABW', // Aruba (shows 3.8°C → 0.4°C; should be ~29°C Caribbean)
  'BHR', // Bahrain (shows 2.2°C → 0.6°C; should be ~27°C Persian Gulf)
  'BHS', // Bahamas (shows 9.8°C → 3.6°C; should be ~25°C subtropical)
]);

/**
 * Parses a Spanish-locale numeric string (e.g. "1.234,56") to a JS float.
 * Spanish format: period = thousands separator, comma = decimal separator.
 */
function parseSpanishNumber(str) {
  // Remove thousands-separator periods, then replace decimal comma with period
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

/**
 * Infers the number of decimal places from a Spanish-locale number string.
 * e.g. "1,59" → 2, "76.800" → 0, "41,27" → 2
 */
function inferDecimals(numStr) {
  const commaIdx = numStr.lastIndexOf(',');
  if (commaIdx === -1) return 0; // no decimal part
  return numStr.length - commaIdx - 1;
}

/**
 * Converts a Spanish-formatted stat value string to en-US formatting.
 * e.g. "1,59 t" → "1.59 t"
 *      "76.800 kWh" → "76,800 kWh"
 *      "25.746 kWh" → "25,746 kWh"
 *      "0 kWh" → "0 kWh"  (unchanged)
 */
function convertValue(displayValue) {
  // Suffixes we use (order matters: longer first to avoid partial matches)
  const suffixes = [' days', ' kWh', '°C', 'mm', ' t', '%'];
  
  let suffix = '';
  let numStr = displayValue;

  for (const s of suffixes) {
    if (displayValue.endsWith(s)) {
      suffix = s;
      numStr = displayValue.slice(0, -s.length).trim();
      break;
    }
  }

  if (!numStr || numStr === '') return displayValue;

  const decimals = inferDecimals(numStr);
  const parsed = parseSpanishNumber(numStr);

  if (isNaN(parsed)) return displayValue; // leave unchanged if unparseable

  const formatted = parsed.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return formatted + suffix;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log('Reading countries.json...');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
console.log(`Loaded ${data.length} countries.`);

// 1. Filter out bad countries
const filtered = data.filter(c => !EXCLUDE_IDS.has(c.id));
console.log(`Removed ${data.length - filtered.length} countries. ${filtered.length} remaining.`);

// 2. Fix number formatting
let fixedCount = 0;
filtered.forEach(c => {
  c.stats.forEach(s => {
    const fixed = convertValue(s.value);
    if (fixed !== s.value) {
      s.value = fixed;
      fixedCount++;
    }
  });
});
console.log(`Fixed ${fixedCount} number formats.`);

// 3. Write output
fs.writeFileSync(DATA_PATH, JSON.stringify(filtered, null, 2));
console.log(`Saved updated countries.json with ${filtered.length} countries.`);
