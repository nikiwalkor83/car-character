import os
import json
import csv
import re
import time
import urllib.request
import urllib.parse
from PIL import Image

HEADERS = {
    "User-Agent": "CarCharacterBot/1.0 (https://github.com/nikiwalkor83/car-character; contact: nikiwalkor83@gmail.com) Python-urllib/3.12"
}

# Curated Wikipedia articles or exact Wikimedia queries to ensure exact generation match
CURATED_TARGETS = {
    "1960 Austin Mini": "Mini",
    "1961 Jaguar E-Type": "Jaguar_E-Type",
    "1962 Ferrari 250 GTO": "Ferrari_250_GTO",
    "1963 Porsche 911": "Porsche_911_(classic)",
    "1963 Chevrolet Corvette Sting Ray": "Chevrolet_Corvette_(C2)",
    "1964 Aston Martin DB5": "Aston_Martin_DB5",
    "1964 Ford Mustang": "Ford_Mustang_(first_generation)",
    "1964 Pontiac GTO": "1964 Pontiac GTO front",
    "1965 Alfa Romeo Giulia Sprint GTA": "Alfa_Romeo_GTA",
    "1965 Shelby Cobra 427": "AC_Cobra",
    "1966 Lamborghini Miura": "Lamborghini_Miura",
    "1966 Toyota 2000GT": "Toyota_2000GT",
    "1966 Volvo 144": "Volvo_140_Series",
    "1967 Chevrolet Camaro": "Chevrolet_Camaro_(first_generation)",
    "1967 Mazda Cosmo Sport": "Mazda_Cosmo",
    "1967 Volkswagen Type 2 Bus": "Volkswagen_Type_2_(T2)",
    "1968 Dodge Charger": "Dodge_Charger_(B-body)",
    "1968 BMW 2002": "BMW_02_Series",
    "1968 Ford GT40 Mk I": "Ford_GT40",
    "1969 Nissan Skyline 2000GT-R": "Nissan Skyline 2000GT-R PGC10 front",
    "1969 Plymouth Road Runner": "Plymouth_Road_Runner",

    # 1970s
    "1970 Dodge Challenger R/T": "Dodge_Challenger_(first_generation)",
    "1970 Range Rover Classic": "Range_Rover_Classic",
    "1971 Alfa Romeo Montreal": "Alfa_Romeo_Montreal",
    "1972 BMW 520": "BMW_5_Series_(E12)",
    "1972 Fiat 126": "Fiat_126",
    "1973 Lancia Stratos HF": "Lancia_Stratos",
    "1974 Lamborghini Countach LP400": "Lamborghini_Countach",
    "1974 Volvo 240": "Volvo_200_Series",
    "1975 Ferrari 308 GTB": "Ferrari_308_GTB/GTS",
    "1975 Toyota Celica": "Toyota_Celica_(first_generation)",
    "1976 Lotus Esprit S1": "Lotus Esprit S1 front",
    "1976 Renault 5 Alpine": "Renault 5 Alpine front",
    "1977 Aston Martin V8 Vantage": "Aston_Martin_V8_Vantage_(1977)",
    "1977 Chevrolet Caprice": "1977 Chevrolet Caprice",
    "1978 Mazda RX-7 (SA22C)": "Mazda RX-7 SA22C front",
    "1978 Subaru BRAT": "Subaru_BRAT",
    "1978 Lincoln Continental Mark V": "Continental_Mark_V",
    "1979 Mercedes-Benz G-Class (W460)": "Mercedes-Benz W460 front",
    "1979 Ford Fox Mustang": "Ford_Mustang_(third_generation)",
    "1979 Toyota Hilux": "Toyota Hilux N30 front",
    "1979 Honda Prelude": "Honda Prelude SN front",

    # 1980s
    "1980 Fiat Panda": "1984 Fiat Panda 45 S front",
    "1981 Renault 5 Turbo": "Renault_5_Turbo",
    "1982 Chevrolet Camaro Z28": "1982 Chevrolet Camaro Z28 front",
    "1982 Porsche 944": "Porsche_944",
    "1983 Peugeot 205": "Peugeot_205",
    "1983 Toyota Sprinter Trueno (AE86)": "Toyota Sprinter Trueno AE86 front",
    "1984 Honda CRX": "Honda Ballade sports CR-X 1983",
    "1985 Ford Sierra RS Cosworth": "Ford_Sierra_RS_Cosworth",
    "1985 Lancia Delta HF 4WD": "Lancia Delta HF 4WD front",
    "1985 Saab 9000": "Saab_9000",
    "1986 Porsche 959": "Porsche_959",
    "1986 Toyota MR2 (AW11)": "1987 Toyota MR2 T-Bar AW11 red",
    "1987 Buick GNX": "1987 Buick GNX front",
    "1987 Ferrari F40": "Ferrari_F40",
    "1987 Mitsubishi Starion": "Mitsubishi_Starion",
    "1988 Honda CR-X Si": "1991 Honda CRX Si in Rio Red",
    "1988 Volvo 740 Turbo": "Volvo 740 Turbo front",
    "1989 Chevrolet Corvette ZR-1": "Chevrolet Corvette ZR-1 C4 1995",
    "1989 Nissan Skyline GT-R (R32)": "Nissan Skyline GT-R R32 front",
    "1989 Subaru Legacy": "Subaru_Legacy_(first_generation)",
    "1989 Mercedes-Benz 500SL (R129)": "Mercedes-Benz_SL-Class_(R129)",

    # 1990s
    "1990 Acura NSX": "Honda_NSX_(first_generation)",
    "1991 GMC Syclone": "GMC_Syclone",
    "1991 Mazda RX-7 (FD)": "Mazda RX-7 FD front",
    "1992 McLaren F1": "McLaren_F1",
    "1992 Mitsubishi Lancer Evolution I": "1992 Mitsubishi Lancer GSR Evolution.jpg",
    "1993 Toyota Supra Turbo (A80)": "Toyota Supra A80 front",
    "1994 Audi RS2 Avant": "Audi_RS_2_Avant",
    "1994 Ferrari F355": "Ferrari_F355",
    "1994 Subaru Impreza 555": "Subaru Impreza GC8 front",
    "1995 BMW M3 (E36)": "BMW M3 E36 front",
    "1995 Honda Integra Type R (DC2)": "Honda Integra Type R DC2 front",
    "1995 Porsche 911 (993)": "Porsche_993",
    "1996 Dodge Viper GTS": "Dodge Viper GTS front",
    "1996 Lotus Elise Series 1": "Lotus Elise Series 1 front",
    "1997 Plymouth Prowler": "Plymouth_Prowler",
    "1997 Honda CR-V": "Honda_CR-V_(first_generation)",
    "1998 Alfa Romeo 156": "Alfa_Romeo_156",
    "1998 Land Rover Defender 90": "Defender90.JPG",
    "1999 Nissan Skyline GT-R (R34)": "2001 Nissan Skyline GT-R V-Spec II R34.jpg",
    "1999 Pagani Zonda C12": "Pagani_Zonda",
    "1999 Porsche 911 GT3 (996)": "Porsche 996 GT3 front",

    # 2000s
    "2000 BMW M3 (E46)": "BMW M3 E46 front",
    "2000 Lotus Exige Series 1": "File:Lotus Exige S1 london.jpg",
    "2001 Chevrolet Corvette Z06 (C5)": "Chevrolet Corvette C5 Z06 front",
    "2002 Ferrari Enzo": "Enzo_Ferrari_(automobile)",
    "2002 Honda Civic Type R (EP3)": "Honda Civic Type R EP3 front",
    "2003 Bentley Continental GT": "File:2005 green Bentley Continental GT front.JPG",
    "2003 Mitsubishi Lancer Evolution VIII": "File:Mitsubishi GH-CT9A Lancer Evolution Ⅷ MR GSR (22092313345).jpg",
    "2004 Porsche Carrera GT": "Porsche_Carrera_GT",
    "2004 Subaru Impreza WRX STI": "Subaru Impreza WRX STI 2004 front",
    "2004 Volkswagen Golf R32 (Mk4)": "Volkswagen Golf R32 Mk4 front",
    "2005 Aston Martin V8 Vantage": "Aston_Martin_V8_Vantage_(2005)",
    "2005 Bugatti Veyron 16.4": "Bugatti_Veyron",
    "2005 Chevrolet Corvette (C6)": "Chevrolet_Corvette_(C6)",
    "2006 Audi RS4 (B7)": "Audi RS4 B7 front",
    "2006 Ford Mustang GT (S197)": "Ford Mustang S197 GT front",
    "2006 Porsche Cayman S (987)": "Porsche Cayman 987 front",
    "2007 BMW M3 (E92)": "BMW M3 E92 front",
    "2007 Mini Cooper S (R56)": "Mini Cooper S R56 front",
    "2008 Dodge Challenger SRT8": "File:Dodge Challenger 2008 SRT8 NoseOn Tall LakeMirrorClassic 17Oct09 (14414125607).jpg",
    "2008 Hyundai Genesis Coupe": "Hyundai_Genesis_Coupe",
    "2009 Ferrari 458 Italia": "Ferrari_458_Italia",

    # 2010s
    "2010 Lexus LFA": "Lexus_LFA",
    "2011 BMW 1 Series M Coupe": "BMW_1_Series_M_Coupé",
    "2011 Ferrari FF": "Ferrari_FF",
    "2012 Ford Focus ST": "File:2013 Ford Focus ST, Front Right, 09-06-2021.jpg",
    "2012 Subaru BRZ": "File:Osaka Motor Show 2012 - Subaru BRZ (ZC6).JPG",
    "2013 Alfa Romeo 4C": "Alfa_Romeo_4C",
    "2013 Chevrolet Corvette Stingray (C7)": "Chevrolet_Corvette_(C7)",
    "2013 McLaren P1": "McLaren_P1",
    "2013 Porsche 918 Spyder": "Porsche_918_Spyder",
    "2014 BMW i8": "BMW_i8",
    "2014 Dodge Challenger SRT Hellcat": "Dodge Challenger SRT Hellcat front",
    "2014 Ferrari LaFerrari": "LaFerrari",
    "2015 Audi R8 V10 Plus": "File:Audi R8 V10 Plus 5.2 FSI (Typ 4S, 2020) (52566233006).jpg",
    "2015 Mazda MX-5 Miata (ND)": "Mazda_MX-5_(ND)",
    "2016 Ford Focus RS": "Ford Focus RS Mk3 front",
    "2017 Alfa Romeo Giulia Quadrifoglio": "Alfa Romeo Giulia Quadrifoglio front",
    "2017 Bugatti Chiron": "Bugatti_Chiron",
    "2017 Kia Stinger GT": "Kia_Stinger",
    "2018 Alpine A110": "Alpine_A110_(2017)",
    "2018 Genesis G70": "Genesis_G70",
    "2019 Hyundai Veloster N": "File:2019 Hyundai Veloster N front 4.2.18.jpg",

    # 2020s
    "2020 Land Rover Defender 110": "Land_Rover_Defender_(L663)",
    "2020 Polestar 2": "Polestar_2",
    "2021 BMW M4 (G82)": "BMW M4 G82 front",
    "2021 Genesis GV70": "Genesis_GV70",
    "2021 Lucid Air": "Lucid_Air",
    "2021 Mercedes-Benz S-Class (W223)": "Mercedes-Benz_S-Class_(W223)",
    "2021 Ram 1500 TRX": "Ram 1500 TRX front",
    "2022 Cadillac CT5-V Blackwing": "Cadillac CT5-V Blackwing front",
    "2022 Ferrari 296 GTB": "Ferrari_296_GTB",
    "2022 Ford F-150 Lightning": "Ford_F-150_Lightning",
    "2022 Hyundai Elantra N": "File:2022 Hyundai Elantra N in Fiery Red, Front Left, 04-18-2022.jpg",
    "2022 Nissan Z (RZ34)": "Nissan_Z_(RZ34)",
    "2022 Subaru WRX (VB)": "Subaru WRX VB front",
    "2023 Chevrolet Corvette Z06 (C8)": "Chevrolet Corvette C8 Z06 front",
    "2023 Dodge Hornet": "Dodge Hornet 2023 front",
    "2023 Honda Civic Type R (FL5)": "Honda Civic Type R FL5 front",
    "2023 Lotus Eletre": "Lotus_Eletre",
    "2023 Toyota GR Corolla": "Toyota GR Corolla front",
    "2024 Aston Martin DB12": "Aston_Martin_DB12",
    "2024 Ford Mustang Dark Horse": "Ford Mustang Dark Horse front",
    "2024 Hyundai Ioniq 5 N": "Hyundai Ioniq 5 N front"
}

