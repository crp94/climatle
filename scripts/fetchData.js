const https = require('https');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const OUTPUT_PATH = path.join(__dirname, '../src/data/countries.json');
const PROJECTIONS_PATH = path.join(__dirname, '../src/data/projections.json');

const URLS = {
  coords: 'https://raw.githubusercontent.com/eesur/country-codes-lat-long/master/country-codes-lat-long-alpha3.json',
  owid_co2: 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv',
  owid_energy: 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv'
};

// Original 24 per-capita / ratio / physical variables
const OWID_VARS = [
  'co2_per_capita',
  'ghg_per_capita',
  'methane_per_capita',
  'nitrous_oxide_per_capita',
  'flaring_co2_per_capita',
  'oil_co2_per_capita',
  'cement_co2_per_capita',
  'energy_per_capita',
  'per_capita_electricity',
  'renewables_elec_per_capita',
  'solar_elec_per_capita',
  'wind_elec_per_capita',
  'hydro_elec_per_capita',
  'nuclear_elec_per_capita',
  'share_global_co2',
  'share_of_temperature_change_from_ghg',
  'fossil_share_elec',
  'renewables_share_elec'
];

// 6 New Projection Variables
const PROJ_VARS = [
  'TM_2000',
  'TM_2050',
  'RR_2000',
  'RR_2050',
  'HW_2000',
  'HW_2050'
];

