// Send an email via Resend. Used by admin invite + ticket sending.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const FROM = 'Reelax Tickets <reelaxtickets@revente.app>';

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

const BodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  from: z.string().optional(),
}).refine((value) => value.body || value.text, {
  message: 'Un contenu HTML ou texte est requis',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY non configuré' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides', details: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { to, subject, body, text, from } = parsed.data;

    const emailContent = body
      ? { html: body, text: text || htmlToText(body) }
      : { text };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || FROM,
        to: [to],
        subject,
        ...emailContent,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', data);
      return new Response(JSON.stringify({ error: data?.message || 'Erreur Resend', details: data }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('sendEmail error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Erreur inconnue' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
