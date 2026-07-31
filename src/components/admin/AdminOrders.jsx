import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, CheckCircle, XCircle, Clock, RefreshCw, Ticket, Trash2, Settings } from 'lucide-react';
import TicketPreview from './TicketPreview';
import OrderDetailModal from './OrderDetailModal';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  paid: { label: 'Payé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  refunded: { label: 'Remboursé', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState({});
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [ticketPreview, setTicketPreview] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    const [ordersData, eventsData, ticketsData] = await Promise.all([
      base44.entities.Order.list('-created_date', 200),
      base44.entities.Event.list('-created_date', 200),
      base44.entities.Ticket.list('-created_date', 500),
    ]);
    const evMap = {};
    eventsData.forEach(ev => { evMap[ev.id] = ev; });
    const tkMap = {};
    ticketsData.forEach(tk => { tkMap[tk.id] = tk; });
    setOrders(ordersData);
    setEvents(evMap);
    setTickets(tkMap);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = base44.entities.Order.subscribe((event) => {
      if (event.type === 'create') {
        setOrders(prev => [event.data, ...prev.filter(o => o.id !== event.id)]);
      } else if (event.type === 'update') {
        setOrders(prev => prev.map(o => o.id === event.id ? event.data : o));
      } else if (event.type === 'delete') {
        setOrders(prev => prev.filter(o => o.id !== event.id));
      }
      load({ silent: true });
    });
    const fallbackRefresh = setInterval(() => load({ silent: true }), 5000);
    return () => {
      unsubscribe();
      clearInterval(fallbackRefresh);
    };
  }, [load]);

  const updateStatus = async (id, status) => {
    const updatedOrder = await base44.entities.Order.update(id, { status });
    setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
    setOrderDetail(prev => prev?.id === id ? updatedOrder : prev);
    load({ silent: true });
  };

  const deleteOrder = async (id) => {
    if (!confirm('Supprimer cette commande ? Cette action est irréversible.')) return;
    await base44.entities.Order.delete(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setOrderDetail(prev => prev?.id === id ? null : prev);
    load({ silent: true });
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const displayOrders = orders.filter(o => o.status !== 'pending');
  const filtered = filter === 'all' ? displayOrders : displayOrders.filter(o => o.status === filter);

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'paid').length,
    pending: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.amount || 0), 0),
  };

  return (
    <div>
      {ticketPreview && (
        <TicketPreview
          order={ticketPreview.order}
          event={events[ticketPreview.order.event_id]}
          ticket={ticketPreview.ticket}
          onClose={() => setTicketPreview(null)}
        />
      )}
      {orderDetail && (
        <OrderDetailModal
          order={orderDetail}
          event={events[orderDetail.event_id]}
          onClose={() => setOrderDetail(null)}
          onSaved={load}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* Paiements en cours (temps réel) */}
      {pendingOrders.length > 0 && (
        <div className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
            </span>
            <h2 className="text-sm font-bold text-yellow-900">
              Paiements en cours · {pendingOrders.length}
            </h2>
          </div>
          <div className="grid gap-2">
            {pendingOrders.map(o => {
              const ev = events[o.event_id];
              const methodLabel = o.payment_method === 'card' ? '💳 Carte / Google Pay' : o.payment_method === 'applepay' ? '🍎 Apple Pay' : (o.payment_method || '—');
              return (
                <div key={o.id} className="bg-white rounded-lg border border-yellow-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {o.buyer_first_name} {o.buyer_last_name}
                        <span className="ml-2 text-xs font-normal text-gray-400">#{o.id.slice(-6).toUpperCase()}</span>
                      </p>
                      {o.buyer_email && <p className="text-xs text-gray-500 truncate">{o.buyer_email}</p>}
                      <p className="text-xs text-gray-600 mt-1">
                        {ev?.name || '—'} · <span className="font-semibold">{o.amount} €</span> · {new Date(o.created_at || o.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{methodLabel}</p>
                      <div className="mt-2">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                          Lien de paiement (envoyé à l'acheteur en temps réel)
                        </label>
                        <input
                          type="url"
                          defaultValue={o.payment_url_used || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            clearTimeout(e.target._t);
                            e.target._t = setTimeout(async () => {
                              await base44.entities.Order.update(o.id, { payment_url_used: val || null });
                              load({ silent: true });
                            }, 400);
                          }}
                          placeholder="https://... (collez le lien Google Pay / Stripe ici)"
                          className="w-full border border-yellow-300 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-500"
                        />
                        {o.payment_url_used && (
                          <a href={o.payment_url_used} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline truncate block max-w-full mt-1">
                            🔗 Tester : {o.payment_url_used}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(o.id, 'paid')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-3 w-3" /> Accepter
                    </button>
                    <button
                      onClick={() => updateStatus(o.id, 'cancelled')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="h-3 w-3" /> Refuser
                    </button>
                    <button
                      onClick={() => setOrderDetail(o)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Settings className="h-3 w-3" /> Détails
                    </button>
                    <button
                      onClick={() => deleteOrder(o.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Payées', value: stats.paid },
          { label: 'En cours', value: stats.pending },
          { label: 'Revenus', value: `${Math.round(stats.revenue).toLocaleString('fr-FR')} €` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>


      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'paid', 'refunded', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f === 'all' ? 'Toutes' : STATUS_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-gray-200">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Aucune commande finalisée.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(order => {
            const ev = events[order.event_id];
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                      <Icon className="h-3 w-3" />{cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">#{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {order.buyer_first_name} {order.buyer_last_name}
                  </p>
                  {order.buyer_email && <p className="text-sm text-gray-500">{order.buyer_email}</p>}
                  {ev && <p className="text-xs text-gray-400 mt-1">{ev.name}</p>}
                  <p className="text-base font-bold text-gray-900 mt-1">{order.amount} €</p>
                  {order.payment_method && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      💳 {order.payment_method === 'card' ? 'Carte / Google Pay' : order.payment_method === 'applepay' ? 'Apple Pay' : order.payment_method}
                    </p>
                  )}
                  {order.payment_url_used && (
                    <a href={order.payment_url_used} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline truncate block max-w-[220px] mt-0.5">
                      🔗 Lien utilisé
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at || order.created_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="shrink-0 flex flex-col gap-2">
                  {order.status === 'paid' && (
                    <button
                      onClick={() => setTicketPreview({ order, ticket: tickets[order.ticket_id] })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Ticket className="h-3 w-3" /> Billet
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(order.id, 'paid')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-3 w-3" /> Accepter
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="h-3 w-3" /> Refuser
                      </button>
                    </div>
                  )}
                  <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                    <option value="pending">En attente</option>
                    <option value="paid">Payé</option>
                    <option value="refunded">Remboursé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <button
                    onClick={() => setOrderDetail(order)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                    title="Détails & modifier"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}