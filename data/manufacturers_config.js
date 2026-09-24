/**
 * Central Manufacturer Configuration & Logo Registry
 * 
 * Sourced from VehicleSpecs (vehiclespecs.io) official curated brand assets.
 * Easily update or replace manufacturer logo assets here.
 */

window.MANUFACTURER_LOGOS = {
  "acura": "images/manufacturers/acura.svg",
  "alfa romeo": "images/manufacturers/alfa-romeo.svg",
  "alpine": "images/manufacturers/alpine.svg",
  "aston martin": "images/manufacturers/aston-martin.svg",
  "audi": "images/manufacturers/audi.svg",
  "bentley": "images/manufacturers/bentley.svg",
  "bmw": "images/manufacturers/bmw.svg",
  "bugatti": "images/manufacturers/bugatti.svg",
  "buick": "images/manufacturers/buick.png",
  "cadillac": "images/manufacturers/cadillac.png",
  "chevrolet": "images/manufacturers/chevrolet.png",
  "chrysler": "images/manufacturers/chrysler.svg",
  "datsun": "images/manufacturers/datsun.png",
  "delorean motor company": null, // Note: Not in VehicleSpecs catalog; uses monogram fallback
  "dodge": "images/manufacturers/dodge.png",
  "ferrari": "images/manufacturers/ferrari.svg",
  "fiat": "images/manufacturers/fiat.svg",
  "ford": "images/manufacturers/ford.png",
  "genesis": "images/manufacturers/genesis.svg",
  "gmc": "images/manufacturers/gmc.png",
  "honda": "images/manufacturers/honda.png",
  "hyundai": "images/manufacturers/hyundai.svg",
  "jaguar": "images/manufacturers/jaguar.svg",
  "jeep": "images/manufacturers/jeep.svg",
  "kia": "images/manufacturers/kia.svg",
  "lamborghini": "images/manufacturers/lamborghini.png",
  "lancia": "images/manufacturers/lancia.png",
  "land rover": "images/manufacturers/land-rover.svg",
  "lexus": "images/manufacturers/lexus.png",
  "lincoln": "images/manufacturers/lincoln.svg",
  "lotus": "images/manufacturers/lotus.svg",
  "lucid": "images/manufacturers/lucid.png",
  "mazda": "images/manufacturers/mazda.svg",
  "mclaren": "images/manufacturers/mclaren.svg",
  "mercedes-benz": "images/manufacturers/mercedes-benz.svg",
  "mini": "images/manufacturers/mini.svg",
  "mitsubishi": "images/manufacturers/mitsubishi.svg",
  "nissan": "images/manufacturers/nissan.svg",
  "pagani": "images/manufacturers/pagani.png",
  "peugeot": "images/manufacturers/peugeot.svg",
  "plymouth": "images/manufacturers/plymouth.png",
  "polestar": "images/manufacturers/polestar.png",
  "pontiac": "images/manufacturers/pontiac.png",
  "porsche": "images/manufacturers/porsche.svg",
  "ram": "images/manufacturers/ram.svg",
  "renault": "images/manufacturers/renault.svg",
  "rivian": "images/manufacturers/rivian.svg",
  "saab": "images/manufacturers/saab.png",
  "subaru": "images/manufacturers/subaru.png",
  "tesla": "images/manufacturers/tesla.svg",
  "toyota": "images/manufacturers/toyota.svg",
  "volkswagen": "images/manufacturers/volkswagen.svg",
  "volvo": "images/manufacturers/volvo.svg"
};

/**
 * Derives dynamic manufacturer registry from the active dataset.
 * Ensures data coverage is automatic without hardcoding counts or country lists.
 */
window.buildManufacturerRegistry = function(carsMetadata) {
  const cars = carsMetadata || window.CARS_METADATA || [];
  const logos = window.MANUFACTURER_LOGOS || {};
  const registry = {};

  cars.forEach(car => {
    const rawName = (car["Manufacturer"] || "Unknown").trim();
    const normKey = rawName.toLowerCase();
    const id = normKey.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const country = (car["Country of manufacturer"] || "Unknown").trim();

    if (!registry[normKey]) {
      // Look up logo in mapping or try normalized ID
      let logoPath = logos[normKey] !== undefined ? logos[normKey] : (logos[id] !== undefined ? logos[id] : null);

      registry[normKey] = {
        name: rawName,
        id: id,
        country: country,
        logo: logoPath,
        modelCount: 0,
        cars: []
      };
    }

    registry[normKey].modelCount += 1;
    registry[normKey].cars.push(car);
  });

  return registry;
};
