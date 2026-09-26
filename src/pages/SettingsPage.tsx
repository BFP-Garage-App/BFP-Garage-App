import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Wrench,
  Users,
  Server,
  Building,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { GarageSettings } from '../types/database';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    saveSettings,
    resetDatabase,
    exportDatabaseJSON,
    importDatabaseJSON,
  } = useGarage();

  const [formData, setFormData] = useState<GarageSettings>({ ...settings });
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newMechanicName, setNewMechanicName] = useState('');

  const supabaseSchemaSql = `-- ====================================================================
-- BFP GARAGE - SCHEMA POSTGRESQL / SUPABASE
-- RÈGLE ABSOLUE : AUCUN CHAMP MÉTIER OBLIGATOIRE (TOUTES COLONNES NULLABLES)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    license_plate TEXT,
    brand TEXT,
    model TEXT,
    year INTEGER,
    motorisation TEXT,
    engine_code TEXT,
    fuel_type TEXT,
    power_ch INTEGER,
    power_fiscal INTEGER,
    vin TEXT,
    mileage INTEGER,
    color TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    reception_date DATE DEFAULT CURRENT_DATE,
    reception_time TEXT,
    mileage_in INTEGER,
    fuel_level TEXT,
    general_state TEXT,
    damages_noted TEXT,
    damages_points JSONB,
    reserves TEXT,
    comments TEXT,
    requested_works TEXT,
    signature_data_url TEXT,
    signature_signer_name TEXT,
    mechanic TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation TEXT,
    reference TEXT,
    brand TEXT,
    supplier TEXT,
    price_buy_ht NUMERIC,
    price_sell_ttc NUMERIC,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'a_commander',
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    intervention_id UUID,
    order_date DATE,
    received_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    date DATE,
    time TEXT,
    duration_minutes INTEGER DEFAULT 60,
    lift TEXT DEFAULT 'pont_1',
    purpose TEXT,
    description TEXT,
    mechanic TEXT,
    status TEXT DEFAULT 'confirme',
    priority TEXT DEFAULT 'normale',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    reception_id UUID REFERENCES public.receptions(id) ON DELETE SET NULL,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'a_faire',
    lead_mechanic TEXT,
    labor_hours NUMERIC DEFAULT 1,
    hourly_rate NUMERIC DEFAULT 65,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);`;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMechanicName.trim()) return;
    const updated = {
      ...formData,
      mechanics: [...formData.mechanics, newMechanicName.trim()],
    };
    setFormData(updated);
    saveSettings(updated);
    setNewMechanicName('');
  };

  const handleRemoveMechanic = (name: string) => {
    const updated = {
      ...formData,
      mechanics: formData.mechanics.filter((m) => m !== name),
    };
    setFormData(updated);
    saveSettings(updated);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(supabaseSchemaSql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bfp_garage_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        setImportStatus('Données importées avec succès ! Rechargement...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('Erreur : le fichier sélectionné est invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          Configuration de BFP GARAGE & Intégration Supabase
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Personnalisation des coordonnées du garage, équipe d’atelier, taux horaire et synchronisation de base de données.
        </p>
      </div>

      {/* SECTION 1: PARAMÈTRES GÉNÉRAUX DE L'ATELIER */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-orange-600" />
          1. Coordonnées & Facturation de l'Atelier
        </h3>

        <form onSubmit={handleSaveGeneral} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Nom du garage</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Téléphone atelier</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Adresse postale</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Email atelier</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Numéro SIRET (Facultatif)</label>
              <input
                type="text"
                value={formData.siret || ''}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Taux horaire MO (€ HT)</label>
              <input
                type="number"
                value={formData.hourly_rate || 65}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Paramètres enregistrés avec succès
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
            >
              Enregistrer les coordonnées
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: ÉQUIPE DES MÉCANICIENS */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-600" />
          2. Équipe Mécanique Atelier
        </h3>

        <p className="text-xs text-slate-500">
          Ces mécaniciens apparaissent dans les listes d'assignation pour les ponts de levage, les réceptions et les interventions.
        </p>

        <div className="flex flex-wrap gap-2">
          {formData.mechanics.map((m) => (
            <div
              key={m}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs flex items-center gap-2 text-slate-800"
            >
              <Wrench className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-semibold">{m}</span>
              <button
                type="button"
                onClick={() => handleRemoveMechanic(m)}
                className="text-slate-400 hover:text-red-600 ml-1"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddMechanic} className="flex items-center gap-2 max-w-sm pt-2">
          <input
            type="text"
            value={newMechanicName}
            onChange={(e) => setNewMechanicName(e.target.value)}
            placeholder="Nouveau mécanicien..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shrink-0 shadow-2xs"
          >
            + Ajouter
          </button>
        </form>
      </div>

      {/* SECTION 3: SAUVEGARDE & RESTAURATION DES DONNÉES */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-orange-600" />
          3. Sauvegarde & Restauration Locale
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-slate-600" />
              Exporter une sauvegarde JSON
            </h4>
            <p className="text-[11px] text-slate-500">
              Téléchargez un fichier complet de vos clients, véhicules, interventions, réceptions et pièces.
            </p>
            <button
              onClick={handleExport}
              className="mt-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1.5 shadow-2xs"
            >
              Télécharger la sauvegarde
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-600" />
              Restaurer une sauvegarde
            </h4>
            <p className="text-[11px] text-slate-500">
              Importez un fichier de données précédemment exporté.
            </p>
            <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer shadow-2xs">
              <span>Choisir un fichier JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            {importStatus && (
              <div className="text-[11px] text-orange-700 mt-1 font-medium">{importStatus}</div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Confirmez-vous la réinitialisation de la base de données avec les données de démonstration du garage ?'
                )
              ) {
                resetDatabase();
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réinitialiser avec les données de démonstration d'atelier</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: SCRIPT SUPABASE POSTGRESQL */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Server className="w-4 h-4 text-orange-600" />
            4. Schéma PostgreSQL / Supabase Dédié
          </h3>

          <button
            onClick={handleCopySchema}
            className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
          >
            {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSchema ? 'Copié !' : 'Copier le script SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Ce script respecte la règle absolue : toutes les colonnes métier sont nullables (zéro NOT NULL bloquant).
          Vous pouvez l'exécuter dans le SQL Editor de votre projet Supabase ou Cloud SQL.
        </p>

        <pre className="p-3 bg-slate-900 text-slate-200 rounded-md text-[11px] font-mono overflow-x-auto max-h-56">
          {supabaseSchemaSql}
        </pre>
      </div>
    </div>
  );
};
