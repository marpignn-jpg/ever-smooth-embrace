import React, { useState } from 'react';
import { Ticket, CreditCard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';
import PaymentPending from './PaymentPending';
import { totalWithFees } from '@/lib/pricing';

const METHODS = [
  {
    id: 'card',
    urlKey: 'payment_url_card',
    label: (
      <span className="flex items-center gap-2">
        <img
          src="https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/073c671bd_image.png"
          alt="Google Pay"
          className="h-6 w-auto"
        />
        <span className="text-sm font-medium text-foreground">Carte bancaire / Google Pay</span>
      </span>
    ),
  },
  {
    id: 'applepay',
    urlKey: 'payment_url_applepay',
    label: (
      <span className="flex items-center gap-2">
        <img
          src="https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/cab8265c7_image.png"
          alt="Apple Pay"
          className="h-6 w-auto rounded"
        />
        <span className="text-sm font-medium text-foreground">Apple Pay</span>
      </span>
    ),
  },
];

export default function StepPaiement({ ticket, event, email, firstName, lastName, price }) {
  const [method, setMethod] = useState('card');
  const [cgAccepted, setCgAccepted] = useState(false);
  const [cgError, setCgError] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [pendingUrlKey, setPendingUrlKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (!cgAccepted) { setCgError(true); return; }
    setCgError(false);
    const selected = METHODS.find(m => m.id === method);
    let freshEvent = event;

    if (event?.id) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', event.id)
        .maybeSingle();

      if (!error && data) freshEvent = data;
    }

    const url = freshEvent?.[selected.urlKey] || null;

    setSubmitting(true);

    // Créer la commande
    const qty = ticket ? 1 : Number(freshEvent?.total_tickets || 1);
    const total = totalWithFees(freshEvent, qty, ticket?.price || price);

    try {
      const order = await base44.entities.Order.create({
        ticket_id: ticket?.id || null,
        event_id: freshEvent?.id || null,
        buyer_first_name: firstName,
        buyer_last_name: lastName,
        buyer_email: email,
        amount: total,
        status: 'pending',
        resale_token: ticket?.resale_token || null,
        payment_method: method,
        payment_url_used: url,
      });

      setPendingUrl(url);
      setPendingUrlKey(selected.urlKey);
      setPendingOrderId(order.id);
      // Ouvre le lien de paiement dans un nouvel onglet si déjà présent au
      // moment de la commande. La page courante bascule sur PaymentPending qui
      // attend la confirmation et la réaffiche automatiquement.
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      console.error('Order create error:', e);
      alert("Erreur lors de la création de la commande. Réessayez.");
      setSubmitting(false);
    }
  };

  if (pendingOrderId) {
    return (
      <PaymentPending
        orderId={pendingOrderId}
        eventId={event?.id}
        urlKey={pendingUrlKey}
        initialUrl={pendingUrl}
      />
    );
  }


  return (
    <div className="space-y-5">
      {/* Récapitulatif */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="h-5 w-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">Récapitulatif de votre commande</h2>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm space-y-2">
          {/* Artiste / Événement */}
          {(event?.artist || event?.name) && (
            <p className="font-bold text-foreground text-base">{event.artist || event.name}</p>
          )}
          {/* Date */}
          {event?.date && (
            <p className="text-gray-500">
              {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {/* Lieu */}
          {event?.venue && (
            <p className="text-gray-500">{event.venue}{event.city ? ` · ${event.city}` : ''}</p>
          )}
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {/* Catégorie */}
            {ticket?.category && <p className="text-gray-700">{ticket.category}</p>}
            {/* Tarif */}
            {ticket?.tarif_label && <p className="text-gray-700">{ticket.tarif_label}</p>}
            {/* Siège */}
            {ticket?.seat && <p className="text-gray-500">{ticket.seat}</p>}
          </div>
          <div className="border-t border-gray-100 pt-2 space-y-0.5">
            {/* Nombre de places */}
            {event?.total_tickets && (
              <p className="text-gray-500">{event.total_tickets} place{event.total_tickets > 1 ? 's' : ''}</p>
            )}
            {/* Email / Nom */}
            {email && <p className="text-gray-500">{email}</p>}
            {(firstName || lastName) && <p className="text-gray-500">{firstName} {lastName}</p>}
            {/* Prix total */}
            {(() => {
              const qty = ticket ? 1 : Number(event?.total_tickets || 1);
              const total = totalWithFees(event, qty, ticket?.price || price);
              if (!total) return null;
              return (
                <div className="flex justify-between font-bold text-foreground text-base pt-1">
                  <span>Total</span>
                  <span>{total.toLocaleString('fr-FR')} €</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Paiement */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-5 w-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">Paiement</h2>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {METHODS.filter(m => m.id !== 'applepay' || event?.apple_pay_enabled !== false).map((m, i) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 ${
                i > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="accent-black"
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      {/* CGU */}
      <div className="space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={cgAccepted}
            onChange={e => { setCgAccepted(e.target.checked); setCgError(false); }}
            className="mt-0.5 accent-black"
          />
          <span className="text-xs text-gray-600 leading-relaxed">
            J'accepte les{' '}
            <span className="underline font-semibold cursor-pointer">conditions générales</span>,
            la{' '}
            <span className="underline font-semibold cursor-pointer">politique de confidentialité</span>{' '}
            de Reelax Tickets et les{' '}
            <span className="underline font-semibold cursor-pointer">conditions générales de Stripe pour les acheteurs</span>. *
          </span>
        </label>
        {cgError && <p className="text-xs text-red-500 font-medium">Champ requis</p>}
      </div>

      {/* Bouton payer */}
      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full rounded-lg bg-black py-4 text-base font-bold text-white hover:bg-gray-900 active:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Préparation…' : (() => {
          const qty = ticket ? 1 : Number(event?.total_tickets || 1);
          const total = totalWithFees(event, qty, ticket?.price || price);
          return total ? `Payer ${total.toLocaleString('fr-FR')} €` : 'Payer';
        })()}
      </button>

    </div>
  );
}