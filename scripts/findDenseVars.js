const https = require('https');
const { parse } = require('csv-parse');

const co2_url = 'https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv';
const energy_url = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';

const coverage = {};
let totalCountries = 0;

function fetchAndParse(url, callback) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      res.pipe(parse({ columns: true, skip_empty_lines: true }))
        .on('data', (row) => {
          if (row.year === '2021' && row.iso_code && row.iso_code.length === 3) {
            callback(row);
          }
        })
        .on('end', resolve);
    });
  });
}

async function run() {
  const countries = new Set();
  
  await fetchAndParse(co2_url, (row) => {
    countries.add(row.iso_code);
    for (const key in row) {
      if (row[key] && row[key].trim() !== '') {
        coverage[key] = (coverage[key] || 0) + 1;
      }
    }
  });

  await fetchAndParse(energy_url, (row) => {
    countries.add(row.iso_code);
    for (const key in row) {
      if (row[key] && row[key].trim() !== '') {
        coverage[key] = (coverage[key] || 0) + 1;
      }
    }
  });

  totalCountries = countries.size;
  console.log(`Total countries with ISO in 2021: ${totalCountries}`);
  
  const sorted = Object.entries(coverage).sort((a, b) => b[1] - a[1]);
  console.log('Top per-capita or ratio variables by coverage:');
  sorted.forEach(([k, v]) => {
    if (k.includes('per_capita') || k.includes('share') || k.includes('temperature') || k.includes('per_unit') || k.includes('per_gdp')) {
      console.log(`${k}: ${v} (${Math.round((v/totalCountries)*100)}%)`);
    }
  });
}

run();
