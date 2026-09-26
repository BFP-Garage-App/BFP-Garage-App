import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Car,
  Package,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';

interface KnowledgeBasePageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({ onNavigate }) => {
  const { parts, vehicles, getVehicle } = useGarage();
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Collect all unique vehicle models with parts
  const allBrands = Array.from(
    new Set(
      parts
        .map((p) => {
          const v = p.vehicle_id ? getVehicle(p.vehicle_id) : null;
          return v?.brand;
        })
        .filter(Boolean)
    )
  ) as string[];

  // Group parts by Vehicle make + model + motorisation
  interface VehicleGroup {
    key: string;
    brand: string;
    model: string;
    motorisation?: string;
    parts: typeof parts;
    vehicleCount: number;
  }

  const groupedMap = new Map<string, VehicleGroup>();

  parts.forEach((part) => {
    if (!part.vehicle_id) return;
    const v = getVehicle(part.vehicle_id);
    if (!v || !v.brand) return;

    const key = `${v.brand}__${v.model || 'Générique'}__${v.motorisation || 'Tous moteurs'}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        key,
        brand: v.brand,
        model: v.model || '',
        motorisation: v.motorisation || '',
        parts: [],
        vehicleCount: 1,
      });
    }
    groupedMap.get(key)!.parts.push(part);
  });

  const groups = Array.from(groupedMap.values()).filter((g) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      g.brand.toLowerCase().includes(q) ||
      g.model.toLowerCase().includes(q) ||
      (g.motorisation && g.motorisation.toLowerCase().includes(q)) ||
      g.parts.some(
        (p) =>
          (p.designation || '').toLowerCase().includes(q) ||
          (p.reference || '').toLowerCase().includes(q)
      );

    const matchBrand = selectedBrand === 'all' || g.brand === selectedBrand;
    return matchSearch && matchBrand;
  });

  const handleCopy = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Base de Connaissances & Mémoire Pièces BFP GARAGE
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Le garage se souvient de toutes les pièces ayant déjà été installées sur chaque modèle.
              Lorsqu'un véhicule identique entre à l'atelier, les références déjà commandées ressortent immédiatement.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Caution Notice */}
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-2.5 text-xs text-orange-950">
        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Avertissement de compatibilité : </span>
          Les références affichées ci-dessous ont été réellement utilisées par le passé sur ces modèles dans l'atelier BFP Garage.
          Le mécanicien ou chef d'atelier reste responsable de vérifier la correspondance exacte avec le numéro de châssis / VIN du véhicule en cours.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle (C3, 208, Clio...), motorisation (1.4 HDi), référence ou désignation..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        {allBrands.length > 0 && (
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full sm:w-56 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          >
            <option value="all">Toutes les marques</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grouped Knowledge Cards */}
      {groups.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <BookOpen className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucune pièce mémorisée pour cette recherche</p>
          <p className="text-xs text-slate-400 mt-1">
            Les pièces commandées sur vos véhicules s'ajouteront automatiquement à la base de connaissances.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.key}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3"
            >
              {/* Group Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                    <Car className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {group.brand} {group.model}
                    </h3>
                    {group.motorisation && (
                      <span className="text-xs text-slate-500 font-mono">
                        Motorisation : {group.motorisation}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 self-start sm:self-auto">
                  {group.parts.length} référence{group.parts.length > 1 ? 's' : ''} mémorisée{group.parts.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Parts under this model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {group.parts.map((p) => {
                  const isCopied = copiedRef === p.reference;

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-md text-xs transition-colors flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.designation}</div>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono font-bold text-orange-700 text-xs">
                            Réf : {p.reference || 'Non renseignée'}
                          </span>

                          {p.reference && (
                            <button
                              type="button"
                              onClick={() => handleCopy(p.reference || '')}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                              title="Copier la référence"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-500 space-x-2">
                          {p.brand && <span>Marque : {p.brand}</span>}
                          {p.supplier && <span>· Fournisseur : {p.supplier}</span>}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          p.status === 'recue'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'commandee'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
