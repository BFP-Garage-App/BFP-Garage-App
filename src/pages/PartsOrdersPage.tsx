import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Car,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Check,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Part, PartStatus } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface PartsOrdersPageProps {
  onNavigate: (view: string, id?: string) => void;
  openCreateModalDirectly?: boolean;
}

export const PartsOrdersPage: React.FC<PartsOrdersPageProps> = ({
  onNavigate,
  openCreateModalDirectly = false,
}) => {
  const {
    parts,
    vehicles,
    interventions,
    getVehicle,
    getIntervention,
    savePart,
    updatePartStatus,
    deletePart,
  } = useGarage();

  const [search, setSearch] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | PartStatus>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterVehicleId, setFilterVehicleId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly);
  const [editingPart, setEditingPart] = useState<Partial<Part> | null>(null);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  // Unique suppliers
  const suppliers = Array.from(new Set(parts.map((p) => p.supplier).filter(Boolean))) as string[];

  const filteredParts = parts.filter((p) => {
    const q = search.toLowerCase();
    const v = p.vehicle_id ? getVehicle(p.vehicle_id) : null;

    const matchSearch =
      (p.designation || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.supplier || '').toLowerCase().includes(q) ||
      (v &&
        ((v.license_plate || '').toLowerCase().includes(q) ||
          (v.brand || '').toLowerCase().includes(q) ||
          (v.model || '').toLowerCase().includes(q)));

    const matchStatus = selectedStatusTab === 'all' || p.status === selectedStatusTab;
    const matchSupplier = filterSupplier === 'all' || p.supplier === filterSupplier;
    const matchVehicle = filterVehicleId === 'all' || p.vehicle_id === filterVehicleId;

    return matchSearch && matchStatus && matchSupplier && matchVehicle;
  });

  const countToOrder = parts.filter((p) => p.status === 'a_commander').length;
  const countOrdered = parts.filter((p) => p.status === 'commandee').length;
  const countReceived = parts.filter((p) => p.status === 'recue').length;

  const handleOpenCreate = () => {
    setEditingPart({
      designation: '',
      reference: '',
      brand: '',
      supplier: '',
      price_buy_ht: undefined,
      price_sell_ttc: undefined,
      quantity: 1,
      status: 'a_commander',
      vehicle_id: '',
      intervention_id: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Part, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPart({ ...p });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart) {
      savePart(editingPart);
      setIsModalOpen(false);
      setEditingPart(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (partToDelete) {
      deletePart(partToDelete.id);
      setPartToDelete(null);
    }
  };

  const handleCopyRef = (id: string, ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRefId(id);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Gestion des Pièces & Commandes (Sans Stock)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Flux tendu : commande des pièces à la réception du véhicule et mémorisation automatique des références.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('knowledge-base')}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Base de connaissances</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Commander une pièce</span>
          </button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedStatusTab('all')}
          className={`p-3 rounded-lg border text-left transition-all shadow-2xs ${
            selectedStatusTab === 'all'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="text-xs font-medium opacity-80">Toutes les pièces</div>
          <div className="text-xl font-bold font-mono mt-1">{parts.length}</div>
        </button>

        <button
          onClick={() => setSelectedStatusTab('a_commander')}
          className={`p-3 rounded-lg border text-left transition-all shadow-2xs ${
            selectedStatusTab === 'a_commander'
              ? 'bg-orange-600 border-orange-600 text-white'
              : countToOrder > 0
              ? 'bg-orange-50 border-orange-300 text-orange-900 hover:border-orange-400'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="text-xs font-medium flex items-center justify-between">
            <span>À commander</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono mt-1">{countToOrder}</div>
        </button>

        <button
          onClick={() => setSelectedStatusTab('commandee')}
          className={`p-3 rounded-lg border text-left transition-all shadow-2xs ${
            selectedStatusTab === 'commandee'
              ? 'bg-blue-700 border-blue-700 text-white'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="text-xs font-medium flex items-center justify-between">
            <span>Commandées (en transit)</span>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-blue-700">{countOrdered}</div>
        </button>

        <button
          onClick={() => setSelectedStatusTab('recue')}
          className={`p-3 rounded-lg border text-left transition-all shadow-2xs ${
            selectedStatusTab === 'recue'
              ? 'bg-emerald-700 border-emerald-700 text-white'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <div className="text-xs font-medium flex items-center justify-between">
            <span>Reçues à l'atelier</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono mt-1 text-emerald-700">{countReceived}</div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence, désignation, véhicule, fournisseur..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          {/* Supplier filter */}
          {suppliers.length > 0 && (
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
            >
              <option value="all">Tous fournisseurs</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Vehicle filter */}
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs max-w-[200px]"
          >
            <option value="all">Tous véhicules</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.license_plate || 'Sans immat'} ({v.brand} {v.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parts List */}
      {filteredParts.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
          <Package className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Aucune pièce trouvée</p>
          <button
            onClick={handleOpenCreate}
            className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
          >
            + Enregistrer une commande de pièce
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4">Désignation</th>
                  <th className="py-2.5 px-4">Référence</th>
                  <th className="py-2.5 px-4">Véhicule</th>
                  <th className="py-2.5 px-4">Fournisseur</th>
                  <th className="py-2.5 px-4">Qté / Prix</th>
                  <th className="py-2.5 px-4 text-right">Actions rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.map((p) => {
                  const v = p.vehicle_id ? getVehicle(p.vehicle_id) : null;
                  const isCopied = copiedRefId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Statut with fast switcher */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={p.status || 'a_commander'}
                          onChange={(e) => updatePartStatus(p.id, e.target.value as PartStatus)}
                          className={`text-[11px] font-bold uppercase rounded px-2 py-0.5 border cursor-pointer ${
                            p.status === 'recue'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : p.status === 'commandee'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-orange-50 text-orange-800 border-orange-300'
                          }`}
                        >
                          <option value="a_commander">À commander</option>
                          <option value="commandee">Commandée</option>
                          <option value="recue">Reçue atelier</option>
                        </select>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.designation}</div>
                        {p.brand && (
                          <div className="text-[10px] text-slate-500">Marque : {p.brand}</div>
                        )}
                      </td>

                      {/* Reference with copy button */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.reference ? (
                          <div className="flex items-center gap-1.5 font-mono font-bold text-orange-700 text-xs">
                            <span>{p.reference}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyRef(p.id, p.reference || '', e)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                              title="Copier la référence"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Non renseignée</span>
                        )}
                      </td>

                      {/* Vehicle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {v ? (
                          <div
                            onClick={() => onNavigate('vehicle-detail', v.id)}
                            className="cursor-pointer hover:underline"
                          >
                            <span className="font-mono font-semibold text-slate-800">
                              {v.license_plate || 'Sans immat'}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {v.brand} {v.model}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sans véhicule</span>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {p.supplier || <span className="text-slate-400 italic">Non spécifié</span>}
                      </td>

                      {/* Qte / Prix */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div>Qté: {p.quantity || 1}</div>
                        {p.price_buy_ht && <div>{p.price_buy_ht} € HT</div>}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'a_commander' && (
                            <button
                              onClick={() => updatePartStatus(p.id, 'commandee')}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded flex items-center gap-1 shadow-2xs"
                              title="Basculer en : Commandée"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Commander</span>
                            </button>
                          )}

                          {p.status === 'commandee' && (
                            <button
                              onClick={() => updatePartStatus(p.id, 'recue')}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded flex items-center gap-1 shadow-2xs"
                              title="Basculer en : Reçue atelier"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Réceptionner</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleOpenEdit(p, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPartToDelete(p)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PART MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && editingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPart.id ? 'Modifier la pièce' : 'Commander / Référencer une pièce'}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs</span>
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
              <div>
                <label className="text-slate-700 font-medium block mb-1">
                  Désignation de la pièce (Facultatif)
                </label>
                <input
                  type="text"
                  value={editingPart.designation || ''}
                  onChange={(e) =>
                    setEditingPart({ ...editingPart, designation: e.target.value })
                  }
                  placeholder="Ex: Disques de frein ventilés AV, Filtre à huile..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Référence pièce (Facultatif)
                  </label>
                  <input
                    type="text"
                    value={editingPart.reference || ''}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, reference: e.target.value })
                    }
                    placeholder="Ex: 0986424705"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Fournisseur (Facultatif)
                  </label>
                  <input
                    type="text"
                    value={editingPart.supplier || ''}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, supplier: e.target.value })
                    }
                    placeholder="Ex: Autodistribution, LKQ..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Véhicule de destination (Facultatif)
                  </label>
                  <select
                    value={editingPart.vehicle_id || ''}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, vehicle_id: e.target.value || null })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans véhicule rattaché --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate || 'Sans immat'} · {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Statut commande</label>
                  <select
                    value={editingPart.status || 'a_commander'}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, status: e.target.value as PartStatus })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="a_commander">À commander</option>
                    <option value="commandee">Commandée (en cours)</option>
                    <option value="recue">Reçue à l'atelier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Quantité</label>
                  <input
                    type="number"
                    value={editingPart.quantity || 1}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        quantity: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Prix achat HT (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPart.price_buy_ht || ''}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        price_buy_ht: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Prix vente TTC (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPart.price_sell_ttc || ''}
                    onChange={(e) =>
                      setEditingPart({
                        ...editingPart,
                        price_sell_ttc: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes / Référence OEM</label>
                <textarea
                  rows={2}
                  value={editingPart.notes || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, notes: e.target.value })}
                  placeholder="Équivalences OEM, délai de livraison estimé..."
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
                  Enregistrer la pièce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!partToDelete}
        title="Supprimer cette pièce ?"
        message={`Confirmez-vous la suppression de la pièce "${partToDelete?.designation || ''}" (Réf : ${partToDelete?.reference || 'N/A'}) ?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPartToDelete(null)}
      />
    </div>
  );
};
