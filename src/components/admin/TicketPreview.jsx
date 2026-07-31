import React, { useRef } from 'react';
import { X } from 'lucide-react';
import TicketCard from './TicketCard';

export default function TicketPreview({ order, event, ticket, onClose }) {
  const ticketRef = useRef(null);

  // Build a pass object from order + ticket + event
  const isNumbered = event?.seating_type === 'numbered';
  const seatRaw = ticket?.seat || '';
  // Try to parse "Rang X - Place Y" or "Rangée X · Siège Y"
  let section = '', rang = '', siege = '';
  if (seatRaw) {
    const parts = seatRaw.split(/[-·]/);
    if (parts.length >= 2) {
      rang = parts[0]?.replace(/rang[ée]?/i, '').trim();
      siege = parts[1]?.replace(/place|siège/i, '').trim();
    } else {
      siege = seatRaw.trim();
    }
  }

  const pass = {
    id: order.id,
    event,
    isNumbered,
    category: ticket?.category || '',
    section,
    rang,
    siege,
  };

  const handlePrint = () => {
    const content = ticketRef.current.innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Billet - ${event?.name || 'Événement'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #f0f0f0; display: flex; justify-content: center; padding: 40px; font-family: 'Inter', Arial, sans-serif; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Billet électronique</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-900 transition-colors"
            >
              Imprimer / PDF
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-4" ref={ticketRef}>
          <TicketCard pass={pass} />
        </div>
      </div>
    </div>
  );
}