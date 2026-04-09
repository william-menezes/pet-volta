import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { extractClientIp, getLocationFromIp, hashIp } from '../_shared/ip-geolocation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Tempo de debounce em minutos — mesmo IP + tag não gera 2 notificações */
const DEBOUNCE_MINUTES = 5;

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const {
      tagCode,
      lat,
      lng,
      message,
      ipLocationFallback = false,
    } = body as {
      tagCode: string;
      lat?: number;
      lng?: number;
      message?: string;
      ipLocationFallback?: boolean;
    };

    if (!tagCode) {
      return new Response(JSON.stringify({ error: 'tagCode obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Busca a tag e o pet vinculado
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id, pet_id, status, pets(id, name, status, owner_id)')
      .eq('tag_code', tagCode)
      .eq('status', 'active')
      .maybeSingle();

    if (tagError || !tag || !tag.pet_id) {
      return new Response(JSON.stringify({ error: 'Tag não encontrada ou inativa' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrai e hash o IP para debounce/privacidade
    const clientIp = extractClientIp(req);
    const ipHash = await hashIp(clientIp);

    // Verifica debounce: mesmo tag + ip_hash nos últimos DEBOUNCE_MINUTES
    const debounceTs = new Date(Date.now() - DEBOUNCE_MINUTES * 60 * 1000).toISOString();
    const { data: recentScan } = await supabase
      .from('scan_events')
      .select('id')
      .eq('tag_id', tag.id)
      .eq('ip_hash', ipHash)
      .gte('scanned_at', debounceTs)
      .maybeSingle();

    if (recentScan) {
      // Debounce ativo — ignora silenciosamente
      return new Response(JSON.stringify({ ok: true, debounced: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determina tipo de localização e dados de geoloc
    let locationType: 'precise' | 'approximate' | 'none' = 'none';
    let ipCity: string | null = null;
    let ipRegion: string | null = null;
    let ipCountry: string | null = null;
    let ipLat: number | null = null;
    let ipLon: number | null = null;

    if (lat != null && lng != null) {
      locationType = 'precise';
    } else if (ipLocationFallback) {
      const geoResult = await getLocationFromIp(clientIp);
      if (geoResult) {
        locationType = 'approximate';
        ipCity = geoResult.city;
        ipRegion = geoResult.region;
        ipCountry = geoResult.country;
        ipLat = geoResult.lat;
        ipLon = geoResult.lon;
      }
    }

    // Registra o scan_event
    const { data: scanEvent, error: scanError } = await supabase
      .from('scan_events')
      .insert({
        tag_id: tag.id,
        pet_id: tag.pet_id,
        latitude: lat ?? null,
        longitude: lng ?? null,
        ip_city: ipCity,
        ip_region: ipRegion,
        ip_country: ipCountry,
        ip_lat: ipLat,
        ip_lon: ipLon,
        location_type: locationType,
        ip_hash: ipHash,
        user_agent: req.headers.get('user-agent') ?? null,
        message: message ?? null,
        notified: false,
      })
      .select('id')
      .single();

    if (scanError) {
      console.error('[scan] Erro ao inserir scan_event:', scanError);
      return new Response(JSON.stringify({ error: 'Erro ao registrar scan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Dispara notificação de forma assíncrona (sem await para não bloquear resposta)
    EdgeRuntime.waitUntil(
      supabase.functions.invoke('send-notification', {
        body: {
          scanEventId: scanEvent.id,
          petId: tag.pet_id,
          ownerId: (tag.pets as any).owner_id,
          locationType,
          lat,
          lng,
          ipCity,
          ipRegion,
          message,
        },
      }),
    );

    return new Response(JSON.stringify({ ok: true, scanEventId: scanEvent.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[scan] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
