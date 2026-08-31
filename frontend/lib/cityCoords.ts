/**
 * Approximate lon/lat for each city in the known list, used only to place
 * glowing dots on the stylized "live network" map widget. This is a
 * decorative visualization, not a navigation-grade map — coordinates are
 * rounded to city-center precision.
 */
export const CITY_COORDS: Record<string, [number, number]> = {
  "Toshkent": [69.3, 41.3],
  "Andijon": [72.34, 40.78],
  "Namangan": [71.67, 41.0],
  "Farg'ona": [71.78, 40.38],
  "Marg'ilon": [71.72, 40.47],
  "Qo'qon": [70.94, 40.53],
  "Samarqand": [66.98, 39.65],
  "Buxoro": [64.42, 39.77],
  "Qarshi": [65.8, 38.86],
  "Termiz": [67.28, 37.22],
  "Guliston": [68.78, 40.49],
  "Jizzax": [67.84, 40.12],
  "Navoiy": [65.38, 40.1],
  "Nukus": [59.6, 42.46],
  "Urganch": [60.63, 41.55],
  "Xiva": [60.36, 41.38],
  "Angren": [70.14, 41.02],
  "Chirchiq": [69.58, 41.47],
  "Olmaliq": [69.6, 40.85],
  "Bekobod": [69.27, 40.22],
  "Kogon": [64.55, 39.72],
  "Denov": [67.9, 38.28],
  "Shahrisabz": [66.83, 39.05],
  "Kitob": [66.9, 39.1],
  "Yangiyo'l": [69.05, 41.11],
  "Gazalkent": [70.0, 41.57],
  "Zomin": [68.38, 39.98],
  "Koson": [65.57, 39.03],
  "Muborak": [65.17, 38.97],
  "Chust": [71.23, 41.0],
  "Kosonsoy": [71.55, 41.25],
  "Asaka": [72.24, 40.63],
  "Xonobod": [72.65, 40.72],
  "Beruniy": [60.75, 41.69],
  "Shovot": [60.32, 41.62],
  "Nurota": [65.69, 40.56],
  "Konimex": [65.85, 40.25],
  "G'ijduvon": [64.68, 40.1],
  "Kagan": [64.55, 39.72],
  "Yangiyer": [68.82, 40.29],
  "Sirdaryo": [68.66, 40.84],
  "Baxt": [68.66, 40.44],
  "Boysun": [67.2, 38.2],
};

// Rough simplified outline of Uzbekistan (lon, lat), decorative only.
export const COUNTRY_OUTLINE: [number, number][] = [
  [56.0, 45.5],
  [58.5, 45.3],
  [61.0, 44.5],
  [63.5, 44.9],
  [66.0, 45.0],
  [68.5, 44.4],
  [70.0, 42.5],
  [71.0, 42.8],
  [73.0, 41.0],
  [72.0, 39.8],
  [70.5, 39.4],
  [69.5, 38.0],
  [68.0, 37.0],
  [66.5, 37.5],
  [64.5, 38.2],
  [62.0, 38.0],
  [60.0, 39.5],
  [58.5, 41.5],
  [56.5, 43.0],
  [56.0, 45.5],
];

const LON_MIN = 56.0;
const LON_MAX = 73.0;
const LAT_MIN = 37.0;
const LAT_MAX = 45.5;

export const MAP_WIDTH = 100;
export const MAP_HEIGHT = 50;

export function project([lon, lat]: [number, number]): [number, number] {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT;
  return [x, y];
}

export function outlinePath(): string {
  return (
    COUNTRY_OUTLINE.map((pt, i) => {
      const [x, y] = project(pt);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z"
  );
}
