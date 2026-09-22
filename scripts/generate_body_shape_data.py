import pandas as pd
import numpy as np
import json
import re

# Load dataset
df = pd.read_csv('engines.csv', low_memory=False)
df = df[(df['gen_year_start'] >= 1970) & (df['gen_year_start'] <= 2024)].copy()

# Dimension filters for valid physical production vehicles
df = df[
    (df['length_mm'] >= 2500) & (df['length_mm'] <= 7000) &
    (df['width_mm'] >= 1200) & (df['width_mm'] <= 2500) &
    (df['height_mm'] >= 1000) & (df['height_mm'] <= 2500) &
    (df['wheelbase_mm'] >= 1500) & (df['wheelbase_mm'] <= 4500)
]

def get_body_type(row):
    m = str(row['model']).strip()
    g = str(row['generation']).strip()
    make = str(row['make']).strip()
    full = f'{make} {m} {g}'.lower()
    
    # 1. Pickup
    if re.search(r'\b(pickup|pick-up|truck|regular cab|crew cab|supercab|double cab)\b', full):
        return 'Pickup'
    if m.lower() in ['f-150', 'silverado', 'ram 1500', 'hilux', 'ranger', 'tacoma', 'navara', 'l200', 'amarok', 'tundra', 'sierra', 'colorado', 'frontier', 'titan']:
        return 'Pickup'
        
    # 2. Convertible
    if re.search(r'\b(convertible|cabriolet|cabrio|roadster|spider|spyder|speedster|targa|drophead|volante)\b', full):
        return 'Convertible'
        
    # 3. Coupe
    if re.search(r'\b(coupe|coupé)\b', full):
        return 'Coupe'
    if m in ['911', 'Corvette', 'Camaro', 'Mustang', 'Challenger', 'Viper', 'GT-R', '350Z', '370Z', 'Supra', 'Celica', 'Prelude', 'TT', 'R8', 'F-Type', 'SLK', 'SL', 'Z4', 'Z3', 'Brera', 'GTV', 'Calibra']:
        return 'Coupe'
        
    # 4. Wagon
    if re.search(r'\b(wagon|estate|touring|avant|kombi|variant|break|turnier|t-modell|weekend|allroad|sportwagon|sportcombi|shooting brake)\b', full) or re.search(r'\bsw\b', full):
        return 'Wagon'
    if m.startswith('V') and len(m) == 3 and m[1:].isdigit():
        return 'Wagon'
        
    # 5. SUV / Crossover
    if re.search(r'\b(suv|crossover|cuv|all-terrain|crosstrek)\b', full):
        return 'SUV'
    if any(k in full for k in ['land cruiser', 'patrol', 'pajero', 'range rover', 'discovery', 'explorer', 'tahoe', 'suburban', 'rav4', 'cr-v', 'forester', 'outback', 'cherokee', 'wrangler', 'grand cherokee', 'touareg', 'tiguan', 'cayenne', 'macan', 'escalade', 'navigator', 'santa fe', 'sportage', 'tucson', 'sorento', 'kuga', 'qashqai', 'duster', 'yeti', 'countryman']):
        return 'SUV'
    if re.search(r'\b(q2|q3|q4|q5|q7|q8|x1|x2|x3|x4|x5|x6|x7|gle|glc|gls|gla|glb|glk|ml-class|g-class|cross)\b', full):
        return 'SUV'
    if m.startswith('XC') and len(m) == 4 and m[2:].isdigit():
        return 'SUV'
        
    # 6. Van / Minivan
    if re.search(r'\b(van|mpv|minivan|transporter|caravelle|multivan|tourneo|transit|vito|sprinter|sharan|espace|scenic|zafira|carnival|sedona|sienna|odyssey|voyager|caravan|altea|b-klasse|mercedes benz b-klasse)\b', full):
        return 'Van'

    # 7. Hatchback
    if re.search(r'\b(hatchback|hatch|liftback|fastback|sportback)\b', full) or '3 doors' in full or '5 doors' in full or '3-door' in full or '5-door' in full:
        return 'Hatchback'
    if m in ['Golf', 'Polo', 'Clio', 'Fiesta', 'Focus', 'Corsa', 'Astra', 'Yaris', '206', '207', '208', '307', '308', 'Ibiza', 'Leon', 'Fabia', 'Civic', 'i20', 'i30', 'Megane', 'A-Klasse', 'MERCEDES BENZ A-Klasse', '1 Series', 'A3', 'Mini']:
        return 'Hatchback'

    # 8. Sedan
    if re.search(r'\b(sedan|saloon|limousine|berlina|berline|notchback)\b', full):
        return 'Sedan'
    if m in ['A4', 'A6', 'A8', '7 Series', '5 Series', 'MERCEDES BENZ C-Klasse and predecessors', 'MERCEDES BENZ E-Klasse and predecessors', 'MERCEDES BENZ S-Klasse and predecessors', 'Passat', 'Superb', 'Octavia', 'Accord', 'Camry', 'Altima', 'Maxima', 'Legacy', 'Sonata', 'Insignia', 'Mondeo', 'Avensis', 'Laguna', 'S40', 'S60', 'S80', 'S90', 'Jetta / Vento / Bora']:
        return 'Sedan'

    return None