const ALL_VARS = [...OWID_VARS, ...PROJ_VARS];

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function fetchCsvAndExtract(url, isoCol, yearCol, colsToExtract) {
  return new Promise((resolve, reject) => {
    const results = {};
    https.get(url, (res) => {
      res.pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          const iso = row[isoCol];
          if (!iso || iso.length !== 3) return; 
          const year = parseInt(row[yearCol], 10);
          
          if (!results[iso]) results[iso] = { _latestYear: {} };

          for (const col of colsToExtract) {
            const val = row[col];
            if (val && val.trim() !== '' && val.trim().toUpperCase() !== 'NA') {
              const currentLatest = results[iso]._latestYear[col] || 0;
              if (year > currentLatest) {
                results[iso][col] = parseFloat(val);
                results[iso]._latestYear[col] = year;
              }
            }
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    }).on('error', reject);
  });
}

function computePercentiles(countriesList, colName) {
  const values = [];
  countriesList.forEach(c => {
    if (c.raw[colName] !== undefined && !isNaN(c.raw[colName])) {
      values.push(c.raw[colName]);
    }
  });

  values.sort((a, b) => a - b);
  
  countriesList.forEach(c => {
    if (c.raw[colName] !== undefined && !isNaN(c.raw[colName])) {
      const val = c.raw[colName];
      const index = values.indexOf(val);
      let pct = 0;
      if (values.length > 1) {
         pct = (index / (values.length - 1)) * 100;
      }
      c.percentiles[colName] = Math.round(pct);
    }
  });
}

async function run() {
  console.log('Fetching coordinate data...');
  const coordsData = await fetchJson(URLS.coords);
  const baseCountries = coordsData.ref_country_codes;

  console.log('Fetching OWID CO2 data...');
  const co2Data = await fetchCsvAndExtract(URLS.owid_co2, 'iso_code', 'year', OWID_VARS);
  
  console.log('Fetching OWID Energy data...');
  const energyData = await fetchCsvAndExtract(URLS.owid_energy, 'iso_code', 'year', OWID_VARS);

  console.log('Loading local Python projections...');
  const projData = JSON.parse(fs.readFileSync(PROJECTIONS_PATH, 'utf-8'));

  console.log('Merging and strictly filtering datasets...');
  const extractedList = [];

  for (const c of baseCountries) {
    const iso3 = c.alpha3;
    const iso2 = c.alpha2;
    const lat = parseFloat(c.latitude);
    const lng = parseFloat(c.longitude);

    if (!iso3 || !iso2 || isNaN(lat) || isNaN(lng)) continue;

    const dataCo2 = co2Data[iso3] || {};
    const dataEnergy = energyData[iso3] || {};
    const dataProj = projData[iso3] || {};

    const raw = {};
    const years = {};
    let missingAny = false;
    for (const col of ALL_VARS) {
      if (PROJ_VARS.includes(col)) {
        if (dataProj[col] !== undefined && !isNaN(dataProj[col])) {
          raw[col] = dataProj[col];
          years[col] = col.includes('2050') ? 2050 : 2000;
        } else {
          missingAny = true;
          break;
        }
      } else {
        // OWID vars
        if (dataEnergy[col] !== undefined) {
          raw[col] = dataEnergy[col];
          years[col] = dataEnergy._latestYear[col];
        } else if (dataCo2[col] !== undefined) {
          raw[col] = dataCo2[col];
          years[col] = dataCo2._latestYear[col];
        } else {
          missingAny = true;
          break;
        }
      }
    }

    if (missingAny) continue;

    extractedList.push({
      id: iso3,
      iso2: iso2,
      name: c.country,
      lat,
      lng,
      raw,
      years,
      percentiles: {}
    });
  }

  console.log('Computing percentiles...');
  for (const col of ALL_VARS) {
    computePercentiles(extractedList, col);
  }

  const VAR_CONFIGS = {
    // Original 18 OWID Vars
    co2_per_capita: { label: 'CO₂ per capita', fullLabel: 'CO₂ emissions per capita', suffix: ' t', decimals: 2, emoji: '🧑‍🏭', invert: false },
    ghg_per_capita: { label: 'GHG per capita', fullLabel: 'Greenhouse gas emissions per capita', suffix: ' t', decimals: 2, emoji: '☁️', invert: false },
    methane_per_capita: { label: 'CH₄ per capita', fullLabel: 'Methane emissions per capita', suffix: ' t', decimals: 3, emoji: '🐄', invert: false },
    nitrous_oxide_per_capita: { label: 'N₂O per capita', fullLabel: 'Nitrous oxide emissions per capita', suffix: ' t', decimals: 3, emoji: '🌬️', invert: false },
    flaring_co2_per_capita: { label: 'Flaring per capita', fullLabel: 'Flaring CO₂ emissions per capita', suffix: ' t', decimals: 3, emoji: '🕯️', invert: false },
    oil_co2_per_capita: { label: 'Oil CO₂ per capita', fullLabel: 'Oil CO₂ emissions per capita', suffix: ' t', decimals: 2, emoji: '🚗', invert: false },
    cement_co2_per_capita: { label: 'Cement per capita', fullLabel: 'Cement CO₂ emissions per capita', suffix: ' t', decimals: 3, emoji: '🧱', invert: false },
    energy_per_capita: { label: 'Energy per capita', fullLabel: 'Primary energy consumption per capita', suffix: ' kWh', decimals: 0, emoji: '🔌', invert: false },
    per_capita_electricity: { label: 'Elec per capita', fullLabel: 'Electricity generation per capita', suffix: ' kWh', decimals: 0, emoji: '⚡', invert: false },
    renewables_elec_per_capita: { label: 'Renew Elec per capita', fullLabel: 'Renewable electricity per capita', suffix: ' kWh', decimals: 0, emoji: '🍃', invert: true },
    solar_elec_per_capita: { label: 'Solar Elec per capita', fullLabel: 'Solar electricity per capita', suffix: ' kWh', decimals: 0, emoji: '☀️', invert: true },
    wind_elec_per_capita: { label: 'Wind Elec per capita', fullLabel: 'Wind electricity per capita', suffix: ' kWh', decimals: 0, emoji: '💨', invert: true },
    hydro_elec_per_capita: { label: 'Hydro Elec per capita', fullLabel: 'Hydropower electricity per capita', suffix: ' kWh', decimals: 0, emoji: '💧', invert: true },
    nuclear_elec_per_capita: { label: 'Nuclear Elec per capita', fullLabel: 'Nuclear electricity per capita', suffix: ' kWh', decimals: 0, emoji: '☢️', invert: true },
    share_global_co2: { label: 'Global CO₂ Share', fullLabel: 'Share of global CO₂ emissions', suffix: '%', decimals: 2, emoji: '🌍', invert: false },
    share_of_temperature_change_from_ghg: { label: 'Temp Impact Share', fullLabel: 'Share of global temperature change from GHG', suffix: '%', decimals: 2, emoji: '🌡️', invert: false },
    fossil_share_elec: { label: 'Fossil Share Elec', fullLabel: 'Fossil fuel share of electricity', suffix: '%', decimals: 1, emoji: '📉', invert: false },
    renewables_share_elec: { label: 'Renew Share Elec', fullLabel: 'Renewables share of electricity', suffix: '%', decimals: 1, emoji: '📈', invert: true },
    
    // New 6 Projections
    TM_2000: { label: 'Mean Temp in 2000', fullLabel: 'Mean Temperature in 2000', suffix: '°C', decimals: 1, emoji: '🌡️', invert: false },
    TM_2050: { label: 'Mean Temp in 2050', fullLabel: 'Projected Mean Temperature in 2050', suffix: '°C', decimals: 1, emoji: '🌡️', invert: false },
    RR_2000: { label: 'Precip in 2000', fullLabel: 'Total Precipitation in 2000', suffix: 'mm', decimals: 0, emoji: '🌧️', invert: true },
    RR_2050: { label: 'Precip in 2050', fullLabel: 'Projected Total Precipitation in 2050', suffix: 'mm', decimals: 0, emoji: '🌧️', invert: true },
    HW_2000: { label: 'Heatwaves in 2000', fullLabel: 'Heatwave days in 2000', suffix: ' days', decimals: 1, emoji: '🥵', invert: false },
    HW_2050: { label: 'Heatwaves in 2050', fullLabel: 'Projected heatwave days in 2050', suffix: ' days', decimals: 1, emoji: '🥵', invert: false }
  };

  const finalJson = extractedList.map(c => {
    const formattedStats = [];

    for (const col of ALL_VARS) {
      const config = VAR_CONFIGS[col];
      
      let pct = c.percentiles[col];
      if (config.invert) {
        pct = 100 - pct;
      }
      const hue = 120 - (pct * 1.2);
      const color = `hsl(${Math.max(0, Math.min(120, hue))}, 80%, 55%)`;

      const isOwid = OWID_VARS.includes(col);
      const displayLabel = isOwid ? `${config.label} (${c.years[col]})` : config.label;
      const displayFullLabel = isOwid ? `${config.fullLabel} in ${c.years[col]}` : config.fullLabel;

      formattedStats.push({
        id: col,
        label: displayLabel,
        fullLabel: displayFullLabel,
        emoji: config.emoji,
        value: c.raw[col].toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: config.decimals }) + config.suffix,
        percentile: c.percentiles[col],
        color: color
      });
    }

    return {
      id: c.id,
      iso2: c.iso2,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      stats: formattedStats
    };
  });

  console.log(`Successfully generated data for ${finalJson.length} strictly dense countries (30 vars).`);
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalJson, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);
}

run().catch(console.error);
