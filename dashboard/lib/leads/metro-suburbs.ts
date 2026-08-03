/** Metro city → suburbs for Find Leads search rotation (AU). */

const METRO_SUBURBS: Record<string, string[]> = {
  sydney: [
    "Sydney CBD",
    "Bondi",
    "Parramatta",
    "Chatswood",
    "Manly",
    "Surry Hills",
    "Newtown",
    "Liverpool",
    "Blacktown",
    "Penrith",
  ],
  melbourne: [
    "Melbourne CBD",
    "Richmond",
    "St Kilda",
    "Brunswick",
    "Footscray",
    "Box Hill",
    "South Yarra",
    "Carlton",
  ],
  brisbane: [
    "Brisbane CBD",
    "South Bank",
    "Fortitude Valley",
    "Chermside",
    "Indooroopilly",
    "Sunnybank",
  ],
  perth: [
    "Perth CBD",
    "Fremantle",
    "Subiaco",
    "Joondalup",
    "Cannington",
  ],
  adelaide: [
    "Adelaide CBD",
    "Glenelg",
    "Norwood",
    "Prospect",
    "Marion",
  ],
};

export function normalizeMetroKey(city: string): string {
  return String(city || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Returns suburb list for known metros; null if city is not a mapped metro. */
export function getMetroSuburbs(city: string): string[] | null {
  const key = normalizeMetroKey(city);
  if (!key) return null;

  if (METRO_SUBURBS[key]) return METRO_SUBURBS[key];

  for (const metro of Object.keys(METRO_SUBURBS)) {
    if (
      key === metro ||
      key.startsWith(metro + " ") ||
      key.startsWith(metro + ",")
    ) {
      return METRO_SUBURBS[metro];
    }
  }
  return null;
}

/**
 * Round-robin suburb from prior campaign count.
 * campaignCount = how many campaigns already exist for this business_type + city.
 */
export function pickSuburb(
  city: string,
  campaignCount: number
): { suburb: string; metro: string } | null {
  const suburbs = getMetroSuburbs(city);
  if (!suburbs || suburbs.length === 0) return null;

  const idx =
    Number.isFinite(campaignCount) && campaignCount > 0
      ? Math.abs(Math.floor(campaignCount)) % suburbs.length
      : 0;

  return {
    suburb: suburbs[idx],
    metro: normalizeMetroKey(city).split(/[,\s]/)[0] || city,
  };
}
