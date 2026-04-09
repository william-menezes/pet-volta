import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PaidPlanTier = 'essential' | 'elite' | 'guardian';

interface CreateCheckoutPayload {
  plan: PaidPlanTier;
}

function getSiteUrl(req: Request) {
  const siteUrl = Deno.env.get('SITE_URL');
  if (siteUrl) return siteUrl;

  const origin = req.headers.get('origin');
  if (origin) return origin;

  const vercelDomain = Deno.env.get('VERCEL_DOMAIN') ?? 'petvolta.vercel.app';
  return vercelDomain.startsWith('http') ? vercelDomain : `https://${vercelDomain}`;
}

function priceIdForPlan(plan: PaidPlanTier): string | null {
  const map: Record<PaidPlanTier, string | undefined> = {
    essential: Deno.env.get('STRIPE_PRICE_ESSENTIAL_ID'),
    elite: Deno.env.get('STRIPE_PRICE_ELITE_ID'),
    guardian: Deno.env.get('STRIPE_PRICE_GUARDIAN_ID'),
  };
  return map[plan] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'NÃ£o autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Stripe nÃ£o configurado' }), {
        status: 501,
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invÃ¡lido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json() as CreateCheckoutPayload;
    const plan = payload?.plan;
    if (!plan || !['essential', 'elite', 'guardian'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Plano invÃ¡lido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price ID nÃ£o configurado' }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[create-checkout] Erro ao buscar profile:', profileError);
      return new Response(JSON.stringify({ error: 'Erro ao carregar perfil' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripeCustomerId = profile?.stripe_customer_id ?? null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error('[create-checkout] Erro ao salvar stripe_customer_id:', updateError);
      }
    }

    const siteUrl = getSiteUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard/pricing?success=1`,
      cancel_url: `${siteUrl}/dashboard/pricing?canceled=1`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
