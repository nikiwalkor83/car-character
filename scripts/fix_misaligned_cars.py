import urllib.request
import urllib.parse
import json
import time
import os
import re
import pandas as pd
from PIL import Image
import io

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CarCharacterResearch/1.0 (contact: student@course.edu)"
}

CAR_UPDATES = [
    {
        "filename": "1980s/1984_dodge_caravan.jpg",
        "title": "File:1984 Dodge Caravan LE (31402563930) (cropped).jpg",
        "car_name": "1984 Dodge Caravan"
    },
    {
        "filename": "1980s/1988_bmw_m3_e30.jpg",
        "title": "File:BMW M3 (E30) IMG 4388.jpg",
        "car_name": "1988 BMW M3 (E30)"
    },
    {
        "filename": "1990s/1991_ford_explorer.jpg",
        "title": "File:1991 Ford Explorer XLT in Tan, front left, 08-06-2022.jpg",
        "car_name": "1991 Ford Explorer"
    },
    {
        "filename": "2000s/2002_cadillac_escalade.jpg",
        "title": "File:2005 Cadillac Escalade Front.jpg",
        "car_name": "2002 Cadillac Escalade"
    },
    {
        "filename": "2000s/2005_chrysler_300c.jpg",
        "title": "File:2005 gray Chrysler 300C front.JPG",
        "car_name": "2005 Chrysler 300C"
    },
    {
        "filename": "1980s/1984_chevrolet_cavalier.jpg",
        "title": "File:1984 Chevrolet Cavalier Type 10 convertible, front left, 03-15-2026.jpg",
        "car_name": "1984 Chevrolet Cavalier"
    },
    {
        "filename": "1980s/1987_mazda_rx7_fc.jpg",
        "title": "File:1988 Mazda RX-7 GXL in Claret Mica, Front Left, 09-10-2023.jpg",
        "car_name": "1987 Mazda RX-7 (FC)"
    },
    {
        "filename": "1980s/1989_land_rover_discovery.jpg",
        "title": "File:Land Rover Discovery Series I Classic-Days 2022 DSC 0072.jpg",
        "car_name": "1989 Land Rover Discovery"
    },
    {
        "filename": "1990s/1995_subaru_impreza.jpg",
        "title": "File:Subaru Impreza Sportswagon (GC) at night front.JPG",
        "car_name": "1995 Subaru Impreza"
    },
    {
        "filename": "1990s/1996_toyota_rav4.jpg",
        "title": "File:1999 Toyota RAV4 4-door, front left, 05-18-2024.jpg",
        "car_name": "1996 Toyota RAV4"
    },
    {
        "filename": "1990s/1999_audi_tt.jpg",
        "title": "File:Audi TT 8N, 1. Genertion, front rechts (2007-05-06 Sp).JPG",
        "car_name": "1999 Audi TT"
    },
    {
        "filename": "2000s/2005_ford_gt.jpg",
        "title": "File:2005 Ford GT coupe (8452001041).jpg",
        "car_name": "2005 Ford GT"
    },
    {
        "filename": "2000s/2006_mazda_3.jpg",
        "title": "File:Mazda 3 front 20071109.jpg",
        "car_name": "2006 Mazda 3"
    },
    {
        "filename": "2000s/2008_subaru_outback.jpg",
        "title": "File:2008 Subaru Outback 2.5, Front Right, 08-05-2020.jpg",
        "car_name": "2008 Subaru Outback"
    },
    {
        "filename": "2010s/2011_nissan_leaf.jpg",
        "title": "File:Nissan Leaf rent‐a‐car Front-RIght.JPG",
        "car_name": "2011 Nissan Leaf"
    },
    {
        "filename": "2010s/2013_toyota_gt86.jpg",
        "title": "File:Red Toyota GT86 (front).jpg",
        "car_name": "2013 Toyota GT86"
    },
    {
        "filename": "2010s/2016_mazda_cx5.jpg",
        "title": "File:Mazda CX-5 (front).jpg",
        "car_name": "2016 Mazda CX-5"
    },
    {
        "filename": "2010s/2017_honda_civic_type_r.jpg",
        "title": "File:Honda CIVIC TYPE R (DBA-FK8).jpg",
        "car_name": "2017 Honda Civic Type R"
    },
    {
        "filename": "1970s/1973_chevrolet_chevelle.jpg",
        "title": "File:1973 Chevrolet Chevelle Laguna.jpg",
        "car_name": "1973 Chevrolet Chevelle"
    },
    {
        "filename": "1970s/1978_saab_99_turbo.jpg",
        "title": "File:1979 Saab 99 Turbo 2.jpg",
        "car_name": "1978 Saab 99 Turbo"
    }
]

