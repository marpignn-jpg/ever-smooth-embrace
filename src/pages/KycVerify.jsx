import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LOGO_URL =
  'https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png';

function decodeParam(value) {
  if (!value) return '';
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(normalized)));
  } catch {
    return '';
  }
}

export default function KycVerify() {
  const params = useMemo(
    () => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''),
    []
  );
  const token = params.get('t') || '';

  // Legacy links (email address / url encoded directly in the URL)
  const [email, setEmail] = useState(decodeParam(params.get('e')) || params.get('email') || '');
  const [kycUrl, setKycUrl] = useState(decodeParam(params.get('u')) || '');
  const [eventName, setEventName] = useState(
    decodeParam(params.get('ev')) || params.get('event') || ''
  );
  const [loading, setLoading] = useState(Boolean(token));
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('kyc_requests')
        .select('email, event_name, target_url, status')
        .eq('token', token)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setEmail(data.email || '');
        setEventName(data.event_name || '');
        setKycUrl(data.status === 'disabled' ? '' : data.target_url || '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleVerify = () => {
    if (!kycUrl) return;
    setRedirecting(true);
    window.location.href = kycUrl;
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <img src={LOGO_URL} alt="Reelax Tickets" className="h-9 mb-6" />

        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-gray-900" />
          <h1 className="text-xl font-bold text-gray-900">Vérification d'identité</h1>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Les places{eventName ? ` pour « ${eventName} »` : ''} sont nominatives. Par mesure de
          sécurité, nous devons vérifier votre identité avant de vous transmettre vos billets.
          Cette étape ne prend que quelques minutes.
        </p>

        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            E-mail associé à la commande
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full border border-gray-200 bg-gray-50 text-gray-800 rounded-lg px-3 py-2.5 pr-9 text-sm cursor-not-allowed"
            />
            <Lock className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Cette adresse ne peut pas être modifiée.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : kycUrl ? (
          <button
            onClick={handleVerify}
            disabled={redirecting}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-lg py-3 text-sm font-semibold hover:bg-gray-900 disabled:opacity-60"
          >
            {redirecting ? 'Redirection…' : 'Vérifier mon identité'}
            {!redirecting && <ArrowRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2.5 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>Lien de vérification invalide ou expiré. Contactez le support.</span>
          </div>
        )}

        <p className="text-[11px] text-gray-400 mt-6 leading-relaxed">
          Ne communiquez jamais vos identifiants bancaires par e-mail. Reelax Tickets ne vous
          demandera jamais votre mot de passe.
        </p>
      </div>
    </div>
  );
}
