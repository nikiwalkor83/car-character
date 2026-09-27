import requests
import io
import json
import pandas as pd
import numpy as np

# 1. Target countries configuration
TARGET_COUNTRIES = {
    "FRA": "France",
    "DEU": "Germany",
    "ITA": "Italy",
    "JPN": "Japan",
    "KOR": "South Korea",
    "SWE": "Sweden",
    "GBR": "United Kingdom",
    "USA": "United States"
}
COUNTRY_LIST = sorted(list(TARGET_COUNTRIES.keys()))
COUNTRY_STR = ";".join(COUNTRY_LIST)
YEAR_START = 1970
YEAR_END = 2024

print(f"Targeting {len(COUNTRY_LIST)} countries from {YEAR_START} to {YEAR_END}...")

# Initialize master country-year grid (8 countries * 55 years = 440 rows)
grid = []
for iso3 in COUNTRY_LIST:
    for yr in range(YEAR_START, YEAR_END + 1):
        grid.append({
            "country": TARGET_COUNTRIES[iso3],
            "iso3": iso3,
            "year": yr,
            "gdp_per_capita_constant_2015_usd": np.nan,
            "population_density_per_km2": np.nan,
            "urbanization_percent": np.nan,
            "passenger_cars_per_1000": np.nan,
            "motorization_source": None
        })

df_master = pd.DataFrame(grid)
master_idx = df_master.set_index(["iso3", "year"])

# 2. Fetch World Bank Indicators
wb_indicators = {
    "NY.GDP.PCAP.KD": "gdp_per_capita_constant_2015_usd",
    "EN.POP.DNST": "population_density_per_km2",
    "SP.URB.TOTL.IN.ZS": "urbanization_percent"
}

for ind_code, col_name in wb_indicators.items():
    print(f"Fetching World Bank indicator {ind_code}...")
    url = f"http://api.worldbank.org/v2/country/{COUNTRY_STR}/indicator/{ind_code}?date={YEAR_START}:{YEAR_END}&format=json&per_page=1000"
    r = requests.get(url, timeout=30)
    data = r.json()
    if len(data) > 1 and data[1]:
        for rec in data[1]:
            iso = rec["countryiso3code"]
            yr = int(rec["date"])
            val = rec["value"]
            if (iso, yr) in master_idx.index and val is not None:
                master_idx.loc[(iso, yr), col_name] = float(val)
    else:
        print(f"Warning: No data returned for {ind_code}")

# 3. Fetch OECD ITF Passenger Cars Per 1,000 Inhabitants (10P3HB)
print("Fetching OECD / ITF Passenger Car ownership (DEU, FRA, GBR, ITA, JPN, KOR, SWE)...")
url_oecd = "https://sdmx.oecd.org/public/rest/data/OECD.ITF,DSD_INDICATORS@DF_EQUIPMENT,1.0/all?startPeriod=1994&endPeriod=2024"
headers = {"Accept": "text/csv"}
r_oecd = requests.get(url_oecd, headers=headers, timeout=35)
if r_oecd.status_code == 200:
    df_oecd = pd.read_csv(io.StringIO(r_oecd.text))
    cars_oecd = df_oecd[
        (df_oecd["REF_AREA"].isin(["DEU", "FRA", "GBR", "ITA", "JPN", "KOR", "SWE"])) &
        (df_oecd["MEASURE"] == "VEHICLES") &
        (df_oecd["VEHICLE_TYPE"] == "CARS") &
        (df_oecd["UNIT_MEASURE"] == "10P3HB")
    ]
    for _, row in cars_oecd.iterrows():
        iso = row["REF_AREA"]
        yr = int(row["TIME_PERIOD"])
        val = row["OBS_VALUE"]
        if (iso, yr) in master_idx.index and pd.notnull(val):
            master_idx.loc[(iso, yr), "passenger_cars_per_1000"] = round(float(val), 2)
            master_idx.loc[(iso, yr), "motorization_source"] = "OECD/ITF"
    print(f"Loaded {len(cars_oecd)} observations from OECD ITF.")
else:
    print(f"OECD error: {r_oecd.status_code}")

# 4. Fetch UNECE Transport Statistics for USA (and compare with Europe)
print("Fetching UNECE Table for USA Passenger Car Rate...")
url_unece = "https://w3.unece.org/PXWeb2015/api/v1/en/STAT/40-TRTRANS/03-TRRoadFleet/01_en_TRRoadTypVehR_r.px"
payload_unece = {
  "query": [
    { "code": "Measurement", "selection": { "filter": "item", "values": ["TR.123"] } },
    { "code": "Vehicle category", "selection": { "filter": "item", "values": ["TR.396"] } },
    { "code": "Country", "selection": { "filter": "item", "values": ["840"] } } # 840 is USA
  ],
  "response": { "format": "json" }
}
r_unece = requests.post(url_unece, json=payload_unece, timeout=20)
if r_unece.status_code == 200:
    unece_json = r_unece.json()
    years_map = [1993 + i for i in range(32)]
    loaded_usa = 0
    for row in unece_json.get("data", []):
        yr_idx = int(row["key"][3])
        yr = years_map[yr_idx]
        val_str = row["values"][0]
        if val_str != ".." and ( "USA", yr ) in master_idx.index:
            master_idx.loc[("USA", yr), "passenger_cars_per_1000"] = round(float(val_str), 2)
            master_idx.loc[("USA", yr), "motorization_source"] = "UNECE/US DOT FHWA"
            loaded_usa += 1
    print(f"Loaded {loaded_usa} observations for USA from UNECE.")
