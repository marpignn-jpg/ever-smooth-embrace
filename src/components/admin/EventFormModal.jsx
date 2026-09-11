import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Link, Loader2, Plus, Trash2, Copy, Check } from 'lucide-react';

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function EventFormModal({ event, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: event?.name || '',
    artist: event?.artist || '',
    categories: event?.categories || [],
    seating_type: event?.seating_type || 'numbered',
    show_seat_numbers: event?.show_seat_numbers === true,
    seat_details: event?.seat_details || '',
    max_tickets_per_order: event?.max_tickets_per_order ?? 4,
    total_tickets: event?.total_tickets || '',
    face_value: event?.face_value || '',
    fee_amount: event?.fee_amount ?? '',
    date: toLocalInput(event?.date),
    venue: event?.venue || '',
    image_url: event?.image_url || '',
    status: event?.status || 'active',
    payment_url_card: event?.payment_url_card || '',
    payment_url_googlepay: event?.payment_url_googlepay || '',
    payment_url_applepay: event?.payment_url_applepay || '',
    apple_pay_enabled: event?.apple_pay_enabled !== false,
  });
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const addCategory = () => {
    const val = newCategory.trim();
    if (!val || form.categories.includes(val)) return;
    setForm(f => ({ ...f, categories: [...f.categories, val] }));
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setForm(f => ({ ...f, categories: f.categories.filter(c => c !== cat) }));
  };

  const resaleLink = event?.id ? `https://reelax-tickets.revente.app/private/?event=${event.id}` : null;
  const copyResaleLink = () => {
    navigator.clipboard.writeText(resaleLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const result = await base44.functions.invoke('scrapeEventUrl', { url: importUrl.trim() });
      if (!result || result.error) throw new Error(result?.error || 'Erreur');
      setForm(f => ({
        ...f,
        name: result.name || f.name,
        artist: result.artist || f.artist,
        date: result.date ? toLocalInput(result.date) : f.date,
        venue: result.venue || f.venue,
        image_url: result.image_url || f.image_url,
      }));
      setImportUrl('');
    } catch (e) {
      console.error('Import error:', e);
      setImportError('Impossible d\'importer. Vérifiez le lien et réessayez.');
    }
    setImporting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    const base = newCategory.trim() && !form.categories.includes(newCategory.trim())
      ? { ...form, categories: [...form.categories, newCategory.trim()] }
      : form;
    const { city, ...cleaned } = base;
    const finalForm = {
      ...cleaned,
      total_tickets: cleaned.total_tickets !== '' ? Number(cleaned.total_tickets) : null,
      face_value: cleaned.face_value !== '' ? Number(cleaned.face_value) : null,
      fee_amount: cleaned.fee_amount !== '' && cleaned.fee_amount !== null ? Number(cleaned.fee_amount) : null,
      date: cleaned.date ? new Date(cleaned.date).toISOString() : null,
    };
    try {
      if (event?.id) {
        await base44.entities.Event.update(event.id, finalForm);
      } else {
        await base44.entities.Event.create(finalForm);
      }
      setSaving(false);
      onSaved();
    } catch (e) {
      console.error('Save event error:', e);
      setSaveError(e?.message || 'Erreur lors de l\'enregistrement.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{event ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        {/* Import Ticketmaster */}
        <div className="mb-5 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
            <Link className="h-3.5 w-3.5" /> Importer depuis Ticketmaster / Fnac / autre
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder="https://www.ticketmaster.fr/..."
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
              onKeyDown={e => e.key === 'Enter' && handleImport()}
            />
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importer'}
            </button>
          </div>
          {importError && <p className="mt-1.5 text-xs text-red-500">{importError}</p>}
          {importing && <p className="mt-1.5 text-xs text-blue-600 animate-pulse">⏳ Analyse en cours… cela peut prendre 30-40 secondes</p>}
        </div>

        <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-1">
          <Field label="Nom de l'événement / Artiste *" value={form.name} onChange={set('name')} />
          <Field label="Date & heure *" type="datetime-local" value={form.date} onChange={set('date')} />
          <Field label="Lieu *" value={form.venue} onChange={set('venue')} placeholder="ex: Accor Arena, Paris" />
          <Field label="URL image" value={form.image_url} onChange={set('image_url')} placeholder="https://..." />


          {/* Type de placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de placement</label>
            <select value={form.seating_type} onChange={set('seating_type')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="numbered">Places numérotées</option>
              <option value="free">Placement libre</option>
            </select>
          </div>

          {/* Numéros de places visibles avant achat */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Afficher les numéros de places</p>
                <p className="text-xs text-gray-400">Visible par l'acheteur avant l'achat</p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, show_seat_numbers: !f.show_seat_numbers }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.show_seat_numbers ? 'bg-black' : 'bg-gray-300'}`}
                aria-pressed={form.show_seat_numbers}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.show_seat_numbers ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {form.show_seat_numbers && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéros de places</label>
                <textarea
                  rows={2}
                  value={form.seat_details}
                  onChange={set('seat_details')}
                  placeholder="ex: Bloc A · Rang 12 · Places 5 et 6"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de places</label>
              <input type="number" min={1} value={form.total_tickets} onChange={set('total_tickets')} placeholder="ex: 500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix facial (€ hors frais)</label>
              <input type="number" min={0} step="0.01" value={form.face_value} onChange={set('face_value')} placeholder="ex: 45.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            </div>
          </div>

          {/* Frais + total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Frais totaux (€) <span className="text-gray-400 font-normal">— pour toutes les places · vide = 5% auto</span>
            </label>
            <input type="number" min={0} step="0.01" value={form.fee_amount} onChange={set('fee_amount')} placeholder="ex: 25.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100" />
            {form.face_value !== '' && !isNaN(Number(form.face_value)) && (() => {
              const face = Number(form.face_value);
              const qty = Number(form.total_tickets) || 1;
              const hasFee = form.fee_amount !== '' && !isNaN(Number(form.fee_amount));
              const totalFees = hasFee ? Number(form.fee_amount) : +(face * qty * 0.05).toFixed(2);
              const perTicket = totalFees / qty;
              const unit = Math.round(face + perTicket);
              const total = Math.round(face * qty + totalFees);
              return (
                <div className="mt-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 space-y-0.5">
                  <p>{qty} × {face.toLocaleString('fr-FR')} € + {Number(totalFees).toLocaleString('fr-FR')} € de frais</p>
                  <p>= <span className="font-semibold text-gray-800">{unit.toLocaleString('fr-FR')} € / billet</span></p>
                  <p className="pt-1 border-t border-gray-200 mt-1">Prix total : <span className="font-bold text-black text-sm">{total.toLocaleString('fr-FR')} €</span></p>
                </div>
              );
            })()}
          </div>

          {/* Catégories de billets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégories de billets</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="ex: Fosse, Catégorie 1, VIP..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
              <button
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="bg-black text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-900 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.categories.map(cat => (
                  <span key={cat} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {cat}
                    <button onClick={() => removeCategory(cat)} className="text-gray-400 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Lien de revente (généré automatiquement après création) */}
          {resaleLink ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien de revente</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 truncate flex-1">{resaleLink}</span>
                <button onClick={copyResaleLink} className="shrink-0 text-gray-500 hover:text-black">
                  {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Envoyez ce lien aux acheteurs pour qu'ils accèdent à la page de vente.</p>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-dashed border-gray-300 p-3 text-xs text-gray-400 text-center">
              Le lien de revente sera généré après l'enregistrement de l'événement.
            </div>
          )}

          <div className="pt-1 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Liens de paiement</p>
            <div className="grid gap-3">
              <Field label="Lien Carte bancaire / Google Pay" value={form.payment_url_card} onChange={set('payment_url_card')} placeholder="https://..." />

              {/* Toggle Apple Pay */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-700">Apple Pay activé</p>
                  <p className="text-xs text-gray-400">Affiche l'option Apple Pay au checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, apple_pay_enabled: !f.apple_pay_enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.apple_pay_enabled ? 'bg-black' : 'bg-gray-300'}`}
                  aria-pressed={form.apple_pay_enabled}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${form.apple_pay_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {form.apple_pay_enabled && (
                <Field label="Lien Apple Pay" value={form.payment_url_applepay} onChange={set('payment_url_applepay')} placeholder="https://..." />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="sold_out">Complet</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>
        {saveError && <p className="mt-3 text-xs text-red-500 text-center">{saveError}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50">Annuler</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.date || !form.venue}
            className="flex-1 bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
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