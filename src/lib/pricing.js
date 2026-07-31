// Calcul du prix avec frais.
// Sémantique: event.fee_amount = frais TOTAUX pour l'ensemble des places (event.total_tickets).
// Par billet : fee_amount / total_tickets. Fallback historique : +5% sur le prix facial.
function perTicketFee(event) {
  const feeRaw = event?.fee_amount;
  const hasFixed = feeRaw !== null && feeRaw !== undefined && feeRaw !== '' && !isNaN(Number(feeRaw));
  if (!hasFixed) return null;
  const totalTickets = Number(event?.total_tickets) || 1;
  return Number(feeRaw) / totalTickets;
}

export function unitPriceWithFees(event, fallbackFace) {
  const face = Number(event?.face_value ?? fallbackFace ?? 0);
  if (!face) return 0;
  const perFee = perTicketFee(event);
  if (perFee !== null) return Math.round(face + perFee);
  return Math.round(face * 1.05);
}

export function totalWithFees(event, qty = 1, fallbackFace) {
  const face = Number(event?.face_value ?? fallbackFace ?? 0);
  if (!face) return 0;
  const q = Number(qty || 1);
  const perFee = perTicketFee(event);
  if (perFee !== null) return Math.round(face * q + perFee * q);
  return Math.round(face * q * 1.05);
}
