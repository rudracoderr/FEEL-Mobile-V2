/**
 * Converts a degree value to radians.
 */
export function toRadians(value) {
  return (value * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance (in km) between two GeoJSON coordinate
 * pairs ([longitude, latitude]) using the Haversine formula.
 * Returns null if either coordinate array is invalid.
 */
export function calculateDistanceKm(fromCoordinates, toCoordinates) {
  if (!Array.isArray(fromCoordinates) || !Array.isArray(toCoordinates)) return null;

  const [fromLongitude, fromLatitude] = fromCoordinates;
  const [toLongitude, toLatitude] = toCoordinates;

  if (
    ![fromLongitude, fromLatitude, toLongitude, toLatitude].every(
      (value) => typeof value === 'number'
    )
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const lat1 = toRadians(fromLatitude);
  const lat2 = toRadians(toLatitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Formats a distance in km into a human-readable label.
 * Values under 1 km are shown in metres.
 */
export function formatDistanceLabel(distanceKm) {
  if (distanceKm === null || Number.isNaN(distanceKm)) return 'Distance unavailable';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m away`;
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Converts an expo-location reverse-geocode address object into a
 * human-readable single-line string.
 */
export function formatReadableAddress(address) {
  if (!address) return '';
  const streetLine = [address.streetNumber, address.street].filter(Boolean).join(' ').trim();
  const localityLine = [address.city, address.subregion, address.region].filter(Boolean).join(', ').trim();
  return [streetLine || address.name, localityLine].filter(Boolean).join(', ').trim();
}