df['body_type'] = df.apply(get_body_type, axis=1)
valid = df[df['body_type'].notna()].copy()
valid['decade'] = (valid['gen_year_start'] // 10 * 10).astype(str) + 's'

body_categories = ['Sedan', 'Coupe', 'SUV', 'Wagon', 'Hatchback', 'Convertible', 'Pickup', 'Van']

# Category metadata
category_meta = {
    'Sedan': {'label': 'Sedan', 'hex': '#38bdf8', 'desc': 'Three-box notchback architecture with separated trunk, cabin, and engine compartments.'},
    'Coupe': {'label': 'Coupe', 'hex': '#8b5cf6', 'desc': 'Low-slung two-door sports silhouette characterized by a steeply raked roofline and sleek stance.'},
    'SUV': {'label': 'SUV / Crossover', 'hex': '#f59e0b', 'desc': 'High-riding, tall-cabin silhouette with elevated ground clearance and upright utility stance.'},
    'Wagon': {'label': 'Station Wagon', 'hex': '#10b981', 'desc': 'Extended two-box roofline running to a vertical tailgate for maximized volumetric rear space.'},
    'Hatchback': {'label': 'Hatchback', 'hex': '#06b6d4', 'desc': 'Compact two-box profile with an integrated rear liftback door and short overhangs.'},
    'Convertible': {'label': 'Convertible', 'hex': '#ec4899', 'desc': 'Open-top roadsters and dropheads with a minimal waistline and low greenhouse profile.'},
    'Pickup': {'label': 'Pickup Truck', 'hex': '#d97706', 'desc': 'Enclosed front passenger cab paired with an open cargo utility bed.'},
    'Van': {'label': 'Van / Minivan', 'hex': '#64748b', 'desc': 'High-volume mono-volume cabin maximizing passenger rows and vertical head space.'}
}

# Decadal composition
decades_summary = []
for dec in ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s']:
    d_sub = valid[valid['decade'] == dec]
    n_tot = len(d_sub)
    row = {'decade': dec, 'n': n_tot}
    for bt in body_categories:
        cnt = (d_sub['body_type'] == bt).sum()
        pct = round(float(cnt / n_tot * 100), 1) if n_tot > 0 else 0.0
        row[bt] = pct
    decades_summary.append(row)

# Yearly metrics
yearly_total = valid.groupby('gen_year_start').size()

by_type = {}
for bt in body_categories:
    sub = valid[valid['body_type'] == bt]
    years_data = []
    
    for yr in range(1970, 2025):
        yr_sub = sub[sub['gen_year_start'] == yr]
        n = len(yr_sub)
        tot_yr = yearly_total.get(yr, 0)
        share = round(float(n / tot_yr * 100), 1) if tot_yr > 0 else 0.0
        
        if n >= 2:
            l_mm = round(float(yr_sub['length_mm'].median()), 1)
            w_mm = round(float(yr_sub['width_mm'].median()), 1)
            h_mm = round(float(yr_sub['height_mm'].median()), 1)
            wb_mm = round(float(yr_sub['wheelbase_mm'].median()), 1)
            lh = round(float((yr_sub['length_mm'] / yr_sub['height_mm']).median()), 2)
            wl = round(float((yr_sub['wheelbase_mm'] / yr_sub['length_mm']).median()), 3)
            
            years_data.append({
                'year': yr,
                'n': n,
                'share_pct': share,
                'length_mm': l_mm,
                'length_in': round(l_mm / 25.4, 1),
                'width_mm': w_mm,
                'width_in': round(w_mm / 25.4, 1),
                'height_mm': h_mm,
                'height_in': round(h_mm / 25.4, 1),
                'wheelbase_mm': wb_mm,
                'wheelbase_in': round(wb_mm / 25.4, 1),
                'lh_ratio': lh,
                'wl_ratio': wl
            })
        else:
            years_data.append({
                'year': yr,
                'n': n,
                'share_pct': share,
                'length_mm': None,
                'length_in': None,
                'width_mm': None,
                'width_in': None,
                'height_mm': None,
                'height_in': None,
                'wheelbase_mm': None,
                'wheelbase_in': None,
                'lh_ratio': None,
                'wl_ratio': None
            })
            
    with_dims = [d for d in years_data if d['length_mm'] is not None]
    first_rec = with_dims[0] if with_dims else None
    latest_rec = with_dims[-1] if with_dims else None
    
    delta_len = round(latest_rec['length_mm'] - first_rec['length_mm']) if (first_rec and latest_rec) else 0
    delta_wid = round(latest_rec['width_mm'] - first_rec['width_mm']) if (first_rec and latest_rec) else 0
    delta_hgt = round(latest_rec['height_mm'] - first_rec['height_mm']) if (first_rec and latest_rec) else 0
    delta_wb = round(latest_rec['wheelbase_mm'] - first_rec['wheelbase_mm']) if (first_rec and latest_rec) else 0
    
    peak_share_yr = max(years_data, key=lambda d: d['share_pct'])
    
    by_type[bt] = {
        'total_n': len(sub),
        'years_with_data': len(with_dims),
        'first_year': first_rec['year'] if first_rec else None,
        'first_dimensions': first_rec,
        'latest_year': latest_rec['year'] if latest_rec else None,
        'latest_dimensions': latest_rec,
        'peak_year': peak_share_yr['year'],
        'peak_share': peak_share_yr['share_pct'],
        'delta_length_mm': delta_len,
        'delta_width_mm': delta_wid,
        'delta_height_mm': delta_hgt,
        'delta_wheelbase_mm': delta_wb,
        'meta': category_meta[bt],
        'yearly': years_data
    }

output_payload = {
    'total_classified_vehicles': len(valid),
    'year_range': [1970, 2024],
    'categories': body_categories,
    'category_meta': category_meta,
    'decades_summary': decades_summary,
    'by_type': by_type
}

with open('data/shape_data.json', 'w') as f:
    json.dump(output_payload, f, indent=2)

print('Successfully exported data/shape_data.json')
