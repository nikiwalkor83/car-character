import urllib.request
import urllib.parse
import json
import time
import os
import re
from PIL import Image
import csv

CARS = [
    # 1970s
    {"article": "Datsun_240Z", "name": "1971 Datsun 240Z", "make": "Datsun", "gen": "First generation (S30)", "year": 1971, "decade": "1970s", "country": "Japan", "cat": "Sports", "filename": "1970s/1971_datsun_240z.jpg"},
    {"article": "Honda_Civic_(first_generation)", "name": "1975 Honda Civic", "make": "Honda", "gen": "First generation (SB1)", "year": 1975, "decade": "1970s", "country": "Japan", "cat": "Economy", "filename": "1970s/1975_honda_civic.jpg"},
    {"article": "Chevrolet_Chevelle", "name": "1973 Chevrolet Chevelle", "make": "Chevrolet", "gen": "Third generation", "year": 1973, "decade": "1970s", "country": "United States", "cat": "Coupe", "filename": "1970s/1973_chevrolet_chevelle.jpg"},
    {"article": "Volkswagen_Golf_Mk1", "name": "1976 Volkswagen Golf Mk1", "make": "Volkswagen", "gen": "First generation (Typ 17)", "year": 1976, "decade": "1970s", "country": "Germany", "cat": "Hatchback", "filename": "1970s/1976_volkswagen_golf_mk1.jpg"},
    {"article": "Porsche_930", "name": "1975 Porsche 911 Turbo", "make": "Porsche", "gen": "G-Series (930)", "year": 1975, "decade": "1970s", "country": "Germany", "cat": "Sports", "filename": "1970s/1975_porsche_911_turbo.jpg"},
    {"article": "BMW_3_Series_(E21)", "name": "1977 BMW 320i", "make": "BMW", "gen": "First generation 3 Series (E21)", "year": 1977, "decade": "1970s", "country": "Germany", "cat": "Sedan", "filename": "1970s/1977_bmw_320i_e21.jpg"},
    {"article": "Ford_F-Series_(sixth_generation)", "name": "1977 Ford F-150", "make": "Ford", "gen": "Sixth generation F-Series", "year": 1977, "decade": "1970s", "country": "United States", "cat": "Pickup", "filename": "1970s/1977_ford_f150.jpg"},
    {"article": "Pontiac_Firebird_(second_generation)", "name": "1977 Pontiac Firebird Trans Am", "make": "Pontiac", "gen": "Second generation", "year": 1977, "decade": "1970s", "country": "United States", "cat": "Sports", "filename": "1970s/1977_pontiac_firebird_trans_am.jpg"},
    {"article": "Saab_99", "name": "1978 Saab 99 Turbo", "make": "Saab", "gen": "Saab 99", "year": 1978, "decade": "1970s", "country": "Sweden", "cat": "Sedan", "filename": "1970s/1978_saab_99_turbo.jpg"},
    {"article": "Peugeot_504", "name": "1976 Peugeot 504", "make": "Peugeot", "gen": "504 Sedan", "year": 1976, "decade": "1970s", "country": "France", "cat": "Sedan", "filename": "1970s/1976_peugeot_504.jpg"},

    # 1980s
    {"article": "Audi_Quattro", "name": "1981 Audi Quattro", "make": "Audi", "gen": "Ur-Quattro", "year": 1981, "decade": "1980s", "country": "Germany", "cat": "Sports", "filename": "1980s/1981_audi_quattro.jpg"},
    {"article": "Chevrolet_Cavalier", "name": "1984 Chevrolet Cavalier", "make": "Chevrolet", "gen": "First generation (J-body)", "year": 1984, "decade": "1980s", "country": "United States", "cat": "Economy", "filename": "1980s/1984_chevrolet_cavalier.jpg"},
    {"article": "Dodge_Caravan", "name": "1984 Dodge Caravan", "make": "Dodge", "gen": "First generation (S-platform)", "year": 1984, "decade": "1980s", "country": "United States", "cat": "Van", "filename": "1980s/1984_dodge_caravan.jpg"},
    {"article": "Jeep_Cherokee_(XJ)", "name": "1986 Jeep Cherokee (XJ)", "make": "Jeep", "gen": "Second generation (XJ)", "year": 1986, "decade": "1980s", "country": "United States", "cat": "SUV", "filename": "1980s/1986_jeep_cherokee_xj.jpg"},
    {"article": "Honda_Accord_(third_generation)", "name": "1986 Honda Accord", "make": "Honda", "gen": "Third generation (CA)", "year": 1986, "decade": "1980s", "country": "Japan", "cat": "Sedan", "filename": "1980s/1986_honda_accord.jpg"},
    {"article": "Ford_Taurus_(first_generation)", "name": "1986 Ford Taurus", "make": "Ford", "gen": "First generation", "year": 1986, "decade": "1980s", "country": "United States", "cat": "Sedan", "filename": "1980s/1986_ford_taurus.jpg"},
    {"article": "BMW_M3", "name": "1988 BMW M3 (E30)", "make": "BMW", "gen": "First generation M3 (E30)", "year": 1988, "decade": "1980s", "country": "Germany", "cat": "Sports", "filename": "1980s/1988_bmw_m3_e30.jpg"},
    {"article": "Mazda_RX-7", "name": "1987 Mazda RX-7 (FC)", "make": "Mazda", "gen": "Second generation (FC)", "year": 1987, "decade": "1980s", "country": "Japan", "cat": "Sports", "filename": "1980s/1987_mazda_rx7_fc.jpg"},
    {"article": "Nissan_300ZX", "name": "1989 Nissan 300ZX (Z32)", "make": "Nissan", "gen": "Fourth generation Z (Z32)", "year": 1989, "decade": "1980s", "country": "Japan", "cat": "Sports", "filename": "1980s/1989_nissan_300zx_z32.jpg"},
    {"article": "Land_Rover_Discovery", "name": "1989 Land Rover Discovery", "make": "Land Rover", "gen": "Series I", "year": 1989, "decade": "1980s", "country": "United Kingdom", "cat": "SUV", "filename": "1980s/1989_land_rover_discovery.jpg"},

    # 1990s
    {"article": "Mazda_MX-5_(NA)", "name": "1990 Mazda Miata (NA)", "make": "Mazda", "gen": "First generation (NA)", "year": 1990, "decade": "1990s", "country": "Japan", "cat": "Sports", "filename": "1990s/1990_mazda_miata.jpg"},
    {"article": "Ford_Explorer", "name": "1991 Ford Explorer", "make": "Ford", "gen": "First generation (UN46)", "year": 1991, "decade": "1990s", "country": "United States", "cat": "SUV", "filename": "1990s/1991_ford_explorer.jpg"},
    {"article": "Honda_Civic_(fifth_generation)", "name": "1993 Honda Civic (EG)", "make": "Honda", "gen": "Fifth generation (EG)", "year": 1993, "decade": "1990s", "country": "Japan", "cat": "Economy", "filename": "1990s/1993_honda_civic.jpg"},
    {"article": "Jeep_Grand_Cherokee_(ZJ)", "name": "1993 Jeep Grand Cherokee (ZJ)", "make": "Jeep", "gen": "First generation (ZJ)", "year": 1993, "decade": "1990s", "country": "United States", "cat": "SUV", "filename": "1990s/1993_jeep_grand_cherokee_zj.jpg"},
    {"article": "Subaru_Impreza_(first_generation)", "name": "1995 Subaru Impreza", "make": "Subaru", "gen": "First generation (GC/GF)", "year": 1995, "decade": "1990s", "country": "Japan", "cat": "Sedan", "filename": "1990s/1995_subaru_impreza.jpg"},
    {"article": "BMW_5_Series_(E39)", "name": "1996 BMW 5 Series (E39)", "make": "BMW", "gen": "Fourth generation (E39)", "year": 1996, "decade": "1990s", "country": "Germany", "cat": "Luxury", "filename": "1990s/1996_bmw_5_series_e39.jpg"},
    {"article": "Toyota_RAV4", "name": "1996 Toyota RAV4", "make": "Toyota", "gen": "First generation (XA10)", "year": 1996, "decade": "1990s", "country": "Japan", "cat": "SUV", "filename": "1990s/1996_toyota_rav4.jpg"},
    {"article": "Chevrolet_Corvette_(C5)", "name": "1998 Chevrolet Corvette (C5)", "make": "Chevrolet", "gen": "Fifth generation (C5)", "year": 1998, "decade": "1990s", "country": "United States", "cat": "Sports", "filename": "1990s/1998_chevrolet_corvette_c5.jpg"},
    {"article": "Audi_TT", "name": "1999 Audi TT", "make": "Audi", "gen": "First generation (Typ 8N)", "year": 1999, "decade": "1990s", "country": "Germany", "cat": "Sports", "filename": "1990s/1999_audi_tt.jpg"},
    {"article": "Ford_Focus_(first_generation)", "name": "1999 Ford Focus", "make": "Ford", "gen": "First generation (C170)", "year": 1999, "decade": "1990s", "country": "United States", "cat": "Economy", "filename": "1990s/1999_ford_focus.jpg"},

    # 2000s
    {"article": "Honda_S2000", "name": "2001 Honda S2000", "make": "Honda", "gen": "AP1", "year": 2001, "decade": "2000s", "country": "Japan", "cat": "Sports", "filename": "2000s/2001_honda_s2000.jpg"},
    {"article": "Cadillac_Escalade", "name": "2002 Cadillac Escalade", "make": "Cadillac", "gen": "Second generation (GMT800)", "year": 2002, "decade": "2000s", "country": "United States", "cat": "SUV", "filename": "2000s/2002_cadillac_escalade.jpg"},
    {"article": "Nissan_350Z", "name": "2003 Nissan 350Z", "make": "Nissan", "gen": "Fifth generation Z (Z33)", "year": 2003, "decade": "2000s", "country": "Japan", "cat": "Sports", "filename": "2000s/2003_nissan_350z.jpg"},
    {"article": "Ford_GT", "name": "2005 Ford GT", "make": "Ford", "gen": "First modern generation", "year": 2005, "decade": "2000s", "country": "United States", "cat": "Supercar", "filename": "2000s/2005_ford_gt.jpg"},
    {"article": "Chrysler_300", "name": "2005 Chrysler 300C", "make": "Chrysler", "gen": "First generation (LX)", "year": 2005, "decade": "2000s", "country": "United States", "cat": "Sedan", "filename": "2000s/2005_chrysler_300c.jpg"},
    {"article": "Mazda3", "name": "2006 Mazda 3", "make": "Mazda", "gen": "First generation (BK)", "year": 2006, "decade": "2000s", "country": "Japan", "cat": "Economy", "filename": "2000s/2006_mazda_3.jpg"},
    {"article": "Fiat_500_(2007)", "name": "2008 Fiat 500", "make": "Fiat", "gen": "Modern Typ 312", "year": 2008, "decade": "2000s", "country": "Italy", "cat": "Economy", "filename": "2000s/2008_fiat_500.jpg"},
    {"article": "Audi_R8_(Type_42)", "name": "2008 Audi R8", "make": "Audi", "gen": "First generation (Typ 42)", "year": 2008, "decade": "2000s", "country": "Germany", "cat": "Supercar", "filename": "2000s/2008_audi_r8.jpg"},
    {"article": "Subaru_Outback", "name": "2008 Subaru Outback", "make": "Subaru", "gen": "Third generation (BP)", "year": 2008, "decade": "2000s", "country": "Japan", "cat": "Wagon", "filename": "2000s/2008_subaru_outback.jpg"},
    {"article": "Nissan_GT-R", "name": "2009 Nissan GT-R (R35)", "make": "Nissan", "gen": "First generation (R35)", "year": 2009, "decade": "2000s", "country": "Japan", "cat": "Sports", "filename": "2000s/2009_nissan_gtr.jpg"},

    # 2010s
    {"article": "Nissan_Leaf", "name": "2011 Nissan Leaf", "make": "Nissan", "gen": "First generation (ZE0)", "year": 2011, "decade": "2010s", "country": "Japan", "cat": "Hatchback", "filename": "2010s/2011_nissan_leaf.jpg"},
    {"article": "Toyota_86", "name": "2013 Toyota GT86", "make": "Toyota", "gen": "First generation (ZN6)", "year": 2013, "decade": "2010s", "country": "Japan", "cat": "Sports", "filename": "2010s/2013_toyota_gt86.jpg"},
    {"article": "Range_Rover_(L405)", "name": "2014 Range Rover", "make": "Land Rover", "gen": "Fourth generation (L405)", "year": 2014, "decade": "2010s", "country": "United Kingdom", "cat": "SUV", "filename": "2010s/2014_range_rover.jpg"},
    {"article": "Ford_Mustang_(sixth_generation)", "name": "2015 Ford Mustang", "make": "Ford", "gen": "Sixth generation (S550)", "year": 2015, "decade": "2010s", "country": "United States", "cat": "Sports", "filename": "2010s/2015_ford_mustang.jpg"},
    {"article": "Mazda_CX-5", "name": "2016 Mazda CX-5", "make": "Mazda", "gen": "First generation (KE)", "year": 2016, "decade": "2010s", "country": "Japan", "cat": "SUV", "filename": "2010s/2016_mazda_cx5.jpg"},
    {"article": "Mercedes-AMG_GT", "name": "2016 Mercedes-AMG GT", "make": "Mercedes-Benz", "gen": "First generation (C190)", "year": 2016, "decade": "2010s", "country": "Germany", "cat": "Sports", "filename": "2010s/2016_mercedes_amg_gt.jpg"},
    {"article": "Honda_Civic_Type_R", "name": "2017 Honda Civic Type R", "make": "Honda", "gen": "Fifth generation Type R (FK8)", "year": 2017, "decade": "2010s", "country": "Japan", "cat": "Hatchback", "filename": "2010s/2017_honda_civic_type_r.jpg"},
    {"article": "Tesla_Model_3", "name": "2018 Tesla Model 3", "make": "Tesla", "gen": "First generation", "year": 2018, "decade": "2010s", "country": "United States", "cat": "Sedan", "filename": "2010s/2018_tesla_model_3.jpg"},
    {"article": "Jeep_Wrangler_(JL)", "name": "2019 Jeep Wrangler (JL)", "make": "Jeep", "gen": "Fourth generation (JL)", "year": 2019, "decade": "2010s", "country": "United States", "cat": "SUV", "filename": "2010s/2019_jeep_wrangler_jl.jpg"},
    {"article": "Porsche_Taycan", "name": "2020 Porsche Taycan", "make": "Porsche", "gen": "First generation", "year": 2020, "decade": "2010s", "country": "Germany", "cat": "Sedan", "filename": "2010s/2020_porsche_taycan.jpg"},

    # 2020s
    {"article": "Chevrolet_Corvette_(C8)", "name": "2020 Chevrolet Corvette (C8)", "make": "Chevrolet", "gen": "Eighth generation (C8)", "year": 2020, "decade": "2020s", "country": "United States", "cat": "Sports", "filename": "2020s/2020_chevrolet_corvette_c8.jpg"},
    {"article": "Ford_Bronco", "name": "2021 Ford Bronco", "make": "Ford", "gen": "Sixth generation", "year": 2021, "decade": "2020s", "country": "United States", "cat": "SUV", "filename": "2020s/2021_ford_bronco.jpg"},
    {"article": "Ford_Mustang_Mach-E", "name": "2021 Ford Mustang Mach-E", "make": "Ford", "gen": "First generation", "year": 2021, "decade": "2020s", "country": "United States", "cat": "SUV", "filename": "2020s/2021_ford_mustang_mach_e.jpg"},
    {"article": "Rivian_R1T", "name": "2022 Rivian R1T", "make": "Rivian", "gen": "First generation", "year": 2022, "decade": "2020s", "country": "United States", "cat": "Pickup", "filename": "2020s/2022_rivian_r1t.jpg"},
    {"article": "Kia_EV6", "name": "2022 Kia EV6", "make": "Kia", "gen": "First generation (CV)", "year": 2022, "decade": "2020s", "country": "South Korea", "cat": "SUV", "filename": "2020s/2022_kia_ev6.jpg"},
    {"article": "BMW_i4", "name": "2023 BMW i4", "make": "BMW", "gen": "First generation (G26)", "year": 2023, "decade": "2020s", "country": "Germany", "cat": "Sedan", "filename": "2020s/2023_bmw_i4.jpg"},
    {"article": "Honda_Civic_(eleventh_generation)", "name": "2023 Honda Civic", "make": "Honda", "gen": "Eleventh generation (FE/FL)", "year": 2023, "decade": "2020s", "country": "Japan", "cat": "Sedan", "filename": "2020s/2023_honda_civic.jpg"},
    {"article": "Toyota_Land_Cruiser_Prado", "name": "2024 Toyota Land Cruiser", "make": "Toyota", "gen": "250 Series", "year": 2024, "decade": "2020s", "country": "Japan", "cat": "SUV", "filename": "2020s/2024_toyota_land_cruiser.jpg"},
    {"article": "Tesla_Cybertruck", "name": "2024 Tesla Cybertruck", "make": "Tesla", "gen": "First generation", "year": 2024, "decade": "2020s", "country": "United States", "cat": "Pickup", "filename": "2020s/2024_tesla_cybertruck.jpg"},
    {"article": "Volvo_EX30", "name": "2024 Volvo EX30", "make": "Volvo", "gen": "First generation", "year": 2024, "decade": "2020s", "country": "Sweden", "cat": "SUV", "filename": "2020s/2024_volvo_ex30.jpg"}
]