def clean_html(text):
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", str(text)).strip()

def safe_request(url, is_json=True, retries=4):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r:
                data = r.read()
                if is_json:
                    return json.loads(data.decode("utf-8", errors="ignore"))
                return data
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait_time = 3 * (attempt + 1)
                retry_after = e.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait_time = int(retry_after) + 1
                    except ValueError:
                        pass
                print(f"    [Rate limit 429] Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            elif e.code in (500, 502, 503, 504):
                time.sleep(2 * (attempt + 1))
            else:
                return None
        except Exception:
            time.sleep(1)
    return None

def get_commons_metadata(filename):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(filename)}&prop=imageinfo&iiprop=extmetadata&format=json"
    d = safe_request(url, is_json=True)
    if d:
        pages = d.get("query", {}).get("pages", {})
        for pid, p in pages.items():
            meta = p.get("imageinfo", [{}])[0].get("extmetadata", {})
            artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
            license_str = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
            return artist, license_str
    return "Unknown", "CC BY-SA"

def get_wikipedia_lead_image(article_title):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(article_title)}"
    d = safe_request(url, is_json=True)
    if not d:
        return None
    orig = d.get("originalimage", {}).get("source")
    if not orig:
        return None
    clean_url = orig.split("?")[0]
    clean_url = re.sub(r"/thumb/([^/]+/[^/]+)/([^/]+)/.*", r"/\1/\2", clean_url)
    clean_url = clean_url.replace("thumb.wikimedia.org", "upload.wikimedia.org")
    if not clean_url.lower().endswith((".jpg", ".jpeg", ".png")):
        return None
    fn = clean_url.split("/")[-1]
    artist, license_str = get_commons_metadata(fn)
    return {
        "title": f"File:{fn}",
        "url": clean_url,
        "artist": artist,
        "license": license_str,
        "desc": d.get("description", "")
    }

