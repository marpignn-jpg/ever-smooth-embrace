import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

function formatEuros(amount) {
  return `${Math.round(amount).toLocaleString('fr-FR')} €`;
}

function computeFees(faceValue, quantity, event) {
  const subtotal = Number(faceValue) * Number(quantity);
  const feeRaw = event?.fee_amount;
  const hasFixed = feeRaw !== null && feeRaw !== undefined && feeRaw !== '' && !isNaN(Number(feeRaw));
  const totalTickets = Number(event?.total_tickets) || 1;
  const perTicketFee = hasFixed ? Number(feeRaw) / totalTickets : null;
  const fees = perTicketFee !== null ? Math.round(perTicketFee * quantity) : Math.round(subtotal * 0.05);
  return { subtotal, fees, total: Math.round(subtotal + fees), hasFixed };
}

function PriceDetailModal({ onClose, faceValue, tarifLabel, quantity = 1, event }) {
  const { subtotal, fees, total } = computeFees(faceValue, quantity, event);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-foreground">Détails du prix</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#555]">{quantity} billet{quantity > 1 ? 's' : ''} {tarifLabel || ''}</span>
              <span className="text-foreground">{formatEuros(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#555]">Frais de service</span>
              <span className="text-foreground">{formatEuros(fees)}</span>
            </div>
            <div className="flex justify-between border-t pt-3 font-bold text-base">
              <span>Total</span>
              <span>{formatEuros(total)}</span>
            </div>
          </div>
        </div>
        <div className="bg-black px-6 py-4 text-center">
          <p className="text-xs text-white font-semibold">Les frais de service permettent de supprimer 100% des arnaques !</p>
          <p className="text-xs text-gray-300 mt-1">Acheter votre billet sur Reelax Tickets, c'est s'assurer de toujours rentrer à l'événement de votre choix en faisant confiance à la plateforme la plus sécurisée du marché.</p>
        </div>
      </div>
    </div>
  );
}

export default function StepCommande({ ticket, event, availableTickets = [], selectedCategory, setSelectedCategory }) {
  const [showPriceModal, setShowPriceModal] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const seatingLabel = event?.seating_type === 'free' ? 'Placement libre' : 'Places assises numérotées';

  // Mode billet unique (via token)
  if (ticket) {
    const faceValue = event?.face_value || ticket.original_price || ticket.price;
    const totalWithFees = faceValue ? computeFees(faceValue, 1, event).total : ticket.price;
    const priceDisplay = totalWithFees ? `${formatEuros(totalWithFees)}` : null;

    return (
      <div className="space-y-6">
        <div>
          {ticket.category && <h2 className="mb-3 text-lg font-semibold text-foreground">{ticket.category}</h2>}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex gap-0">
              <div className="w-[3px] rounded-sm bg-black shrink-0 mr-4" />
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-semibold text-foreground text-base">
                  {event?.artist || event?.name || '—'}
                </p>
                {event?.date && <p className="text-[#555]">{formatDate(event.date)}</p>}
                {ticket.tarif_label && <p className="font-medium text-foreground">{ticket.tarif_label}</p>}
                {ticket.seat && <p className="text-[#555]">{ticket.seat}</p>}
                {event?.venue && <p className="text-[#888]">{event.venue}{event.city ? ` · ${event.city}` : ''}</p>}
                {priceDisplay && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-base font-semibold text-foreground">{priceDisplay}</span>
                    {faceValue && (
                      <button
                        onClick={() => setShowPriceModal(true)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a2e] text-white"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <TrustRows />
        {showPriceModal && faceValue && (
          <PriceDetailModal
            onClose={() => setShowPriceModal(false)}
            faceValue={faceValue}
            tarifLabel={ticket.tarif_label}
            quantity={1}
            event={event}
          />
        )}
      </div>
    );
  }

  // Mode événement : affichage des billets par catégorie
  const categories = event?.categories?.length > 0 ? event.categories : [...new Set(availableTickets.map(t => t.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Titre catégorie sélectionnée */}
      {selectedCategory && <h2 className="text-lg font-semibold text-foreground">{selectedCategory}</h2>}
      {/* Récapitulatif de l'événement */}
      {event && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex gap-0">
            <div className="w-[3px] rounded-sm bg-black shrink-0 mr-4" />
            <div className="flex-1 space-y-1 text-sm">
              <p className="font-semibold text-foreground text-base">
                {event.artist || event.name}
              </p>
              {event.date && <p className="text-[#555]">{formatDate(event.date)}</p>}
              {event.venue && <p className="text-[#888]">{event.venue}{event.city ? ` · ${event.city}` : ''}</p>}
              <p className="text-[#888]">{seatingLabel}</p>
              {event.total_tickets && (
                <p className="text-[#555]">{event.total_tickets} place{event.total_tickets > 1 ? 's' : ''}</p>
              )}
              {event.face_value && (
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-base font-semibold text-foreground">
                    {formatEuros(computeFees(event.face_value, event.total_tickets || 1, event).total)}
                  </span>
                  <button
                    onClick={() => setShowPriceModal(true)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a2e] text-white"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <TrustRows />

      {showPriceModal && event?.face_value && (
        <PriceDetailModal
          onClose={() => setShowPriceModal(false)}
          faceValue={Number(event.face_value)}
          tarifLabel={selectedCategory}
          quantity={Number(event.total_tickets) || 1}
          event={event}
        />
      )}
    </div>
  );
}

function TrustRows() {
  return (
    <div className="space-y-5">
      <TrustRow
        icon={<LockIcon />}
        text={
          <>
            Afin de sécuriser la transaction, nous avons{' '}
            <strong>vérifié la validité du billet</strong>{' '}
            auprès de l'organisateur. Nous enverrons l'argent au vendeur{' '}
            une fois l'événement terminé.
          </>
        }
      />
      <TrustRow
        icon={<CardCheckIcon />}
        text={
          <>
            <strong>En cas d'annulation ou de report</strong>{' '}
            de l'événement, vous pourrez nous contacter{' '}
            directement{' '}
            pour toute demande de <strong>remboursement</strong>.
          </>
        }
      />
    </div>
  );
}

function TrustRow({ icon, text }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 shrink-0 text-foreground">{icon}</div>
      <p className="text-sm leading-relaxed text-[#444]">{text}</p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CardCheckIcon() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="24" height="16" rx="2" />
      <line x1="1" y1="8" x2="25" y2="8" />
      <polyline points="18 22 22 26 30 16" />
    </svg>
  );
}