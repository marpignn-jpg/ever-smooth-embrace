import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, eventName, artist, isNumbered, categories } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sys = `Tu génères une liste de billets pour un événement. Réponds STRICTEMENT en appelant l'outil generate_passes. ${
      isNumbered ? 'Places numérotées : remplis section, rang, siege.' : 'Placement libre : laisse section/rang/siege vides.'
    } ${Array.isArray(categories) && categories.length ? `Catégories autorisées : ${categories.join(', ')}.` : ''}`;

    const userMsg = `Événement : "${eventName || ''}"${artist ? ` (${artist})` : ''}.
Demande : ${prompt}`;

    const tool = {
      type: 'function',
      function: {
        name: 'generate_passes',
        description: 'Retourne la liste des billets demandés',
        parameters: {
          type: 'object',
          properties: {
            passes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  section: { type: 'string' },
                  rang: { type: 'string' },
                  siege: { type: 'string' },
                },
                required: ['category', 'section', 'rang', 'siege'],
                additionalProperties: false,
              },
            },
          },
          required: ['passes'],
          additionalProperties: false,
        },
      },
    };

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'generate_passes' } },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('AI gateway error', res.status, txt);
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: 'Trop de requêtes. Réessayez.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits IA épuisés.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
    const passes = Array.isArray(args.passes) ? args.passes : [];

    return new Response(JSON.stringify({ passes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generatePasses error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