def get_commons_file_info(file_title):
    if not file_title.startswith("File:"):
        file_title = f"File:{file_title}"
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    d = safe_request(url, is_json=True)
    if not d:
        return None
    pages = d.get("query", {}).get("pages", {})
    for pid, p in pages.items():
        if pid == "-1":
            return None
        info = p.get("imageinfo", [{}])[0]
        meta = info.get("extmetadata", {})
        artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
        license_str = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
        return {
            "title": p.get("title"),
            "url": info.get("url", "").split("?")[0],
            "artist": artist,
            "license": license_str,
            "desc": clean_html(meta.get("ImageDescription", {}).get("value", ""))
        }
    return None

def search_wikimedia_commons(query):
    encoded = urllib.parse.quote(query)
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={encoded}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata&format=json"
    d = safe_request(url, is_json=True)
    if not d:
        return []
    candidates = []
    pages = d.get("query", {}).get("pages", {})
    for pid, p in pages.items():
        t = p.get("title", "")
        tl = t.lower()
        if any(bad in tl for bad in [
            "interior", "engine", "motor", "dashboard", "wheel", "speedometer",
            "logo", "badge", "brochure", "drawing", "diagram", "stamp",
            "diecast", "hot wheels", "scale model", "lego", "matchbox", "steering"
        ]):
            continue
        info = p.get("imageinfo", [{}])[0]
        u = info.get("url", "").split("?")[0]
        w = info.get("width", 0)
        h = info.get("height", 0)
        if not u.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        if w < 600 or w < h:
            continue
        meta = info.get("extmetadata", {})
        artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
        license_str = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
        desc = clean_html(meta.get("ImageDescription", {}).get("value", ""))
        candidates.append({
            "title": t,
            "url": u,
            "width": w,
            "height": h,
            "artist": artist,
            "license": license_str,
            "desc": desc
        })
    return candidates

