import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Car,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Client } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ClientsPageProps {
  onNavigate: (view: string, id?: string) => void;
  openCreateModalDirectly?: boolean;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  onNavigate,
  openCreateModalDirectly = false,
}) => {
  const { clients, saveClient, deleteClient, getVehiclesByClient } = useGarage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingClient({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postal_code: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient({ ...c });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      // ZERO REQUIRED FIELDS - Enregistre même si tout est vide !
      saveClient(editingClient);
      setIsModalOpen(false);
      setEditingClient(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Répertoire des Clients ({clients.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fiches clients du garage automobile. Tous les champs sont facultatifs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client par nom, prénom, téléphone, email, ville..."
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

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <Users className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucun client trouvé</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Aucun résultat correspondant.' : 'Créez votre première fiche client sans aucune contrainte.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
          >
            + Créer un client (tout facultatif)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredClients.map((client) => {
            const clientVehicles = getVehiclesByClient(client.id);
            const displayName =
              `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Fiche client sans nom';

            return (
              <div
                key={client.id}
                onClick={() => onNavigate('client-detail', client.id)}
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {displayName}
                      </h3>
                      {client.city && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>
                            {client.postal_code ? `${client.postal_code} ` : ''}
                            {client.city}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(client, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier le client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer le client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact infos */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {client.phone ? (
                      <div className="flex items-center gap-2 font-mono font-medium text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Téléphone facultatif</div>
                    )}

                    {client.email && (
                      <div className="flex items-center gap-2 truncate text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Vehicles badge */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {clientVehicles.length} véhicule{clientVehicles.length > 1 ? 's' : ''} associé{clientVehicles.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    <span>Ouvrir</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CLIENT MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingClient.id ? 'Modifier la fiche client' : 'Nouveau client'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Prénom (Facultatif)</label>
                  <input
                    type="text"
                    value={editingClient.first_name || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, first_name: e.target.value })
                    }
                    placeholder="Ex: Jean"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Nom (Facultatif)</label>
                  <input
                    type="text"
                    value={editingClient.last_name || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, last_name: e.target.value })
                    }
                    placeholder="Ex: Dupont"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Téléphone (Facultatif)</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, phone: e.target.value })
                    }
                    placeholder="06 12 34 56 78"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Email (Facultatif)</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, email: e.target.value })
                    }
                    placeholder="client@email.fr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Adresse (Facultatif)</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, address: e.target.value })
                  }
                  placeholder="12 rue de la Paix"
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
                    placeholder="75001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-700 font-medium block mb-1">Ville (Facultatif)</label>
                  <input
                    type="text"
                    value={editingClient.city || ''}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, city: e.target.value })
                    }
                    placeholder="Paris"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes atelier (Facultatif)</label>
                <textarea
                  rows={2}
                  value={editingClient.notes || ''}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, notes: e.target.value })
                  }
                  placeholder="Préférence de contact, véhicule de prêt habituel..."
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
                  Enregistrer la fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        title="Supprimer ce client ?"
        message={`Confirmez-vous la suppression de ${clientToDelete?.first_name || ''} ${clientToDelete?.last_name || 'ce client'} ?`}
        impactText="Ses véhicules ne seront PAS supprimés, ils deviendront simplement sans client assigné (indépendance totale)."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setClientToDelete(null)}
      />
    </div>
  );
};
