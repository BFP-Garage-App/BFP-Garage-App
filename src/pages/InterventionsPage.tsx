import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Car,
  User,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Intervention, InterventionStatus, Task } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface InterventionsPageProps {
  onNavigate: (view: string, id?: string) => void;
  openCreateModalDirectly?: boolean;
}

export const InterventionsPage: React.FC<InterventionsPageProps> = ({
  onNavigate,
  openCreateModalDirectly = false,
}) => {
  const {
    interventions,
    vehicles,
    clients,
    getVehicle,
    getClient,
    saveIntervention,
    deleteIntervention,
    getTasksByIntervention,
    saveTask,
    deleteTask,
    settings,
  } = useGarage();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly);
  const [editingIntervention, setEditingIntervention] = useState<Partial<Intervention> | null>(null);
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null);
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);

  // New task inline state
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('freinage');

  const filteredInterventions = interventions.filter((i) => {
    const q = search.toLowerCase();
    const v = i.vehicle_id ? getVehicle(i.vehicle_id) : null;
    const c = i.client_id ? getClient(i.client_id) : null;

    const matchSearch =
      (i.title || '').toLowerCase().includes(q) ||
      (i.lead_mechanic || '').toLowerCase().includes(q) ||
      (i.notes || '').toLowerCase().includes(q) ||
      (v &&
        ((v.brand || '').toLowerCase().includes(q) ||
          (v.model || '').toLowerCase().includes(q) ||
          (v.license_plate || '').toLowerCase().includes(q))) ||
      (c &&
        ((c.first_name || '').toLowerCase().includes(q) ||
          (c.last_name || '').toLowerCase().includes(q)));

    const matchStatus = filterStatus === 'all' || i.status === filterStatus;

    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingIntervention({
      title: '',
      notes: '',
      status: 'a_faire',
      lead_mechanic: settings.mechanics[0] || 'Atelier',
      vehicle_id: '',
      client_id: '',
      estimated_duration_hours: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (i: Intervention, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIntervention({ ...i });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIntervention) {
      // ZERO REQUIRED FIELDS : save even if fields are empty
      saveIntervention(editingIntervention);
      setIsModalOpen(false);
      setEditingIntervention(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (interventionToDelete) {
      deleteIntervention(interventionToDelete.id);
      setInterventionToDelete(null);
      if (selectedInterventionId === interventionToDelete.id) {
        setSelectedInterventionId(null);
      }
    }
  };

  const handleAddTask = (e: React.FormEvent, interventionId: string) => {
    e.preventDefault();
    if (!newTaskDesc.trim()) return;
    saveTask({
      intervention_id: interventionId,
      description: newTaskDesc,
      category: newTaskCategory,
      status: 'a_faire',
    });
    setNewTaskDesc('');
  };

  const selectedIntervention = interventions.find((i) => i.id === selectedInterventionId);
  const selectedTasks = selectedInterventionId
    ? getTasksByIntervention(selectedInterventionId)
    : [];

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Interventions & Travaux Atelier ({interventions.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des ordres de réparation, travaux par mécanicien et pointage des tâches (tout facultatif).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle intervention</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="flex-1 w-full flex items-center gap-2.5 bg-white border border-slate-200 rounded-md p-2 shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre d'intervention, immatriculation, client, mécanicien..."
            className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-48 bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
        >
          <option value="all">Tous les statuts</option>
          <option value="a_faire">À faire</option>
          <option value="en_cours">En cours</option>
          <option value="attente_pieces">Attente pièces</option>
          <option value="termine">Terminé</option>
          <option value="annule">Annulé</option>
        </select>
      </div>

      {/* Main Layout: Master-Detail List and Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interventions List (Col 7 or 12) */}
        <div className={`${selectedIntervention ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-2.5`}>
          {filteredInterventions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-300 rounded-lg bg-white p-6 shadow-2xs">
              <Wrench className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">Aucune intervention trouvée</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3.5 px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-md transition-colors"
              >
                + Créer une intervention (tout facultatif)
              </button>
            </div>
          ) : (
            filteredInterventions.map((i) => {
              const v = i.vehicle_id ? getVehicle(i.vehicle_id) : null;
              const c = i.client_id ? getClient(i.client_id) : null;
              const isSelected = selectedInterventionId === i.id;
              const tasks = getTasksByIntervention(i.id);
              const doneTasks = tasks.filter((t) => t.status === 'termine').length;

              return (
                <div
                  key={i.id}
                  onClick={() => setSelectedInterventionId(isSelected ? null : i.id)}
                  className={`bg-white hover:bg-slate-50/70 border rounded-lg p-4 cursor-pointer transition-all shadow-2xs ${
                    isSelected ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            i.status === 'termine'
                              ? 'bg-emerald-100 text-emerald-800'
                              : i.status === 'en_cours'
                              ? 'bg-orange-100 text-orange-800'
                              : i.status === 'attente_pieces'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {i.status === 'en_cours'
                            ? 'En cours'
                            : i.status === 'attente_pieces'
                            ? 'Attente pièces'
                            : i.status === 'termine'
                            ? 'Terminé'
                            : 'À faire'}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(i.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {i.title || 'Intervention sans titre'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(i, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title="Modifier l'intervention"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setInterventionToDelete(i)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer l'intervention"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle and Client infos */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                    {v ? (
                      <div className="flex items-center gap-1.5 font-mono font-medium text-slate-800">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.license_plate || 'Sans immat'}</span>
                        <span className="text-slate-500 font-sans">({v.brand} {v.model})</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">Sans véhicule assigné</div>
                    )}

                    {c && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.first_name} {c.last_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Mechanic & Progress */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Mécanicien : {i.lead_mechanic || 'Atelier'}</span>
                      {i.estimated_duration_hours && <span>· {i.estimated_duration_hours}h estimées</span>}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                      <span>{tasks.length > 0 ? `${doneTasks}/${tasks.length} tâches` : 'Détails'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Tasks & Notes Pane (Col 5) */}
        {selectedIntervention && (
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                  Détail intervention
                </span>
                <h3 className="text-sm font-bold text-slate-900">{selectedIntervention.title}</h3>
              </div>
              <button
                onClick={() => setSelectedInterventionId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded"
              >
                Fermer
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Statut :</span>
              <select
                value={selectedIntervention.status || 'a_faire'}
                onChange={(e) =>
                  saveIntervention({
                    id: selectedIntervention.id,
                    status: e.target.value as InterventionStatus,
                  })
                }
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-900 focus:outline-hidden font-semibold"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="attente_pieces">Attente pièces</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>

            {selectedIntervention.notes && (
              <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-500 block mb-0.5">Notes :</span>
                {selectedIntervention.notes}
              </div>
            )}

            {/* Tasks list */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span>Tâches et opérations ({selectedTasks.length})</span>
                <span className="text-[10px] text-slate-500">
                  {selectedTasks.filter((t) => t.status === 'termine').length} réalisées
                </span>
              </h4>

              <div className="space-y-1.5 mb-3">
                {selectedTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center italic">
                    Aucune tâche découpée pour cette intervention.
                  </p>
                ) : (
                  selectedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <label className="flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={t.status === 'termine'}
                          onChange={(e) => saveTask({ id: t.id, status: e.target.checked ? 'termine' : 'a_faire' })}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span
                          className={`truncate ${
                            t.status === 'termine' ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                          }`}
                        >
                          {t.description}
                        </span>
                      </label>

                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Supprimer la tâche"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add task inline form */}
              <form
                onSubmit={(e) => handleAddTask(e, selectedIntervention.id)}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Ajouter une tâche (ex: Purge liquide frein...)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md shrink-0 shadow-2xs"
                >
                  + Ajouter
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT INTERVENTION MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && editingIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingIntervention.id ? 'Modifier l’intervention' : 'Nouvelle intervention atelier'}
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
                  Titre des travaux (Facultatif)
                </label>
                <input
                  type="text"
                  value={editingIntervention.title || ''}
                  onChange={(e) =>
                    setEditingIntervention({ ...editingIntervention, title: e.target.value })
                  }
                  placeholder="Ex: Remplacement embrayage, Vidange + filtres, Freinage AV..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Vehicle & Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Véhicule (Facultatif)
                  </label>
                  <select
                    value={editingIntervention.vehicle_id || ''}
                    onChange={(e) =>
                      setEditingIntervention({
                        ...editingIntervention,
                        vehicle_id: e.target.value || null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans véhicule assigné --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.license_plate || 'Sans immat'} · {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Client (Facultatif)</label>
                  <select
                    value={editingIntervention.client_id || ''}
                    onChange={(e) =>
                      setEditingIntervention({
                        ...editingIntervention,
                        client_id: e.target.value || null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans client assigné --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Mechanic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Statut</label>
                  <select
                    value={editingIntervention.status || 'a_faire'}
                    onChange={(e) =>
                      setEditingIntervention({
                        ...editingIntervention,
                        status: e.target.value as InterventionStatus,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="attente_pieces">Attente pièces</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Mécanicien responsable
                  </label>
                  <select
                    value={editingIntervention.lead_mechanic || 'Atelier'}
                    onChange={(e) =>
                      setEditingIntervention({
                        ...editingIntervention,
                        lead_mechanic: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    {settings.mechanics.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration hours */}
              <div>
                <label className="text-slate-700 font-medium block mb-1">Durée estimée (heures)</label>
                <input
                  type="number"
                  step="0.25"
                  value={editingIntervention.estimated_duration_hours || ''}
                  onChange={(e) =>
                    setEditingIntervention({
                      ...editingIntervention,
                      estimated_duration_hours: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="Ex: 1.5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes et consignes</label>
                <textarea
                  rows={2}
                  value={editingIntervention.notes || ''}
                  onChange={(e) =>
                    setEditingIntervention({ ...editingIntervention, notes: e.target.value })
                  }
                  placeholder="Instructions mécaniques, couples de serrage, points d’attention..."
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
                  Enregistrer l'intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!interventionToDelete}
        title="Supprimer cette intervention ?"
        message={`Confirmez-vous la suppression de l'intervention "${interventionToDelete?.title || ''}" ?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setInterventionToDelete(null)}
      />
    </div>
  );
};
