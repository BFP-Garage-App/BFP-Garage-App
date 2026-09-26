import React, { useState } from 'react';
import {
  ClipboardList,
  Car,
  User,
  Calendar,
  Clock,
  Printer,
  Wrench,
  ArrowLeft,
  CheckCircle,
  FileSignature,
  Camera,
  Trash2,
  Edit2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Reception, ReceptionPhoto } from '../types/database';
import { DamageCarDiagram } from '../components/receptions/DamageCarDiagram';
import { PhotoUploader } from '../components/receptions/PhotoUploader';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ReceptionDetailPageProps {
  receptionId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ReceptionDetailPage: React.FC<ReceptionDetailPageProps> = ({
  receptionId,
  onNavigate,
}) => {
  const {
    getReception,
    getVehicle,
    getClient,
    deleteReception,
    getPhotosByReception,
    addPhoto,
    deletePhoto,
    saveIntervention,
  } = useGarage();

  const reception = getReception(receptionId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!reception) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 text-sm">Fiche réception introuvable.</p>
        <button
          onClick={() => onNavigate('receptions')}
          className="mt-3 px-3 py-1.5 bg-slate-800 text-white rounded-md text-xs"
        >
          Retour aux réceptions
        </button>
      </div>
    );
  }

  const vehicle = reception.vehicle_id ? getVehicle(reception.vehicle_id) : null;
  const client = reception.client_id ? getClient(reception.client_id) : null;
  const photos = getPhotosByReception(receptionId);

  const handlePrint = () => {
    window.print();
  };

  const handleCreateInterventionFromReception = () => {
    const created = saveIntervention({
      vehicle_id: reception.vehicle_id || null,
      client_id: reception.client_id || null,
      reception_id: reception.id,
      title: reception.requested_works
        ? `Travaux : ${reception.requested_works.substring(0, 50)}`
        : 'Intervention suite réception',
      status: 'a_faire',
      lead_mechanic: reception.mechanic || 'Atelier',
      notes: reception.damages_noted ? `Dommages constatés : ${reception.damages_noted}` : '',
    });
    onNavigate('interventions', created.id);
  };

  const handleDelete = () => {
    deleteReception(receptionId);
    onNavigate('receptions');
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('receptions')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux réceptions</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer la fiche</span>
          </button>

          <button
            onClick={handleCreateInterventionFromReception}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Créer intervention</span>
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Fiche N° {reception.id.substring(0, 8)}
              </span>
              <span className="text-xs text-slate-500">
                Arrivée le {reception.reception_date || 'Date libre'} à {reception.reception_time || '08:30'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Réception Atelier : {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule en cours'}
            </h2>
            <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
              Immatriculation : {vehicle?.license_plate || 'Non renseignée'}
            </div>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-1 sm:border-l border-slate-100 sm:pl-4">
            <div>
              <span className="text-slate-400">Kilométrage : </span>
              <span className="font-mono font-bold text-slate-900">
                {reception.mileage_in ? `${reception.mileage_in.toLocaleString()} km` : 'Non renseigné'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Carburant : </span>
              <span className="font-semibold text-slate-800">{reception.fuel_level || 'Non précisé'}</span>
            </div>
            <div>
              <span className="text-slate-400">Mécanicien : </span>
              <span className="font-semibold text-slate-800">{reception.mechanic || 'Atelier BFP'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* VEHICLE & CLIENT SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-orange-600" />
              Véhicule inspecté
            </h4>
            {vehicle && (
              <button
                onClick={() => onNavigate('vehicle-detail', vehicle.id)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
              >
                <span>Fiche véhicule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {vehicle ? (
            <div className="space-y-1 text-xs text-slate-600">
              <div className="font-bold text-slate-900">
                {vehicle.brand} {vehicle.model}
              </div>
              <div className="font-mono text-slate-700">Immat : {vehicle.license_plate || 'SANS IMMAT'}</div>
              {vehicle.motorisation && <div>Moteur : {vehicle.motorisation}</div>}
              {vehicle.vin && <div className="font-mono text-[11px] text-slate-400">VIN : {vehicle.vin}</div>}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Aucun véhicule rattaché à cette fiche.</div>
          )}
        </div>

        {/* Client */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-600" />
              Client dépositaire
            </h4>
            {client && (
              <button
                onClick={() => onNavigate('client-detail', client.id)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
              >
                <span>Fiche client</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {client ? (
            <div className="space-y-1 text-xs text-slate-600">
              <div className="font-bold text-slate-900">
                {client.first_name} {client.last_name}
              </div>
              {client.phone && <div className="font-mono text-slate-700">Tél : {client.phone}</div>}
              {client.email && <div>Email : {client.email}</div>}
              {client.city && <div>Ville : {client.city}</div>}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Aucun client rattaché (Facultatif).</div>
          )}
        </div>
      </div>

      {/* REQUESTED WORKS */}
      {reception.requested_works && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
            Travaux demandés à la réception
          </h4>
          <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {reception.requested_works}
          </p>
        </div>
      )}

      {/* DAMAGE DIAGRAM (READ ONLY DISPLAY) */}
      <div>
        <DamageCarDiagram
          points={reception.damages_points || []}
          onChange={() => {}}
          readOnly={true}
        />
      </div>

      {/* PHOTOS OF ARRIVAL */}
      <div>
        <PhotoUploader
          photos={photos}
          onAddPhoto={(photo) =>
            addPhoto({
              ...photo,
              reception_id: reception.id,
              vehicle_id: reception.vehicle_id || null,
            })
          }
          onDeletePhoto={deletePhoto}
          receptionId={reception.id}
          vehicleId={reception.vehicle_id}
        />
      </div>

      {/* RESERVES & NOTES */}
      {reception.reserves && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-100">
            Réserves d'usage formulées
          </h4>
          <p className="text-xs text-slate-700 italic">{reception.reserves}</p>
        </div>
      )}

      {/* SIGNATURE SECTION */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-3 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-orange-600" />
          Signature Client / Atelier
        </h4>

        {reception.signature_data_url ? (
          <div className="space-y-2">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 inline-block">
              <img
                src={reception.signature_data_url}
                alt="Signature de réception"
                className="max-h-28 w-auto object-contain"
              />
            </div>
            {reception.signature_signer_name && (
              <div className="text-xs text-slate-600">
                Signataire : <span className="font-semibold text-slate-800">{reception.signature_signer_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Document validé électroniquement à l'arrivée</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Aucune signature apposée sur cette fiche de réception (Facultative).
          </p>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer cette réception ?"
        message="Confirmez-vous la suppression définitive de cette fiche de réception ? L'historique du véhicule sera synchronisé."
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
