import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, MousePointerClick, RefreshCw } from 'lucide-react';

const fmt = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminInvitations() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false }).limit(300);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('inv-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invitations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const opened = rows.filter(r => r.opened_at).length;
  const clicked = rows.filter(r => r.clicked_at).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des invitations</h1>
        <button onClick={load} className="flex items-center gap-2 text-sm bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Envoyées</p><p className="text-2xl font-bold">{rows.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Vues</p><p className="text-2xl font-bold text-green-600">{opened}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Lien cliqué</p><p className="text-2xl font-bold text-blue-600">{clicked}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Chargement...</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Aucune invitation envoyée pour l'instant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 text-left">
              <tr><th className="p-3">Email</th><th className="p-3">Événement</th><th className="p-3">Envoyée</th><th className="p-3">Statut</th><th className="p-3">Vue le</th><th className="p-3">Cliquée le</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{r.email}</td>
                  <td className="p-3 text-gray-600">{r.event_name || '—'}</td>
                  <td className="p-3 text-gray-500">{fmt(r.created_at)}</td>
                  <td className="p-3">
                    {r.clicked_at ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"><MousePointerClick className="h-3 w-3" /> Cliquée ({r.click_count})</span>
                    ) : r.opened_at ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium"><Eye className="h-3 w-3" /> Vue ({r.open_count})</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-medium"><EyeOff className="h-3 w-3" /> Pas encore vue</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{fmt(r.opened_at)}</td>
                  <td className="p-3 text-gray-500">{fmt(r.clicked_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">« Vue » est détectée quand l'email affiche ses images ; certaines messageries les bloquent, un clic sur le lien compte donc aussi comme vue.</p>
    </div>
  );
}
