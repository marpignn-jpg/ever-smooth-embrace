import React, { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { sendKycRequestEmail } from '@/lib/kyc-email.functions';
import { ShieldCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400';

export default function AdminKyc({ defaultEmail = '', defaultName = '', defaultEventName = '' }) {
  const send = useServerFn(sendKycRequestEmail);
  const [form, setForm] = useState({
    email: defaultEmail,
    buyerName: defaultName,
    eventName: defaultEventName,
    kycUrl: '',
    deadline: '',
    message: '',
  });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await send({
        data: {
          email: form.email.trim(),
          kycUrl: form.kycUrl.trim(),
          buyerName: form.buyerName.trim() || undefined,
          eventName: form.eventName.trim() || undefined,
          deadline: form.deadline.trim() || undefined,
          message: form.message.trim() || undefined,
        },
      });
      if (res.sent) {
        setStatus({ ok: true, text: `E-mail de vérification envoyé à ${form.email}.` });
        setForm((f) => ({ ...f, kycUrl: '', message: '' }));
      } else {
        setStatus({ ok: false, text: res.reason });
      }
    } catch (err) {
      setStatus({
        ok: false,
        text: err?.message?.includes('kycUrl') || err?.message?.includes('url')
          ? 'Vérifie l\'adresse e-mail et le lien KYC (https:// obligatoire).'
          : "L'envoi a échoué. Réessaie dans quelques instants.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck className="h-5 w-5 text-gray-800" />
        <h1 className="text-xl font-bold text-gray-900">Demande de vérification KYC</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Envoie à l'acheteur une demande de vérification d'identité avant la remise des billets.
        Le lien KYC est celui que tu colles ci-dessous.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">E-mail de l'acheteur *</label>
          <input type="email" required value={form.email} onChange={set('email')}
            placeholder="acheteur@email.com" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lien KYC à envoyer *</label>
          <input type="url" required value={form.kycUrl} onChange={set('kycUrl')}
            placeholder="https://..." className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom de l'acheteur</label>
            <input type="text" value={form.buyerName} onChange={set('buyerName')}
              placeholder="Camille Martin" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Événement</label>
            <input type="text" value={form.eventName} onChange={set('eventName')}
              placeholder="Concert Olympia" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date limite (optionnel)</label>
          <input type="text" value={form.deadline} onChange={set('deadline')}
            placeholder="15 août 2026" className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Message additionnel (optionnel)</label>
          <textarea rows={3} value={form.message} onChange={set('message')}
            placeholder="Précision affichée dans l'e-mail…" className={inputClass} />
        </div>

        {status && (
          <div className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            status.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {status.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
            <span>{status.text}</span>
          </div>
        )}

        <button type="submit" disabled={sending}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50">
          <Send className="h-3.5 w-3.5" />
          {sending ? 'Envoi…' : 'Envoyer la demande KYC'}
        </button>
      </form>
    </div>
  );
}
