import React, { useState } from 'react';
import { Search, Plus, Wrench, Car, User, Calendar, FileText, Package, Menu } from 'lucide-react';
import { useGarage } from '../../context/GarageContext';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onToggleSidebar,
}) => {
  const { pontsStatus } = useGarage();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Tableau de bord Atelier';
      case 'clients':
      case 'client-detail':
        return 'Gestion des Clients';
      case 'vehicles':
      case 'vehicle-detail':
        return 'Gestion du Parc Véhicules';
      case 'appointments':
      case 'planning':
        return 'Planning Atelier (4 Ponts)';
      case 'interventions':
      case 'intervention-detail':
        return 'Interventions & Travaux';
      case 'parts':
        return 'Gestion des Pièces & Commandes';
      case 'devis-factures':
        return 'Devis & Factures';
      case 'documents':
        return 'Gestion Documentaire';
      case 'receptions':
      case 'reception-detail':
      case 'new-reception':
        return 'Fiches Réception Véhicule';
      case 'knowledge-base':
        return 'Base de Connaissances Pièces';
      case 'history':
        return 'Historique Global des Actions';
      case 'settings':
        return 'Paramètres Atelier & Supabase';
      default:
        return 'BFP GARAGE';
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Zone 1: Mobile toggle & Breadcrumb title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-mono font-bold text-orange-600 uppercase tracking-wider hidden sm:inline">
            BFP GARAGE
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <h1 className="text-sm md:text-base font-bold text-slate-900 truncate">
            {getBreadcrumbTitle()}
          </h1>
        </div>
      </div>

      {/* Zone 2: 4 Ponts atelier fast status & Global search bar */}
      <div className="hidden xl:flex items-center gap-4">
        {/* 4 Ponts Status indicators */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200 text-xs">
          <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold mr-1">
            Ponts :
          </span>
          {[1, 2, 3, 4].map((pontNum) => {
            const key = `pont_${pontNum}` as keyof typeof pontsStatus;
            const apt = pontsStatus[key];
            const isOccupied = !!apt;
            return (
              <button
                key={pontNum}
                onClick={() => onNavigate('planning')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  isOccupied
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title={
                  isOccupied
                    ? `Pont ${pontNum} occupé : ${apt?.purpose || 'Intervention'} (${apt?.mechanic || 'Mécanicien'})`
                    : `Pont ${pontNum} libre`
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOccupied ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                />
                <span>P{pontNum}</span>
              </button>
            );
          })}
        </div>

        {/* Global Search shortcut button */}
        <button
          onClick={onOpenSearch}
          className="w-72 flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-md text-xs text-slate-500 hover:text-slate-800 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-orange-600" />
            <span className="truncate">Recherche globale (immat, VIN, réf...)</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 rounded border border-slate-200 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Quick Action button & Search trigger on mobile */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={onOpenSearch}
          className="xl:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Rechercher"
        >
          <Search className="w-5 h-5 text-orange-600" />
        </button>

        {/* Quick Action dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 active:bg-orange-700 rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer / Ajouter</span>
          </button>

          {isQuickMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsQuickMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 text-xs">
                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('new-reception');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Nouvelle réception</div>
                    <div className="text-[10px] text-slate-500">Photos, état, signature</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('vehicles', 'new');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <Car className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Nouveau véhicule</div>
                    <div className="text-[10px] text-slate-500">Fiche complète ou partielle</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('clients', 'new');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <User className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Nouveau client</div>
                    <div className="text-[10px] text-slate-500">Coordonnées facultatives</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('planning', 'new');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Nouveau rendez-vous</div>
                    <div className="text-[10px] text-slate-500">Affectation sur les 4 ponts</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('interventions', 'new');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <Wrench className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Nouvelle intervention</div>
                    <div className="text-[10px] text-slate-500">Travaux & mécanicien</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    onNavigate('parts', 'new');
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors"
                >
                  <Package className="w-4 h-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Commander une pièce</div>
                    <div className="text-[10px] text-slate-500">À la demande (sans stock)</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
