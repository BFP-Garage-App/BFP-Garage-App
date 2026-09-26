/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GarageProvider } from './context/GarageContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { ReceptionsPage } from './pages/ReceptionsPage';
import { NewReceptionPage } from './pages/NewReceptionPage';
import { ReceptionDetailPage } from './pages/ReceptionDetailPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { PartsOrdersPage } from './pages/PartsOrdersPage';
import { WorkshopPlanningPage } from './pages/WorkshopPlanningPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { GlobalHistoryPage } from './pages/GlobalHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    setSelectedEntityId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;

      case 'clients':
        return (
          <ClientsPage
            onNavigate={handleNavigate}
            openCreateModalDirectly={selectedEntityId === 'new'}
          />
        );

      case 'client-detail':
        return (
          <ClientDetailPage
            clientId={selectedEntityId || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'vehicles':
        return (
          <VehiclesPage
            onNavigate={handleNavigate}
            openCreateModalDirectly={selectedEntityId === 'new'}
          />
        );

      case 'vehicle-detail':
        return (
          <VehicleDetailPage
            vehicleId={selectedEntityId || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'receptions':
        return <ReceptionsPage onNavigate={handleNavigate} />;

      case 'new-reception':
        return (
          <NewReceptionPage
            onNavigate={handleNavigate}
            presetVehicleId={selectedEntityId}
          />
        );

      case 'reception-detail':
        return (
          <ReceptionDetailPage
            receptionId={selectedEntityId || ''}
            onNavigate={handleNavigate}
          />
        );

      case 'interventions':
      case 'intervention-detail':
        return (
          <InterventionsPage
            onNavigate={handleNavigate}
            openCreateModalDirectly={selectedEntityId === 'new'}
          />
        );

      case 'parts':
        return (
          <PartsOrdersPage
            onNavigate={handleNavigate}
            openCreateModalDirectly={selectedEntityId === 'new'}
          />
        );

      case 'appointments':
      case 'planning':
        return (
          <WorkshopPlanningPage
            onNavigate={handleNavigate}
            openCreateModalDirectly={selectedEntityId === 'new'}
          />
        );

      case 'devis-factures':
        return (
          <DocumentsPage
            key="devis-factures"
            onNavigate={handleNavigate}
            initialFilterType="devis_factures"
          />
        );

      case 'documents':
        return (
          <DocumentsPage
            key="documents"
            onNavigate={handleNavigate}
            initialFilterType="all"
          />
        );

      case 'knowledge-base':
        return <KnowledgeBasePage onNavigate={handleNavigate} />;

      case 'history':
        return <GlobalHistoryPage onNavigate={handleNavigate} />;

      case 'settings':
        return <SettingsPage />;

      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <GarageProvider>
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col antialiased">
        {/* Responsive Fixed Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Layout with 256px sidebar offset on desktop */}
        <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
          <Header
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenSearch={() => setIsSearchOpen(true)}
            onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-7 overflow-y-auto">
            {renderContent()}
          </main>
        </div>

        {/* Global Search Dialog Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleNavigate}
        />
      </div>
    </GarageProvider>
  );
}
