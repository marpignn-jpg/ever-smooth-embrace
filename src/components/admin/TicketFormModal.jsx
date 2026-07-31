import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export default function TicketFormModal({ eventId, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category: '',
    seat: '',
    tarif_label: 'Tarif Normal',
    price: '',
    original_price: '',
    status: 'available',
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!eventId) return;
    base44.entities.Event.filter({ id: eventId }).then(results => {
      if (results.length > 0 && results[0].categories?.length > 0) {
        setCategories(results[0].categories);
        setForm(f => ({ ...f, category: results[0].categories[0] }));
      }
    });
  }, [eventId]);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Ticket.create({
      ...form,
      event_id: eventId,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : undefined,
      resale_token: generateToken(),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Nouveau billet</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4">
          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie *</label>
            {categories.length > 0 ? (
              <select value={form.category} onChange={set('category')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={form.category} onChange={set('category')} placeholder="Catégorie 1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            )}
          </div>
          <Field label="Siège / Secteur" value={form.seat} onChange={set('seat')} placeholder="Siège 208 - Secteur GRADIN NUM. 1" />
          <Field label="Label tarif" value={form.tarif_label} onChange={set('tarif_label')} placeholder="Tarif Normal" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix de revente (€) *" type="number" value={form.price} onChange={set('price')} placeholder="71.50" />
            <Field label="Prix original (€)" type="number" value={form.original_price} onChange={set('original_price')} placeholder="65.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="available">Disponible</option>
              <option value="reserved">Réservé</option>
              <option value="sold">Vendu</option>
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400">Un lien de revente unique sera automatiquement généré pour ce billet.</p>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.category || !form.price}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {saving ? 'Création...' : 'Créer le billet'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
    </div>
  );
}