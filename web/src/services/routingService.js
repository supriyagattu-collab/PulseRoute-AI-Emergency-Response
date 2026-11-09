/**
 * PulseRoute Road Network Routing Service
 * Integrates OSRM driving routes with graceful Haversine geodesic fallback.
 * Configurable via Vite environment variable VITE_OSRM_BASE_URL.
 */
import { apiClient } from './api';

const OSRM_PUBLIC_URL = import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org';

/**
 * Great-circle distance between two coordinates in kilometers.
 */
export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Estimate transit time in minutes (45 km/h urban emergency baseline + 2 min dispatch latency).
 */
export const estimateEtaMinutes = (distanceKm) => {
  return Math.max(2, Math.round((distanceKm / 45) * 60 + 2));
};

/**
 * Fallback route builder: returns straight-line waypoint coordinates and Haversine distance.
 */
export const buildFallbackRoute = (waypoints, reason = 'Geodesic baseline calculation') => {
  let totalKm = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    totalKm += haversineDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
  }

  const eta = estimateEtaMinutes(totalKm);
  return {
    coordinates: waypoints.map((p) => [p.lat, p.lng]),
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMinutes: eta,
    isRoadNetwork: false,
    provider: 'Haversine Direct Geodesic (Fallback)',
    fallbackReason: reason,
  };
};

/**
 * Fetch road network route for an array of waypoint objects: [{ lat, lng }, ...]
 * First attempts FastAPI /api/v1/routing/route (which handles server-side OSRM).
 * If FastAPI route fails or is offline, attempts direct client-side OSRM.
 * If both fail or network is unavailable, falls back gracefully to Haversine straight line.
 */
export const fetchRoadRoute = async (waypoints) => {
  if (!waypoints || waypoints.length < 2) {
    return {
      coordinates: (waypoints || []).map((p) => [p.lat, p.lng]),
      distanceKm: 0,
      durationMinutes: 0,
      isRoadNetwork: false,
      provider: 'Insufficient Waypoints',
      fallbackReason: 'At least two coordinates required for routing.',
    };
  }

  // 1. Attempt backend FastAPI routing endpoint
  try {
    const params = {
      start_lat: waypoints[0].lat,
      start_lng: waypoints[0].lng,
      end_lat: waypoints[1].lat,
      end_lng: waypoints[1].lng,
    };
    if (waypoints.length > 2) {
      params.hospital_lat = waypoints[2].lat;
      params.hospital_lng = waypoints[2].lng;
    }

    const res = await apiClient.get('/routing/route', { params, timeout: 3500 });
    if (res.data && res.data.coordinates && res.data.coordinates.length > 0) {
      return {
        coordinates: res.data.coordinates,
        distanceKm: res.data.distance_km,
        durationMinutes: res.data.duration_minutes,
        isRoadNetwork: res.data.is_road_network,
        provider: res.data.provider,
        fallbackReason: res.data.error || null,
      };
    }
  } catch (backendErr) {
    // Backend routing proxy unavailable, try direct client-side OSRM
  }

  // 2. Attempt direct public OSRM service
  try {
    const coordString = waypoints
      .map((p) => `${Number(p.lng).toFixed(6)},${Number(p.lat).toFixed(6)}`)
      .join(';');
    const url = `${OSRM_PUBLIC_URL.replace(/\/+$/, '')}/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
        const primary = json.routes[0];
        // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
        const leafletCoords = primary.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        const distKm = Math.round((primary.distance / 1000) * 10) / 10;
        const durMins = Math.max(1, Math.round(primary.duration / 60));

        return {
          coordinates: leafletCoords,
          distanceKm: distKm,
          durationMinutes: durMins,
          isRoadNetwork: true,
          provider: 'OSRM Road Network',
          fallbackReason: null,
        };
      }
    }
  } catch (osrmErr) {
    // Both failed, proceed to fallback
  }

  // 3. Fallback: Haversine distance and straight-line trajectory
  return buildFallbackRoute(
    waypoints,
    'External OSRM network unavailable; operating in offline geodesic mode.'
  );
};

export default {
  haversineDistanceKm,
  estimateEtaMinutes,
  buildFallbackRoute,
  fetchRoadRoute,
};

