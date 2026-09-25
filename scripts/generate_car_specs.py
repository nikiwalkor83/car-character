"""
Generate authentic automotive specifications for all master cars from engines.csv.
Adheres strictly to the rule:
- Use only data that actually exists in engines.csv
- Do not invent, estimate, or fabricate missing values
- Omit or set null for unavailable specs
Outputs:
- data/car_specs.js (window.CAR_SPECS)
- data/cars_metadata.js (enriched with specs property on each car)
"""

import json
import re
import pandas as pd

with open("cars_metadata.json", "r", encoding="utf-8") as f:
    cars = json.load(f)

engines = pd.read_csv("engines.csv", low_memory=False)

MAKE_ALIASES = {
    "delorean motor company": ["dmc"],
    "datsun": ["nissan", "datsun"],
    "mercedes-benz": ["mercedes-benz", "mercedes"],
    "alfa romeo": ["alfa romeo", "alfa-romeo"],
    "aston martin": ["aston martin", "aston-martin"],
    "land rover": ["land rover", "land-rover"],
    "lucid": ["lucid", "lucid motors"]
}

MODEL_OVERRIDES = {
    "1960 Austin Mini": ("Mini", "Classic"),
    "1961 Lincoln Continental": ("Lincoln", "Continental"),
    "1970 Datsun 240Z": ("Nissan", "240Z"),
    "1971 Datsun 240Z": ("Nissan", "240Z"),
    "1972 Lincoln Continental": ("Lincoln", "Continental"),
    "1973 Pontiac Firebird Trans Am": ("Pontiac", "Firebird"),
    "1974 Lancia Stratos HF": ("Lancia", "Stratos"),
    "1980 Fiat Panda": ("Fiat", "Panda"),
    "1984 Renault Espace": ("Renault", "Espace"),
    "1986 Ford Taurus": ("Ford", "Taurus"),
    "1989 Mazda MX-5 Miata": ("Mazda", "MX-5 / Miata"),
    "1992 Bugatti EB110": ("Bugatti", "EB 110"),
    "1999 Pagani Zonda C12": ("Pagani", "Zonda"),
    "2000 Lotus Exige": ("Lotus", "Exige"),
    "2001 Mini Cooper": ("Mini", "Hatch"),
    "2006 Bugatti Veyron 16.4": ("Bugatti", "Veyron"),
    "2009 Aston Martin One-77": ("Aston Martin", "One-77"),
    "2011 Lexus LFA": ("Lexus", "LFA"),
    "2012 Pagani Huayra": ("Pagani", "Huayra"),
    "2013 McLaren P1": ("McLaren", "P1"),
    "2017 Alpine A110": ("Alpine", "A110"),
    "2017 Bugatti Chiron": ("Bugatti", "Chiron"),
    "2021 Lucid Air": ("Lucid", "Motors Air"),
    "1969 Dodge Charger Daytona": ("Dodge", "Charger"),
    "1993 Renault Twingo": ("Renault", "Twingo"),
    "2015 Renault Zoe": ("Renault", "ZOE"),
    "1994 McLaren F1": ("McLaren", "F1"),
    "1989 Nissan 300ZX (Z32)": ("Nissan", "300 ZX"),
    "2013 Toyota GT86": ("Toyota", "GT 86"),
    "1977 BMW 320i": ("BMW", "3 Series"),
    "1972 BMW 520": ("BMW", "5 Series"),
    "1974 Volvo 240": ("Volvo", "240"),
    "1975 Toyota Celica": ("Toyota", "Celica"),
    "1979 Toyota Hilux": ("Toyota", "Hilux"),
    "1985 Ford Sierra RS Cosworth": ("Ford", "Sierra"),
    "1988 Honda CR-X Si": ("Honda", "CR-X"),
    "1988 Volvo 740 Turbo": ("Volvo", "740"),
    "1989 Mercedes-Benz 500SL (R129)": ("Mercedes-Benz", "MERCEDES BENZ SL-Klasse"),
    "1997 Plymouth Prowler": ("Plymouth", "Prowler"),
    "2006 Audi RS4 (B7)": ("Audi", "RS 4"),
    "2007 Mini Cooper S (R56)": ("Mini", "Hatch"),
    "1970 Range Rover Classic": ("Land Rover", "Range Rover")
}

