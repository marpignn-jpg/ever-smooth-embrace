import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const LOGO_URL = "https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/8ee1834a6_image.png";

export function formatDate(dateStr) {
  if (!dateStr) return { day: '—', time: '—' };
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function TicketCard({ pass }) {
  const { event, category, section, rang, siege, id, isNumbered } = pass;
  const date = formatDate(event?.date);
  const eventTitle = (event?.name || event?.artist || 'ÉVÉNEMENT').toUpperCase();
  const venue = (event?.venue || '').toUpperCase();
  const ref = (id || '').slice(-16).toUpperCase();

  return (
    <div style={{
      fontFamily: "'Inter', Arial, sans-serif",
      background: 'white',
      width: '360px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    }}>
      {/* Blue header */}
      <div style={{ background: '#1469C9', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', width: '100%' }}>
          <img src={LOGO_URL} alt="Logo" style={{ height: '13px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: '10px', letterSpacing: '1px' }}>
            MOBILE ENTRY
          </span>
        </div>
        <div style={{ color: 'white', fontWeight: '800', fontSize: '18px', lineHeight: 1.15, marginBottom: '6px' }}>
          {eventTitle}
        </div>
        {category && (
          <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            {category}
          </div>
        )}
        {venue && (
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '500', fontSize: '11px', letterSpacing: '0.3px' }}>
            {venue}{event?.city ? ` · ${event.city.toUpperCase()}` : ''}
          </div>
        )}
      </div>

      {/* Date/Heure band */}
      <div style={{ background: '#1058A7', display: 'flex', padding: '14px 22px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '3px' }}>DATE</div>
          <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{date.day}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '3px' }}>HEURE</div>
          <div style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{date.time !== '—' ? date.time : '—'}</div>
        </div>
      </div>

      {/* Category + seat info */}
      <div style={{ background: 'white', padding: '16px 22px 12px', textAlign: 'center' }}>

        {isNumbered && (section || rang || siege) ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0' }}>
            {section && (
              <div style={{ flex: 1, textAlign: 'center', padding: '0 8px', borderRight: rang || siege ? '1px solid #e0e0e0' : 'none' }}>
                <div style={{ color: '#999', fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '4px' }}>SECTION</div>
                <div style={{ color: '#111', fontWeight: '900', fontSize: '18px' }}>{section}</div>
              </div>
            )}
            {rang && (
              <div style={{ flex: 1, textAlign: 'center', padding: '0 8px', borderRight: siege ? '1px solid #e0e0e0' : 'none' }}>
                <div style={{ color: '#999', fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '4px' }}>RANGÉE</div>
                <div style={{ color: '#111', fontWeight: '900', fontSize: '18px' }}>{rang}</div>
              </div>
            )}
            {siege && (
              <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
                <div style={{ color: '#999', fontSize: '9px', fontWeight: '700', letterSpacing: '1.5px', marginBottom: '4px' }}>SIÈGE</div>
                <div style={{ color: '#111', fontWeight: '900', fontSize: '18px' }}>{siege}</div>
              </div>
            )}
          </div>
        ) : !isNumbered ? (
          <div style={{ color: '#555', fontSize: '12px', fontWeight: '600' }}>Placement libre</div>
        ) : null}
      </div>

      {/* Dashed separator */}
      <div style={{ margin: '0 22px', borderTop: '2px dashed #d0d0d0' }} />

      {/* QR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 22px 14px' }}>
        <QRCodeSVG value={`https://reelax-tickets.revente.app/verify?t=${encodeURIComponent(id || 'TICKET')}`} size={190} level="H" />
        <div style={{ color: '#aaa', fontSize: '11px', marginTop: '12px', letterSpacing: '1px', fontWeight: '500' }}>
          {ref}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#f7f8fa', padding: '12px 22px', textAlign: 'center', borderTop: '1px solid #e8e8e8' }}>
        <div style={{ color: '#999', fontSize: '11px', lineHeight: 1.5 }}>
          Ce billet est soumis aux conditions générales de vente.<br />
          Présentez ce code à l'entrée.
        </div>
      </div>
    </div>
  );
}