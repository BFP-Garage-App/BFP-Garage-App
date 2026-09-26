import React, { useState } from 'react';
import {
  Car,
  User,
  ClipboardList,
  Wrench,
  Package,
  Calendar,
  Clock,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Camera,
  FileText,
  Tag,
  History,
  CheckCircle,
  Truck,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Fuel,
  Hash,
  BookOpen,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Vehicle, Reception, ReceptionPhoto, Intervention, Part, Appointment, DocumentRecord } from '../types/database';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { KnowledgeBaseWidget } from '../components/knowledge/KnowledgeBaseWidget';

interface VehicleDetailPageProps {
  vehicleId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const VehicleDetailPage: React.FC<VehicleDetailPageProps> = ({
  vehicleId,
  onNavigate,
}) => {
  const {
    getVehicle,
    saveVehicle,
    deleteVehicle,
    getClient,
    clients,
    getReceptionsByVehicle,
    getInterventionsByVehicle,
    getPartsByVehicle,
    getPhotosByVehicle,
    appointments,
    documents,
    savePart,
    updatePartStatus,
  } = useGarage();

  const vehicle = getVehicle(vehicleId);
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'receptions' | 'interventions' | 'parts' | 'photos' | 'documents' | 'knowledge'
  >('timeline');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [newPartData, setNewPartData] = useState<Partial<Part>>({
    designation: '',
    reference: '',
    brand: '',
    supplier: '',
    price_buy_ht: undefined,
    price_sell_ttc: undefined,
    quantity: 1,
    status: 'a_commander',
  });

  if (!vehicle) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 text-sm">Fiche véhicule introuvable.</p>
        <button
          onClick={() => onNavigate('vehicles')}
          className="mt-3 px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs"
        >
          Retour aux véhicules
        </button>
      </div>
    );
  }

  const client = vehicle.client_id ? getClient(vehicle.client_id) : null;
  const receptions = getReceptionsByVehicle(vehicleId);
  const interventions = getInterventionsByVehicle(vehicleId);
  const parts = getPartsByVehicle(vehicleId);
  const photos = getPhotosByVehicle(vehicleId);
  const vehicleAppointments = appointments.filter((a) => a.vehicle_id === vehicleId);
  const vehicleDocuments = documents.filter((d) => d.vehicle_id === vehicleId);

  // BUILD COMPLETE CHRONOLOGICAL TIMELINE (HISTORIQUE VÉHICULE CENTRAL)
  interface TimelineEvent {
    id: string;
    date: string;
    rawDate: string;
    type: 'reception' | 'intervention' | 'part' | 'appointment' | 'finish';
    title: string;
    details?: string;
    badge?: string;
    mileage?: number;
    photosCount?: number;
  }

  const timelineEvents: TimelineEvent[] = [];

  receptions.forEach((r) => {
    timelineEvents.push({
      id: 'rec-' + r.id,
      date: r.reception_date || r.created_at.split('T')[0],
      rawDate: r.created_at,
      type: 'reception',
      title: 'Réception du véhicule',
      details: r.requested_works
        ? `Travaux demandés : ${r.requested_works}`
        : 'Inspection à l’arrivée (carburant, état général, dégâts relevés)',
      mileage: r.mileage_in ?? undefined,
      photosCount: getPhotosByVehicle(vehicleId).filter((p) => p.reception_id === r.id).length,
    });
  });

  interventions.forEach((i) => {
    timelineEvents.push({
      id: 'int-' + i.id,
      date: i.created_at.split('T')[0],
      rawDate: i.created_at,
      type: i.status === 'termine' ? 'finish' : 'intervention',
      title: i.status === 'termine' ? `Travaux terminés : ${i.title}` : `Intervention : ${i.title}`,
      details: i.notes || `Mécanicien assigné : ${i.lead_mechanic || 'Atelier'}`,
      badge: i.status || undefined,
    });
  });

  parts.forEach((p) => {
    if (p.status === 'recue') {
      timelineEvents.push({
        id: 'part-rec-' + p.id,
        date: p.delivery_actual_date || p.created_at.split('T')[0],
        rawDate: p.created_at,
        type: 'part',
        title: `Pièce reçue à l’atelier : ${p.designation}`,
        details: `Réf : ${p.reference || 'N/A'} (${p.brand || 'Marque'}) - Prête pour montage`,
      });
    } else if (p.status === 'commandee') {
      timelineEvents.push({
        id: 'part-cmd-' + p.id,
        date: p.order_date || p.created_at.split('T')[0],
        rawDate: p.created_at,
        type: 'part',
        title: `Commande de pièce : ${p.designation}`,
        details: `Réf : ${p.reference || 'N/A'} auprès de ${p.supplier || 'Fournisseur'}`,
      });
    }
  });

  vehicleAppointments.forEach((a) => {
    timelineEvents.push({
      id: 'apt-' + a.id,
      date: a.date || a.created_at.split('T')[0],
      rawDate: a.created_at,
      type: 'appointment',
      title: `Rendez-vous : ${a.purpose || 'Passage atelier'}`,
      details: `Heure : ${a.time || '08:30'} · Pont : ${a.lift ? a.lift.replace('_', ' ') : 'N/A'}`,
    });
  });

  // Sort timeline chronologically (most recent first)
  timelineEvents.sort(
    (a, b) => new Date(b.date || b.rawDate).getTime() - new Date(a.date || a.rawDate).getTime()
  );

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      saveVehicle(editingVehicle);
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteVehicle = () => {
    deleteVehicle(vehicleId);
    onNavigate('vehicles');
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    savePart({
      ...newPartData,
      vehicle_id: vehicleId,
    });
    setIsAddPartModalOpen(false);
    setNewPartData({
      designation: '',
      reference: '',
      brand: '',
      supplier: '',
      price_buy_ht: undefined,
      price_sell_ttc: undefined,
      quantity: 1,
      status: 'a_commander',
    });
  };

  const displayName = `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Véhicule sans nom';

  return (
    <div className="space-y-5">
      {/* Top action navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('vehicles')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux véhicules</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingVehicle({ ...vehicle });
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

      {/* VEHICLE MAIN HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-300 tracking-wider shadow-2xs">
                {vehicle.license_plate || 'SANS IMMATRICULATION'}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
              {vehicle.year && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {vehicle.year}
                </span>
              )}
            </div>

            {/* Technical details tags */}
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 pt-1">
              {vehicle.motorisation && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200 font-medium">
                  {vehicle.motorisation}
                </span>
              )}
              {vehicle.fuel_type && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200">
                  {vehicle.fuel_type}
                </span>
              )}
              {vehicle.engine_code && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                  Moteur : {vehicle.engine_code}
                </span>
              )}
              {vehicle.power_ch && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                  {vehicle.power_ch} ch
                </span>
              )}
              {vehicle.mileage && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                  {vehicle.mileage.toLocaleString()} km
                </span>
              )}
              {vehicle.vin && (
                <span className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
                  VIN: {vehicle.vin}
                </span>
              )}
            </div>

            {/* Client linked banner */}
            <div className="pt-2">
              {client ? (
                <div
                  onClick={() => onNavigate('client-detail', client.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs cursor-pointer transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Client associé :</span>
                  <span className="font-semibold text-slate-900">
                    {client.first_name} {client.last_name}
                  </span>
                  {client.phone && <span className="font-mono text-slate-500">({client.phone})</span>}
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 italic">
                  <span>Véhicule indépendant (aucun client rattaché)</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick fast actions on vehicle */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={() => onNavigate('new-reception', vehicle.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Créer une réception</span>
            </button>
            <button
              onClick={() => onNavigate('interventions', 'new')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              <span>Nouvelle intervention</span>
            </button>
            <button
              onClick={() => setIsAddPartModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>Commander une pièce</span>
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS (DENSE & ERGONOMIC) */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historique chronologique ({timelineEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('receptions')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'receptions'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Réceptions ({receptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'interventions'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Interventions ({interventions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parts')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'parts'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Pièces utilisées ({parts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Photos ({photos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documents ({vehicleDocuments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'knowledge'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Mémoire pièces</span>
        </button>
      </div>

      {/* TAB CONTENT 1 : HISTORIQUE CHRONOLOGIQUE (FONCTIONNALITÉ CENTRALE) */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Historique Chronologique du Véhicule
              </h3>
              <p className="text-xs text-slate-500">
                Frise temporelle de toute la vie du véhicule dans le garage (réceptions, travaux, pièces, livraisons).
              </p>
            </div>
            <button
              onClick={() => onNavigate('new-reception', vehicle.id)}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              + Nouvelle réception
            </button>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Aucun événement dans l’historique. Réceptionnez ce véhicule pour initier son journal de bord.
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineEvents.map((evt) => (
                <div key={evt.id} className="relative group text-xs">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      evt.type === 'reception'
                        ? 'border-blue-600'
                        : evt.type === 'finish'
                        ? 'border-emerald-600'
                        : evt.type === 'part'
                        ? 'border-orange-600'
                        : 'border-slate-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        evt.type === 'reception'
                          ? 'bg-blue-600'
                          : evt.type === 'finish'
                          ? 'bg-emerald-600'
                          : evt.type === 'part'
                          ? 'bg-orange-600'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  {/* Card */}
                  <div className="bg-slate-50 group-hover:bg-slate-100/70 border border-slate-200 rounded-md p-3 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 font-semibold">{evt.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-slate-900">{evt.title}</span>
                      </div>

                      {evt.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                          {evt.badge}
                        </span>
                      )}
                    </div>

                    {evt.details && <p className="text-slate-600 text-xs mt-1">{evt.details}</p>}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      {evt.mileage && (
                        <span className="font-mono font-medium text-slate-700">
                          Kilométrage relevé : {evt.mileage.toLocaleString()} km
                        </span>
                      )}
                      {evt.photosCount !== undefined && evt.photosCount > 0 && (
                        <span className="text-orange-600 font-medium">
                          {evt.photosCount} photo{evt.photosCount > 1 ? 's' : ''} jointe{evt.photosCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2 : RÉCEPTIONS */}
      {activeTab === 'receptions' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Fiches de Réception ({receptions.length})
            </h3>
            <button
              onClick={() => onNavigate('new-reception', vehicle.id)}
              className="px-3 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md"
            >
              + Nouvelle réception
            </button>
          </div>

          {receptions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Aucune réception pour ce véhicule.</p>
          ) : (
            <div className="space-y-2.5">
              {receptions.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('reception-detail', r.id)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      Réception du {r.reception_date || 'Date libre'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {r.mileage_in ? `${r.mileage_in.toLocaleString()} km` : 'Kilométrage libre'} · Carburant: {r.fuel_level || 'N/A'}
                    </div>
                    {r.requested_works && (
                      <div className="text-slate-700 text-xs mt-1">Travaux: {r.requested_works}</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3 : INTERVENTIONS */}
      {activeTab === 'interventions' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Interventions et Travaux ({interventions.length})
            </h3>
            <button
              onClick={() => onNavigate('interventions', 'new')}
              className="px-3 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md"
            >
              + Nouvelle intervention
            </button>
          </div>

          {interventions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Aucune intervention enregistrée.</p>
          ) : (
            <div className="space-y-2.5">
              {interventions.map((i) => (
                <div
                  key={i.id}
                  onClick={() => onNavigate('interventions', i.id)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{i.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Mécanicien : {i.lead_mechanic || 'Atelier'} · Créé le {new Date(i.created_at).toLocaleDateString('fr-FR')}
                    </div>
                    {i.notes && <div className="text-slate-700 mt-1">{i.notes}</div>}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                    {i.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4 : PIÈCES UTILISÉES */}
      {activeTab === 'parts' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Pièces & Références ({parts.length})
            </h3>
            <button
              onClick={() => setIsAddPartModalOpen(true)}
              className="px-3 py-1 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md"
            >
              + Commander une pièce
            </button>
          </div>

          {parts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Aucune pièce rattachée.</p>
          ) : (
            <div className="space-y-2">
              {parts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{p.designation}</div>
                    <div className="text-[11px] font-mono text-orange-700 mt-0.5">
                      Réf : {p.reference || 'Facultative'} · Marque : {p.brand || 'N/A'} · Fournisseur : {p.supplier || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {p.status}
                    </span>
                    {p.status === 'a_commander' && (
                      <button
                        type="button"
                        onClick={() => updatePartStatus(p.id, 'commandee')}
                        className="px-2 py-1 text-[11px] bg-blue-700 text-white rounded font-medium hover:bg-blue-800"
                      >
                        Commander
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5 : PHOTOS */}
      {activeTab === 'photos' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Galerie Photos du Véhicule ({photos.length})
          </h3>

          {photos.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Aucune photo enregistrée. Les photos prises lors des réceptions apparaîtront ici.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((ph) => (
                <div key={ph.id} className="rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                  <img
                    src={ph.photo_url || ''}
                    alt={ph.category || 'Photo véhicule'}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-2 text-[11px] font-medium text-slate-700 uppercase">
                    {(ph.category || 'Photo').replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 6 : DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Documents Rattachés ({vehicleDocuments.length})
            </h3>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              + Gérer documents
            </button>
          </div>

          {vehicleDocuments.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Aucun document pour ce véhicule.</p>
          ) : (
            <div className="space-y-2">
              {vehicleDocuments.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{d.title}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{d.file_name}</div>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {d.doc_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 7 : MÉMOIRE PIÈCES DE CE MODÈLE */}
      {activeTab === 'knowledge' && (
        <KnowledgeBaseWidget vehicle={vehicle} onNavigate={onNavigate} />
      )}

      {/* EDIT VEHICLE MODAL */}
      {isEditModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Modifier la fiche véhicule</h3>
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

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={editingVehicle.license_plate || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, license_plate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono uppercase focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Client associé</label>
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
                    <option value="">-- Sans client (Indépendant) --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Marque</label>
                  <input
                    type="text"
                    value={editingVehicle.brand || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, brand: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Modèle</label>
                  <input
                    type="text"
                    value={editingVehicle.model || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, model: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Carburant</label>
                  <input
                    type="text"
                    value={editingVehicle.fuel_type || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, fuel_type: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Moteur</label>
                  <input
                    type="text"
                    value={editingVehicle.engine_code || ''}
                    onChange={(e) =>
                      setEditingVehicle({ ...editingVehicle, engine_code: e.target.value })
                    }
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Kilométrage</label>
                  <input
                    type="number"
                    value={editingVehicle.mileage || ''}
                    onChange={(e) =>
                      setEditingVehicle({
                        ...editingVehicle,
                        mileage: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">VIN</label>
                <input
                  type="text"
                  value={editingVehicle.vin || ''}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, vin: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono uppercase focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Notes atelier</label>
                <textarea
                  rows={2}
                  value={editingVehicle.notes || ''}
                  onChange={(e) =>
                    setEditingVehicle({ ...editingVehicle, notes: e.target.value })
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

      {/* ADD PART MODAL */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Commander une pièce pour {displayName}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-orange-600 font-medium mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Tous les champs sont facultatifs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Désignation de la pièce</label>
                <input
                  type="text"
                  value={newPartData.designation || ''}
                  onChange={(e) => setNewPartData({ ...newPartData, designation: e.target.value })}
                  placeholder="Ex: Jeu de 4 plaquettes avant, Kit distribution..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Référence pièce</label>
                  <input
                    type="text"
                    value={newPartData.reference || ''}
                    onChange={(e) => setNewPartData({ ...newPartData, reference: e.target.value })}
                    placeholder="Ex: 0 986 424 705"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={newPartData.supplier || ''}
                    onChange={(e) => setNewPartData({ ...newPartData, supplier: e.target.value })}
                    placeholder="Ex: Autodistribution, LKQ, Mecatronic..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Marque équipementier</label>
                  <input
                    type="text"
                    value={newPartData.brand || ''}
                    onChange={(e) => setNewPartData({ ...newPartData, brand: e.target.value })}
                    placeholder="Ex: Bosch, Valeo, Brembo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-medium block mb-1">Statut commande</label>
                  <select
                    value={newPartData.status || 'a_commander'}
                    onChange={(e) => setNewPartData({ ...newPartData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
                  >
                    <option value="a_commander">À commander</option>
                    <option value="commandee">Commandée</option>
                    <option value="recue">Reçue à l'atelier</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddPartModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md transition-colors shadow-2xs"
                >
                  Ajouter la pièce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer cette fiche véhicule ?"
        message={`Confirmez-vous la suppression de ${displayName} (${vehicle.license_plate || 'Sans immat'}) ?`}
        onConfirm={handleDeleteVehicle}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
