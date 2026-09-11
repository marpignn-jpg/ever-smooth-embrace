import React from 'react';
import { Armchair, DoorOpen, LayoutGrid, Rows3 } from 'lucide-react';

function parseSeats(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;/•\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Tente d'extraire porte / rang / sièges d'un texte libre du type
 * « PORTE Z rang 6 place 10 11 et 12 ».
 */
function parseFreeText(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  const normalized = text.replace(/,/g, ' ').replace(/\s+/g, ' ');

  const entranceMatch = normalized.match(/(?:porte|entree|entrée|acc[eè]s|gate)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  const rowMatch = normalized.match(/(?:rang(?:[eé]e)?|row)\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  const seatsMatch = normalized.match(/places?\s*[:\-]?\s*([0-9A-Za-z\s]+)/i);

  if (!entranceMatch && !rowMatch && !seatsMatch) return null;

  let seats = [];
  if (seatsMatch) {
    seats = seatsMatch[1]
      .replace(/\bet\b/gi, ' ')
      .split(/\s+/)
      .map(s => s.trim())
      .filter(s => /^[0-9]+[A-Za-z]?$/i.test(s));
  }

  return {
    entrance: entranceMatch?.[1] || null,
    row: rowMatch?.[1] || null,
    seats,
  };
}

/**
 * Affichage "vraies places" : bloc, rang, entrée + chaque siège listé individuellement.
 * Retourne null si aucune information de place n'est disponible.
 */
export default function SeatDisplay({ event, ticket }) {
  if (!event?.show_seat_numbers) return null;

  let block = event.seat_block?.trim() || null;
  let row = event.seat_row?.trim() || null;
  let entrance = event.seat_entrance?.trim() || null;
  let seats = parseSeats(ticket?.seat || event.seat_numbers);
  const fallback = event.seat_details?.trim();

  // Compléter à partir du texte libre si les champs structurés manquent
  if (fallback && (!block && !row && !entrance && seats.length === 0)) {
    const parsed = parseFreeText(fallback);
    if (parsed && (parsed.seats.length > 0 || parsed.row || parsed.entrance)) {
      entrance = entrance || parsed.entrance;
      row = row || parsed.row;
      seats = parsed.seats;
    }
  }

  if (!block && !row && !entrance && seats.length === 0) {
    if (!fallback) return null;
  }

  const infos = [
    block && { icon: LayoutGrid, label: 'Bloc / Tribune', value: block },
    row && { icon: Rows3, label: 'Rang', value: row },
    entrance && { icon: DoorOpen, label: 'Entrée / Porte', value: entrance },
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Armchair className="h-4 w-4 text-foreground" />
        <p className="text-sm font-semibold text-foreground">
          {seats.length > 1 ? 'Vos places' : 'Votre place'}
        </p>
        <span className="ml-auto rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-[#555]">
          {event.seating_type === 'free' ? 'Placement libre' : 'Places numérotées'}
        </span>
      </div>

      {infos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {infos.map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[#999]">
                <Icon className="h-3 w-3" /> {label}
              </p>
              <p className="mt-1 text-base font-bold text-foreground break-words">{value}</p>
            </div>
          ))}
        </div>
      )}

      {seats.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {seats.map((s, i) => (
            <div key={`${s}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                <Armchair className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#999]">
                  {seats.length > 1 ? `Place ${i + 1} sur ${seats.length}` : 'Place'}
                </p>
                <p className="text-base font-bold text-foreground">
                  {/^[0-9]+[A-Za-z]?$/i.test(s) ? `Siège ${s}` : s}
                </p>
              </div>
              {row && (
                <span className="ml-auto text-xs text-[#777]">Rang {row}</span>
              )}
            </div>
          ))}
        </div>
      ) : fallback ? (
        <div className="px-4 py-4">
          <p className="text-sm font-medium text-foreground whitespace-pre-line">{fallback}</p>
        </div>
      ) : null}

      <p className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-xs text-[#777]">
        Emplacement exact communiqué par le vendeur et vérifié auprès de l'organisateur.
      </p>
    </div>
  );
}
