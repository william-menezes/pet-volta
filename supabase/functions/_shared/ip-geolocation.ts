/**
 * Módulo de geolocalização por IP usando ip-api.com (free tier).
 * Usado como fallback quando browser geoloc é negado pelo encontrador.
 *
 * Limitações free tier:
 * - 45 req/min
 * - Apenas HTTP (não HTTPS) — aceitável para server-to-server no Edge
 * - Accuracy: ~5-50km dependendo do ISP
 */

export interface IpGeoResult {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

/**
 * Consulta ip-api.com para obter localização aproximada a partir do IP.
 * Retorna null em caso de falha (scan continua sem geoloc).
 */
export async function getLocationFromIp(ip: string): Promise<IpGeoResult | null> {
  // IPs locais/privados não têm geoloc
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'success') return null;

    return {
      city: data.city ?? '',
      region: data.regionName ?? '',
      country: data.country ?? '',
      lat: data.lat ?? 0,
      lon: data.lon ?? 0,
    };
  } catch {
    // Falha silenciosa — scan continua sem geoloc aproximada
    return null;
  }
}

/** Extrai o IP real do cliente a partir dos headers do request */
export function extractClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}

/** Gera hash SHA-256 do IP para debounce sem armazenar IP raw */
export async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + 'pet-volta-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
