import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Copy, Link, Check } from 'lucide-react';
import TicketFormModal from './TicketFormModal';

export default function AdminTickets({ selectedEventId }) {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [eventId, setEventId] = useState(selectedEventId || '');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    base44.entities.Event.list('-created_date').then(setEvents);
  }, []);

  useEffect(() => {
    if (selectedEventId) setEventId(selectedEventId);
  }, [selectedEventId]);

  useEffect(() => {
    if (!eventId) { setTickets([]); return; }
    setLoading(true);
    base44.entities.Ticket.filter({ event_id: eventId }, '-created_date').then(data => {
      setTickets(data);
      setLoading(false);
    });
  }, [eventId]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce billet ?')) return;
    await base44.entities.Ticket.delete(id);
    reload();
  };

  const reload = () => {
    base44.entities.Ticket.filter({ event_id: eventId }, '-created_date').then(setTickets);
  };

  const getResaleLink = (token) => `https://reelax-tickets.com.revente.app/?token=${token}`;

  const copyLink = (token, id) => {
    navigator.clipboard.writeText(getResaleLink(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusColors = {
    available: 'bg-green-100 text-green-700',
    reserved: 'bg-yellow-100 text-yellow-700',
    sold: 'bg-red-100 text-red-700',
  };
  const statusLabels = { available: 'Disponible', reserved: 'Réservé', sold: 'Vendu' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billets et Liens de revente</h1>
        <button
          onClick={() => setShowModal(true)}
          disabled={!eventId}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Nouveau billet
        </button>
      </div>

      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner un événement</label>
        <select value={eventId} onChange={e => setEventId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
          <option value="">-- Choisir un événement --</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name} — {ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</option>
          ))}
        </select>
      </div>

      {!eventId ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-gray-200">
          <Link className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Sélectionnez un événement pour gérer ses billets.</p>
        </div>
      ) : loading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-gray-200">
          <p>Aucun billet pour cet événement.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{t.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status]}`}>
                    {statusLabels[t.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{t.seat || '—'} · {t.tarif_label || 'Tarif Normal'}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{t.price} €</p>
                {t.resale_token && (
                  <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-gray-400 truncate flex-1">{getResaleLink(t.resale_token)}</span>
                    <button onClick={() => copyLink(t.resale_token, t.id)}
                      className="shrink-0 text-gray-500 hover:text-black">
                      {copiedId === t.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TicketFormModal
          eventId={eventId}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); reload(); }}
        />
      )}
    </div>
  );
}