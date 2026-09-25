# Country Context Data Dictionary

This data dictionary documents the four country-level contextual variables prepared for the automotive exploration project. All data are sourced from authoritative international statistical organizations (World Bank, OECD / International Transport Forum, and UNECE) and cover the eight vehicle-manufacturing countries represented in the archive (**France, Germany, Italy, Japan, South Korea, Sweden, United Kingdom, and United States**) across the historical scope from **1970 to 2024**.

---

## 1. GDP Per Capita (Constant 2015 US$)

* **Variable Name**: `gdp_per_capita_constant_2015_usd`
* **Definition**: Gross domestic product divided by midyear population, measured in constant 2015 U.S. dollars. GDP is the sum of gross value added by all resident producers in the economy plus any product taxes and minus any subsidies not included in the value of the products.
* **Unit**: Constant 2015 US Dollars ($)
* **Source**: World Bank (*World Development Indicators*)
* **Indicator Code**: `NY.GDP.PCAP.KD`
* **Source URL**: [https://data.worldbank.org/indicator/NY.GDP.PCAP.KD](https://data.worldbank.org/indicator/NY.GDP.PCAP.KD)
* **Available Years**: 1970–2024 (100% complete for all 8 countries; 440 of 440 observations).
* **Known Limitations & Methodological Notes**:
  * Values are inflation-adjusted to 2015 price levels using chain-linked volume measures, enabling consistent longitudinal purchasing power comparisons across decades without inflation distortion.
  * **Germany**: Pre-1991 data corresponds to the Federal Republic of Germany (West Germany). Data from 1991 onward reflects unified Germany. This historical boundary represents a structural shift in both territory and population.

---

## 2. Population Density

* **Variable Name**: `population_density_per_km2`
* **Definition**: Midyear population divided by total land area in square kilometers. Land area is a country's total area, excluding area under inland water bodies, national claims to continental shelf, and exclusive economic zones.
* **Unit**: People per square kilometer (people / km²)
* **Source**: World Bank & UN Food and Agriculture Organization (FAO)
* **Indicator Code**: `EN.POP.DNST`
* **Source URL**: [https://data.worldbank.org/indicator/EN.POP.DNST](https://data.worldbank.org/indicator/EN.POP.DNST)
* **Available Years**: 1970–2023 (100% complete for all 8 countries through 2023; 432 of 440 observations. 2024 is unmeasured/pending annual land survey publication).
* **Known Limitations & Methodological Notes**:
  * Assumes uniform land distribution across national territory, not accounting for mountainous, desert, or unpopulated regions (e.g., northern Sweden). However, national density reliably distinguishes spatially constrained nations (Japan, South Korea, UK) from geographically expansive nations (USA, Sweden).

---

## 3. Urbanization

* **Variable Name**: `urbanization_percent`
* **Definition**: Percentage of the national population living in urban areas as defined by national statistical offices and compiled by the UN Population Division.
* **Unit**: Percentage (%)
* **Source**: World Bank & UN Population Division (*World Urbanization Prospects*)
* **Indicator Code**: `SP.URB.TOTL.IN.ZS`
* **Source URL**: [https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS](https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS)
* **Available Years**: 1970–2024 (100% complete for all 8 countries; 440 of 440 observations).
* **Known Limitations & Methodological Notes**:
  * National statistical agencies use varying threshold criteria for defining "urban" boundaries (e.g., minimum population thresholds, administrative boundaries). However, within each nation, the series is consistently harmonized by the United Nations across time.

---

## 4. Passenger Cars Per 1,000 Inhabitants

* **Variable Name**: `passenger_cars_per_1000`
* **Definition**: Total number of registered passenger road vehicles (motor vehicles designed primarily for the carriage of persons and having a capacity of not more than 9 seated persons, including the driver) divided by the resident population, scaled per 1,000 inhabitants.
* **Unit**: Passenger cars per 1,000 inhabitants (cars / 1,000 people)
* **Source**:
  * **OECD / International Transport Forum (ITF)**: For France, Germany, Italy, Japan, South Korea, Sweden, and United Kingdom.
  * **UNECE Transport Statistics Database / US Department of Transportation (FHWA Table MV-1)**: For United States.
* **Indicator Code**:
  * OECD ITF: `DSD_INDICATORS@DF_EQUIPMENT(1.0)` / `MEASURE: VEHICLES` / `VEHICLE_TYPE: CARS` / `UNIT_MEASURE: 10P3HB`
  * UNECE: `01_en_TRRoadTypVehR_r.px` / `Vehicle category: TR.396 (Passenger cars)` / `Measurement: TR.123 (per 1000 inhabitants)`
* **Source URLs**:
  * [https://stats.oecd.org](https://stats.oecd.org) / [https://sdmx.oecd.org](https://sdmx.oecd.org)
  * [https://w3.unece.org/PXWeb2015/](https://w3.unece.org/PXWeb2015/)
* **Available Years**:
  * **Germany, France, UK, Italy, Japan, South Korea, Sweden**: 1994–2024 (31 consecutive annual observations per country).
  * **United States**: 1993–2023 (31 consecutive annual observations).
  * **1970–1993**: Unmeasured in harmonized international databases. In accordance with data integrity guidelines, missing historical observations are recorded as `NA` / `null` rather than estimated, interpolated, or fabricated.
* **Known Limitations & Methodological Notes**:
  * **Category Definition Discrepancy (USA)**: In Europe and Asia (category M1), SUVs and family passenger vans are classified as passenger cars. In the United States, light trucks (pickups, minivans, and truck-chassis SUVs) have historically been classified under a separate commercial/light-truck category.
  * In the UNECE/FHWA series for the United States:
    * **1993–2005**: Reports total personal light-duty passenger vehicles (cars + passenger light trucks/SUVs), yielding rates around 720–783 per 1,000.
    * **2006–2018**: Reports traditional passenger cars (sedans/coupes/wagons only), yielding rates around 340–461 per 1,000.
    * **2019–2023**: Re-aggregates all personal light-duty vehicles, yielding rates around 766–774 per 1,000.
  * For this reason, the dataset includes a `motorization_source` column to explicitly record whether a figure originated from the OECD ITF European/Asian harmonized registry or UNECE/US DOT FHWA.

---

## Dataset Joining Specifications

* **Primary Join Keys**: `iso3` (ISO 3166-1 alpha-3 code) and `year` (4-digit calendar year).
* **Automotive Dataset Compatibility**: The primary automotive metadata table (`cars_metadata.csv`) contains 204 car models from 1970 to 2024 across the exact same 8 nations. Mapping `cars_metadata.csv$Country of manufacturer` to `iso3` yields a **100% match rate** with zero orphaned records.
