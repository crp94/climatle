const fs = require('fs');
const readline = require('readline');

const filePath = '/home/carlos/PycharmProjects/emulator/data/gdl/projection_and_hist_data_climate_country_pop_weight_1950_2100(in).csv';

const rl = readline.createInterface({
  input: fs.createReadStream(filePath),
  crlfDelay: Infinity
});

let header = null;
let usa2020Models = new Set();
let usa2050Models = new Set();
let count = 0;

rl.on('line', (line) => {
  // Remove all quotes
  const cleanLine = line.replace(/"/g, '');
  const parts = cleanLine.split(',');

  if (!header) {
    header = parts;
    return;
  }

  const year = parts[0];
  const iso3 = parts[1];
  const ssp = parts[2];
  const model = parts[3];

  if (iso3 === 'USA') {
    if (year === '2020') {
      usa2020Models.add(`${ssp}_${model}`);
      if (count < 5) {
        console.log(`2020 USA -> SSP: ${ssp}, Model: ${model}, HW: ${parts[9]}, RR: ${parts[5]}, TM: ${parts[6]}`);
        count++;
      }
    }
    if (year === '2050') {
      usa2050Models.add(`${ssp}_${model}`);
    }
  }
});

rl.on('close', () => {
  console.log('2020 Scenarios/Models:', Array.from(usa2020Models).slice(0, 10));
  console.log('2050 Scenarios/Models:', Array.from(usa2050Models).slice(0, 10));
});