def score_candidate(cand, car):
    text = (cand["title"] + " " + cand.get("desc", "")).lower()
    score = 0
    make = car["Manufacturer"].lower()
    year = str(car["Model year"])
    
    if make not in text:
        return -100
    score += 25
    
    if year in text:
        score += 30
        
    name_parts = car["Car name"].lower().replace(year, "").replace(make, "").split()
    for part in name_parts:
        if len(part) > 2 and part in text:
            score += 15
            
    gen_parts = re.findall(r"[A-Za-z0-9]+", car["Exact model generation"].lower())
    for gp in gen_parts:
        if len(gp) >= 3 and gp not in ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "generation", "series", "facelift", "mark", "body", "type", "platform"] and gp in text:
            score += 25
            
    if "front" in text:
        score += 10
    if "side" in text:
        score += 5
    if "rear" in text:
        score -= 10
        
    return score

def get_thumbnail_url(orig_url, width=1280):
    match = re.search(r"https://upload\.wikimedia\.org/wikipedia/commons/([0-9a-f]/[0-9a-f]{2})/([^/?#]+)", orig_url)
    if match:
        path_part = match.group(1)
        filename = match.group(2)
        return f"https://upload.wikimedia.org/wikipedia/commons/thumb/{path_part}/{filename}/{width}px-{filename}"
    return orig_url

