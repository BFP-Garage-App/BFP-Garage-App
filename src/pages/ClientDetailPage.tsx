import React, { useState } from 'react';
import {
  User,
  Car,
  ClipboardList,
  Wrench,
  Package,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Client, Vehicle, Reception, Intervention, Part } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ClientDetailPageProps {
  clientId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  clientId,
  onNavigate,
}) => {
  const {
    getClient,
    saveClient,
    deleteClient,
    getVehiclesByClient,
    getReceptionsByVehicle,
    getInterventionsByVehicle,
    getPartsByVehicle,
    saveVehicle,
  } = useGarage();

  const client = getClient(clientId);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAttachVehicleModalOpen, setIsAttachVehicleModalOpen] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState<Partial<Vehicle>>({
    license_plate: '',
    brand: '',
    model: '',
    year: undefined,
    motorisation: '',
    mileage: undefined,
  });

  if (!client) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 text-sm">Fiche client introuvable.</p>
        <button
          onClick={() => onNavigate('clients')}
          className="mt-3 px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs"
        >
          Retour aux clients
        </button>
      </div>
    );
  }

  // 1. SES VÉHICULES
  const vehicles = getVehiclesByClient(clientId);

  // 2. RÉCEPTIONS DE SES VÉHICULES
  const allReceptions: Reception[] = [];
  vehicles.forEach((v) => {
    allReceptions.push(...getReceptionsByVehicle(v.id));
  });

  // 3. INTERVENTIONS DE SES VÉHICULES
  const allInterventions: Intervention[] = [];
  vehicles.forEach((v) => {
    allInterventions.push(...getInterventionsByVehicle(v.id));
  });

  // 4. PIÈCES DE SES VÉHICULES
  const allParts: Part[] = [];
  vehicles.forEach((v) => {
    allParts.push(...getPartsByVehicle(v.id));
  });

  const displayName =
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Fiche client sans nom';

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      saveClient(editingClient);
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteClient = () => {
    deleteClient(clientId);
    onNavigate('clients');
  };

  const handleAddVehicleForClient = (e: React.FormEvent) => {
    e.preventDefault();
    saveVehicle({
      ...newVehicleData,
      client_id: clientId,
    });
    setIsAttachVehicleModalOpen(false);
    setNewVehicleData({
      license_plate: '',
      brand: '',
      model: '',
      year: undefined,
      motorisation: '',
      mileage: undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button & Actions bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('clients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux clients</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingClient({ ...client });
              setIsEditModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Modifier la fiche</span>
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      {/* SECTION 1 : CLIENT (INFOS GÉNÉRALES) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
              {client.first_name ? client.first_name[0].toUpperCase() : <User className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  ID: {client.id.substring(0, 8)}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-y-1.5 gap-x-5 text-xs text-slate-600">
                {client.phone && (
                  <div className="flex items-center gap-1.5 font-mono font-medium text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.email}</span>
                  </div>
                )}
                {(client.address || client.city) && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {client.address ? `${client.address}, ` : ''}
                      {client.postal_code ? `${client.postal_code} ` : ''}
                      {client.city || ''}
                    </span>
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700">
                  <span className="text-slate-500 font-semibold block mb-0.5">Notes atelier :</span>
                  {client.notes}
                </div>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
            <div>Fiche créée le {new Date(client.created_at).toLocaleDateString('fr-FR')}</div>
            <div className="mt-1 font-bold text-orange-600">
              {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} rattaché{vehicles.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 : SES VÉHICULES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Véhicules du client ({vehicles.length})
            </h3>
          </div>

          <button
            onClick={() => setIsAttachVehicleModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un véhicule</span>
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-lg">
            <Car className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700">Aucun véhicule rattaché pour l'instant.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Un client peut exister sans véhicule, ou avoir plusieurs véhicules.
            </p>
            <button
              onClick={() => setIsAttachVehicleModalOpen(true)}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
            >
              + Rapprocher un véhicule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {vehicles.map((v) => (
              <div
                key={v.id}
                onClick={() => onNavigate('vehicle-detail', v.id)}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 rounded-lg p-4 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                      {v.license_plate || 'SANS IMMAT'}
                    </span>
                    {v.year && (
                      <span className="text-[11px] text-slate-500 font-mono">{v.year}</span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {v.brand || 'Marque'} {v.model || 'Modèle'}
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {v.motorisation && <div>Motorisation : {v.motorisation}</div>}
                    {v.mileage && <div>Kilométrage : {v.mileage.toLocaleString()} km</div>}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-orange-600 font-semibold">
                  <span>Historique & détails</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3 : INTERVENTIONS DE SES VÉHICULES */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Interventions sur les véhicules ({allInterventions.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('interventions', 'new')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            + Nouvelle intervention
          </button>
        </div>

        {allInterventions.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">Aucune intervention enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {allInterventions.map((i) => (
              <div
                key={i.id}
                onClick={() => onNavigate('interventions', i.id)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-md border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">{i.title}</div>
                  <div className="text-[11px] text-slate-500">
                    Mécanicien: {i.lead_mechanic || 'Atelier'} · Créé le {new Date(i.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                  {i.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4 : RÉCEPTIONS DE SES VÉHICULES */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Fiches de réceptions ({allReceptions.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('new-reception')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            + Réceptionner
          </button>
        </div>

        {allReceptions.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">Aucune fiche de réception.</p>
        ) : (
          <div className="space-y-2">
            {allReceptions.map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigate('reception-detail', r.id)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-md border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    Réception du {r.reception_date || 'Date libre'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {r.mileage_in ? `${r.mileage_in.toLocaleString()} km` : 'Kilométrage libre'}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5 : PIÈCES UTILISÉES */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Pièces commandées / installées ({allParts.length})
            </h3>
          </div>
          <button
            onClick={() => onNavigate('parts', 'new')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            + Commande de pièce
          </button>
        </div>

        {allParts.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">Aucune pièce rattachée.</p>
        ) : (
          <div className="space-y-1.5">
            {allParts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{p.designation}</div>
                  <div className="text-[11px] font-mono text-orange-700">
                    Réf: {p.reference || 'Facultative'} · Fournisseur: {p.supplier || 'N/A'}
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ATTACH NEW VEHICLE MODAL */}
      {isAttachVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rattacher un véhicule à {displayName}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAttachVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicleForClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={newVehicleData.license_plate || ''}
                    onChange={(e) =>
                      setNewVehicleData({ ...newVehicleData, license_plate: e.target.value })
                    }
                    placeholder="Ex: AA-123-BB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Marque</label>
                  <input
                    type="text"
                    value={newVehicleData.brand || ''}
                    onChange={(e) =>
                      setNewVehicleData({ ...newVehicleData, brand: e.target.value })
                    }
                    placeholder="Ex: Peugeot"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Modèle</label>
                  <input
                    type="text"
                    value={newVehicleData.model || ''}
                    onChange={(e) =>
                      setNewVehicleData({ ...newVehicleData, model: e.target.value })
                    }
                    placeholder="Ex: 208"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Motorisation</label>
                  <input
                    type="text"
                    value={newVehicleData.motorisation || ''}
                    onChange={(e) =>
                      setNewVehicleData({ ...newVehicleData, motorisation: e.target.value })
                    }
                    placeholder="Ex: 1.2 PureTech 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAttachVehicleModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
                >
                  Rattacher le véhicule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Modifier la fiche client</h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editingClient.first_name || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, first_name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Nom</label>
                  <input
                    type="text"
                    value={editingClient.last_name || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, last_name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, email: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Adresse</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, address: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Code Postal</label>
                  <input
                    type="text"
                    value={editingClient.postal_code || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, postal_code: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">Ville</label>
                  <input
                    type="text"
                    value={editingClient.city || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, city: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes atelier</label>
                <textarea
                  rows={2}
                  value={editingClient.notes || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer cette fiche client ?"
        message={`Confirmez-vous la suppression de ${displayName} ? Ses véhicules resteront dans le garage mais sans client associé.`}
        onConfirm={handleDeleteClient}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
