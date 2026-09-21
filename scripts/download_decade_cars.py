import urllib.request
import urllib.parse
import json
import time
import os
import re
from PIL import Image
import csv

CARS_TO_ADD = [
    # 1970s
    {
        "name": "1971 Datsun 240Z",
        "make": "Datsun",
        "gen": "First generation (S30)",
        "year": 1971,
        "decade": "1970s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "1970s/1971_datsun_240z.jpg",
        "query": "1971 Datsun 240Z front"
    },
    {
        "name": "1975 Honda Civic",
        "make": "Honda",
        "gen": "First generation (SB1)",
        "year": 1975,
        "decade": "1970s",
        "country": "Japan",
        "cat": "Economy",
        "filename": "1970s/1975_honda_civic.jpg",
        "query": "1975 Honda Civic front"
    },
    {
        "name": "1973 Chevrolet Chevelle",
        "make": "Chevrolet",
        "gen": "Third generation",
        "year": 1973,
        "decade": "1970s",
        "country": "United States",
        "cat": "Coupe",
        "filename": "1970s/1973_chevrolet_chevelle.jpg",
        "query": "1973 Chevrolet Chevelle front"
    },
    {
        "name": "1976 Volkswagen Golf Mk1",
        "make": "Volkswagen",
        "gen": "First generation (Typ 17)",
        "year": 1976,
        "decade": "1970s",
        "country": "Germany",
        "cat": "Hatchback",
        "filename": "1970s/1976_volkswagen_golf_mk1.jpg",
        "query": "Volkswagen Golf I front"
    },
    {
        "name": "1975 Porsche 911 Turbo",
        "make": "Porsche",
        "gen": "G-Series (930)",
        "year": 1975,
        "decade": "1970s",
        "country": "Germany",
        "cat": "Sports",
        "filename": "1970s/1975_porsche_911_turbo.jpg",
        "query": "Porsche 930 Turbo front"
    },
    {
        "name": "1977 BMW 320i",
        "make": "BMW",
        "gen": "First generation 3 Series (E21)",
        "year": 1977,
        "decade": "1970s",
        "country": "Germany",
        "cat": "Sedan",
        "filename": "1970s/1977_bmw_320i_e21.jpg",
        "query": "BMW E21 front"
    },
    {
        "name": "1977 Ford F-150",
        "make": "Ford",
        "gen": "Sixth generation F-Series",
        "year": 1977,
        "decade": "1970s",
        "country": "United States",
        "cat": "Pickup",
        "filename": "1970s/1977_ford_f150.jpg",
        "query": "1977 Ford F-150 front"
    },
    {
        "name": "1977 Pontiac Firebird Trans Am",
        "make": "Pontiac",
        "gen": "Second generation",
        "year": 1977,
        "decade": "1970s",
        "country": "United States",
        "cat": "Sports",
        "filename": "1970s/1977_pontiac_firebird_trans_am.jpg",
        "query": "1977 Pontiac Firebird Trans Am front"
    },
    {
        "name": "1978 Saab 99 Turbo",
        "make": "Saab",
        "gen": "Saab 99",
        "year": 1978,
        "decade": "1970s",
        "country": "Sweden",
        "cat": "Sedan",
        "filename": "1970s/1978_saab_99_turbo.jpg",
        "query": "Saab 99 Turbo front"
    },
    {
        "name": "1976 Peugeot 504",
        "make": "Peugeot",
        "gen": "504 Sedan",
        "year": 1976,
        "decade": "1970s",
        "country": "France",
        "cat": "Sedan",
        "filename": "1970s/1976_peugeot_504.jpg",
        "query": "Peugeot 504 front"
    },

    # 1980s
    {
        "name": "1981 Audi Quattro",
        "make": "Audi",
        "gen": "Ur-Quattro",
        "year": 1981,
        "decade": "1980s",
        "country": "Germany",
        "cat": "Sports",
        "filename": "1980s/1981_audi_quattro.jpg",
        "query": "Audi Quattro front"
    },
    {
        "name": "1984 Chevrolet Cavalier",
        "make": "Chevrolet",
        "gen": "First generation (J-body)",
        "year": 1984,
        "decade": "1980s",
        "country": "United States",
        "cat": "Economy",
        "filename": "1980s/1984_chevrolet_cavalier.jpg",
        "query": "Chevrolet Cavalier sedan front"
    },
    {
        "name": "1984 Dodge Caravan",
        "make": "Dodge",
        "gen": "First generation (S-platform)",
        "year": 1984,
        "decade": "1980s",
        "country": "United States",
        "cat": "Van",
        "filename": "1980s/1984_dodge_caravan.jpg",
        "query": "1984 Dodge Caravan front"
    },
    {
        "name": "1986 Jeep Cherokee (XJ)",
        "make": "Jeep",
        "gen": "Second generation (XJ)",
        "year": 1986,
        "decade": "1980s",
        "country": "United States",
        "cat": "SUV",
        "filename": "1980s/1986_jeep_cherokee_xj.jpg",
        "query": "Jeep Cherokee XJ front"
    },
    {
        "name": "1986 Honda Accord",
        "make": "Honda",
        "gen": "Third generation (CA)",
        "year": 1986,
        "decade": "1980s",
        "country": "Japan",
        "cat": "Sedan",
        "filename": "1980s/1986_honda_accord.jpg",
        "query": "Honda Accord sedan 1986 front"
    },
    {
        "name": "1986 Ford Taurus",
        "make": "Ford",
        "gen": "First generation",
        "year": 1986,
        "decade": "1980s",
        "country": "United States",
        "cat": "Sedan",
        "filename": "1980s/1986_ford_taurus.jpg",
        "query": "Ford Taurus first generation front"
    },
    {
        "name": "1988 BMW M3 (E30)",
        "make": "BMW",
        "gen": "First generation M3 (E30)",
        "year": 1988,
        "decade": "1980s",
        "country": "Germany",
        "cat": "Sports",
        "filename": "1980s/1988_bmw_m3_e30.jpg",
        "query": "BMW E30 M3 front"
    },
    {
        "name": "1987 Mazda RX-7 (FC)",
        "make": "Mazda",
        "gen": "Second generation (FC)",
        "year": 1987,
        "decade": "1980s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "1980s/1987_mazda_rx7_fc.jpg",
        "query": "Mazda RX-7 FC front"
    },
    {
        "name": "1989 Nissan 300ZX (Z32)",
        "make": "Nissan",
        "gen": "Fourth generation Z (Z32)",
        "year": 1989,
        "decade": "1980s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "1980s/1989_nissan_300zx_z32.jpg",
        "query": "Nissan 300ZX Z32 front"
    },
    {
        "name": "1989 Land Rover Discovery",
        "make": "Land Rover",
        "gen": "Series I",
        "year": 1989,
        "decade": "1980s",
        "country": "United Kingdom",
        "cat": "SUV",
        "filename": "1980s/1989_land_rover_discovery.jpg",
        "query": "Land Rover Discovery Series I front"
    },

    # 1990s
    {
        "name": "1990 Mazda Miata (NA)",
        "make": "Mazda",
        "gen": "First generation (NA)",
        "year": 1990,
        "decade": "1990s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "1990s/1990_mazda_miata.jpg",
        "query": "Mazda MX-5 NA front"
    },
    {
        "name": "1991 Ford Explorer",
        "make": "Ford",
        "gen": "First generation (UN46)",
        "year": 1991,
        "decade": "1990s",
        "country": "United States",
        "cat": "SUV",
        "filename": "1990s/1991_ford_explorer.jpg",
        "query": "Ford Explorer first generation front"
    },
    {
        "name": "1993 Honda Civic (EG)",
        "make": "Honda",
        "gen": "Fifth generation (EG)",
        "year": 1993,
        "decade": "1990s",
        "country": "Japan",
        "cat": "Economy",
        "filename": "1990s/1993_honda_civic.jpg",
        "query": "Honda Civic EG front"
    },
    {
        "name": "1993 Jeep Grand Cherokee (ZJ)",
        "make": "Jeep",
        "gen": "First generation (ZJ)",
        "year": 1993,
        "decade": "1990s",
        "country": "United States",
        "cat": "SUV",
        "filename": "1990s/1993_jeep_grand_cherokee_zj.jpg",
        "query": "Jeep Grand Cherokee ZJ front"
    },
    {
        "name": "1995 Subaru Impreza",
        "make": "Subaru",
        "gen": "First generation (GC/GF)",
        "year": 1995,
        "decade": "1990s",
        "country": "Japan",
        "cat": "Sedan",
        "filename": "1990s/1995_subaru_impreza.jpg",
        "query": "Subaru Impreza GC front"
    },
    {
        "name": "1996 BMW 5 Series (E39)",
        "make": "BMW",
        "gen": "Fourth generation (E39)",
        "year": 1996,
        "decade": "1990s",
        "country": "Germany",
        "cat": "Luxury",
        "filename": "1990s/1996_bmw_5_series_e39.jpg",
        "query": "BMW E39 front"
    },
    {
        "name": "1996 Toyota RAV4",
        "make": "Toyota",
        "gen": "First generation (XA10)",
        "year": 1996,
        "decade": "1990s",
        "country": "Japan",
        "cat": "SUV",
        "filename": "1990s/1996_toyota_rav4.jpg",
        "query": "Toyota RAV4 XA10 front"
    },
    {
        "name": "1998 Chevrolet Corvette (C5)",
        "make": "Chevrolet",
        "gen": "Fifth generation (C5)",
        "year": 1998,
        "decade": "1990s",
        "country": "United States",
        "cat": "Sports",
        "filename": "1990s/1998_chevrolet_corvette_c5.jpg",
        "query": "Chevrolet Corvette C5 front"
    },
    {
        "name": "1999 Audi TT",
        "make": "Audi",
        "gen": "First generation (Typ 8N)",
        "year": 1999,
        "decade": "1990s",
        "country": "Germany",
        "cat": "Sports",
        "filename": "1990s/1999_audi_tt.jpg",
        "query": "Audi TT 8N front"
    },
    {
        "name": "1999 Ford Focus",
        "make": "Ford",
        "gen": "First generation (C170)",
        "year": 1999,
        "decade": "1990s",
        "country": "United States",
        "cat": "Economy",
        "filename": "1990s/1999_ford_focus.jpg",
        "query": "Ford Focus Mk1 front"
    },

    # 2000s
    {
        "name": "2001 Honda S2000",
        "make": "Honda",
        "gen": "AP1",
        "year": 2001,
        "decade": "2000s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "2000s/2001_honda_s2000.jpg",
        "query": "Honda S2000 AP1 front"
    },
    {
        "name": "2002 Cadillac Escalade",
        "make": "Cadillac",
        "gen": "Second generation (GMT800)",
        "year": 2002,
        "decade": "2000s",
        "country": "United States",
        "cat": "SUV",
        "filename": "2000s/2002_cadillac_escalade.jpg",
        "query": "2002 Cadillac Escalade front"
    },
    {
        "name": "2003 Nissan 350Z",
        "make": "Nissan",
        "gen": "Fifth generation Z (Z33)",
        "year": 2003,
        "decade": "2000s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "2000s/2003_nissan_350z.jpg",
        "query": "Nissan 350Z front"
    },
    {
        "name": "2005 Ford GT",
        "make": "Ford",
        "gen": "First modern generation",
        "year": 2005,
        "decade": "2000s",
        "country": "United States",
        "cat": "Supercar",
        "filename": "2000s/2005_ford_gt.jpg",
        "query": "2005 Ford GT front"
    },
    {
        "name": "2005 Chrysler 300C",
        "make": "Chrysler",
        "gen": "First generation (LX)",
        "year": 2005,
        "decade": "2000s",
        "country": "United States",
        "cat": "Sedan",
        "filename": "2000s/2005_chrysler_300c.jpg",
        "query": "Chrysler 300C front"
    },
    {
        "name": "2006 Mazda 3",
        "make": "Mazda",
        "gen": "First generation (BK)",
        "year": 2006,
        "decade": "2000s",
        "country": "Japan",
        "cat": "Economy",
        "filename": "2000s/2006_mazda_3.jpg",
        "query": "Mazda 3 BK front"
    },
    {
        "name": "2008 Fiat 500",
        "make": "Fiat",
        "gen": "Modern Typ 312",
        "year": 2008,
        "decade": "2000s",
        "country": "Italy",
        "cat": "Economy",
        "filename": "2000s/2008_fiat_500.jpg",
        "query": "Fiat 500 2008 front"
    },
    {
        "name": "2008 Audi R8",
        "make": "Audi",
        "gen": "First generation (Typ 42)",
        "year": 2008,
        "decade": "2000s",
        "country": "Germany",
        "cat": "Supercar",
        "filename": "2000s/2008_audi_r8.jpg",
        "query": "Audi R8 Typ 42 front"
    },
    {
        "name": "2008 Subaru Outback",
        "make": "Subaru",
        "gen": "Third generation (BP)",
        "year": 2008,
        "decade": "2000s",
        "country": "Japan",
        "cat": "Wagon",
        "filename": "2000s/2008_subaru_outback.jpg",
        "query": "Subaru Outback BP front"
    },
    {
        "name": "2009 Nissan GT-R (R35)",
        "make": "Nissan",
        "gen": "First generation (R35)",
        "year": 2009,
        "decade": "2000s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "2000s/2009_nissan_gtr.jpg",
        "query": "Nissan GT-R R35 front"
    },

    # 2010s
    {
        "name": "2011 Nissan Leaf",
        "make": "Nissan",
        "gen": "First generation (ZE0)",
        "year": 2011,
        "decade": "2010s",
        "country": "Japan",
        "cat": "Hatchback",
        "filename": "2010s/2011_nissan_leaf.jpg",
        "query": "Nissan Leaf ZE0 front"
    },
    {
        "name": "2013 Toyota GT86",
        "make": "Toyota",
        "gen": "First generation (ZN6)",
        "year": 2013,
        "decade": "2010s",
        "country": "Japan",
        "cat": "Sports",
        "filename": "2010s/2013_toyota_gt86.jpg",
        "query": "Toyota GT86 front"
    },
    {
        "name": "2014 Range Rover",
        "make": "Land Rover",
        "gen": "Fourth generation (L405)",
        "year": 2014,
        "decade": "2010s",
        "country": "United Kingdom",
        "cat": "SUV",
        "filename": "2010s/2014_range_rover.jpg",
        "query": "Range Rover L405 front"
    },
    {
        "name": "2015 Ford Mustang",
        "make": "Ford",
        "gen": "Sixth generation (S550)",
        "year": 2015,
        "decade": "2010s",
        "country": "United States",
        "cat": "Sports",
        "filename": "2010s/2015_ford_mustang.jpg",
        "query": "Ford Mustang S550 front"
    },
    {
        "name": "2016 Mazda CX-5",
        "make": "Mazda",
        "gen": "First generation (KE)",
        "year": 2016,
        "decade": "2010s",
        "country": "Japan",
        "cat": "SUV",
        "filename": "2010s/2016_mazda_cx5.jpg",
        "query": "Mazda CX-5 KE front"
    },
    {
        "name": "2016 Mercedes-AMG GT",
        "make": "Mercedes-Benz",
        "gen": "First generation (C190)",
        "year": 2016,
        "decade": "2010s",
        "country": "Germany",
        "cat": "Sports",
        "filename": "2010s/2016_mercedes_amg_gt.jpg",
        "query": "Mercedes-AMG GT front"
    },
    {
        "name": "2017 Honda Civic Type R",
        "make": "Honda",
        "gen": "Fifth generation Type R (FK8)",
        "year": 2017,
        "decade": "2010s",
        "country": "Japan",
        "cat": "Hatchback",
        "filename": "2010s/2017_honda_civic_type_r.jpg",
        "query": "Honda Civic Type R FK8 front"
    },
    {
        "name": "2018 Tesla Model 3",
        "make": "Tesla",
        "gen": "First generation",
        "year": 2018,
        "decade": "2010s",
        "country": "United States",
        "cat": "Sedan",
        "filename": "2010s/2018_tesla_model_3.jpg",
        "query": "Tesla Model 3 front"
    },
    {
        "name": "2019 Jeep Wrangler (JL)",
        "make": "Jeep",
        "gen": "Fourth generation (JL)",
        "year": 2019,
        "decade": "2010s",
        "country": "United States",
        "cat": "SUV",
        "filename": "2010s/2019_jeep_wrangler_jl.jpg",
        "query": "Jeep Wrangler JL front"
    },
    {
        "name": "2020 Porsche Taycan",
        "make": "Porsche",
        "gen": "First generation",
        "year": 2020,
        "decade": "2010s",
        "country": "Germany",
        "cat": "Sedan",
        "filename": "2010s/2020_porsche_taycan.jpg",
        "query": "Porsche Taycan front"
    },

    # 2020s
    {
        "name": "2020 Chevrolet Corvette (C8)",
        "make": "Chevrolet",
        "gen": "Eighth generation (C8)",
        "year": 2020,
        "decade": "2020s",
        "country": "United States",
        "cat": "Sports",
        "filename": "2020s/2020_chevrolet_corvette_c8.jpg",
        "query": "Chevrolet Corvette C8 front"
    },
    {
        "name": "2021 Ford Bronco",
        "make": "Ford",
        "gen": "Sixth generation",
        "year": 2021,
        "decade": "2020s",
        "country": "United States",
        "cat": "SUV",
        "filename": "2020s/2021_ford_bronco.jpg",
        "query": "Ford Bronco 2021 front"
    },
    {
        "name": "2021 Ford Mustang Mach-E",
        "make": "Ford",
        "gen": "First generation",
        "year": 2021,
        "decade": "2020s",
        "country": "United States",
        "cat": "SUV",
        "filename": "2020s/2021_ford_mustang_mach_e.jpg",
        "query": "Ford Mustang Mach-E front"
    },
    {
        "name": "2022 Rivian R1T",
        "make": "Rivian",
        "gen": "First generation",
        "year": 2022,
        "decade": "2020s",
        "country": "United States",
        "cat": "Pickup",
        "filename": "2020s/2022_rivian_r1t.jpg",
        "query": "Rivian R1T front"
    },
    {
        "name": "2022 Kia EV6",
        "make": "Kia",
        "gen": "First generation (CV)",
        "year": 2022,
        "decade": "2020s",
        "country": "South Korea",
        "cat": "SUV",
        "filename": "2020s/2022_kia_ev6.jpg",
        "query": "Kia EV6 front"
    },
    {
        "name": "2023 BMW i4",
        "make": "BMW",
        "gen": "First generation (G26)",
        "year": 2023,
        "decade": "2020s",
        "country": "Germany",
        "cat": "Sedan",
        "filename": "2020s/2023_bmw_i4.jpg",
        "query": "BMW i4 G26 front"
    },
    {
        "name": "2023 Honda Civic",
        "make": "Honda",
        "gen": "Eleventh generation (FE/FL)",
        "year": 2023,
        "decade": "2020s",
        "country": "Japan",
        "cat": "Sedan",
        "filename": "2020s/2023_honda_civic.jpg",
        "query": "Honda Civic FE sedan front"
    },
    {
        "name": "2024 Toyota Land Cruiser",
        "make": "Toyota",
        "gen": "250 Series",
        "year": 2024,
        "decade": "2020s",
        "country": "Japan",
        "cat": "SUV",
        "filename": "2020s/2024_toyota_land_cruiser.jpg",
        "query": "Toyota Land Cruiser 250 front"
    },
    {
        "name": "2024 Tesla Cybertruck",
        "make": "Tesla",
        "gen": "First generation",
        "year": 2024,
        "decade": "2020s",
        "country": "United States",
        "cat": "Pickup",
        "filename": "2020s/2024_tesla_cybertruck.jpg",
        "query": "Tesla Cybertruck front"
    },
    {
        "name": "2024 Volvo EX30",
        "make": "Volvo",
        "gen": "First generation",
        "year": 2024,
        "decade": "2020s",
        "country": "Sweden",
        "cat": "SUV",
        "filename": "2020s/2024_volvo_ex30.jpg",
        "query": "Volvo EX30 front"
    }
]