HEADERS = {"User-Agent": "CarCharacterEducationalStudy/1.0 (https://github.com/nikiwalkor83/car-character; student@example.edu)"}

def clean_html(text):
    return re.sub(r'<[^>]+>', '', text).strip()

def get_wikipedia_lead_image(article_title):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{article_title}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        orig = data.get("originalimage", {}).get("source", "")
        if not orig:
            return None
        # Convert to upload.wikimedia.org clean URL
        clean_url = re.sub(r'/thumb/([^/]+/[^/]+)/([^/]+)/.*', r'/\1/\2', orig)
        clean_url = clean_url.replace("thumb.wikimedia.org", "upload.wikimedia.org")
        # Extract filename
        file_part = clean_url.split("/")[-1].split("?")[0]
        return clean_url, file_part
    except Exception as e:
        print(f"Error fetching summary for {article_title}: {e}")
        return None

def get_commons_metadata(filename):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(filename)}&prop=imageinfo&iiprop=extmetadata&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            d = json.loads(resp.read().decode("utf-8"))
        pages = d.get("query", {}).get("pages", {})
        for pid, page in pages.items():
            meta = page.get("imageinfo", [{}])[0].get("extmetadata", {})
            artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
            license_str = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
            return artist, license_str
        return "Unknown", "CC BY-SA"
    except Exception as e:
        print(f"Error getting metadata for {filename}: {e}")
        return "Unknown", "CC BY-SA"

