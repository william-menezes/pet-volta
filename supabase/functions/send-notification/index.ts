import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  scanEventId: string;
  petId: string;
  ownerId: string;
  locationType: 'precise' | 'approximate' | 'none';
  lat?: number;
  lng?: number;
  ipCity?: string;
  ipRegion?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const payload = await req.json() as NotificationPayload;
    const { scanEventId, petId, ownerId, locationType, lat, lng, ipCity, ipRegion, message } = payload;

    // Busca dados do pet e do tutor
    const { data: pet } = await supabase
      .from('pets')
      .select('name, reward_amount_cents, status, photos')
      .eq('id', petId)
      .single();

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, plan_tier')
      .eq('id', ownerId)
      .single();

    // Verifica preferências de notificação (snooze)
    const { data: prefs } = await supabase
      .from('notification_prefs')
      .select('email_enabled, snooze_until')
      .eq('profile_id', ownerId)
      .maybeSingle();

    const emailEnabled = prefs?.email_enabled ?? true;
    const snoozed = prefs?.snooze_until ? new Date(prefs.snooze_until) > new Date() : false;

    if (!emailEnabled || snoozed) {
      // Marca como notificado mesmo assim (evento registrado)
      await supabase.from('scan_events').update({ notified: true }).eq('id', scanEventId);
      return new Response(JSON.stringify({ ok: true, skipped: 'notificação silenciada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Busca email do tutor via auth
    const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(ownerId);
    const toEmail = ownerUser?.email;
    if (!toEmail) {
      console.error('[send-notification] Email do tutor não encontrado');
      return new Response(JSON.stringify({ error: 'Email não encontrado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const petName = pet?.name ?? 'Seu pet';
    const tutorName = profile?.full_name ?? 'Tutor';
    const rewardCents = pet?.reward_amount_cents ?? 0;

    // Monta o template de email conforme tipo de localização
    const { subject, html } = buildEmailTemplate({
      petName,
      tutorName,
      locationType,
      lat,
      lng,
      ipCity,
      ipRegion,
      message,
      rewardCents,
    });

    // Envia via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pet Volta <noreply@petvolta.com.br>',
          to: [toEmail],
          subject,
          html,
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error('[send-notification] Resend error:', err);
      }
    } else {
      // Sem Resend key configurado (dev/staging) — apenas loga
      console.log('[send-notification] Sem RESEND_API_KEY. Email que seria enviado:', { to: toEmail, subject });
    }

    // Marca scan_event como notificado
    await supabase.from('scan_events').update({ notified: true }).eq('id', scanEventId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-notification] Erro inesperado:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildEmailTemplate(opts: {
  petName: string;
  tutorName: string;
  locationType: 'precise' | 'approximate' | 'none';
  lat?: number;
  lng?: number;
  ipCity?: string;
  ipRegion?: string;
  message?: string;
  rewardCents: number;
}): { subject: string; html: string } {
  const { petName, tutorName, locationType, lat, lng, ipCity, ipRegion, message, rewardCents } = opts;

  let locationHtml = '';
  let subject = '';
  let icon = '';

  switch (locationType) {
    case 'precise':
      icon = '📍';
      subject = `${icon} Alguém encontrou o(a) ${petName}!`;
      locationHtml = `
        <p><strong>Localização precisa:</strong></p>
        <p>Latitude: ${lat?.toFixed(6)}, Longitude: ${lng?.toFixed(6)}</p>
        <p>
          <a href="https://maps.google.com/?q=${lat},${lng}" style="color:#2D6A4F">
            Ver no Google Maps
          </a>
        </p>`;
      break;

    case 'approximate':
      icon = '📌';
      subject = `${icon} Alguém viu o(a) ${petName}!`;
      locationHtml = `
        <p><strong>Localização aproximada (via IP):</strong></p>
        <p>${ipCity ?? ''}${ipRegion ? ', ' + ipRegion : ''}</p>
        <p style="color:#6b7280;font-size:12px">
          ⚠️ Esta localização é baseada no endereço IP e pode variar alguns quilômetros.
        </p>`;
      break;

    default:
      icon = '🔔';
      subject = `${icon} Alguém visitou a página do(a) ${petName}`;
      locationHtml = `<p>Localização não disponível.</p>`;
  }

  const rewardHtml = rewardCents > 0
    ? `<div style="background:#FFB01F;border-radius:16px;padding:16px;margin:16px 0">
        <p style="color:white;font-weight:bold;margin:0">🎁 Recompensa: R$ ${(rewardCents / 100).toFixed(2).replace('.', ',')}</p>
        <p style="color:white;font-size:12px;margin:4px 0 0">Oferecida pelo tutor. Pet Volta não intermedia pagamentos.</p>
      </div>`
    : '';

  const messageHtml = message
    ? `<div style="background:#f5f5f5;border-radius:8px;padding:12px;margin:12px 0">
        <p style="margin:0;color:#374151"><strong>Mensagem do encontrador:</strong></p>
        <p style="margin:4px 0 0;color:#374151">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:Inter,sans-serif;background:#FDFCF0;margin:0;padding:20px">
      <div style="max-width:500px;margin:0 auto;background:white;border-radius:32px;padding:32px;box-shadow:0 2px 16px rgba(45,106,79,0.07)">
        <div style="background:#2D6A4F;border-radius:16px;padding:16px;text-align:center;margin-bottom:24px">
          <p style="color:white;font-size:24px;margin:0">${icon}</p>
          <h1 style="color:white;font-size:20px;margin:8px 0 0">${subject.replace(/^[^ ]+ /, '')}</h1>
        </div>

        <p>Olá, <strong>${tutorName}</strong>!</p>
        <p>${subject}</p>

        ${locationHtml}
        ${messageHtml}
        ${rewardHtml}

        <p style="margin-top:24px;font-size:12px;color:#6b7280">
          — Equipe Pet Volta 🐾<br>
          <a href="https://petvolta.vercel.app" style="color:#2D6A4F">petvolta.vercel.app</a>
        </p>
      </div>
    </body>
    </html>`;

  return { subject, html };
}
