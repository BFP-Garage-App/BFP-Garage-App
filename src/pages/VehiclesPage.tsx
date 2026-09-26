import React, { useState } from 'react';
import {
  Car,
  Search,
  Plus,
  User,
  Calendar,
  Fuel,
  Zap,
  Tag,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Vehicle } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface VehiclesPageProps {
  onNavigate: (view: string, id?: string) => void;
  openCreateModalDirectly?: boolean;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  onNavigate,
  openCreateModalDirectly = false,
}) => {
  const { vehicles, clients, saveVehicle, deleteVehicle, getClient } = useGarage();
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterHasClient, setFilterHasClient] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Available brands for filter
  const allBrands = Array.from(new Set(vehicles.map((v) => v.brand).filter(Boolean))) as string[];

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase().replace(/[\s-]/g, '');
    const matchSearch =
      (v.license_plate || '').toLowerCase().replace(/[\s-]/g, '').includes(q) ||
      (v.brand || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.motorisation || '').toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q);

    const matchBrand = filterBrand === 'all' || v.brand === filterBrand;
    const matchClient =
      filterHasClient === 'all' ||
      (filterHasClient === 'yes' && !!v.client_id) ||
      (filterHasClient === 'no' && !v.client_id);

    return matchSearch && matchBrand && matchClient;
  });

  const handleOpenCreate = () => {
    setEditingVehicle({
      license_plate: '',
      brand: '',
      model: '',
      year: undefined,
      motorisation: '',
      engine_code: '',
      fuel_type: 'Diesel',
      power_ch: undefined,
      power_fiscal: undefined,
      vin: '',
      mileage: undefined,
      color: '',
      notes: '',
      client_id: null, // SANS CLIENT (FACULTATIF !)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVehicle({ ...v });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      // ZERO REQUIRED FIELDS : enregistre même si tous les champs sont vides
      saveVehicle(editingVehicle);
      setIsModalOpen(false);
      setEditingVehicle(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-600" />
            Parc Véhicules ({vehicles.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fiches véhicules indépendantes du client (le client est facultatif).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau véhicule</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par plaque, marque, modèle, moteur, VIN..."
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

        <div className="w-full sm:w-auto flex items-center gap-2">
          {/* Filter Brand */}
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          >
            <option value="all">Toutes les marques</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Filter Client presence */}
          <select
            value={filterHasClient}
            onChange={(e) => setFilterHasClient(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          >
            <option value="all">Tous les véhicules</option>
            <option value="yes">Avec client</option>
            <option value="no">Sans client</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <Car className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucun véhicule trouvé</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Aucun résultat correspondant.' : 'Créez votre première fiche véhicule sans contrainte.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
          >
            + Ajouter un véhicule (tout facultatif)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredVehicles.map((vehicle) => {
            const client = vehicle.client_id ? getClient(vehicle.client_id) : null;
            const hasPlate = !!vehicle.license_plate;
            const hasModel = vehicle.brand || vehicle.model;

            return (
              <div
                key={vehicle.id}
                onClick={() => onNavigate('vehicle-detail', vehicle.id)}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    {/* Immat badge auto */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-300 tracking-wider shadow-2xs">
                        {hasPlate ? vehicle.license_plate : 'SANS IMMAT'}
                      </span>
                      {vehicle.year && (
                        <span className="text-[11px] font-mono text-slate-500 font-medium">
                          {vehicle.year}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(vehicle, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier le véhicule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setVehicleToDelete(vehicle)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer le véhicule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Brand & Model */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {hasModel ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : 'Véhicule non identifié'}
                  </h3>

                  {/* Motorisation and Specs */}
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    {vehicle.motorisation && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-medium text-slate-700">{vehicle.motorisation}</span>
                        {vehicle.fuel_type && <span className="text-slate-400">· {vehicle.fuel_type}</span>}
                      </div>
                    )}

                    {vehicle.mileage && (
                      <div className="font-mono text-slate-600 text-[11px]">
                        Kilométrage : {vehicle.mileage.toLocaleString()} km
                      </div>
                    )}

                    {vehicle.vin && (
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        VIN : {vehicle.vin}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Client association */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] truncate mr-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client ? (
                      <span className="text-slate-700 font-medium truncate">
                        {client.first_name} {client.last_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Sans client</span>
                    )}
                  </div>

                  <div className="text-[11px] font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                    <span>Historique</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT VEHICLE MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingVehicle.id ? 'Modifier le véhicule' : 'Nouveau véhicule'}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs (enregistrement libre)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Immat & Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Immatriculation (Facultatif)
                  </label>
                  <input
                    type="text"
                    value={editingVehicle.license_plate || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, license_plate: e.target.value })
                    }
                    placeholder="Ex: AA-123-BB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono uppercase focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Client associé (Facultatif)
                  </label>
                  <select
                    value={editingVehicle.client_id || ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        client_id: e.target.value ? e.target.value : null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Aucun client (Indépendant) --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Marque & Modèle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Marque (Facultatif)</label>
                  <input
                    type="text"
                    value={editingVehicle.brand || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, brand: e.target.value })
                    }
                    placeholder="Ex: Citroën, Peugeot, Renault..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Modèle (Facultatif)</label>
                  <input
                    type="text"
                    value={editingVehicle.model || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, model: e.target.value })
                    }
                    placeholder="Ex: C3, 208, Clio, Golf..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Motorisation, Carburant, Année */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Année</label>
                  <input
                    type="number"
                    value={editingVehicle.year || ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 2002"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Motorisation</label>
                  <input
                    type="text"
                    value={editingVehicle.motorisation || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, motorisation: e.target.value })
                    }
                    placeholder="Ex: 1.4 HDi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Carburant</label>
                  <select
                    value={editingVehicle.fuel_type || 'Diesel'}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, fuel_type: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Essence">Essence</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Électrique">Électrique</option>
                    <option value="GPL">GPL</option>
                  </select>
                </div>
              </div>

              {/* Moteur, Puissance, Kilométrage */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Code Moteur</label>
                  <input
                    type="text"
                    value={editingVehicle.engine_code || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, engine_code: e.target.value })
                    }
                    placeholder="Ex: 8HX (DV4TD)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Puissance (ch)</label>
                  <input
                    type="number"
                    value={editingVehicle.power_ch || ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        power_ch: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 70"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Kilométrage actuel</label>
                  <input
                    type="number"
                    value={editingVehicle.mileage || ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        mileage: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 185000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* VIN & Couleur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Numéro VIN</label>
                  <input
                    type="text"
                    value={editingVehicle.vin || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, vin: e.target.value })
                    }
                    placeholder="VF7FC8HXB..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono uppercase focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Couleur</label>
                  <input
                    type="text"
                    value={editingVehicle.color || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, color: e.target.value })
                    }
                    placeholder="Gris métallisé"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes atelier</label>
                <textarea
                  rows={2}
                  value={editingVehicle.notes || ''}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, notes: e.target.value })
                  }
                  placeholder="Particularités, historique antérieur..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
                >
                  Enregistrer le véhicule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!vehicleToDelete}
        title="Supprimer ce véhicule ?"
        message={`Confirmez-vous la suppression de ${vehicleToDelete?.brand || ''} ${vehicleToDelete?.model || 'ce véhicule'} (${vehicleToDelete?.license_plate || 'Sans immat'}) ?`}
        impactText="Ses réceptions et interventions resteront archivées dans le garage avec le véhicule dissocié."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setVehicleToDelete(null)}
      />
    </div>
  );
};
