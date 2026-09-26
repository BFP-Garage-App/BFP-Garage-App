import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Car,
  User,
  Calendar,
  Clock,
  CheckCircle,
  FileSignature,
  Camera,
  Trash2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Reception } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ReceptionsPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const ReceptionsPage: React.FC<ReceptionsPageProps> = ({ onNavigate }) => {
  const { receptions, getVehicle, getClient, deleteReception } = useGarage();
  const [search, setSearch] = useState('');
  const [receptionToDelete, setReceptionToDelete] = useState<Reception | null>(null);

  const filteredReceptions = receptions.filter((r) => {
    const q = search.toLowerCase();
    const v = r.vehicle_id ? getVehicle(r.vehicle_id) : null;
    const c = r.client_id ? getClient(r.client_id) : null;

    const matchVeh =
      v &&
      ((v.license_plate || '').toLowerCase().includes(q) ||
        (v.brand || '').toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q));

    const matchCli =
      c &&
      ((c.first_name || '').toLowerCase().includes(q) ||
        (c.last_name || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q));

    const matchText =
      (r.damages_noted || '').toLowerCase().includes(q) ||
      (r.requested_works || '').toLowerCase().includes(q) ||
      (r.reception_date || '').includes(q) ||
      (r.mechanic || '').toLowerCase().includes(q);

    return matchVeh || matchCli || matchText;
  });

  const handleDeleteConfirm = () => {
    if (receptionToDelete) {
      deleteReception(receptionToDelete.id);
      setReceptionToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            Réceptions de Véhicules ({receptions.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            États des lieux à l'arrivée : kilométrage, dommages, photos et signature (tout facultatif).
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-reception')}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle réception</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par véhicule, immatriculation, client, date, travaux demandés..."
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Receptions Grid */}
      {filteredReceptions.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <ClipboardList className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucune réception trouvée</p>
          <button
            onClick={() => onNavigate('new-reception')}
            className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
          >
            + Réceptionner un véhicule (tout facultatif)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredReceptions.map((r) => {
            const v = r.vehicle_id ? getVehicle(r.vehicle_id) : null;
            const c = r.client_id ? getClient(r.client_id) : null;

            return (
              <div
                key={r.id}
                onClick={() => onNavigate('reception-detail', r.id)}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                          {v?.license_plate || 'SANS IMMAT'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {r.reception_date || 'Date libre'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-orange-600 transition-colors">
                        {v ? `${v.brand} ${v.model}` : 'Véhicule en cours'}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceptionToDelete(r);
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer la réception"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Client & Specs */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {c && (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.first_name} {c.last_name}</span>
                      </div>
                    )}

                    {r.mileage_in && (
                      <div className="font-mono text-slate-700 font-medium text-[11px]">
                        Kilométrage relevé : {r.mileage_in.toLocaleString()} km
                      </div>
                    )}

                    {r.fuel_level && (
                      <div className="text-[11px] text-slate-500">
                        Niveau carburant : {r.fuel_level}
                      </div>
                    )}

                    {r.requested_works && (
                      <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 line-clamp-2">
                        <span className="font-medium text-slate-500 block text-[10px]">
                          Travaux demandés :
                        </span>
                        {r.requested_works}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Mechanic & Details */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    Mécanicien : {r.mechanic || 'Atelier'}
                  </div>

                  <div className="text-[11px] font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Fiche complète</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!receptionToDelete}
        title="Supprimer cette fiche de réception ?"
        message="Confirmez-vous la suppression de cette fiche de réception ? L'historique du véhicule sera mis à jour."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setReceptionToDelete(null)}
      />
    </div>
  );
};