def download_and_process(img_url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    tmp_path = target_path + ".tmp"
    req = urllib.request.Request(img_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp, open(tmp_path, "wb") as f:
        f.write(resp.read())

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

print(f"Starting downloads for {len(CARS)} cars...")
success_list = []

for idx, car in enumerate(CARS):
    print(f"[{idx+1}/{len(CARS)}] {car['name']} ({car['article']})...")
    res = get_wikipedia_lead_image(car["article"])
    if not res:
        print(f"  FAILED to get image URL for {car['article']}")
        continue
    img_url, file_name = res
    print(f"  Found image URL: {img_url}")

    # Metadata
    artist, lic = get_commons_metadata(file_name)
    car["orig_url"] = img_url
    car["source"] = "Wikimedia Commons"
    car["license_info"] = f"{lic}; Author: {artist[:60]}"

    try:
        download_and_process(img_url, car["filename"])
        size_kb = os.path.getsize(car["filename"]) / 1024
        print(f"  Successfully saved {car['filename']} ({size_kb:.1f} KB)")
        success_list.append(car)
    except Exception as e:
        print(f"  FAILED to download/process {img_url}: {e}")

    time.sleep(0.4)

print(f"\nFinished! Successfully downloaded {len(success_list)} of {len(CARS)} cars.")

# Append to cars_metadata.csv and cars_metadata.json
# Read existing
with open("cars_metadata.json") as f:
    existing_cars = json.load(f)

existing_filenames = set(c.get("Image filename") for c in existing_cars)

for car in success_list:
    if car["filename"] not in existing_filenames:
        existing_cars.append({
            "Car name": car["name"],
            "Manufacturer": car["make"],
            "Exact model generation": car["gen"],
            "Model year": car["year"],
            "Decade": car["decade"],
            "Country of manufacturer": car["country"],
            "Vehicle category": car["cat"],
            "Image filename": car["filename"],
            "Original image URL": car["orig_url"],
            "Image source": car["source"],
            "Image license/copyright information": car["license_info"]
        })
        existing_filenames.add(car["filename"])

with open("cars_metadata.json", "w") as f:
    json.dump(existing_cars, f, indent=2)

# Write cars_metadata.csv
fieldnames = [
    "Car name", "Manufacturer", "Exact model generation", "Model year",
    "Decade", "Country of manufacturer", "Vehicle category",
    "Image filename", "Original image URL", "Image source", "Image license/copyright information"
]
with open("cars_metadata.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in existing_cars:
        writer.writerow(row)

print(f"Updated cars_metadata.csv and cars_metadata.json (Total cars: {len(existing_cars)})")
