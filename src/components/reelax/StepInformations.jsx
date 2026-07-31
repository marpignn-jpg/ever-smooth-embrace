import React from 'react';

export default function StepInformations({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  emailConfirm,
  setEmailConfirm,
}) {
  const mismatch = emailConfirm.length > 0 && email !== emailConfirm;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1.5 text-lg font-semibold text-foreground">Informations de l'acheteur</h2>
      <p className="mb-5 text-sm text-gray-500">
        Vous recevrez vos billets à cette adresse e-mail. Le billet sera nominatif au prénom et nom indiqués ci-dessous.
      </p>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Prénom *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nom *</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Nom"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-colors"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Confirmer l'e-mail *</label>
          <input
            type="email"
            value={emailConfirm}
            onChange={e => setEmailConfirm(e.target.value)}
            placeholder="votre@email.com"
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 transition-colors ${
              mismatch
                ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-300 focus:border-gray-500 focus:ring-gray-200'
            }`}
          />
          {mismatch && (
            <p className="mt-1.5 text-xs text-red-500">Les adresses e-mail ne correspondent pas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
