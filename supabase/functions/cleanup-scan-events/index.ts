import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function requireCronSecret(req: Request) {
  const expected = Deno.env.get('CRON_SECRET');
  if (!expected) return true; // Permite rodar se nÃ£o foi configurado (ambiente dev)
  const provided = req.headers.get('x-cron-secret');
  return provided === expected;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!requireCronSecret(req)) {
      return new Response(JSON.stringify({ error: 'NÃ£o autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabaseAdmin
      .from('scan_events')
      .update({
        ip_hash: null,
        ip_city: null,
        ip_region: null,
        ip_country: null,
        ip_lat: null,
        ip_lon: null,
      })
      .lt('scanned_at', cutoff)
      .or('ip_hash.not.is.null,ip_city.not.is.null,ip_region.not.is.null,ip_country.not.is.null,ip_lat.not.is.null,ip_lon.not.is.null')
      .select('id', { count: 'exact' });

    if (error) {
      console.error('[cleanup-scan-events] Erro ao atualizar:', error);
      return new Response(JSON.stringify({ error: 'Erro ao limpar scan_events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, cutoff, cleanedCount: count ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cleanup-scan-events] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

