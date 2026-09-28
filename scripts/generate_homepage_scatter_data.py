import pandas as pd
import numpy as np
import json
import re
import sys
import os

# Import get_body_type from generate_body_shape_data
sys.path.append(os.path.dirname(__file__))
from generate_body_shape_data import get_body_type

print("Loading engines.csv...")
df = pd.read_csv('engines.csv', low_memory=False)

# 1. Base generation production overlapping 1970-2024
df = df[(df['gen_year_end'].fillna(2024) >= 1970) & (df['gen_year_start'] <= 2024)].copy()

# 2. Reasonable physical bounds (as in generate_body_shape_data.py)
df = df[
    (df['length_mm'] >= 2500) & (df['length_mm'] <= 7000) &
    (df['width_mm'] >= 1200) & (df['width_mm'] <= 2500) &
    (df['height_mm'] >= 1000) & (df['height_mm'] <= 2500) &
    (df['wheelbase_mm'] >= 1500) & (df['wheelbase_mm'] <= 4500)
]

# 3. Classify body type
df['body_type'] = df.apply(get_body_type, axis=1)
valid = df[df['body_type'].notna()].copy()
raw_classified_count = len(valid)

# 4. Filter corrupted records:
# - length_mm must be > wheelbase_mm (car length cannot be <= wheelbase)
# - width_mm cannot be swapped with height_mm (remove width < 1400 where height > 1500)
valid_clean = valid[
    (valid['length_mm'] > valid['wheelbase_mm']) &
    ~((valid['width_mm'] < 1400) & (valid['height_mm'] > 1500))
].copy()

# 5. Filter for 1970-2024 generation introduction years
clean_70 = valid_clean[valid_clean['gen_year_start'] >= 1970].copy()
clean_70['decade'] = (clean_70['gen_year_start'] // 10 * 10).astype(str) + 's'

usable_record_count = len(clean_70)

decades = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']
decade_colors = {
    '1970s': {'hex': '#c26e38', 'name': 'Warm Cognac'},
    '1980s': {'hex': '#967444', 'name': 'Antique Brass'},
    '1990s': {'hex': '#1c3d2e', 'name': 'Racing Green'},
    '2000s': {'hex': '#742d33', 'name': 'Burgundy'},
    '2010s': {'hex': '#2c4c5e', 'name': 'Steel Blue'},
    '2020s': {'hex': '#475569', 'name': 'Slate Charcoal'}
}

decade_stats = {}
for dec in decades:
    sub = clean_70[clean_70['decade'] == dec]
    n_rec = len(sub)
    if n_rec > 0:
        med_l_mm = round(float(sub['length_mm'].median()), 1)
        med_w_mm = round(float(sub['width_mm'].median()), 1)
        med_l_in = round(med_l_mm / 25.4, 1)
        med_w_in = round(med_w_mm / 25.4, 1)
        decade_stats[dec] = {
            'records': n_rec,
            'median_length_mm': med_l_mm,
            'median_length_in': med_l_in,
            'median_width_mm': med_w_mm,
            'median_width_in': med_w_in,
            'color': decade_colors[dec]['hex']
        }

# Group unique vehicle models and dimensions
grouped = clean_70.groupby(['make', 'model', 'gen_year_start', 'length_mm', 'width_mm', 'body_type', 'decade']).size().reset_index(name='n_trims')

records_data = []
for _, r in grouped.iterrows():
    l_mm = round(float(r['length_mm']), 1)
    w_mm = round(float(r['width_mm']), 1)
    yr = int(r['gen_year_start'])
    dec_idx = decades.index(r['decade']) if r['decade'] in decades else 0
    make = str(r['make']).strip()
    model = str(r['model']).strip()
    bt = str(r['body_type']).strip()
    n_trims = int(r['n_trims'])
    records_data.append([l_mm, w_mm, yr, dec_idx, make, model, bt, n_trims])

metadata = {
    'total_classified_raw': raw_classified_count,
    'usable_records_count': usable_record_count,
    'unique_model_dimensions_count': len(records_data),
    'unique_generations_count': len(clean_70[['make', 'model', 'generation']].drop_duplicates()),
    'year_range': [int(clean_70['gen_year_start'].min()), int(clean_70['gen_year_start'].max())],
    'length_range_mm': [round(float(clean_70['length_mm'].min()), 1), round(float(clean_70['length_mm'].max()), 1)],
    'length_range_in': [round(float(clean_70['length_mm'].min()) / 25.4, 1), round(float(clean_70['length_mm'].max()) / 25.4, 1)],
    'width_range_mm': [round(float(clean_70['width_mm'].min()), 1), round(float(clean_70['width_mm'].max()), 1)],
    'width_range_in': [round(float(clean_70['width_mm'].min()) / 25.4, 1), round(float(clean_70['width_mm'].max()) / 25.4, 1)],
    'decades': decades,
    'decade_colors': decade_colors,
    'decade_stats': decade_stats
}

js_content = f"""// Body Dimension Scatter Data & Metadata
// Generated from real classified automotive database (engines.csv)
// Usable classified records (1970-2024): {usable_record_count} across {len(records_data)} distinct model dimensions.
window.SHAPE_SCATTER_METADATA = {json.dumps(metadata, indent=2)};

// Columns: [0: length_mm, 1: width_mm, 2: year, 3: decade_idx (0=1970s..5=2020s), 4: make, 5: model, 6: body_type, 7: trim_records_count]
window.SHAPE_SCATTER_DATA = {json.dumps(records_data)};
"""

output_path = 'data/shape_scatter_data.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully generated {output_path} ({os.path.getsize(output_path)} bytes).")
print(f"Usable records: {usable_record_count}, Unique model-dimension points: {len(records_data)}")
