export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  let dx = lon2 - lon1;
  // Handle dateline wrap for shortest path
  if (dx > 180) dx -= 360;
  if (dx < -180) dx += 360;
  
  const dy = lat2 - lat1;
  
  // atan2(dy, dx) returns angle from -PI to PI
  // 0 is East, PI/2 is North, PI is West, -PI/2 is South
  // But we want 0 to be North, 90 to be East, etc.
  let brng = Math.atan2(dy, dx) * 180 / Math.PI;
  // Convert standard math angle to compass bearing
  brng = (90 - brng + 360) % 360;

  const arrows = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];
  const index = Math.round(brng / 45) % 8;
  return arrows[index];
}

export function getProximity(distance: number): number {
  const maxDistance = 20000; // max distance on earth is ~20,000km
  const proximity = Math.max(0, 100 - (distance / maxDistance) * 100);
  return Math.round(proximity);
}
