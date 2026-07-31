const LOGO_URL = "https://media.base44.com/images/public/6a26deb6bcfd5e626a026084/d31cad38e_image.png";
const BRAND_DARK = "#111111";
const BRAND_MID = "#4a4a4a";
const BRAND_LIGHT = "#888888";
const BRAND_MUTED = "#f4f4f5";
const BRAND_BORDER = "#e5e5e5";

function formatEventDate(dateStr) {
  if (!dateStr) return { day: '', time: '' };
  const d = new Date(dateStr);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
}

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Reelax Tickets</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_MUTED};font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_MUTED};padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.04);">
        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:32px 40px 24px;text-align:center;border-bottom:1px solid ${BRAND_BORDER};">
            <img src="${LOGO_URL}" alt="Reelax Tickets" style="height:40px;display:inline-block;" />
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="background:#ffffff;padding:0;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:${BRAND_MUTED};padding:28px 40px;text-align:center;border-top:1px solid ${BRAND_BORDER};">
            <p style="margin:0 0 4px;color:${BRAND_LIGHT};font-size:12px;letter-spacing:0.3px;text-transform:uppercase;font-weight:600;">Reelax Tickets</p>
            <p style="margin:0;color:${BRAND_LIGHT};font-size:11px;letter-spacing:0.2px;">La revente officielle et sécurisée de billets</p>
            <p style="margin:8px 0 0;color:${BRAND_LIGHT};font-size:10px;letter-spacing:0.2px;">
              <a href="https://reelax-tickets.com.revente.app" style="color:${BRAND_MID};text-decoration:none;border-bottom:1px solid ${BRAND_BORDER};">reelax-tickets.com.revente.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function eventCard(event) {
  const { day, time } = formatEventDate(event?.date);
  const eventName = event?.artist || event?.name || 'Événement';
  const venue = [event?.venue, event?.city].filter(Boolean).join(', ');
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_MUTED};border-radius:12px;margin-bottom:32px;overflow:hidden;">
      <tr>
        ${event?.image_url ? `<td style="width:96px;padding:20px 0 20px 20px;vertical-align:middle;">
          <img src="${event.image_url}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;display:block;" />
        </td>` : ''}
        <td style="padding:20px ${event?.image_url ? '20px' : '24px'};">
          <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:${BRAND_DARK};letter-spacing:-0.2px;">${eventName}</p>
          ${day ? `<p style="margin:0 0 4px;color:${BRAND_MID};font-size:13px;font-weight:500;">${day} &middot; ${time}</p>` : ''}
          ${venue ? `<p style="margin:0;color:${BRAND_LIGHT};font-size:12px;">${venue}</p>` : ''}
        </td>
      </tr>
    </table>
  `;
}

function primaryButton(label, href) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_DARK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;transition:opacity 0.2s;">${label}</a>`;
}

