import React from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Package,
  Receipt,
  FolderOpen,
  ClipboardList,
  BookOpen,
  History,
  Settings,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useGarage } from '../../context/GarageContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { stats } = useGarage();

  // The 8 primary rubriques requested by the user
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: stats.totalClients,
    },
    {
      id: 'vehicles',
      label: 'Véhicules',
      icon: Car,
      badge: stats.totalVehicles,
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: Calendar,
      badge: stats.todayAppointmentsCount > 0 ? `${stats.todayAppointmentsCount} auj.` : '4 Ponts',
      highlightBadge: stats.todayAppointmentsCount > 0,
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: Wrench,
      badge: stats.ongoingInterventions > 0 ? stats.ongoingInterventions : null,
      highlightBadge: stats.ongoingInterventions > 0,
    },
    {
      id: 'parts',
      label: 'Pièces',
      icon: Package,
      badge: stats.partsToOrder > 0 ? `${stats.partsToOrder} à comm.` : null,
      urgentBadge: stats.partsToOrder > 0,
    },
    {
      id: 'devis-factures',
      label: 'Devis / Factures',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FolderOpen,
      badge: null,
    },
  ];

  // Secondary Atelier operations (preserving all capabilities)
  const secondaryNavItems = [
    {
      id: 'receptions',
      label: 'Réceptions atelier',
      icon: ClipboardList,
      badge: stats.totalReceptions,
    },
    {
      id: 'knowledge-base',
      label: 'Base pièces & réf.',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'history',
      label: 'Historique global',
      icon: History,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Paramètres atelier',
      icon: Settings,
      badge: null,
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (id: string) => {
    if (currentView === id) return true;
    if (id === 'clients' && currentView === 'client-detail') return true;
    if (id === 'vehicles' && currentView === 'vehicle-detail') return true;
    if (id === 'planning' && currentView === 'appointments') return true;
    if (id === 'interventions' && currentView === 'intervention-detail') return true;
    if (id === 'receptions' && (currentView === 'reception-detail' || currentView === 'new-reception')) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Lateral navigation bar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1329]">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center shadow-xs group-hover:bg-orange-500 transition-colors">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
                BFP <span className="text-orange-500">GARAGE</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
                Gestion Atelier Automobile
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              Menu Principal
            </div>
            <nav className="space-y-0.5">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-slate-800/90 text-white font-semibold border-l-2 border-orange-500 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-orange-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          item.urgentBadge
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold'
                            : item.highlightBadge
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                            : active
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              Outils Atelier
            </div>
            <nav className="space-y-0.5">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-slate-800/90 text-white font-semibold border-l-2 border-orange-500 shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-orange-500' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info: Zero Required Fields Reminder */}
        <div className="p-3 border-t border-slate-800 bg-[#0b1329] shrink-0">
          <div className="p-2.5 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-1.5 text-orange-400 font-semibold mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Zéro champ obligatoire</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Enregistrez n'importe quelle fiche sans blocage. Complétez ultérieurement.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
