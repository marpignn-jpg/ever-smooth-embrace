import React, { useEffect, useState } from 'react';

const LOGO_URL = "https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png";

export default function RedirectTicket() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.title = 'Reelax Tickets — Chargement';
    const params = new URLSearchParams(window.location.search);
    const tokens = params.get('t') || params.get('tokens') || params.get('token');
    const event = params.get('e') || params.get('event');
    const inviteToken = params.get('it');

    let target = null;
    if (tokens) {
      target = `https://reelax-tickets.com.revente.app/ticket?tokens=${encodeURIComponent(tokens)}`;
    } else if (event) {
      target = `https://reelax-tickets.com.revente.app/private/?event=${encodeURIComponent(event)}`;
    } else if (inviteToken) {
      target = `https://reelax-tickets.com.revente.app/?token=${encodeURIComponent(inviteToken)}`;
    }
    if (!target) return;

    const start = Date.now();
    const duration = 1600;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / duration) * 100));
    }, 40);

    const timer = setTimeout(() => {
      window.location.replace(target);
    }, duration);

    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-[#ebebeb] flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center">
        <img src={LOGO_URL} alt="Reelax Tickets" className="h-10 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-10 text-center">
          <img src={LOGO_URL} alt="Reelax Tickets" className="h-12 mx-auto mb-6 object-contain" />

          <h1 className="text-xl font-black text-gray-900 mb-2">
            Préparation de vos billets
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Connexion sécurisée à votre espace billetterie Reelax…
          </p>

          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-[#1469C9] transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span>🔒 Connexion chiffrée</span>
            <span>✅ Billets vérifiés</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
          Vous allez être redirigé automatiquement vers vos e-billets.
        </p>
      </div>
    </div>
  );
}
