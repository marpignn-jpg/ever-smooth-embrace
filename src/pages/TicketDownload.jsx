import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import TicketCard from '@/components/admin/TicketCard';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png";

function ticketToPass(ticket, event) {
  return {
    id: ticket.resale_token || ticket.id,
    category: ticket.category || '',
    section: ticket.seat?.split(' ')?.[0] || '',
    rang: ticket.seat?.split(' ')?.[1]?.replace('R', '') || '',
    siege: ticket.seat?.split(' ')?.[2]?.replace('S', '') || '',
    event: event || null,
    isNumbered: event?.seating_type === 'numbered',
  };
}

export default function TicketDownload() {
  const [passes, setPasses] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketsRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Support ?tokens=t1,t2,t3 (multi) or legacy ?token=t1
    const tokensParam = params.get('tokens') || params.get('token');
    if (!tokensParam) { setNotFound(true); setLoading(false); return; }

    const tokens = tokensParam.split(',').map(t => t.trim()).filter(Boolean);

    Promise.all(tokens.map(tok => base44.entities.Ticket.filter({ resale_token: tok }))).then(async (results) => {
      const tickets = results.flat();
      if (tickets.length === 0) { setNotFound(true); setLoading(false); return; }

      // Load event from first ticket
      let ev = null;
      if (tickets[0].event_id) {
        const evs = await base44.entities.Event.filter({ id: tickets[0].event_id });
        if (evs.length > 0) ev = evs[0];
      }
      setEvent(ev);
      setPasses(tickets.map(t => ticketToPass(t, ev)));
      setLoading(false);
    });
  }, []);

  const handleDownloadPDF = async () => {
    const el = ticketsRef.current;
    if (!el) return;
    setDownloading(true);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px' });
    const cards = el.querySelectorAll('.ticket-card-item');
    for (let i = 0; i < cards.length; i++) {
      const canvas = await html2canvas(cards[i], { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const w = canvas.width / 3;
      const h = canvas.height / 3;
      if (i === 0) {
        pdf.internal.pageSize.setWidth(w);
        pdf.internal.pageSize.setHeight(h);
        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      } else {
        pdf.addPage([w, h]);
        pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      }
    }
    const eventName = event?.artist || event?.name || 'billets';
    pdf.save(`billets-${eventName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    setDownloading(false);
  };

  const handlePrint = () => {
    const el = ticketsRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Billets</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#f0f0f0;font-family:'Inter',Arial,sans-serif;}.ticket-card-item{display:flex;justify-content:center;padding:30px;page-break-after:always;}</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 800);
  };

  return (
    <div className="min-h-screen bg-[#ebebeb] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center">
        <img src={LOGO_URL} alt="Reelax Tickets" className="h-10 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        {loading ? (
          <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mt-20" />
        ) : notFound ? (
          <div className="text-center mt-20">
            <p className="text-5xl mb-4">🎟️</p>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Billet introuvable</h1>
            <p className="text-gray-500 text-sm">Ce lien est invalide ou a expiré.</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {passes.length > 1 ? `Vos ${passes.length} e-billets` : 'Votre e-billet'}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              {event?.artist || event?.name || ''}
            </p>

            {/* Boutons en haut */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 bg-[#1469C9] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Génération…' : `Télécharger ${passes.length > 1 ? 'les PDF' : 'en PDF'}`}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
            </div>

            {/* Billets */}
            <div ref={ticketsRef} className="flex flex-col items-center gap-6">
              {passes.map((pass, i) => (
                <div key={i} className="ticket-card-item">
                  <TicketCard pass={pass} />
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-8 text-center max-w-xs">
              Présentez chaque QR code à l'entrée de l'événement. Conservez ce lien pour y accéder à tout moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}