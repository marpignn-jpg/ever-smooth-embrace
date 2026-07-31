import React from 'react';

const FALLBACK_IMG = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80";

export default function EventHeader({ event }) {
  const imageUrl = event?.image_url || FALLBACK_IMG;
  const isSoldOut = event?.status === 'sold_out';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div>
      {/* Event image banner */}
      <div className="relative h-48 w-full overflow-hidden bg-black sm:h-64">
        {/* Fond flouté */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-110"
          style={{ filter: 'blur(20px)', opacity: 0.75 }}
        />
        {/* Image principale centrée avec ratio naturel */}
        <img
          src={imageUrl}
          alt={event?.name || 'Concert'}
          className="absolute z-10 max-h-full max-w-[70%] object-contain"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />

        {isSoldOut && (
          <div className="absolute top-4 left-4 rotate-[-4deg] rounded bg-red-600 px-3 py-1 text-sm font-black uppercase tracking-wider text-white shadow">
            COMPLET
          </div>
        )}

      </div>

      {/* Bourse aux billets banner */}
      <div className="flex justify-center px-3 sm:px-4 -mt-10 sm:-mt-12 relative z-10">
        <div className="bg-black rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-center max-w-2xl w-full shadow-lg">
          <p className="text-sm font-bold text-white">Bourse aux billets officielle</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-300">
            <span className="font-semibold text-white">{event?.venue || event?.name || 'Cet événement'}</span> et Reelax Tickets vous proposent d'acheter et de{' '}
            <span className="font-semibold text-white">vendre vos billets en sécurité</span> ! C'est la seule plateforme de revente à pouvoir vous{' '}
            garantir la validité des billets.
          </p>
        </div>
      </div>
    </div>

  );
}