import React, { useState } from 'react';
import {
  ClipboardList,
  Car,
  User,
  Calendar,
  Clock,
  Gauge,
  Fuel,
  FileSignature,
  Camera,
  ArrowLeft,
  Check,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useGarage } from '../context/GarageContext';
import { Reception, ReceptionPhoto, DamagePoint } from '../types/database';
import { DamageCarDiagram } from '../components/receptions/DamageCarDiagram';
import { PhotoUploader } from '../components/receptions/PhotoUploader';
import { SignatureCanvas } from '../components/receptions/SignatureCanvas';

interface NewReceptionPageProps {
  onNavigate: (view: string, id?: string) => void;
  presetVehicleId?: string;
}

export const NewReceptionPage: React.FC<NewReceptionPageProps> = ({
  onNavigate,
  presetVehicleId,
}) => {
  const { vehicles, clients, saveReception, addPhoto, settings } = useGarage();

  const [formData, setFormData] = useState<Partial<Reception>>({
    vehicle_id: presetVehicleId || '',
    client_id: '',
    reception_date: new Date().toISOString().split('T')[0],
    reception_time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    mileage_in: undefined,
    fuel_level: '1/2',
    general_state: '',
    damages_noted: '',
    damages_points: [],
    reserves: '',
    comments: '',
    requested_works: '',
    signature_data_url: null,
    signature_signer_name: '',
    mechanic: settings.mechanics[0] || 'Atelier BFP',
  });

  const [tempPhotos, setTempPhotos] = useState<Partial<ReceptionPhoto>[]>([]);

  // Automatically update client if selected vehicle already has a client
  const handleVehicleChange = (vId: string) => {
    const veh = vehicles.find((v) => v.id === vId);
    setFormData((prev) => ({
      ...prev,
      vehicle_id: vId || null,
      client_id: veh?.client_id || prev.client_id || null,
      mileage_in: veh?.mileage || prev.mileage_in,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // RÈGLE ABSOLUE : AUCUN CHAMP OBLIGATOIRE.
    // L'enregistrement est validé même si l'ensemble des champs est vide !
    const saved = saveReception(formData);

    // Save attached photos
    tempPhotos.forEach((ph) => {
      addPhoto({
        ...ph,
        reception_id: saved.id,
        vehicle_id: saved.vehicle_id || null,
      });
    });

    onNavigate('reception-detail', saved.id);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Top action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('receptions')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux réceptions</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zéro champ obligatoire</span>
          </span>
        </div>
      </div>

      {/* Main Title Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              Fiche de Réception Véhicule à l'Arrivée
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              État des lieux d'entrée : kilométrage, niveau de carburant, schéma des dégâts, photos et signature client.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer la réception</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: VÉHICULE & CLIENT (FACULTATIFS) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Car className="w-4 h-4 text-orange-600" />
            1. Véhicule et Client associés (Facultatifs)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Véhicule concerné (Facultatif)
              </label>
              <select
                value={formData.vehicle_id || ''}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              >
                <option value="">-- Sans véhicule / À identifier plus tard --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.license_plate || 'Sans immat'} · {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Client (Facultatif)
              </label>
              <select
                value={formData.client_id || ''}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value || null })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              >
                <option value="">-- Sans client / Non renseigné --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: DATE, HEURE & MÉCANICIEN */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            2. Heure d'arrivée & Responsable atelier
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Date d'arrivée</label>
              <input
                type="date"
                value={formData.reception_date || ''}
                onChange={(e) => setFormData({ ...formData, reception_date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Heure d'arrivée</label>
              <input
                type="time"
                value={formData.reception_time || ''}
                onChange={(e) => setFormData({ ...formData, reception_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Mécanicien réceptionnaire</label>
              <select
                value={formData.mechanic || 'Atelier BFP'}
                onChange={(e) => setFormData({ ...formData, mechanic: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
              >
                {settings.mechanics.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: KILOMÉTRAGE & CARBURANT */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-orange-600" />
            3. Kilométrage compteur & Carburant (Facultatif)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Kilométrage relevé au compteur (km)
              </label>
              <input
                type="number"
                value={formData.mileage_in || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mileage_in: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Ex: 142500"
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Niveau de carburant à l'arrivée
              </label>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {['Réserve', '1/4', '1/2', '3/4', 'Plein'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormData({ ...formData, fuel_level: lvl })}
                    className={`py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      formData.fuel_level === lvl
                        ? 'bg-orange-600 text-white border-orange-600 font-semibold shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: TRAVAUX DEMANDÉS */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            4. Travaux demandés par le client (Facultatif)
          </label>
          <textarea
            rows={3}
            value={formData.requested_works || ''}
            onChange={(e) => setFormData({ ...formData, requested_works: e.target.value })}
            placeholder="Ex: Remplacement disques et plaquettes avant, bruit suspect à l'accélération, révision des 120 000 km..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* SECTION 5: SCHÉMA DES DÉGÂTS (INTERACTIF) */}
        <div>
          <DamageCarDiagram
            points={formData.damages_points || []}
            onChange={(pts) => setFormData({ ...formData, damages_points: pts })}
          />
        </div>

        {/* SECTION 6: PHOTOS D'ARRIVÉE */}
        <div>
          <PhotoUploader
            photos={tempPhotos as any}
            onAddPhoto={(photo) => setTempPhotos((prev) => [...prev, photo])}
            onDeletePhoto={(idx) =>
              setTempPhotos((prev) => prev.filter((_, i) => i !== parseInt(idx)))
            }
          />
        </div>

        {/* SECTION 7: REMARQUES & RÉSERVES */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            5. Réserves d'usage & Remarques (Facultatif)
          </label>
          <textarea
            rows={2}
            value={formData.reserves || ''}
            onChange={(e) => setFormData({ ...formData, reserves: e.target.value })}
            placeholder="Ex: Véhicule déposé très sale, examen approfondi après lavage..."
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>

        {/* SECTION 8: SIGNATURE ÉLECTRONIQUE */}
        <div>
          <SignatureCanvas
            value={formData.signature_data_url}
            signerName={formData.signature_signer_name}
            onChange={(url) => setFormData({ ...formData, signature_data_url: url })}
            onSignerNameChange={(name) =>
              setFormData({ ...formData, signature_signer_name: name })
            }
          />
        </div>

        {/* BOTTOM SUBMIT BUTTON */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => onNavigate('receptions')}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Annuler
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-2 transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Valider et Enregistrer la Réception</span>
          </button>
        </div>
      </form>
    </div>
  );
};
