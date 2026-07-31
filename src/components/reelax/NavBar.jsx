import React, { useState } from 'react';
import { User, Menu, X } from 'lucide-react';
import ReelaxLogo from '@/components/reelax/ReelaxLogo';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
          <a href="https://reelax-tickets.com/" className="inline-flex items-center">
            <ReelaxLogo className="h-12 sm:h-16" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="https://reelax-tickets.com/evenements/list" className="hover:text-foreground transition-colors">Événements</a>
            <a href="https://reelax-tickets.com/pro" className="hover:text-foreground transition-colors">Organisateurs</a>
            <a href="https://reelax-tickets.com/faq/vendeur" className="hover:text-foreground transition-colors">Aide</a>
            <a href="https://reelax-tickets.com/connexion" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 transition-colors">
              <User className="h-4 w-4 text-gray-700" />
            </a>
            <div className="flex items-center gap-1 text-sm cursor-pointer select-none">
              <span className="text-xl leading-none">🇫🇷</span>
              <span className="text-gray-500 text-xs">▾</span>
            </div>
          </nav>

          {/* Mobile: hamburger */}
          <button
            className="flex sm:hidden items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 transition-colors z-10"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          {/* Drawer */}
          <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <ReelaxLogo className="h-12" />
              <button onClick={() => setMenuOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <nav className="flex flex-col py-4">
              <a href="https://reelax-tickets.com/evenements/list" className="px-5 py-3.5 text-base text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50">Événements</a>
              <a href="https://reelax-tickets.com/pro" className="px-5 py-3.5 text-base text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50">Organisateurs</a>
              <a href="https://reelax-tickets.com/faq/vendeur" className="px-5 py-3.5 text-base text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 border-b border-gray-50">Aide</a>
              <a href="https://reelax-tickets.com/connexion" className="px-5 py-3.5 text-base text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2">
                <User className="h-4 w-4" /> Mon compte
              </a>
            </nav>
            <div className="mt-auto px-5 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-xl">🇫🇷</span>
                <span>Français</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}