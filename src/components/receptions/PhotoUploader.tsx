import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Tag, MessageSquare, Plus } from 'lucide-react';
import { PhotoCategory, ReceptionPhoto } from '../../types/database';

interface PhotoUploaderProps {
  photos: ReceptionPhoto[];
  onAddPhoto: (photo: Partial<ReceptionPhoto>) => void;
  onDeletePhoto: (id: string) => void;
  receptionId?: string | null;
  vehicleId?: string | null;
  readOnly?: boolean;
}

const CATEGORIES: { value: PhotoCategory; label: string }[] = [
  { value: 'avant', label: 'Face avant' },
  { value: 'arriere', label: 'Arrière' },
  { value: 'cote_gauche', label: 'Côté gauche' },
  { value: 'cote_droit', label: 'Côté droit' },
  { value: 'interieur', label: 'Intérieur' },
  { value: 'tableau_de_bord', label: 'Tableau de bord / Compteur' },
  { value: 'moteur', label: 'Compartiment moteur' },
  { value: 'roue', label: 'Roue / Jante' },
  { value: 'dommage', label: 'Dommage spécifique' },
  { value: 'autre', label: 'Autre' },
];

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onAddPhoto,
  onDeletePhoto,
  receptionId,
  vehicleId,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('autre');
  const [commentInput, setCommentInput] = useState('');

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        onAddPhoto({
          reception_id: receptionId || null,
          vehicle_id: vehicleId || null,
          photo_url: base64Url,
          category: selectedCategory,
          comment: commentInput || null,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
    setCommentInput('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Photos du véhicule (Facultatif)</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Prenez ou importez des photos à l'arrivée (tableau de bord, carrosserie, dommages).
          </p>
        </div>
      </div>

      {!readOnly && (
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-orange-600" />
                Catégorie de la photo (Facultatif)
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PhotoCategory)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-orange-600" />
                Commentaire ou précision (Facultatif)
              </label>
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Ex: Rayure profonde aile arrière gauche..."
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFiles}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Prendre une photo (Appareil)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importer des fichiers</span>
            </button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
          Aucune photo enregistrée pour cette réception.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((ph) => (
            <div
              key={ph.id}
              className="group relative bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                <img
                  src={ph.photo_url || ''}
                  alt={ph.category || 'Photo véhicule'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(ph.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white hover:bg-red-600 rounded transition-colors"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-2 text-[11px] bg-white">
                <div className="font-semibold text-slate-900 truncate">
                  {CATEGORIES.find((c) => c.value === ph.category)?.label || ph.category || 'Photo'}
                </div>
                {ph.comment && (
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {ph.comment}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
