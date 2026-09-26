import React, { useState } from 'react';
import {
  Layers,
  Calendar as CalendarIcon,
  Clock,
  Car,
  User,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Appointment, LiftType } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface WorkshopPlanningPageProps {
  onNavigate: (view: string, id?: string) => void;
  openCreateModalDirectly?: boolean;
}

export const WorkshopPlanningPage: React.FC<WorkshopPlanningPageProps> = ({
  onNavigate,
  openCreateModalDirectly = false,
}) => {
  const {
    appointments,
    vehicles,
    clients,
    getVehicle,
    getClient,
    saveAppointment,
    deleteAppointment,
    settings,
  } = useGarage();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'jour' | 'semaine'>('jour');
  const [isModalOpen, setIsModalOpen] = useState(openCreateModalDirectly);
  const [editingAppointment, setEditingAppointment] = useState<Partial<Appointment> | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const LIFT_COLUMNS: { id: LiftType; label: string; desc: string }[] = [
    { id: 'pont_1', label: 'Pont 1', desc: 'Pont élévateur 2 colonnes 4T' },
    { id: 'pont_2', label: 'Pont 2', desc: 'Pont élévateur 2 colonnes 3.5T' },
    { id: 'pont_3', label: 'Pont 3', desc: 'Pont 4 colonnes Géométrie' },
    { id: 'pont_4', label: 'Pont 4', desc: 'Pont ciseau / Diagnostic rapide' },
    { id: 'sans_pont', label: 'Sans pont', desc: 'Zone préparation / Diagnostic valise' },
  ];

  // Helper to change dates
  const handleDateShift = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Appointments for the selected day
  const dayAppointments = appointments.filter((a) => a.date === selectedDate);

  // CONFLICT DETECTION ALGORITHM:
  const checkConflicts = (apt: Appointment): boolean => {
    if (!apt.lift || apt.lift === 'sans_pont' || !apt.time || !apt.date) return false;

    const [aptH, aptM] = apt.time.split(':').map(Number);
    const aptStart = aptH * 60 + aptM;
    const aptEnd = aptStart + (apt.duration_minutes || 60);

    const conflicting = dayAppointments.find((other) => {
      if (other.id === apt.id || other.lift !== apt.lift || !other.time) return false;
      const [oH, oM] = other.time.split(':').map(Number);
      const oStart = oH * 60 + oM;
      const oEnd = oStart + (other.duration_minutes || 60);

      return Math.max(aptStart, oStart) < Math.min(aptEnd, oEnd);
    });

    return !!conflicting;
  };

  const handleOpenCreateForLift = (lift: LiftType) => {
    setEditingAppointment({
      date: selectedDate,
      time: '09:00',
      duration_minutes: 60,
      lift,
      purpose: '',
      description: '',
      mechanic: settings.mechanics[0] || 'Atelier',
      status: 'confirme',
      priority: 'normale',
      client_id: '',
      vehicle_id: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAppointment({ ...apt });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAppointment) {
      saveAppointment(editingAppointment);
      setIsModalOpen(false);
      setEditingAppointment(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (appointmentToDelete) {
      deleteAppointment(appointmentToDelete.id);
      setAppointmentToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            Planning atelier — 4 ponts de levage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organisation des 4 postes d'atelier, gestion des rendez-vous et conflits (tout facultatif).
          </p>
        </div>

        {/* Date controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-1 shadow-2xs">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-mono text-xs text-slate-900 font-bold px-2 py-0.5 focus:outline-hidden"
            />

            <button
              onClick={() => handleDateShift(1)}
              className="p-1 hover:bg-white text-slate-600 rounded transition-colors"
              title="Jour suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-2xs"
          >
            Aujourd'hui
          </button>

          <button
            onClick={() => handleOpenCreateForLift('pont_1')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau rendez-vous</span>
          </button>
        </div>
      </div>

      {/* 5 COLUMNS WORKSHOP PLANNING (PONT 1, PONT 2, PONT 3, PONT 4, SANS PONT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-start">
        {LIFT_COLUMNS.map((col) => {
          const colAppointments = dayAppointments
            .filter((a) => a.lift === col.id)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          return (
            <div
              key={col.id}
              className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="pb-2.5 mb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900" />
                    <h3 className="font-mono text-xs font-bold text-slate-900 uppercase">
                      {col.label}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{col.desc}</p>
                </div>

                <button
                  onClick={() => handleOpenCreateForLift(col.id)}
                  className="p-1 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                  title={`Nouveau rendez-vous sur ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Appointments List for this lift */}
              <div className="space-y-2.5 flex-1">
                {colAppointments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                    <span className="text-[11px]">Disponible</span>
                    <button
                      onClick={() => handleOpenCreateForLift(col.id)}
                      className="mt-2 text-[10px] font-semibold text-orange-600 hover:underline"
                    >
                      + Nouveau rendez-vous
                    </button>
                  </div>
                ) : (
                  colAppointments.map((apt) => {
                    const v = apt.vehicle_id ? getVehicle(apt.vehicle_id) : null;
                    const c = apt.client_id ? getClient(apt.client_id) : null;
                    const hasConflict = checkConflicts(apt);

                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => handleOpenEdit(apt, e)}
                        className={`p-3 rounded-md border text-xs cursor-pointer transition-all shadow-2xs flex flex-col justify-between ${
                          hasConflict
                            ? 'bg-red-50/70 border-red-300 hover:border-red-400'
                            : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          {/* Time & Conflict alert */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {apt.time || '08:30'} ({apt.duration_minutes || 60}m)
                            </span>

                            {hasConflict ? (
                              <span
                                className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200"
                                title="Chevauchement d'horaire détecté sur ce pont"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>Conflit</span>
                              </span>
                            ) : apt.priority === 'urgente' ? (
                              <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                                Urgent
                              </span>
                            ) : null}
                          </div>

                          {/* Purpose */}
                          <h4 className="font-bold text-slate-900 text-xs mb-1">
                            {apt.purpose || 'Rendez-vous atelier'}
                          </h4>

                          {/* Vehicle Plate & Brand */}
                          {v ? (
                            <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5 mb-1">
                              <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate font-mono font-bold text-slate-900">
                                {v.license_plate || 'SANS IMMAT'}
                              </span>
                              <span className="text-slate-500 truncate">
                                · {v.brand} {v.model}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic mb-1">
                              Véhicule non assigné
                            </div>
                          )}

                          {/* Client */}
                          {c && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {c.first_name} {c.last_name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card bottom: Mechanic & Delete */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-medium text-slate-700">{apt.mechanic || 'Atelier'}</span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setAppointmentToDelete(apt)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Supprimer ce créneau"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT APPOINTMENT MODAL (ZERO REQUIRED FIELDS) */}
      {isModalOpen && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAppointment.id ? 'Modifier le créneau d’atelier' : 'Nouveau rendez-vous atelier'}
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
                  Motif / Travaux prévus (Facultatif)
                </label>
                <input
                  type="text"
                  value={editingAppointment.purpose || ''}
                  onChange={(e) =>
                    setEditingAppointment({ ...editingAppointment, purpose: e.target.value })
                  }
                  placeholder="Ex: Révision complète, Freinage AV, Géométrie..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={editingAppointment.date || ''}
                    onChange={(e) =>
                      setEditingAppointment({ ...editingAppointment, date: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={editingAppointment.time || '08:30'}
                    onChange={(e) =>
                      setEditingAppointment({ ...editingAppointment, time: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    value={editingAppointment.duration_minutes || 60}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        duration_minutes: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Lift & Mechanic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Pont d'atelier</label>
                  <select
                    value={editingAppointment.lift || 'pont_1'}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        lift: e.target.value as LiftType,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="pont_1">Pont 1 (2 colonnes 4T)</option>
                    <option value="pont_2">Pont 2 (2 colonnes 3.5T)</option>
                    <option value="pont_3">Pont 3 (4 colonnes Géométrie)</option>
                    <option value="pont_4">Pont 4 (Ciseau / Diagnostic)</option>
                    <option value="sans_pont">Sans pont (Sol / Préparation)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Mécanicien</label>
                  <select
                    value={editingAppointment.mechanic || 'Atelier'}
                    onChange={(e) =>
                      setEditingAppointment({ ...editingAppointment, mechanic: e.target.value })
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

              {/* Vehicle & Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">
                    Véhicule (Facultatif)
                  </label>
                  <select
                    value={editingAppointment.vehicle_id || ''}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        vehicle_id: e.target.value || null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans véhicule --</option>
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
                    value={editingAppointment.client_id || ''}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        client_id: e.target.value || null,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="">-- Sans client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Priorité</label>
                  <select
                    value={editingAppointment.priority || 'normale'}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Statut</label>
                  <select
                    value={editingAppointment.status || 'confirme'}
                    onChange={(e) =>
                      setEditingAppointment({
                        ...editingAppointment,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="prevu">Prévu</option>
                    <option value="confirme">Confirmé</option>
                    <option value="en_cours">En cours sur le pont</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={editingAppointment.notes || ''}
                  onChange={(e) =>
                    setEditingAppointment({ ...editingAppointment, notes: e.target.value })
                  }
                  placeholder="Remarques particulières, pièces prévues..."
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
                  Enregistrer le créneau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!appointmentToDelete}
        title="Supprimer ce rendez-vous ?"
        message={`Confirmez-vous la suppression du créneau "${appointmentToDelete?.purpose || 'Rendez-vous'}" prévu le ${appointmentToDelete?.date || ''} à ${appointmentToDelete?.time || ''} ?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAppointmentToDelete(null)}
      />
    </div>
  );
};
