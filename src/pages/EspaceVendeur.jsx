import React from 'react';
import { Download, FileText, Calendar, MapPin, Eye } from 'lucide-react';
import NavBar from '@/components/reelax/NavBar';

// Placeholders — remplacer par les vraies URLs des PDFs quand disponibles
const TICKETS = [
  { id: 1, label: 'Billet 1 — Les Déferlantes', pdfUrl: '#', filename: 'deferlantes-billet-1.pdf' },
  { id: 2, label: 'Billet 2 — Les Déferlantes', pdfUrl: '#', filename: 'deferlantes-billet-2.pdf' },
];

const EVENT = {
  name: 'Les Déferlantes',
  date: 'Dimanche 12 juillet 2026',
  location: 'Château de Aubiry, Céret',
};

export default function EspaceVendeur() {
  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col">
      <NavBar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Espace vendeur</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Mes billets à revendre</h1>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{EVENT.name}</h2>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{EVENT.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{EVENT.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {TICKETS.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-[#1469C9]/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-[#1469C9]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.label}</p>
                  <p className="text-xs text-gray-500 truncate">{t.filename}</p>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-shrink-0">
                <a
                  href={t.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  En ligne
                </a>
                <a
                  href={t.pdfUrl}
                  download={t.filename}
                  className="inline-flex items-center justify-center gap-2 bg-[#1469C9] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-8 text-center">
          Ces billets sont mis en revente via Reelax. Conservez ce lien pour y accéder à tout moment.
        </p>
      </main>
    </div>
  );
}
