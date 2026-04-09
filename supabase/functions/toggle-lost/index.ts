import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ToggleLostPayload {
  petId: string;
  lost: boolean;
  rewardAmountCents?: number;
  lostDescription?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth obrigatória — usa JWT do usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } },
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Obtém usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json() as ToggleLostPayload;
    const { petId, lost, rewardAmountCents, lostDescription } = payload;

    if (!petId) {
      return new Response(JSON.stringify({ error: 'petId obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verifica que o pet pertence ao usuário autenticado
    const { data: pet } = await supabase
      .from('pets')
      .select('id, public_slug, owner_id')
      .eq('id', petId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!pet) {
      return new Response(JSON.stringify({ error: 'Pet não encontrado ou sem permissão' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Monta o update
    const updatePayload: Record<string, unknown> = {
      status: lost ? 'lost' : 'safe',
      updated_at: new Date().toISOString(),
    };

    if (lost) {
      updatePayload['lost_since'] = new Date().toISOString();
      if (rewardAmountCents != null) updatePayload['reward_amount_cents'] = rewardAmountCents;
      if (lostDescription != null) updatePayload['lost_description'] = lostDescription;
    }
    // Nota: ao desativar modo lost, preserva reward_amount_cents e lost_description

    const { error: updateError } = await supabaseAdmin
      .from('pets')
      .update(updatePayload)
      .eq('id', petId);

    if (updateError) {
      console.error('[toggle-lost] Erro ao atualizar pet:', updateError);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalida cache Vercel para as páginas SSR do pet
    const vercelToken = Deno.env.get('VERCEL_TOKEN');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');
    const domain = Deno.env.get('VERCEL_DOMAIN') ?? 'petvolta.vercel.app';

    if (vercelToken && vercelProjectId) {
      // Busca tag vinculada ao pet (se houver)
      const { data: tag } = await supabaseAdmin
        .from('tags')
        .select('tag_code')
        .eq('pet_id', petId)
        .eq('status', 'active')
        .maybeSingle();

      const pathsToInvalidate: string[] = [`/p/${pet.public_slug}`];
      if (tag?.tag_code) pathsToInvalidate.push(`/t/${tag.tag_code}`);

      // Revalidação on-demand via Vercel API
      await fetch(
        `https://api.vercel.com/v1/projects/${vercelProjectId}/domains/${domain}/purge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paths: pathsToInvalidate }),
        },
      ).catch((err) => console.warn('[toggle-lost] Aviso: falha na invalidação Vercel:', err));
    }

    return new Response(
      JSON.stringify({ ok: true, status: lost ? 'lost' : 'safe' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[toggle-lost] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
