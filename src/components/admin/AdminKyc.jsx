import React, { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { sendKycRequestEmail } from '@/lib/kyc-email.functions';
import { supabase } from '@/integrations/supabase/client';
import {
  ShieldCheck, Send, CheckCircle2, AlertCircle, Link2, Save, RefreshCw, Copy,
} from 'lucide-react';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400';

const SITE_URL = 'https://reelax-tickets.revente.app';

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

  const [requests, setRequests] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from('kyc_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setRequests(data || []);
    setLoadingList(false);
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const { data: created, error } = await supabase
        .from('kyc_requests')
        .insert({
          email: form.email.trim(),
          buyer_name: form.buyerName.trim() || null,
          event_name: form.eventName.trim() || null,
          target_url: form.kycUrl.trim(),
          deadline: form.deadline.trim() || null,
          message: form.message.trim() || null,
        })
        .select()
        .single();
      if (error || !created) throw error || new Error('insert');

      const res = await send({
        data: {
          email: form.email.trim(),
          token: created.token,
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
      loadRequests();
    } catch (err) {
      setStatus({
        ok: false,
        text: "L'envoi a échoué. Vérifie l'adresse e-mail et le lien KYC (https:// obligatoire).",
      });
    } finally {
      setSending(false);
    }
  };

  const saveUrl = async (req) => {
    const value = (drafts[req.id] ?? req.target_url ?? '').trim();
    if (!value) return;
    setSavingId(req.id);
    await supabase.from('kyc_requests').update({ target_url: value }).eq('id', req.id);
    setDrafts((d) => { const n = { ...d }; delete n[req.id]; return n; });
    await loadRequests();
    setSavingId(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck className="h-5 w-5 text-gray-800" />
        <h1 className="text-xl font-bold text-gray-900">Demande de vérification KYC</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Envoie à l'acheteur une demande de vérification d'identité avant la remise des billets.
        Le lien reste modifiable après l'envoi : l'e-mail pointe vers une page Reelax qui redirige
        toujours vers le lien actuel.
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

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Demandes envoyées</h2>
          <button onClick={loadRequests}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
        </div>

        {loadingList ? (
          <p className="text-sm text-gray-400">Chargement…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune demande pour l'instant.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const landing = `${SITE_URL}/kyc?t=${req.token}`;
              const value = drafts[req.id] ?? req.target_url ?? '';
              const dirty = value.trim() !== (req.target_url || '');
              return (
                <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                    <span className="text-sm font-semibold text-gray-900">{req.email}</span>
                    {req.event_name && (
                      <span className="text-xs text-gray-500">{req.event_name}</span>
                    )}
                    <span className="text-[11px] text-gray-400 ml-auto">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Lien KYC actuel (modifiable sans renvoyer d'e-mail)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => setDrafts((d) => ({ ...d, [req.id]: e.target.value }))}
                      className={inputClass}
                      placeholder="https://..."
                    />
                    <button
                      onClick={() => saveUrl(req)}
                      disabled={!dirty || savingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-900 disabled:opacity-40 whitespace-nowrap"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {savingId === req.id ? '…' : 'Enregistrer'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                    <Link2 className="h-3.5 w-3.5" />
                    <span className="truncate">{landing}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(landing)}
                      className="text-gray-500 hover:text-gray-900"
                      title="Copier le lien envoyé dans l'e-mail"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
