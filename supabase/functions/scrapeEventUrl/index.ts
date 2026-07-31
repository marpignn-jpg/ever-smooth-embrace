// Scrape event info from the exact URL provided. No search, no LLM guessing.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const FIRECRAWL_V2 = 'https://api.firecrawl.dev/v2';

const BodySchema = z.object({
  url: z.string().url(),
}).superRefine((value, context) => {
  try {
    const parsedUrl = new URL(value.url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'URL invalide' });
    }
  } catch (_error) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'URL invalide' });
  }
});

const EVENT_TYPES = new Set([
  'Event',
  'MusicEvent',
  'SportsEvent',
  'TheaterEvent',
  'Festival',
  'ComedyEvent',
  'DanceEvent',
  'ScreeningEvent',
  'SaleEvent',
]);

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttribute(tag: string, name: string): string {
  return clean(tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] || '');
}

function extractMeta(html: string, keys: string[]): string {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const key of keys) {
    for (const tag of metaTags) {
      const metaKey = getAttribute(tag, 'property') || getAttribute(tag, 'name') || getAttribute(tag, 'itemprop');
      if (metaKey.toLowerCase() === key.toLowerCase()) return getAttribute(tag, 'content');
    }
  }
  return '';
}

function extractH1(html: string): string {
  return clean(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
}

function asArray(value: unknown): unknown[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function flattenLd(value: unknown, output: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenLd(item, output));
    return output;
  }
  if (!value || typeof value !== 'object') return output;

  const objectValue = value as Record<string, unknown>;
  output.push(objectValue);
  if (objectValue['@graph']) flattenLd(objectValue['@graph'], output);
  return output;
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const objects: Record<string, unknown>[] = [];

  for (const script of scripts) {
    const raw = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    if (!raw) continue;
    try {
      flattenLd(JSON.parse(raw), objects);
    } catch (_error) {
      // Ignore malformed JSON-LD instead of inventing data.
    }
  }

  return objects;
}

function isEventObject(value: Record<string, unknown>): boolean {
  return asArray(value['@type']).some((type) => EVENT_TYPES.has(clean(type)) || clean(type).endsWith('Event'));
}

function getName(value: unknown): string {
  if (typeof value === 'string') return clean(value);
  if (value && typeof value === 'object') return clean((value as Record<string, unknown>).name);
  return '';
}

function getFirstName(value: unknown): string {
  for (const item of asArray(value)) {
    const name = getName(item);
    if (name) return name;
  }
  return '';
}

function getImage(value: unknown, baseUrl: string): string {
  for (const item of asArray(value)) {
    const raw = typeof item === 'string'
      ? item
      : item && typeof item === 'object'
        ? ((item as Record<string, unknown>).url || (item as Record<string, unknown>).contentUrl)
        : '';
    const image = clean(raw);
    if (!image) continue;
    try {
      return new URL(image, baseUrl).toString();
    } catch (_error) {
      continue;
    }
  }
  return '';
}

function getVenue(value: unknown): string {
  if (typeof value === 'string') return clean(value);
  if (!value || typeof value !== 'object') return '';

  const location = value as Record<string, unknown>;
  const name = clean(location.name);
  const address = location.address && typeof location.address === 'object'
    ? location.address as Record<string, unknown>
    : null;
  const locality = clean(address?.addressLocality);

  return [name, locality].filter(Boolean).join(', ');
}

function normalizeDate(value: unknown): string {
  const date = clean(value);
  if (!date) return '';
  const direct = date.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)?.[0];
  if (direct) return direct;
  const dayOnly = date.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return dayOnly ? `${dayOnly}T20:00` : '';
}

function cleanTitle(title: string): string {
  return clean(title)
    .replace(/\s*[-|–]\s*(Ticketmaster|Fnac Spectacles|See Tickets|Billetweb|France Billet).*$/i, '')
    .replace(/^(Billets?|Tickets?)\s+/i, '')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY non configuré' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Lien invalide' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { url } = parsed.data;

    const fcRes = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        onlyMainContent: false,
        waitFor: 5000,
        formats: ['html', 'rawHtml', 'markdown'],
        location: { country: 'FR', languages: ['fr'] },
      }),
    });

    const payload = await fcRes.json();
    if (!fcRes.ok) {
      console.error('Firecrawl error:', payload);
      return new Response(JSON.stringify({ error: payload?.error || 'Erreur Firecrawl' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Firecrawl v2 returns { success, data: { html/rawHtml/metadata, ... } }
    const doc = payload?.data ?? payload;
    const meta = doc?.metadata ?? {};
    const html = String(doc?.rawHtml || doc?.html || '');
    const ldEvents = extractJsonLd(html).filter(isEventObject);
    const event = ldEvents[0] || {};

    const metaTitle = clean(meta.ogTitle || meta.title || extractMeta(html, ['og:title', 'twitter:title']) || extractH1(html));
    const metaImage = clean(meta.ogImage || meta['og:image'] || extractMeta(html, ['og:image', 'twitter:image', 'image']));
    const image_url = getImage(event.image, url) || getImage(metaImage, url);

    // Parse "Artiste | Concert le DATE | Lieu" style titles (Ticketmaster, Fnac, etc.)
    const titleParts = cleanTitle(metaTitle).split(/\s*[|•·–—\-]\s*/).filter(Boolean);
    const dateRe = /\b(concert|spectacle|date|festival|tourn[ée]e|janv|févr|mars|avr|mai|juin|juil|ao[uû]t|sept|oct|nov|déc|\d{4}|\d{1,2}\s*\/\s*\d{1,2})/i;
    const stripDate = (s: string) => s.replace(/\s+le\s+\d.*$/i, '').replace(/\s*[,–-]\s*\d{1,2}.*$/,'').trim();
    const looksLikeDate = (s: string) => dateRe.test(s) && !/[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]{3,}/.test(stripDate(s));
    const titleArtist = titleParts.find((p) => !looksLikeDate(p)) || titleParts[0] || '';
    const venueCandidates = titleParts
      .filter((p) => p !== titleArtist)
      .map((p) => stripDate(p))
      .filter((p) => p && !dateRe.test(p));
    const titleVenue = venueCandidates[0] || '';


    const ldName = clean(event.name);
    const ldVenue = getVenue(event.location);

    const name = ldName || titleArtist || cleanTitle(metaTitle);
    if (!name) {
      return new Response(JSON.stringify({ error: 'Aucun événement fiable trouvé sur ce lien' }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = {
      name,
      artist: getFirstName(event.performer || event.actor || event.artist) || titleArtist,
      date: normalizeDate(event.startDate || extractMeta(html, ['event:start_time', 'startDate'])),
      venue: ldVenue || titleVenue,
      image_url,
      source_url: clean(meta.sourceURL || meta.url || url),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('scrapeEventUrl error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Erreur inconnue' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
