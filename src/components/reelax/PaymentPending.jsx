import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Mail, ExternalLink } from 'lucide-react';

export default function PaymentPending({ orderId, eventId, urlKey, initialUrl }) {
  const [status, setStatus] = useState('pending');
  const [paymentUrl, setPaymentUrl] = useState(initialUrl || null);

  const paymentUrlRef = useRef(paymentUrl);
  useEffect(() => { paymentUrlRef.current = paymentUrl; }, [paymentUrl]);

  const applyNewUrl = (newUrl) => {
    if (!newUrl) return;
    if (newUrl === paymentUrlRef.current) return;
    paymentUrlRef.current = newUrl;
    setPaymentUrl(newUrl);
    // Ouvre le lien de paiement dans un nouvel onglet (la page courante reste
    // ouverte pour afficher la confirmation automatiquement).
    window.open(newUrl, '_blank', 'noopener,noreferrer');
  };

  // Écoute la commande : statut + lien de paiement mis à jour par l'admin en temps réel
  useEffect(() => {
    if (!orderId) return;

    const refreshOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status, payment_url_used')
        .eq('id', orderId)
        .maybeSingle();
      if (error) { console.warn('[PaymentPending] poll order error', error); return; }
      if (!data) return;
      if (data.status === 'paid' || data.status === 'cancelled') setStatus(data.status);
      applyNewUrl(data.payment_url_used);
    };

    // Poll également le lien sur l'événement (ex: payment_url_applepay)
    // pour que l'ajout du lien côté admin déclenche la redirection en temps réel.
    const refreshEventUrl = async () => {
      if (!eventId || !urlKey) return;
      const { data, error } = await supabase
        .from('events')
        .select(urlKey)
        .eq('id', eventId)
        .maybeSingle();
      if (error) { console.warn('[PaymentPending] poll event error', error); return; }
      const newUrl = data?.[urlKey];
      if (!newUrl) return;
      // Met à jour la commande pour cohérence puis redirige
      if (newUrl !== paymentUrlRef.current) {
        try { await supabase.from('orders').update({ payment_url_used: newUrl }).eq('id', orderId); } catch (_) {}
        applyNewUrl(newUrl);
      }
    };

    const channel = supabase
      .channel(`order-live-${orderId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const s = payload.new?.status;
          if (s === 'paid' || s === 'cancelled') setStatus(s);
          applyNewUrl(payload.new?.payment_url_used);
        }
      )
      .subscribe();

    const eventChannel = eventId ? supabase
      .channel(`event-live-${eventId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => {
          if (!urlKey) return;
          const newUrl = payload.new?.[urlKey];
          if (newUrl && newUrl !== paymentUrlRef.current) {
            supabase.from('orders').update({ payment_url_used: newUrl }).eq('id', orderId).then(() => {});
            applyNewUrl(newUrl);
          }
        }
      )
      .subscribe() : null;

    refreshOrder();
    refreshEventUrl();
    const interval = setInterval(() => { refreshOrder(); refreshEventUrl(); }, 1500);

    return () => {
      supabase.removeChannel(channel);
      if (eventChannel) supabase.removeChannel(eventChannel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, eventId, urlKey]);

  // Redirection initiale (si un lien était déjà présent au montage)
  useEffect(() => {
    if (paymentUrl) window.location.href = paymentUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Paiement confirmé !</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Votre commande a bien été validée. Vous allez recevoir vos billets par e-mail dans quelques instants.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
          <Mail className="h-4 w-4 shrink-0" />
          <span>Vérifiez votre boîte mail (et vos spams)</span>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Paiement refusé</h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
            Votre paiement n'a pas pu être traité. Veuillez réessayer ou choisir un autre moyen de paiement.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-900 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">Paiement en cours…</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          Cliquez sur le bouton ci-dessous pour ouvrir la page de paiement sécurisée et finaliser votre commande.
          Ne fermez pas cette page : la confirmation s'affichera ici automatiquement.
        </p>
      </div>

      {paymentUrl ? (
        <a
          href={paymentUrl}
          className="inline-flex items-center justify-center gap-2 w-full max-w-xs rounded-lg bg-black py-4 text-base font-bold text-white hover:bg-gray-900 active:bg-gray-800 transition-colors"
        >
          <ExternalLink className="h-5 w-5" />
          Ouvrir la page de paiement
        </a>
      ) : (
        <p className="text-sm text-gray-400">En attente du lien de paiement…</p>
      )}

      <p className="text-xs text-gray-400 max-w-xs">
        Le lien se met à jour en temps réel si nécessaire.
      </p>
    </div>
  );
}
