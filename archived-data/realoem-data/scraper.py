import os
import re
import json
import time
import random
import urllib.parse
import requests
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

BASE_URL = "https://www.realoem.com"
CAR_URL = "https://www.realoem.com/bmw/enUS/partgrp?id=KB45-THA-03-2009-F02-BMW-740Li"

# All Main Group codes extracted from the base catalog page
GROUPS = {
    "01": "Technical Literature",
    "02": "Service And Scope Of Repair Work",
    "03": "Retrofitting / Conversion / Accessories",
    "11": "Engine",
    "12": "Engine Electrical System",
    "13": "Fuel Preparation System",
    "16": "Fuel Supply",
    "17": "Radiator / Cooling",
    "18": "Exhaust System",
    "22": "Engine And Transmission Suspension",
    "24": "Automatic Transmission",
    "25": "Gearshift",
    "26": "Drive Shaft",
    "31": "Front Axle",
    "32": "Steering",
    "33": "Rear Axle",
    "34": "Brakes",
    "35": "Pedals",
    "36": "Wheels",
    "41": "Bodywork",
    "51": "Vehicle Trim",
    "52": "Seats",
    "54": "Sliding Roof / Folding Top",
    "61": "Vehicle Electrical System",
    "62": "Instruments, Measuring Systems",
    "63": "Lighting",
    "64": "Heater And Air Conditioning",
    "65": "Audio, Navigation, Electronic Systems",
    "66": "Distance Systems, Cruise Control",
    "71": "Equipment Parts",
    "72": "Restraint System And Accessories",
    "83": "Auxiliary Materials",
    "84": "Communication Systems",
    "88": "Value Parts & Packages Service And Repair"
}

def clean_filename(s):
    return re.sub(r'[\\/*?:"<>|]', '_', s).strip()

def scrape_car_catalog():
    print(f"Starting Scraper for KB45 F02 740Li...")
    os.makedirs("r:\\realoem-scraper\\data", exist_ok=True)
    os.makedirs("r:\\realoem-scraper\\diagrams", exist_ok=True)

    session = requests.Session()
    all_data = {}

    # Iterate through each major group
    for mg_code, mg_name in GROUPS.items():
        print(f"\n[{mg_code}] Scraping Group: {mg_name}...")
        group_url = f"{CAR_URL}&mg={mg_code}"
        
        # Rate-limiting cushion
        time.sleep(random.uniform(1.2, 2.5))
        
        try:
            resp = session.get(group_url, headers=HEADERS)
            if resp.status_code != 200:
                print(f"Error loading Group {mg_code}: Status {resp.status_code}")
                continue
                
            soup = BeautifulSoup(resp.text, 'html.parser')
            diagram_links = []
            
            # Find all diagram anchors under this page
            for a in soup.find_all('a'):
                href = a.get('href', '')
                if 'showparts' in href and 'diagId=' in href:
                    title = a.text.strip()
                    if not title:
                        img = a.find('img')
                        if img:
                            title = img.get('alt', '')
                    title = title.replace(" diagram for BMW 7 Series F02 740Li", "").replace("  ", " ").strip()
                    
                    # Uniquify links based on absolute address
                    full_href = BASE_URL + href if href.startswith('/') else href
                    if full_href not in [x['url'] for x in diagram_links]:
                        diagram_links.append({
                            "title": title or "Unnamed Diagram",
                            "url": full_href
                        })
            
            all_data[mg_code] = {
                "group_name": mg_name,
                "url": group_url,
                "diagrams": []
            }
            
            print(f"Found {len(diagram_links)} sub-diagrams under [{mg_name}]. Extracting individual part tables...")
            
            # Scrape individual parts lists inside each sublink diagram
            for idx, diag in enumerate(diagram_links):
                print(f"  -> ({idx+1}/{len(diagram_links)}) Parts for: {diag['title']}...")
                time.sleep(random.uniform(1.0, 2.2))
                
                try:
                    diag_resp = session.get(diag['url'], headers=HEADERS)
                    if diag_resp.status_code != 200:
                        print(f"     Failed to load table. Status: {diag_resp.status_code}")
                        continue
                        
                    diag_soup = BeautifulSoup(diag_resp.text, 'html.parser')
                    
                    # Find diagram image
                    img_elem = diag_soup.find("div", {"id": "div_diagram"})
                    img_url = ""
                    if img_elem:
                        img_img = img_elem.find("img")
                        if img_img:
                            img_url = BASE_URL + img_img.get("src", "")
                    
                    # Find parts list table
                    parts = []
                    table = diag_soup.find("table", {"id": "partsList"})
                    if table:
                        rows = table.find_all("tr")
                        for row in rows:
                            # Skip header row or blank rows
                            if 'class' in row.attrs and 'header' in row.attrs['class']:
                                continue
                            
                            cols = row.find_all("td")
                            if len(cols) >= 4:
                                parts.append({
                                    "pos": cols[0].text.strip(),
                                    "description": cols[1].text.strip(),
                                    "suppl": cols[2].text.strip() if len(cols) > 2 else "",
                                    "qty": cols[3].text.strip() if len(cols) > 3 else "",
                                    "from_date": cols[4].text.strip() if len(cols) > 4 else "",
                                    "to_date": cols[5].text.strip() if len(cols) > 5 else "",
                                    "part_number": cols[6].text.strip() if len(cols) > 6 else "",
                                    "price_approx": cols[7].text.strip() if len(cols) > 7 else "",
                                    "notes": cols[8].text.strip() if len(cols) > 8 else ""
                                })
                    
                    all_data[mg_code]["diagrams"].append({
                        "id": urllib.parse.parse_qs(urllib.parse.urlparse(diag['url']).query).get('diagId', [''])[0],
                        "name": diag['title'],
                        "url": diag['url'],
                        "image_url": img_url,
                        "parts": parts
                    })
                    
                except Exception as ex:
                    print(f"     Error scraping diagram {diag['title']}: {ex}")
            
            # Save progress as we complete each group
            filename = f"r:\\realoem-scraper\\data\\group_{mg_code}_{clean_filename(mg_name)}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(all_data[mg_code], f, indent=2, ensure_ascii=False)
            print(f"Successfully saved group progress to: {filename}")
            
        except Exception as e:
            print(f"Critical error on group {mg_code}: {e}")

    # Save comprehensive ecosystem master file
    all_path = "r:\\realoem-scraper\\all_realoem_parts_catalog.json"
    with open(all_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
    print(f"\n🚀 ALL CAR CATALOUGE SCRAPED! Consolidated master saved to: {all_path}")

if __name__ == "__main__":
    scrape_car_catalog()