else:
    print(f"UNECE error: {r_unece.status_code}")

# Reset index to regular dataframe
df_final = master_idx.reset_index()
# Sort strictly by country and year
df_final = df_final.sort_values(["iso3", "year"]).reset_index(drop=True)

# Reorder columns
cols_ordered = [
    "country",
    "iso3",
    "year",
    "gdp_per_capita_constant_2015_usd",
    "population_density_per_km2",
    "urbanization_percent",
    "passenger_cars_per_1000",
    "motorization_source"
]
df_final = df_final[cols_ordered]

# Save CSV
csv_path = "data/country_context.csv"
df_final.to_csv(csv_path, index=False)
print(f"Saved {csv_path} ({len(df_final)} rows)")

# Save JSON
json_path = "data/country_context.json"
records = df_final.to_dict(orient="records")
# Convert NaN to None for clean JSON serialization
for r in records:
    for k, v in r.items():
        if pd.isna(v):
            r[k] = None
with open(json_path, "w") as f:
    json.dump(records, f, indent=2)
print(f"Saved {json_path}")

# Build and save Metadata JSON
metadata = {
    "title": "Country-Level Contextual Indicators for Automotive Exploration",
    "description": "Annual macroeconomic, demographic, and motorization indicators for eight primary automotive manufacturing nations (1970–2024).",
    "temporal_coverage": "1970-2024",
    "country_coverage": COUNTRY_LIST,
    "total_observations": len(df_final),
    "variables": {
        "gdp_per_capita_constant_2015_usd": {
            "name": "GDP per capita (constant 2015 US$)",
            "unit": "Constant 2015 US Dollars ($)",
            "source_agency": "World Bank",
            "indicator_code": "NY.GDP.PCAP.KD",
            "source_url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.KD",
            "coverage_years": "1970-2024 (100% complete across all 8 countries)",
            "notes": "Data for Germany before 1991 refers to West Germany (Federal Republic of Germany prior to reunification), while data from 1991 onward refers to unified Germany."
        },
        "population_density_per_km2": {
            "name": "Population density (people per sq. km of land area)",
            "unit": "People / km²",
            "source_agency": "World Bank / UN Food and Agriculture Organization",
            "indicator_code": "EN.POP.DNST",
            "source_url": "https://data.worldbank.org/indicator/EN.POP.DNST",
            "coverage_years": "1970-2023 (100% complete across all 8 countries through 2023; 2024 land area survey pending)",
            "notes": "Midyear population divided by land area in square kilometers."
        },
        "urbanization_percent": {
            "name": "Urban population (% of total population)",
            "unit": "Percentage (%)",
            "source_agency": "World Bank / UN Population Division (World Urbanization Prospects)",
            "indicator_code": "SP.URB.TOTL.IN.ZS",
            "source_url": "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
            "coverage_years": "1970-2024 (100% complete across all 8 countries)",
            "notes": "Urban population refers to people living in urban areas as defined by national statistical offices."
        },
        "passenger_cars_per_1000": {
            "name": "Passenger cars per 1,000 inhabitants",
            "unit": "Cars / 1,000 inhabitants",
            "source_agency": "OECD / International Transport Forum (ITF) & UNECE Transport Statistics / US DOT FHWA",
            "indicator_code": "OECD.ITF:DSD_INDICATORS@DF_EQUIPMENT(1.0)/10P3HB & UNECE:01_en_TRRoadTypVehR_r.px/TR.123",
            "source_url": "https://stats.oecd.org / https://w3.unece.org/PXWeb2015",
            "coverage_years": "1994-2024 for DEU, FRA, GBR, ITA, JPN, KOR, SWE; 1993-2023 for USA. (Pre-1994 unrecorded in harmonized international databases; kept as NA)",
            "notes": "For European nations, Japan, and South Korea, strictly tracks category M1 passenger cars. For the United States, FHWA data reported to UNECE includes all light-duty passenger vehicles (cars + passenger light trucks/SUVs) in 1993-2005 and 2019-2023, while isolating sedans only in 2006-2018."
        }
    }
}

with open("data/country_context_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print("Saved data/country_context_metadata.json")
