/**
 * Tipos para geolocalização via IP (fallback quando browser geoloc é negado).
 * Provider: ip-api.com (free tier, HTTP only, 45 req/min)
 */

export type LocationType = 'precise' | 'approximate' | 'none';

export interface IpGeoResult {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

export interface ScanLocation {
  type: LocationType;
  /** Coordenadas precisas do browser (type = 'precise') */
  lat?: number;
  lng?: number;
  /** Localização aproximada via IP (type = 'approximate') */
  ipCity?: string;
  ipRegion?: string;
  ipCountry?: string;
  ipLat?: number;
  ipLon?: number;
}

/** Rótulo legível para exibição no histórico de scans */
export function locationTypeLabel(type: LocationType): string {
  switch (type) {
    case 'precise':     return '📍 Localização precisa';
    case 'approximate': return '📌 Localização aproximada (IP)';
    case 'none':        return '📎 Sem localização';
  }
}