def find_best_engine(car):
    name = car["Car name"]
    mfg = car["Manufacturer"].strip()
    yr = int(car["Model year"])
    gen = car["Exact model generation"]

    if name in MODEL_OVERRIDES:
        o_make, o_model = MODEL_OVERRIDES[name]
        m_sub = engines[engines["make"].str.lower() == o_make.lower()]
        mod_sub = m_sub[m_sub["model"].str.lower() == o_model.lower()]
        if len(mod_sub) > 0:
            scored = []
            for _, r in mod_sub.iterrows():
                y_diff = abs(yr - r["gen_year_start"]) if pd.notna(r["gen_year_start"]) else 99
                has_specs = sum(pd.notna(r[c]) for c in ["power_hp", "curb_weight_kg", "length_mm"])
                cabrio_penalty = 10 if "cabrio" in str(r["generation"]).lower() and "cabrio" not in gen.lower() else 0
                eng_label = str(r.get("engine_label", "")).lower()
                trim_match = 0
                for tok in ["500", "turbo", "gti", "v8", "v6", "rs"]:
                    if tok in name.lower() and tok in eng_label:
                        trim_match += 5
                scored.append((y_diff + cabrio_penalty, -trim_match, -has_specs, r))
            scored.sort(key=lambda x: (x[0], x[1], x[2]))
            return scored[0][3]

    possible_makes = MAKE_ALIASES.get(mfg.lower(), [mfg.lower()])
    m_sub = engines[engines["make"].str.lower().isin(possible_makes) | engines["make_group"].str.lower().isin(possible_makes)]
    if len(m_sub) == 0:
        return None

    rem = re.sub(rf"^{yr}\s+", "", name, flags=re.IGNORECASE)
    rem = re.sub(rf"^{re.escape(mfg)}\s+", "", rem, flags=re.IGNORECASE).strip()

    tokens = set(re.findall(r"[a-z0-9]+", rem.lower()))
    gen_tokens = set(re.findall(r"[a-z0-9]+", gen.lower()))

    best_row = None
    best_score = -1

    for _, row in m_sub.iterrows():
        score = 0
        r_model = str(row["model"]).lower()
        r_gen = str(row["generation"]).lower()
        r_start = row["gen_year_start"]
        r_end = row["gen_year_end"] if pd.notna(row["gen_year_end"]) else 2030

        r_mod_tokens = set(re.findall(r"[a-z0-9]+", r_model))
        common_mod = tokens & r_mod_tokens
        if not common_mod and not any(t in r_model for t in tokens):
            continue

        score += len(common_mod) * 15
        if r_model == rem.lower() or rem.lower() in r_model:
            score += 30

        if pd.notna(r_start):
            if r_start <= yr <= r_end:
                score += 40
            else:
                diff = min(abs(yr - r_start), abs(yr - r_end))
                score -= diff * 2.5

        common_gen = gen_tokens & set(re.findall(r"[a-z0-9]+", r_gen))
        score += len(common_gen) * 8

        if pd.notna(row["power_hp"]): score += 3
        if pd.notna(row["curb_weight_kg"]): score += 3
        if pd.notna(row["length_mm"]): score += 2

        if score > best_score:
            best_score = score
            best_row = row

    if best_score > 10:
        return best_row
    return None

specs_dict = {}
matched_count = 0

