import React, { useEffect, useRef } from 'react';
import TicketCard from '@/components/admin/TicketCard';
import { Download, Printer } from 'lucide-react';
import NavBar from '@/components/reelax/NavBar';

export default function MyTicketView({ ticket, event }) {
  const ticketRef = useRef(null);

  // Reconstruct pass object expected by TicketCard
  const pass = {
    id: ticket?.resale_token || ticket?.id || '',
    firstName: ticket?.buyer_first_name || '',
    lastName: ticket?.buyer_last_name || '',
    category: ticket?.category || '',
    section: ticket?.seat || '',
    rang: '',
    siege: '',
    event,
    isNumbered: event?.seating_type === 'numbered',
  };

  const handlePrint = () => {
    const el = ticketRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Mon Billet</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f0f0;display:flex;justify-content:center;padding:40px;font-family:'Inter',Arial,sans-serif;}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  return (
    <div className="min-h-screen bg-[#ebebeb]">
      <NavBar />
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900">Mon billet</h1>
          <p className="text-gray-500 text-sm mt-1">Présentez ce billet à l'entrée de l'événement.</p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
          >
            <Printer className="h-4 w-4" /> Imprimer / Télécharger
          </button>
        </div>

        <div ref={ticketRef}>
          <TicketCard pass={pass} />
        </div>
      </div>
    </div>
  );
}