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
 * Affichage "vraies places" : bloc, rang, entrée + vignettes par siège.
 * Retourne null si aucune information de place n'est disponible.
 */
export default function SeatDisplay({ event, ticket }) {
  if (!event?.show_seat_numbers) return null;

  const block = event.seat_block?.trim();
  const row = event.seat_row?.trim();
  const entrance = event.seat_entrance?.trim();
  const seats = parseSeats(ticket?.seat || event.seat_numbers);
  const fallback = event.seat_details?.trim();

  if (!block && !row && !entrance && seats.length === 0) {
    if (!fallback) return null;
  }

  const infos = [
    block && { icon: LayoutGrid, label: 'Bloc / Tribune', value: block },
    row && { icon: Rows3, label: 'Rang', value: row },
    entrance && { icon: DoorOpen, label: 'Entrée', value: entrance },
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
        <div className="px-4 py-4">
          <p className="text-[11px] uppercase tracking-wide text-[#999] mb-2">
            {seats.length > 1 ? `Sièges (${seats.length})` : 'Siège'}
          </p>
          <div className="flex flex-wrap gap-2">
            {seats.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-900 bg-black px-3 py-2 text-sm font-bold text-white"
              >
                <Armchair className="h-3.5 w-3.5" />
                {s}
              </span>
            ))}
          </div>
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
