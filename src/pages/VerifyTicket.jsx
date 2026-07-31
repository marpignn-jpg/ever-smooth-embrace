import React, { useEffect, useState } from 'react';
import { CheckCircle2, ScanLine, ShieldCheck, Clock } from 'lucide-react';

const LOGO_URL = "https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png";

export default function VerifyTicket() {
  const [ref, setRef] = useState('');
  const [validatedAt, setValidatedAt] = useState('');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = 'Reelax Tickets — Vérification';
    const params = new URLSearchParams(window.location.search);
    const id = params.get('t') || params.get('id') || '';
    setRef((id || '').slice(-16).toUpperCase() || '—');

    const start = Date.now();
    const duration = 1200;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDone(true);
        setValidatedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="min-h-screen bg-[#ebebeb] flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center">
        <img src={LOGO_URL} alt="Reelax Tickets" className="h-10 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 text-center">
          {!done ? (
            <>
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">
                <ScanLine className="h-8 w-8 text-[#1469C9] animate-pulse" />
              </div>
              <h1 className="text-xl font-black text-gray-900 mb-2">Vérification en cours…</h1>
              <p className="text-sm text-gray-500 mb-6">Contrôle de l'authenticité du e-billet</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-[#1469C9] transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 font-mono">{ref}</div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Billet validé
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">Entrée autorisée</h1>
              <p className="text-sm text-gray-500 mb-6">
                Ce billet a été contrôlé et est authentique.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Référence</span>
                  <span className="font-mono font-bold text-gray-900">{ref}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Statut</span>
                  <span className="font-bold text-green-600">VALIDÉ</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Validé à</span>
                  <span className="font-mono font-bold text-gray-900">{validatedAt}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center max-w-xs">
          🔒 Vérification chiffrée · Système anti-fraude Reelax Tickets
        </p>
      </div>
    </div>
  );
}
