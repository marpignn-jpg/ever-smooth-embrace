import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Ticket, Calendar, MapPin, Copy, Check, Mail, Loader2, CopyPlus } from 'lucide-react';
import EventFormModal from './EventFormModal';
import { resaleInviteEmail } from '@/lib/emailTemplates';

export default function AdminEvents({ onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [inviteModal, setInviteModal] = useState(null); // { ev }
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteModal) return;
    setInviteSending(true);
    // Lien de revente de l'événement (identique au lien copié depuis la fiche événement).
    const resaleLink = `https://reelax-tickets.com.revente.app/private/?event=${inviteModal.ev.id}`;
    await base44.functions.invoke('sendEmail', {
      to: inviteEmail,
      from_name: 'Reelax Tickets',
      subject: `Accès privé — Billets disponibles · ${inviteModal.ev.artist || inviteModal.ev.name}`,
      body: resaleInviteEmail({ event: inviteModal.ev, resaleLink }),
    });
    setInviteSending(false);
    setInviteSent(true);
    setTimeout(() => { setInviteModal(null); setInviteEmail(''); setInviteSent(false); }, 2000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Event.list('-created_at');
      setEvents(data);
    } catch (e) {
      console.error('Load events error:', e);
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return;
    await base44.entities.Event.delete(id);
    load();
  };

  const handleDuplicate = async (ev) => {
    const { id, created_at, updated_at, ...rest } = ev;
    const copy = {
      ...rest,
      name: `${ev.name || 'Événement'} (copie)`,
      status: 'draft',
    };
    try {
      await base44.entities.Event.create(copy);
      load();
    } catch (e) {
      console.error('Duplicate event error:', e);
      alert('Erreur lors de la duplication.');
    }
  };

  const toggleActive = async (ev) => {
    const newStatus = ev.status === 'active' ? 'draft' : 'active';
    await base44.entities.Event.update(ev.id, { status: newStatus });
    setEvents(evs => evs.map(e => e.id === ev.id ? { ...e, status: newStatus } : e));
  };

  const copyResaleLink = async (eventId, id) => {
    const link = `https://reelax-tickets.com.revente.app/private/?event=${eventId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
      window.prompt('Copiez le lien :', link);
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    sold_out: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    draft: 'bg-yellow-100 text-yellow-700',
  };

  const statusLabels = {
    active: 'Actif', sold_out: 'Complet', cancelled: 'Annulé', draft: 'Brouillon'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900"
        >
          <Plus className="h-4 w-4" /> Nouvel événement
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl border border-gray-200">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucun événement. Créez-en un.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              {ev.image_url && (
                <img
                  src={ev.image_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-16 w-24 object-cover rounded-lg shrink-0 bg-gray-100"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900 truncate">{ev.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ev.status] || 'bg-gray-100'}`}>
                    {statusLabels[ev.status] || ev.status}
                  </span>
                </div>
                {ev.artist && <p className="text-sm text-gray-500">{ev.artist.split(' - ')[0].trim()}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                  {ev.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                  {ev.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.venue}{ev.city ? `, ${ev.city}` : ''}</span>}
                  {ev.face_value > 0 && (() => {
                    const face = Number(ev.face_value);
                    const qty = Number(ev.total_tickets) || 1;
                    const feeRaw = ev.fee_amount;
                    const hasFixed = feeRaw !== null && feeRaw !== undefined && feeRaw !== '' && !isNaN(Number(feeRaw));
                    const totalFees = hasFixed ? Number(feeRaw) : Math.round(face * qty * 0.05);
                    const total = Math.round(face * qty + totalFees);
                    const unit = Math.round(face + totalFees / qty);
                    return (
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        {total.toLocaleString('fr-FR')} € <span className="text-gray-400 font-normal">({qty} × {unit.toLocaleString('fr-FR')} € frais inclus)</span>
                      </span>
                    );
                  })()}
                </div>
                {/* Lien de revente */}
                <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 w-fit max-w-xs">
                  <span className="text-xs text-gray-400 truncate">reelax-tickets.com.revente.app/private/?event={ev.id}</span>
                  <button onClick={() => copyResaleLink(ev.id, ev.id)} className="shrink-0 text-gray-400 hover:text-black">
                    {copiedId === ev.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle actif/inactif */}
                <button
                  onClick={() => toggleActive(ev)}
                  title={ev.status === 'active' ? 'Désactiver' : 'Activer'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ev.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${ev.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <button
                  onClick={() => { setInviteModal({ ev }); setInviteEmail(''); setInviteSent(false); }}
                  className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium border border-blue-200"
                  title="Inviter à la revente"
                >
                  <Mail className="h-3.5 w-3.5" /> Inviter
                </button>
                <button
                  onClick={() => onSelectEvent(ev.id)}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg font-medium"
                >
                  <Ticket className="h-3.5 w-3.5" /> Billets
                </button>
                <button
                  onClick={() => handleDuplicate(ev)}
                  title="Dupliquer l'événement"
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <CopyPlus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setEditing(ev); setShowModal(true); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale invitation revente */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Inviter à la revente</h2>
                <p className="text-xs text-gray-500 mt-0.5">{inviteModal.ev.artist || inviteModal.ev.name}</p>
              </div>
              <button onClick={() => setInviteModal(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Envoyez un email avec le lien de revente à quelqu'un qui souhaite revendre son billet.
            </p>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
              placeholder="email@exemple.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:border-blue-500"
              disabled={inviteSending || inviteSent}
            />
            <div className="flex gap-3">
              <button onClick={() => setInviteModal(null)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteEmail || inviteSending || inviteSent}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                  inviteSent ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {inviteSent ? (
                  <><Check className="h-4 w-4" /> Envoyé !</>
                ) : inviteSending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
                ) : (
                  <><Mail className="h-4 w-4" /> Envoyer l'invitation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <EventFormModal
          event={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}