def download_and_process(img_url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    tmp_path = target_path + ".tmp"
    
    # Try 1280px thumbnail first
    thumb_url = get_thumbnail_url(img_url, width=1280)
    data = safe_request(thumb_url, is_json=False)
    if not data:
        # Fall back to original url
        data = safe_request(img_url, is_json=False)
        
    if not data:
        raise Exception("Failed to download image data")

    with open(tmp_path, "wb") as f:
        f.write(data)

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

def save_all_datasets(cars):
    with open("cars_metadata.json", "w", encoding="utf-8") as f:
        json.dump(cars, f, indent=2, ensure_ascii=False)
        
    fieldnames = [
        "Car name", "Manufacturer", "Exact model generation", "Model year",
        "Decade", "Country of manufacturer", "Vehicle category",
        "Image filename", "Original image URL", "Image source", "Image license/copyright information"
    ]
    with open("cars_metadata.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for c in cars:
            row = {fn: c.get(fn, "") for fn in fieldnames}
            writer.writerow(row)
            
    with open("data/cars_metadata.js", "w", encoding="utf-8") as f:
        f.write(f"window.CARS_METADATA = {json.dumps(cars, ensure_ascii=False)};\n")

def find_best_image(car):
    name = car["Car name"]
    make = car["Manufacturer"]
    gen = car["Exact model generation"]
    year = str(car["Model year"])

    # 1. Check curated target first
    if name in CURATED_TARGETS:
        tgt = CURATED_TARGETS[name]
        if tgt.startswith("File:") or tgt.lower().endswith((".jpg", ".jpeg", ".png")):
            info = get_commons_file_info(tgt)
            if info:
                return info
        elif not " " in tgt:
            # It is a Wikipedia article title
            lead = get_wikipedia_lead_image(tgt)
            if lead:
                return lead
        else:
            # It is an exact Commons search query
            cands = search_wikimedia_commons(tgt)
            if cands:
                return cands[0]

    clean_name = re.sub(r"\(.*?\)", "", name).strip()
    clean_gen = re.sub(r"\(.*?\)", "", gen).strip()
    no_yr = clean_name.replace(year, "").strip()
    
    queries = [
        f"{name} front",
        f"{make} {clean_gen} front",
        f"{clean_name} front",
        f"{make} {no_yr} front",
        f"{name}",
        f"{make} {clean_gen}",
        f"{clean_name}"
    ]
    
    seen_urls = set()
    all_cands = []
    for q in queries:
        cands = search_wikimedia_commons(q)
        for c in cands:
            if c["url"] not in seen_urls:
                seen_urls.add(c["url"])
                all_cands.append(c)
        if len(all_cands) >= 12:
            break
            
    scored = [(score_candidate(c, car), c) for c in all_cands]
    scored.sort(key=lambda x: x[0], reverse=True)
    if scored and scored[0][0] > 0:
        return scored[0][1]
        
    return None

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Download images for missing cars")
    parser.add_argument("--decade", type=str, default="", help="Specific decade to process (e.g. 1960s)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of cars to process")
    parser.add_argument("--force", action="store_true", help="Force re-download even if file exists")
    parser.add_argument("--car", type=str, default="", help="Process a specific car by name substring")
    args = parser.parse_args()

    with open("cars_metadata.json", "r", encoding="utf-8") as f:
        cars = json.load(f)

    target_cars = []
    for c in cars:
        if args.car and args.car.lower() not in c["Car name"].lower():
            continue
        if not args.force and c.get("Image filename") and os.path.exists(c["Image filename"]) and os.path.getsize(c["Image filename"]) > 5000:
            continue
        if args.decade and c.get("Decade") != args.decade:
            continue
        target_cars.append(c)

    if args.limit > 0:
        target_cars = target_cars[:args.limit]

    print(f"Total cars to process: {len(target_cars)} (Filter: decade={args.decade or 'ALL'}, car={args.car or 'ALL'}, force={args.force})")

    success_count = 0
    fail_count = 0

    for idx, car in enumerate(target_cars):
        name = car["Car name"]
        dec = car["Decade"]
        year = car["Model year"]
        slug = name.lower()
        slug = re.sub(r"[^a-z0-9]+", "_", slug).strip("_")
        target_filename = f"{dec}/{slug}.jpg"

        print(f"[{idx+1}/{len(target_cars)}] Processing {name} ({dec})...")

        if not args.force and os.path.exists(target_filename) and os.path.getsize(target_filename) > 5000:
            print(f"  File {target_filename} already exists. Updating metadata.")
            car["Image filename"] = target_filename
            if not car.get("Image source"):
                car["Image source"] = "Wikimedia Commons"
            success_count += 1
            save_all_datasets(cars)
            continue

        best = find_best_image(car)
        if not best:
            print(f"  FAILED to find image for {name}")
            fail_count += 1
            continue

        try:
            print(f"  Downloading from: {best['url']}")
            download_and_process(best["url"], target_filename)
            size_kb = os.path.getsize(target_filename) / 1024
            print(f"  Successfully saved {target_filename} ({size_kb:.1f} KB)")
            car["Image filename"] = target_filename
            car["Original image URL"] = best["url"]
            car["Image source"] = "Wikimedia Commons"
            artist = best.get("artist", "Unknown")
            lic = best.get("license", "CC BY-SA")
            car["Image license/copyright information"] = f"{lic}; Author: {artist}"
            success_count += 1
            save_all_datasets(cars)
        except Exception as e:
            print(f"  Error downloading {name}: {e}")
            fail_count += 1

        time.sleep(0.8)

    print(f"\nProcessing complete: {success_count} succeeded, {fail_count} failed.")

if __name__ == "__main__":
    main()
