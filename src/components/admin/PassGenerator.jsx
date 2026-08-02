import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Printer, Mail, Plus, Trash2, Send, ChevronDown, ChevronUp, Sparkles, Download, History, RefreshCw, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import TicketCard from './TicketCard';
import { ticketConfirmationEmail } from '@/lib/emailTemplates';


function genToken() {
  return `RT-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function emptyPass() {
  return { _key: genToken(), category: '', section: '', rang: '', siege: '' };
}

// Parseur local (zéro crédit IA)
function parsePassesPrompt(input, { categories = [], isNumbered = false } = {}) {
  const text = ' ' + input.replace(/\s+/g, ' ').trim() + ' ';
  const lower = text.toLowerCase();

  // Quantité
  let qty = 1;
  const qMatch = lower.match(/(\d+)\s*(billets?|places?|tickets?|pass|passes)/);
  if (qMatch) qty = parseInt(qMatch[1], 10);

  // Catégorie : match contre les catégories existantes, sinon mots-clés courants
  let category = '';
  for (const c of categories) {
    if (c && lower.includes(c.toLowerCase())) { category = c; break; }
  }
  if (!category) {
    const catKeywords = ['carré or', 'carre or', 'fosse or', 'fosse', 'pelouse or', 'pelouse', 'tribune', 'gradin', 'vip', 'premium', 'standard'];
    for (const k of catKeywords) {
      if (lower.includes(k)) {
        category = categories.find(c => c.toLowerCase() === k) || k.replace(/\b\w/g, l => l.toUpperCase());
        break;
      }
    }
    if (!category) {
      const cat1 = lower.match(/cat[ée]gorie\s+([a-z0-9]+)/);
      if (cat1) category = `Catégorie ${cat1[1].toUpperCase()}`;
    }
  }

  // Section
  let section = '';
  const secMatch = text.match(/(?:section|porte|bloc|zone)\s+([A-Za-zÀ-ÿ0-9]+(?:\s+\d+)?)/i);
  if (secMatch) {
    const kw = secMatch[0].split(/\s+/)[0];
    section = `${kw.charAt(0).toUpperCase()}${kw.slice(1).toLowerCase()} ${secMatch[1]}`.trim();
  }

  // Helper: parse une plage "1-5", "1 à 5", "A-E"
  const parseRange = (raw) => {
    if (!raw) return null;
    const m = raw.match(/([A-Za-z0-9]+)\s*(?:-|à|a|au|to)\s*([A-Za-z0-9]+)/i);
    if (m) {
      const [a, b] = [m[1], m[2]];
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
        const start = parseInt(a, 10), end = parseInt(b, 10);
        const out = []; for (let i = start; i <= end; i++) out.push(String(i)); return out;
      }
      if (/^[A-Za-z]$/.test(a) && /^[A-Za-z]$/.test(b)) {
        const s = a.toUpperCase().charCodeAt(0), e = b.toUpperCase().charCodeAt(0);
        const out = []; for (let i = s; i <= e; i++) out.push(String.fromCharCode(i)); return out;
      }
    }
    // liste "1,2,3"
    if (raw.includes(',')) return raw.split(',').map(s => s.trim()).filter(Boolean);
    return [raw.trim()];
  };

  // Rangées
  let rows = [];
  const rowMatch = text.match(/(?:rang[ée]?e?s?|rang)\s+([A-Za-z0-9]+(?:\s*(?:-|à|a|au|to)\s*[A-Za-z0-9]+)?(?:\s*,\s*[A-Za-z0-9]+)*)/i);
  if (rowMatch) rows = parseRange(rowMatch[1]) || [];

  // Sièges/places
  let seats = [];
  const seatMatch = text.match(/(?:si[èe]ges?|places?|num[ée]ros?)\s+([0-9]+(?:\s*(?:-|à|a|au|to)\s*[0-9]+)?(?:\s*,\s*[0-9]+)*)/i);
  if (seatMatch) seats = parseRange(seatMatch[1]) || [];

  // Construction des billets
  const result = [];
  if (isNumbered && (rows.length > 0 || seats.length > 0)) {
    if (rows.length > 0 && seats.length > 0) {
      // Combine: pour chaque rangée, tous les sièges
      for (const r of rows) {
        for (const s of seats) {
          result.push({ category, section, rang: r, siege: s });
          if (result.length >= 200) break;
        }
        if (result.length >= 200) break;
      }
    } else if (seats.length > 0) {
      const r = rows[0] || '';
      for (const s of seats) result.push({ category, section, rang: r, siege: s });
    } else {
      for (const r of rows) result.push({ category, section, rang: r, siege: '' });
    }
    // Si qty explicite et inférieure, on tronque ; si supérieure, on complète
    if (qMatch) {
      if (result.length > qty) result.length = qty;
      while (result.length < qty) result.push({ category, section, rang: '', siege: '' });
    }
  } else {
    for (let i = 0; i < qty; i++) {
      result.push({ category, section, rang: '', siege: '' });
    }
  }

  return result;
}

export default function PassGenerator() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [email, setEmail] = useState('');
  const [passes, setPasses] = useState([emptyPass()]);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const ticketRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [resentId, setResentId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await base44.entities.EmailHistory.list('-last_sent_at', 50);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error('History load error:', e);
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    base44.entities.Event.list().then(setEvents);
    loadHistory();
  }, [loadHistory]);


  const selectedEvent = events.find(e => e.id === selectedEventId);
  const isNumbered = selectedEvent?.seating_type === 'numbered';
  const categories = selectedEvent?.categories || [];
  const focusedPass = passes[focusedIdx] || passes[0];

  const update = (i, field, value) => {
    setPasses(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const addPass = () => {
    const np = emptyPass();
    if (categories.length > 0) np.category = categories[0];
    setPasses(prev => [...prev, np]);
    setFocusedIdx(passes.length);
  };

  const removePass = (i) => {
    setPasses(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length === 0 ? [emptyPass()] : next;
    });
    setFocusedIdx(prev => Math.max(0, prev >= i ? prev - 1 : prev));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || !selectedEventId) return;
    setAiLoading(true);
    try {
      const generated = parsePassesPrompt(aiPrompt, { categories, isNumbered });
      if (generated.length === 0) {
        alert("Impossible d'interpréter la demande. Exemple : « 5 billets Carré Or, section Porte 012, rang A, sièges 1-5 ».");
      } else {
        setPasses(generated.map(p => ({ _key: genToken(), ...p })));
        setFocusedIdx(0);
        setShowAi(false);
      }
    } catch (e) {
      console.error('Parser error:', e);
      alert("Erreur lors de la génération. Réessayez.");
    }
    setAiLoading(false);
  };

  const handleSendAll = async () => {
    if (!email || !selectedEventId) return;
    setSending(true);

    // Créer tous les tickets et collecter les tokens
    const tokens = [];
    const ticketInfos = [];
    for (const pass of passes) {
      const token = genToken();
      const seat = [pass.section, pass.rang && `R${pass.rang}`, pass.siege && `S${pass.siege}`].filter(Boolean).join(' ');
      await base44.entities.Ticket.create({
        event_id: selectedEvent?.id || '',
        category: pass.category || '',
        seat,
        price: 0,
        status: 'sold',
        resale_token: token,
      });
      tokens.push(token);
      const seatInfo = isNumbered
        ? [pass.section && `Section : ${pass.section}`, pass.rang && `Rangée : ${pass.rang}`, pass.siege && `Siège : ${pass.siege}`].filter(Boolean).join(' · ') || 'Placement libre'
        : 'Placement libre';
      ticketInfos.push({ category: pass.category, seatInfo });
    }

    // Accès direct aux billets sur le domaine neutre : aucune redirection vers
    // le domaine custom, afin d'éviter le filtrage anti-hameçonnage Outlook.
    const downloadUrl = `https://reelax-tickets.revente.app/ticket?tokens=${encodeURIComponent(tokens.join(','))}`;
    const subject = `Vos billets — ${selectedEvent?.artist || selectedEvent?.name || 'Événement'}`;

    let status = 'sent';
    try {
      await base44.functions.invoke('sendEmail', {
        to: email,
        from_name: 'Reelax Tickets',
        subject,
        
        body: ticketConfirmationEmail({
          firstName: '',
          lastName: '',
          event: selectedEvent,
          tickets: ticketInfos,
          downloadUrl,
        }),
      });
    } catch (e) {
      console.error('sendEmail error:', e);
      status = 'failed';
    }

    try {
      await base44.entities.EmailHistory.create({
        recipient_email: email,
        event_id: selectedEvent?.id || null,
        event_name: selectedEvent?.artist || selectedEvent?.name || '',
        subject,
        tokens,
        download_url: downloadUrl,
        ticket_infos: ticketInfos,
        status,
        last_sent_at: new Date().toISOString(),
      });
      loadHistory();
    } catch (e) {
      console.error('History log error:', e);
    }

    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const handleResend = async (entry) => {
    setResendingId(entry.id);
    try {
      const ev = events.find(e => e.id === entry.event_id) || { name: entry.event_name, artist: entry.event_name };
      await base44.functions.invoke('sendEmail', {
        to: entry.recipient_email,
        from_name: 'Reelax Tickets',
        subject: entry.subject || `Vos billets — ${entry.event_name || 'Événement'}`,
        body: ticketConfirmationEmail({
          firstName: '',
          lastName: '',
          event: ev,
          tickets: entry.ticket_infos || [],
          downloadUrl: entry.download_url,
        }),
      });
      await base44.entities.EmailHistory.update(entry.id, {
        resend_count: (entry.resend_count || 0) + 1,
        last_sent_at: new Date().toISOString(),
        status: 'sent',
      });
      setResentId(entry.id);
      setTimeout(() => setResentId(null), 2500);
      loadHistory();
    } catch (e) {
      console.error('Resend error:', e);
      alert("Erreur lors du renvoi de l'email.");
    }
    setResendingId(null);
  };

  const handleCopyLink = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.download_url || '');
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) { console.error(e); }
  };

  const handleDownloadPDF = async () => {

    const el = ticketRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 3, canvas.height / 3] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
    const eventName = selectedEvent?.artist || selectedEvent?.name || 'billet';
    pdf.save(`billet-${eventName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const handlePrintOne = () => {
    const el = ticketRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Billet</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f0f0;display:flex;justify-content:center;padding:40px;font-family:'Inter',Arial,sans-serif;}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  const previewPass = {
    id: focusedPass?._key || 'TICKET',
    category: focusedPass?.category || '',
    section: focusedPass?.section || '',
    rang: focusedPass?.rang || '',
    siege: focusedPass?.siege || '',
    event: selectedEvent || null,
    isNumbered,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Générateur de Pass</h1>
      </div>

      {/* Event selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Événement</label>
        <select
          value={selectedEventId}
          onChange={e => { setSelectedEventId(e.target.value); setPasses([emptyPass()]); setFocusedIdx(0); setSent(false); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
        >
          <option value="">— Sélectionner un événement —</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}{ev.artist ? ` · ${ev.artist.split(' - ')[0].trim()}` : ''}</option>)}
        </select>
      </div>

      {selectedEventId && (
        <div className="flex gap-6 items-start">
          {/* LEFT: formulaire */}
          <div className="flex-1 min-w-0">

            {/* Email unique */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Email du destinataire</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                placeholder="email@exemple.com"
              />
              <p className="text-xs text-gray-400 mt-1.5">Tous les billets seront envoyés à cette adresse dans un seul email.</p>
            </div>

            {/* AI */}
            <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
              <button onClick={() => setShowAi(!showAi)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="font-semibold text-gray-800 text-sm">Génération rapide</span>
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Sans crédit</span>
                </div>
                {showAi ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showAi && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mt-3 mb-2"
                    placeholder="Ex: 5 billets Carré Or, section Porte 012, rangées A-E, places 1-5..."
                  />
                  <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-40">
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiLoading ? 'Génération…' : "Générer"}
                  </button>
                </div>
              )}
            </div>

            {/* Passes list */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">{passes.length} billet{passes.length > 1 ? 's' : ''}</span>
                <button onClick={addPass} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {passes.map((pass, i) => (
                  <div
                    key={pass._key}
                    onClick={() => setFocusedIdx(i)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${focusedIdx === i ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Billet #{i + 1}</span>
                      {passes.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); removePass(i); }} className="ml-auto text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {categories.length > 0 ? (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Catégorie</label>
                          <select value={pass.category} onChange={e => update(i, 'category', e.target.value)} onClick={e => e.stopPropagation()}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white">
                            <option value="">—</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Catégorie</label>
                          <input type="text" value={pass.category} onChange={e => update(i, 'category', e.target.value)} onClick={e => e.stopPropagation()}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white" placeholder="Ex: Fosse" />
                        </div>
                      )}

                      {isNumbered && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Section</label>
                            <input type="text" value={pass.section} onChange={e => update(i, 'section', e.target.value)} onClick={e => e.stopPropagation()}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white" placeholder="Porte 012" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Rangée</label>
                            <input type="text" value={pass.rang} onChange={e => update(i, 'rang', e.target.value)} onClick={e => e.stopPropagation()}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white" placeholder="C" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Siège</label>
                            <input type="text" value={pass.siege} onChange={e => update(i, 'siege', e.target.value)} onClick={e => e.stopPropagation()}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white" placeholder="18" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={handleSendAll} disabled={sending || !email || sent}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-colors ${sent ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'}`}>
                {sent ? <>✓ Envoyé !</> : sending ? <><Mail className="h-4 w-4 animate-pulse" /> Envoi en cours…</> : <><Send className="h-4 w-4" /> Envoyer {passes.length} billet{passes.length > 1 ? 's' : ''} par email</>}
              </button>
              <button onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
                title="Télécharger en PDF">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={handlePrintOne}
                className="flex items-center gap-2 px-4 py-3 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-900 transition-colors"
                title="Imprimer">
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: preview live */}
          <div className="shrink-0 sticky top-6">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-3 text-center">Aperçu — Billet #{focusedIdx + 1}</p>
            <div ref={ticketRef}>
              <TicketCard pass={previewPass} />
            </div>
          </div>
        </div>
      )}

      {/* HISTORIQUE des emails envoyés */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Historique des emails envoyés</h2>
            <span className="text-xs text-gray-400">({history.length})</span>
          </div>
          <button onClick={loadHistory} disabled={historyLoading}
            className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5">
            <RefreshCw className={`h-3 w-3 ${historyLoading ? 'animate-spin' : ''}`} /> Rafraîchir
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucun email envoyé pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Destinataire</th>
                  <th className="py-2 pr-3 font-semibold">Événement</th>
                  <th className="py-2 pr-3 font-semibold">Billets</th>
                  <th className="py-2 pr-3 font-semibold">Statut</th>
                  <th className="py-2 pr-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => {
                  const date = new Date(entry.last_sent_at || entry.created_at);
                  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const count = (entry.tokens || []).length;
                  return (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2.5 pr-3 text-xs text-gray-600 whitespace-nowrap">
                        <div className="font-medium text-gray-800">{dateStr}</div>
                        <div className="text-gray-400">{timeStr}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-800">{entry.recipient_email}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{entry.event_name || '—'}</td>
                      <td className="py-2.5 pr-3 text-gray-700">{count} billet{count > 1 ? 's' : ''}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${entry.status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {entry.status === 'sent' ? '✓ Envoyé' : '✕ Échec'}
                        </span>
                        {entry.resend_count > 0 && (
                          <span className="ml-1 text-[10px] text-gray-400">·  {entry.resend_count}× renvoyé</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => handleCopyLink(entry)}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50"
                            title="Copier le lien de téléchargement">
                            {copiedId === entry.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                            {copiedId === entry.id ? 'Copié' : 'Lien'}
                          </button>
                          <button onClick={() => handleResend(entry)} disabled={resendingId === entry.id}
                            className={`flex items-center gap-1 text-xs font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${resentId === entry.id ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'}`}>
                            {resentId === entry.id ? <><Check className="h-3 w-3" /> Renvoyé</> : resendingId === entry.id ? <><Mail className="h-3 w-3 animate-pulse" /> …</> : <><Send className="h-3 w-3" /> Renvoyer</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
