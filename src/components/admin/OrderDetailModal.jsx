import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Save, ExternalLink, CreditCard } from 'lucide-react';

const METHOD_LABELS = {
  card: 'Carte bancaire / Google Pay',
  applepay: 'Apple Pay',
};

const METHOD_ICONS = {
  card: <img src="https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/073c671bd_image.png" alt="CB" className="h-5 w-auto" />,
  applepay: <img src="https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/cab8265c7_image.png" alt="Apple Pay" className="h-5 w-auto rounded" />,
};

export default function OrderDetailModal({ order, event, onClose, onSaved }) {
  const [eventData, setEventData] = useState(event || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!eventData.id) return;
    setSaving(true);
    await base44.entities.Event.update(eventData.id, {
      payment_url_card: eventData.payment_url_card || null,
      payment_url_applepay: eventData.payment_url_applepay || null,
    });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Détails de la commande</h2>
            <p className="text-xs text-gray-400 mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Méthode de paiement */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Paiement demandé</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-3">
              {order.payment_method ? (
                <>
                  {METHOD_ICONS[order.payment_method] || <CreditCard className="h-5 w-5 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-800">
                    {METHOD_LABELS[order.payment_method] || order.payment_method}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400 italic">Non renseigné</span>
              )}
            </div>
            {order.payment_url_used && (
              <a
                href={order.payment_url_used}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                <ExternalLink className="h-3 w-3" />
                Voir le lien de paiement envoyé à l'acheteur
              </a>
            )}
          </div>

          {/* Liens de paiement par défaut de l'événement */}
          {eventData.id && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Liens de paiement par défaut de l'événement
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Carte / Google Pay</label>
                  <input
                    type="url"
                    value={eventData.payment_url_card || ''}
                    onChange={e => setEventData(d => ({ ...d, payment_url_card: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Apple Pay</label>
                  <input
                    type="url"
                    value={eventData.payment_url_applepay || ''}
                    onChange={e => setEventData(d => ({ ...d, payment_url_applepay: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Ces liens sont utilisés par défaut pour toutes les nouvelles commandes de cet événement.
              </p>
            </div>
          )}

          {/* Infos acheteur */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Acheteur</h3>
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
              {(order.buyer_first_name || order.buyer_last_name) && (
                <p className="font-medium text-gray-800">{order.buyer_first_name} {order.buyer_last_name}</p>
              )}
              {order.buyer_email && <p className="text-gray-500">{order.buyer_email}</p>}
              {order.buyer_phone && <p className="text-gray-500">{order.buyer_phone}</p>}
              <p className="text-gray-400 text-xs mt-1">Montant : <strong className="text-gray-700">{order.amount} €</strong></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {eventData.id && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-50">
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
