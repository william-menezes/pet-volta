import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@16.6.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

type PlanTier = 'digital' | 'essential' | 'elite' | 'guardian';
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | null;

function planFromPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return 'digital';
  const essential = Deno.env.get('STRIPE_PRICE_ESSENTIAL_ID');
  const elite = Deno.env.get('STRIPE_PRICE_ELITE_ID');
  const guardian = Deno.env.get('STRIPE_PRICE_GUARDIAN_ID');

  if (essential && priceId === essential) return 'essential';
  if (elite && priceId === elite) return 'elite';
  if (guardian && priceId === guardian) return 'guardian';
  return 'digital';
}

function mapSubscriptionStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case 'active': return 'active';
    case 'past_due': return 'past_due';
    case 'canceled': return 'canceled';
    case 'trialing': return 'trialing';
    default: return null;
  }
}

async function markEventProcessed(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Stripe.Event,
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existingError) {
    console.warn('[stripe-webhook] Aviso: falha ao checar idempotÃªncia:', existingError);
    return { alreadyProcessed: false };
  }

  if (existing?.id) return { alreadyProcessed: true };

  const { error: insertError } = await supabaseAdmin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });

  if (insertError) {
    console.warn('[stripe-webhook] Aviso: falha ao gravar stripe_events:', insertError);
  }

  return { alreadyProcessed: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Stripe nÃ£o configurado' }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Assinatura ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.text();
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Assinatura invÃ¡lida:', err);
      return new Response(JSON.stringify({ error: 'Webhook signature invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { alreadyProcessed } = await markEventProcessed(supabaseAdmin, event);
    if (alreadyProcessed) {
      return new Response(JSON.stringify({ ok: true, deduped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeCustomerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;

      if (!stripeCustomerId || !subscriptionId) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price'],
      });

      const firstItem = subscription.items.data[0];
      const priceId = (firstItem?.price as Stripe.Price | undefined)?.id ?? firstItem?.price?.toString();
      const planTier = planFromPriceId(priceId);
      const subscriptionStatus = mapSubscriptionStatus(subscription.status);

      const supabaseUserId = (session.metadata?.['supabase_user_id'] as string | undefined) ?? null;

      if (supabaseUserId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_tier: planTier,
            subscription_status: subscriptionStatus,
            stripe_customer_id: stripeCustomerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', supabaseUserId);
      } else {
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_tier: planTier,
            subscription_status: subscriptionStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', stripeCustomerId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string | null;

      if (!stripeCustomerId) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const item = subscription.items.data[0];
      const priceId = (item?.price as Stripe.Price | undefined)?.id ?? item?.price?.toString();

      const subscriptionStatus = mapSubscriptionStatus(subscription.status);
      const planTier = subscriptionStatus === 'canceled' ? 'digital' : planFromPriceId(priceId);

      await supabaseAdmin
        .from('profiles')
        .update({
          plan_tier: planTier,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', stripeCustomerId);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string | null;

      if (stripeCustomerId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            plan_tier: 'digital',
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', stripeCustomerId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, ignored: true, type: event.type }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[stripe-webhook] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

