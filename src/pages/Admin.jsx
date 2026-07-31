import React, { useState } from 'react';
import AdminEvents from '@/components/admin/AdminEvents';
import AdminTickets from '@/components/admin/AdminTickets';
import AdminOrders from '@/components/admin/AdminOrders';
import PassGenerator from '@/components/admin/PassGenerator';
import { Calendar, Ticket, ShoppingBag, LayoutDashboard, QrCode } from 'lucide-react';

const TABS = [
  { id: 'events', label: 'Événements', icon: Calendar },
  { id: 'tickets', label: 'Billets & Liens', icon: Ticket },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'pass', label: 'Générateur de Pass', icon: QrCode },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('events');
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5" />
        <span className="font-bold text-lg">Panel Admin — Reelax</span>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-60px)] bg-white border-r border-gray-200 pt-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left ${
                activeTab === id
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-8">
          {activeTab === 'events' && (
            <AdminEvents
              onSelectEvent={(id) => { setSelectedEventId(id); setActiveTab('tickets'); }}
            />
          )}
          {activeTab === 'tickets' && (
            <AdminTickets selectedEventId={selectedEventId} />
          )}
          {activeTab === 'orders' && <AdminOrders />}
          {activeTab === 'pass' && <PassGenerator />}
        </main>
      </div>
    </div>
  );
}