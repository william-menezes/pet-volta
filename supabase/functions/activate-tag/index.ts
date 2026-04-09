// Supabase Edge Function (Deno) — deploy via Supabase Dashboard/CLI.
// Uses the user's JWT + anon key so RLS remains enforced.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.101.1';

type Json = Record<string, unknown>;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function isPaidPlan(planTier: string | null) {
  return planTier === 'essential' || planTier === 'elite' || planTier === 'guardian';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { ok: false, code: 'METHOD_NOT_ALLOWED', message: 'Método inválido.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(500, { ok: false, code: 'MISSING_ENV', message: 'Configuração ausente.' });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!jwt) {
    return json(401, { ok: false, code: 'UNAUTHENTICATED', message: 'Faça login para ativar a tag.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return json(401, { ok: false, code: 'UNAUTHENTICATED', message: 'Sessão inválida.' });
  }

  const { tagCode, petId } = (await req.json().catch(() => ({}))) as {
    tagCode?: string;
    petId?: string;
  };

  if (!tagCode || !petId) {
    return json(400, { ok: false, code: 'BAD_REQUEST', message: 'Dados inválidos.' });
  }

  const userId = userData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan_tier')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    return json(500, { ok: false, code: 'PROFILE_ERROR', message: 'Não foi possível validar seu plano.' });
  }
  if (!isPaidPlan(profile?.plan_tier ?? null)) {
    return json(403, { ok: false, code: 'PLAN_REQUIRED', message: 'Plano Essential+ necessário.' });
  }

  const { data: pet, error: petError } = await supabase
    .from('pets')
    .select('id')
    .eq('id', petId)
    .maybeSingle();

  if (petError || !pet) {
    return json(404, { ok: false, code: 'PET_NOT_FOUND', message: 'Pet não encontrado.' });
  }

  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id,status')
    .eq('tag_code', tagCode)
    .maybeSingle();

  if (tagError || !tag) {
    return json(404, { ok: false, code: 'TAG_NOT_FOUND', message: 'Tag não encontrada.' });
  }

  if (tag.status !== 'orphan') {
    return json(409, { ok: false, code: 'TAG_NOT_ORPHAN', message: 'Esta tag já está ativada.' });
  }

  // Update is constrained to orphan tags and checked by RLS.
  const { data: updated, error: updateError } = await supabase
    .from('tags')
    .update({
      pet_id: petId,
      activated_by: userId,
      activated_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('tag_code', tagCode)
    .eq('status', 'orphan')
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    return json(500, { ok: false, code: 'UPDATE_FAILED', message: 'Não foi possível ativar a tag.' });
  }

  return json(200, { ok: true });
});