// ─── Template 1 : Confirmation de commande / Vos billets ──────────────────────
// Version simplifiée : HTML minimal, un seul CTA, pas de tokens visibles
// (améliore la délivrabilité chez Outlook / Microsoft).
export function ticketConfirmationEmail({ firstName, lastName, event, tickets, category, seatInfo, ticketRef, resaleToken, downloadUrl }) {
  const { day, time } = formatEventDate(event?.date);
  const eventName = event?.artist || event?.name || 'Événement';
  const venue = [event?.venue, event?.city].filter(Boolean).join(', ');
  const ticketLink = downloadUrl || `https://reelax-tickets.com.revente.app`;

  const ticketList = tickets || [{ category, seatInfo }];
  const count = ticketList.length;
  const greeting = firstName ? `Bonjour ${firstName}${lastName ? ' ' + lastName : ''},` : 'Bonjour,';
  const introLine = count > 1
    ? `Votre commande de ${count} billets est confirmée.`
    : `Votre billet est confirmé.`;

  const content = `
    <div style="padding:32px 32px 8px;">

      <p style="margin:0 0 16px;color:${BRAND_DARK};font-size:15px;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 24px;color:${BRAND_MID};font-size:15px;line-height:1.6;">
        ${introLine}
      </p>

      <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:16px;font-weight:600;">${eventName}</p>
      ${day ? `<p style="margin:0 0 2px;color:${BRAND_MID};font-size:14px;">${day}${time ? ' — ' + time : ''}</p>` : ''}
      ${venue ? `<p style="margin:0 0 24px;color:${BRAND_LIGHT};font-size:13px;">${venue}</p>` : '<div style="height:24px;"></div>'}

      <p style="margin:0 0 24px;color:${BRAND_MID};font-size:14px;line-height:1.6;">
        ${count > 1 ? 'Vos billets sont disponibles au téléchargement via le lien ci-dessous.' : 'Votre billet est disponible au téléchargement via le lien ci-dessous.'}
      </p>

      <p style="margin:0 0 32px;">
        <a href="${ticketLink}" style="color:${BRAND_DARK};font-size:15px;font-weight:600;text-decoration:underline;">
          ${count > 1 ? 'Accéder à mes billets' : 'Accéder à mon billet'}
        </a>
      </p>

      <p style="margin:0 0 24px;color:${BRAND_LIGHT};font-size:13px;line-height:1.6;">
        Merci de conserver cet email. ${count > 1 ? 'Vos billets seront requis' : 'Votre billet sera requis'} à l'entrée de l'événement.
      </p>

    </div>
  `;

  return baseLayout(content);
}


// ─── Template 2 : Invitation à racheter des billets ───────────────────────────
export function resaleInviteEmail({ event, resaleLink }) {
  const eventName = event?.artist || event?.name || 'Événement';

  const content = `
    <div style="padding:40px 40px 0;">
      
      <!-- Title -->
      <div style="text-align:center;margin-bottom:36px;">
        <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;color:${BRAND_DARK};font-size:24px;font-weight:700;letter-spacing:-0.3px;">Des places disponibles</h1>
        <p style="margin:0;color:${BRAND_MID};font-size:15px;line-height:1.6;">
          Vous avez reçu un <strong style="color:${BRAND_DARK}">accès privé et exclusif</strong> pour acquérir des billets pour l'événement ci-dessous. Ce lien est personnel et réservé à votre usage.
        </p>
      </div>

      <!-- Event Card -->
      ${eventCard(event)}

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:36px;">
        ${primaryButton('Accéder aux billets', resaleLink)}
      </div>

      <!-- Trust badges -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="width:33%;text-align:center;padding:0 6px;">
            <div style="background:${BRAND_MUTED};border-radius:10px;padding:18px 12px;">
              <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:13px;font-weight:700;">Paiement sécurisé</p>
              <p style="margin:0;color:${BRAND_LIGHT};font-size:11px;">Stripe & SSL</p>
            </div>
          </td>
          <td style="width:33%;text-align:center;padding:0 6px;">
            <div style="background:${BRAND_MUTED};border-radius:10px;padding:18px 12px;">
              <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:13px;font-weight:700;">Billets vérifiés</p>
              <p style="margin:0;color:${BRAND_LIGHT};font-size:11px;">Authenticité garantie</p>
            </div>
          </td>
          <td style="width:33%;text-align:center;padding:0 6px;">
            <div style="background:${BRAND_MUTED};border-radius:10px;padding:18px 12px;">
              <p style="margin:0 0 4px;color:${BRAND_DARK};font-size:13px;font-weight:700;">Remboursement</p>
              <p style="margin:0;color:${BRAND_LIGHT};font-size:11px;">Garantie 100%</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Fine print -->
      <p style="text-align:center;color:${BRAND_LIGHT};font-size:11px;margin:0 0 40px;line-height:1.6;">
        Cet accès privé vous a été transmis personnellement.<br/>
        Revente officielle et sécurisée via <a href="https://reelax-tickets.com.revente.app" style="color:${BRAND_MID};text-decoration:none;border-bottom:1px solid ${BRAND_BORDER};">Reelax Tickets</a>.
      </p>

    </div>
  `;

  return baseLayout(content);
}
