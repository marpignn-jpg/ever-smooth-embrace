import React, { useState, useEffect } from 'react';
import NavBar from '@/components/reelax/NavBar';
import EventHeader from '@/components/reelax/EventHeader';
import Stepper from '@/components/reelax/Stepper';
import StepCommande from '@/components/reelax/StepCommande';
import StepInformations from '@/components/reelax/StepInformations';
import StepPaiement from '@/components/reelax/StepPaiement';
import MyTicketView from '@/components/reelax/MyTicketView';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';

const STEPS = ['Ma commande', 'Informations', 'Paiement'];

export default function Home() {
  useEffect(() => { document.title = 'Reelax Tickets'; }, []);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewTicket, setViewTicket] = useState(null); // { ticket, event } for my-ticket mode
  const hasParams = (() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('token') || p.get('event') || p.get('view_ticket');
  })();
  const [loading, setLoading] = useState(!!hasParams);

  // Load event/ticket from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewToken = params.get('view_ticket');
    const token = params.get('token');
    const eventId = params.get('event');

    if (viewToken) {
      base44.entities.Ticket.filter({ resale_token: viewToken }).then(async (results) => {
        if (results.length > 0) {
          const t = results[0];
          let ev = null;
          if (t.event_id) {
            const evs = await base44.entities.Event.filter({ id: t.event_id });
            if (evs.length > 0) ev = evs[0];
          }
          setViewTicket({ ticket: t, event: ev });
        }
        setLoading(false);
      });
      return;
    }

    if (token) {
      base44.entities.Ticket.filter({ resale_token: token }).then(async (results) => {
        if (results.length > 0) {
          const t = results[0];
          if (t.event_id) {
            const evs = await base44.entities.Event.filter({ id: t.event_id });
            if (evs.length > 0) {
              setEvent(evs[0]);
              // Ne charger le billet que si l'événement est actif
              if (evs[0].status === 'active' || evs[0].status === 'sold_out') {
                setTicket(t);
              }
            }
          } else {
            setTicket(t);
          }
        }
        setLoading(false);
      });
    } else if (eventId) {
      Promise.all([
        base44.entities.Event.filter({ id: eventId }),
        base44.entities.Ticket.filter({ event_id: eventId, status: 'available' })
      ]).then(([evResults, tkResults]) => {
        if (evResults.length > 0) {
          setEvent(evResults[0]);
          if (evResults[0].categories?.length > 0) setSelectedCategory(evResults[0].categories[0]);
        }
        setAvailableTickets(tkResults);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Maintient les infos de l'événement à jour sans recharger la page
  useEffect(() => {
    if (!event?.id) return;
    const eventId = event.id;
    let stopped = false;

    const applyFreshEvent = (freshEvent) => {
      if (!freshEvent?.id) return;
      setEvent(current => current?.id === freshEvent.id ? { ...current, ...freshEvent } : current);
    };

    const refreshEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) {
        console.warn('[Home] actualisation événement impossible', error);
        return;
      }
      if (!stopped && data) applyFreshEvent(data);
    };

    refreshEvent();

    const channel = supabase
      .channel(`event-live-${eventId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => applyFreshEvent(payload.new)
      )
      .subscribe();

    const interval = setInterval(refreshEvent, 2500);

    return () => {
      stopped = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [event?.id]);

  const canNext = (step === 0 ? (ticket !== null || event !== null) : true)
    && (step !== 1 || (firstName.length > 0 && lastName.length > 0 && email.length > 0 && email === emailConfirm));

  const handleNext = () => { if (canNext) setStep(s => Math.min(s + 1, 2)); };
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#ebebeb]">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (viewTicket) {
    return <MyTicketView ticket={viewTicket.ticket} event={viewTicket.event} />;
  }

  // Événement hors ligne — ne pas bloquer si l'utilisateur est déjà à l'étape paiement
  if (event && (event.status === 'draft' || event.status === 'cancelled') && step !== 2) {
    const isCancelled = event.status === 'cancelled';
    const eventName = event.artist || event.name;
    return (
      <div className="min-h-screen bg-[#ebebeb] flex flex-col">
        <NavBar />

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
            {/* Event image banner */}
            {event.image_url && (
              <div className="relative h-48 overflow-hidden">
                <img src={event.image_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={event.image_url} alt={eventName} className="h-28 w-28 object-cover rounded-2xl shadow-2xl border-4 border-white" />
                </div>
              </div>
            )}

            <div className="p-8 text-center">
              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4 ${isCancelled ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCancelled ? 'bg-red-500' : 'bg-orange-500'}`} />
                {isCancelled ? 'Événement annulé' : 'Vente suspendue'}
              </div>

              <h1 className="text-2xl font-black text-gray-900 mb-1">{eventName}</h1>

              {event.venue && (
                <p className="text-sm text-gray-400 mb-6">📍 {event.venue}{event.city ? `, ${event.city}` : ''}</p>
              )}

              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {isCancelled
                  ? `Les billets pour cet événement ne sont plus disponibles suite à son annulation.`
                  : `Les billets pour cet événement ne sont pas disponibles pour le moment. Revenez plus tard ou contactez l'organisateur.`}
              </p>

              <a
                href="https://reelax-tickets.com"
                className="inline-block bg-black text-white text-sm font-bold px-8 py-3.5 rounded-xl hover:bg-gray-900 transition-colors w-full"
              >
                Retour à l'accueil Reelax
              </a>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 flex items-center gap-6 text-xs text-gray-400">
            <span>🔒 Paiement sécurisé</span>
            <span>✅ Billets vérifiés</span>
            <span>💳 Remboursement garanti</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ebebeb]">
      <NavBar />
      <EventHeader event={event} />
      <div className="mx-auto max-w-3xl px-3 py-6 sm:px-8 sm:py-8">
        <Stepper steps={STEPS} current={step} />
        <div className="mt-6">
          {step === 0 && (
            <StepCommande
              ticket={ticket}
              event={event}
              availableTickets={availableTickets}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          )}
          {step === 1 && (
            <StepInformations
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              email={email}
              setEmail={setEmail}
              emailConfirm={emailConfirm}
              setEmailConfirm={setEmailConfirm}
            />
          )}
          {step === 2 && (
            <StepPaiement ticket={ticket} event={event} email={email} firstName={firstName} lastName={lastName} price={ticket?.price} />
          )}
        </div>
        {step < 2 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handlePrev}
              className="rounded-lg border-2 border-gray-300 bg-white py-4 text-base font-bold text-foreground transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              Précédent
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext}
              className="rounded-lg bg-black py-4 text-base font-bold text-white transition-colors hover:bg-gray-900 active:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="mt-6 pb-8">
            <button
              onClick={handlePrev}
              className="w-full rounded-lg border-2 border-gray-300 bg-white py-4 text-base font-bold text-foreground transition-colors hover:bg-gray-50"
            >
              Précédent
            </button>
          </div>
        )}
      </div>
    </div>
  );
}