def clean_html(text):
    return re.sub(r"<[^>]+>", "", text).strip()

def process_image(img_bytes, dest_path):
    with Image.open(io.BytesIO(img_bytes)) as im:
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
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        im.save(dest_path, "JPEG", quality=85, optimize=True)

def main():
    print("1. Querying metadata from Wikimedia Commons...")
    titles = [item["title"] for item in CAR_UPDATES]
    params = {
        "action": "query",
        "format": "json",
        "titles": "|".join(titles),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata"
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        query_data = json.loads(resp.read().decode("utf-8"))

    pages = query_data.get("query", {}).get("pages", {})
    commons_map = {}
    for p in pages.values():
        title = p.get("title", "")
        if "imageinfo" in p and len(p["imageinfo"]) > 0:
            ii = p["imageinfo"][0]
            img_url = ii.get("url", "")
            meta = ii.get("extmetadata", {})
            artist = clean_html(meta.get("Artist", {}).get("value", "Unknown"))
            lic = clean_html(meta.get("LicenseShortName", {}).get("value", "CC BY-SA"))
            commons_map[title] = {
                "url": img_url,
                "license_info": f"{lic}; Author: {artist[:60]}"
            }

    print(f"Retrieved metadata for {len(commons_map)} of {len(CAR_UPDATES)} images.")

    # Download and process each image
    metadata_lookup = {}
    for idx, item in enumerate(CAR_UPDATES):
        title = item["title"]
        fn = item["filename"]
        car_name = item["car_name"]
        if title not in commons_map:
            print(f"Skipping {car_name} - not found in Commons map!")
            continue

        c_info = commons_map[title]
        img_url = c_info["url"]
        print(f"[{idx+1}/{len(CAR_UPDATES)}] Downloading {car_name} from {img_url}...")
        img_req = urllib.request.Request(img_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                img_data = img_resp.read()
            process_image(img_data, fn)
            print(f"  Successfully saved {fn} ({os.path.getsize(fn)//1024} KB)")
            metadata_lookup[car_name] = {
                "url": img_url,
                "license_info": c_info["license_info"],
                "filename": fn
            }
        except Exception as e:
            print(f"  FAILED to download/process {car_name}: {e}")
        time.sleep(1.2)

    # Now update cars_metadata.json
    print("\n2. Updating cars_metadata.json...")
    with open("cars_metadata.json", "r") as f:
        cars_json = json.load(f)

    for entry in cars_json:
        # Fix Taycan decade
        if entry.get("Car name") == "2020 Porsche Taycan":
            entry["Decade"] = "2020s"

        name = entry.get("Car name")
        if name in metadata_lookup:
            info = metadata_lookup[name]
            entry["Original image URL"] = info["url"]
            entry["Image license/copyright information"] = info["license_info"]
            entry["Image filename"] = info["filename"]

    with open("cars_metadata.json", "w") as f:
        json.dump(cars_json, f, indent=2)

    # Update cars_metadata.csv
    print("3. Updating cars_metadata.csv...")
    df = pd.DataFrame(cars_json)
    df.to_csv("cars_metadata.csv", index=False)

    # Update data/cars_metadata.js
    print("4. Updating data/cars_metadata.js...")
    js_content = f"window.CARS_METADATA = {json.dumps(cars_json)};"
    with open("data/cars_metadata.js", "w") as f:
        f.write(js_content)

    print("All image and metadata updates completed successfully!")

if __name__ == "__main__":
    main()