for c in cars:
    car_name = c["Car name"]
    eng = find_best_engine(c)
    if eng is None:
        btype = c.get("Vehicle category")
        s = {"body_type": btype} if btype else None
        specs_dict[car_name] = s
        c["specs"] = s
        continue

    matched_count += 1
    s = {}
    if pd.notna(eng["power_hp"]) and eng["power_hp"] > 0:
        s["horsepower"] = int(round(eng["power_hp"]))
    if pd.notna(eng["curb_weight_kg"]) and eng["curb_weight_kg"] > 0:
        s["weight_kg"] = int(round(eng["curb_weight_kg"]))
        s["weight_lbs"] = int(round(eng["curb_weight_kg"] * 2.20462))
    if pd.notna(eng["fuel_economy_combined_l100"]) and eng["fuel_economy_combined_l100"] > 0:
        l100 = float(eng["fuel_economy_combined_l100"])
        s["fuel_economy_l100"] = round(l100, 1)
        s["mpg"] = round(235.215 / l100, 1)
    if pd.notna(eng["engine_label"]) and str(eng["engine_label"]).strip():
        s["engine"] = str(eng["engine_label"]).strip()
    if pd.notna(eng["cylinders"]) and eng["cylinders"] > 0:
        s["cylinders"] = int(round(eng["cylinders"]))
    if pd.notna(eng["displacement_cc"]) and eng["displacement_cc"] > 0:
        s["displacement_cc"] = int(round(eng["displacement_cc"]))
    if pd.notna(eng["fuel_type"]) and str(eng["fuel_type"]).strip():
        s["fuel_type"] = str(eng["fuel_type"]).strip()
    if pd.notna(eng["transmission"]) and str(eng["transmission"]).strip():
        s["transmission"] = str(eng["transmission"]).strip()
    if pd.notna(eng["drivetrain"]) and str(eng["drivetrain"]).strip():
        s["drivetrain"] = str(eng["drivetrain"]).strip()
    
    btype = str(eng["body_type"]).strip() if pd.notna(eng["body_type"]) and str(eng["body_type"]).strip() else c.get("Vehicle category")
    if btype:
        s["body_type"] = btype

    if pd.notna(eng["length_mm"]) and eng["length_mm"] > 0:
        s["length_mm"] = int(round(eng["length_mm"]))
        s["length_in"] = round(eng["length_mm"] / 25.4, 1)
    if pd.notna(eng["width_mm"]) and eng["width_mm"] > 0:
        s["width_mm"] = int(round(eng["width_mm"]))
        s["width_in"] = round(eng["width_mm"] / 25.4, 1)
    if pd.notna(eng["height_mm"]) and eng["height_mm"] > 0:
        s["height_mm"] = int(round(eng["height_mm"]))
        s["height_in"] = round(eng["height_mm"] / 25.4, 1)
    if pd.notna(eng["wheelbase_mm"]) and eng["wheelbase_mm"] > 0:
        s["wheelbase_mm"] = int(round(eng["wheelbase_mm"]))
        s["wheelbase_in"] = round(eng["wheelbase_mm"] / 25.4, 1)

    specs_dict[car_name] = s
    c["specs"] = s

print(f"Matched {matched_count} out of {len(cars)} cars ({matched_count/len(cars)*100:.1f}%).")

# Save data/car_specs.js
with open("data/car_specs.js", "w", encoding="utf-8") as f:
    f.write("// Authentic automotive specifications derived directly from engines.csv\n")
    f.write("// Only genuine recorded specifications are included; missing values are omitted/null.\n")
    f.write("window.CAR_SPECS = ")
    json.dump(specs_dict, f, indent=2)
    f.write(";\n")
print("Saved data/car_specs.js successfully.")

# Save updated data/cars_metadata.js with specs attached
with open("data/cars_metadata.js", "w", encoding="utf-8") as f:
    f.write("window.CARS_METADATA = ")
    json.dump(cars, f, ensure_ascii=False)
    f.write(";\n")
print("Saved updated data/cars_metadata.js successfully.")
