import pandas as pd
import json
import os

csv_path = '/home/carlos/PycharmProjects/emulator/data/gdl/projection_and_hist_data_climate_country_pop_weight_1950_2100(in).csv'
output_path = os.path.join(os.path.dirname(__file__), '../src/data/projections.json')

print("Reading CSV...")
# The CSV might have quotes wrapping the whole line, let's clean it while reading
with open(csv_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Parsing CSV lines...")
parsed_data = []
header = lines[0].replace('"', '').strip().split(',')
iso3_idx = header.index('iso3')
year_idx = header.index('year')
tm_idx = header.index('TM')
rr_idx = header.index('RR')
hw_idx = header.index('HW')

for line in lines[1:]:
    clean_line = line.replace('"', '').strip()
    if not clean_line:
        continue
    parts = clean_line.split(',')
    year = parts[year_idx]
    if year in ['2000', '2050']:
        parsed_data.append({
            'iso3': parts[iso3_idx],
            'year': year,
            'TM': float(parts[tm_idx]) if parts[tm_idx] and parts[tm_idx] != 'NA' else None,
            'RR': float(parts[rr_idx]) if parts[rr_idx] and parts[rr_idx] != 'NA' else None,
            'HW': float(parts[hw_idx]) if parts[hw_idx] and parts[hw_idx] != 'NA' else None,
        })

print(f"Filtered to {len(parsed_data)} rows for 2000/2050.")

df = pd.DataFrame(parsed_data)

print("Averaging across models/scenarios...")
# Group by ISO3 and Year, and average
grouped = df.groupby(['iso3', 'year']).mean().reset_index()

import math

# Restructure into a dictionary keyed by ISO3
result = {}
for _, row in grouped.iterrows():
    iso3 = row['iso3']
    year = row['year']
    
    if iso3 not in result:
        result[iso3] = {}
        
    result[iso3][f'TM_{year}'] = row['TM'] if not math.isnan(row['TM']) else None
    result[iso3][f'RR_{year}'] = row['RR'] if not math.isnan(row['RR']) else None
    result[iso3][f'HW_{year}'] = row['HW'] if not math.isnan(row['HW']) else None

# Only keep countries that have all 6 variables non-null
final_result = {}
for iso3, data in result.items():
    if len(data) == 6 and all(v is not None for v in data.values()):
        final_result[iso3] = data

print(f"Generated robust projections for {len(final_result)} countries.")

with open(output_path, 'w') as f:
    json.dump(final_result, f, indent=2)

print(f"Saved projections to {output_path}")