HEADERS = {"User-Agent": "CarCharacterProject/1.0 (student data science research; car-character)"}

def clean_html(text):
    return re.sub(r'<[^>]+>', '', text).strip()

def search_wikimedia(query):
    encoded_q = urllib.parse.quote(query)
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={encoded_q}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        pages = data.get("query", {}).get("pages", {})
        results = []
        for pid, page in pages.items():
            info = page.get("imageinfo", [{}])[0]
            img_url = info.get("url", "")
            # check if it's jpg or png
            if not img_url.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            width = info.get("width", 0)
            height = info.get("height", 0)
            # Must be reasonable landscape resolution
            if width < 800 or width < height:
                continue
            meta = info.get("extmetadata", {})
            artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
            license_str = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
            results.append({
                "url": img_url,
                "title": page.get("title", ""),
                "artist": artist if artist else "Unknown",
                "license": license_str,
                "page_url": info.get("descriptionurl", "")
            })
        return results
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        return []

def download_and_process(img_url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    tmp_path = target_path + ".tmp"
    req = urllib.request.Request(img_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp, open(tmp_path, "wb") as f:
        f.write(resp.read())

    # Open with PIL, convert to RGB, resize if needed, save as JPEG
    with Image.open(tmp_path) as im:
        im = im.convert("RGB")
        max_dim = 1400
        w, h = im.size
        if w > max_dim or h > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        im.save(target_path, "JPEG", quality=85, optimize=True)

    if os.path.exists(tmp_path):
        os.remove(tmp_path)

print(f"Starting search and download for {len(CARS_TO_ADD)} cars...")
results_metadata = []

for idx, car in enumerate(CARS_TO_ADD):
    print(f"[{idx+1}/{len(CARS_TO_ADD)}] Processing: {car['name']}...")
    if os.path.exists(car["filename"]) and os.path.getsize(car["filename"]) > 5000:
        print(f"  Already exists, skipping download.")
        continue

    hits = search_wikimedia(car["query"])
    if not hits:
        # Fallback simpler query
        fallback_query = f"{car['make']} {car['name'].split()[-1]}"
        print(f"  Retrying with fallback query: {fallback_query}")
        hits = search_wikimedia(fallback_query)

    if not hits:
        print(f"  FAILED to find image for {car['name']}")
        continue

    best = hits[0]
    try:
        download_and_process(best["url"], car["filename"])
        file_size_kb = os.path.getsize(car["filename"]) / 1024
        print(f"  Successfully saved {car['filename']} ({file_size_kb:.1f} KB)")
        car["orig_url"] = best["url"]
        car["source"] = "Wikimedia Commons"
        car["license_info"] = f"{best['license']}; Author: {best['artist'][:60]}"
        results_metadata.append(car)
    except Exception as e:
        print(f"  Error downloading {best['url']}: {e}")

    time.sleep(0.5)

print(f"Downloaded {len(results_metadata)} new cars.")
