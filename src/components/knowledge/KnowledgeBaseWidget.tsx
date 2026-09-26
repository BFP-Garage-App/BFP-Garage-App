import React, { useState } from 'react';
import { useGarage } from '../../context/GarageContext';
import { Vehicle, Part } from '../../types/database';
import { BookOpen, Copy, Check, ArrowRight, AlertCircle, Wrench } from 'lucide-react';

interface KnowledgeBaseWidgetProps {
  vehicle?: Vehicle | null;
  brand?: string | null;
  model?: string | null;
  motorisation?: string | null;
  year?: number | null;
  onUsePart?: (part: Part) => void;
  onNavigate?: (view: string, id?: string) => void;
  className?: string;
}

export const KnowledgeBaseWidget: React.FC<KnowledgeBaseWidgetProps> = ({
  vehicle,
  brand,
  model,
  motorisation,
  year,
  onUsePart,
  onNavigate,
  className = '',
}) => {
  const { findPartsUsedOnSimilarVehicles } = useGarage();
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const queryBrand = brand ?? vehicle?.brand;
  const queryModel = model ?? vehicle?.model;
  const queryMotor = motorisation ?? vehicle?.motorisation;
  const queryYear = year ?? vehicle?.year;

  const matches = findPartsUsedOnSimilarVehicles({
    brand: queryBrand,
    model: queryModel,
    motorisation: queryMotor,
    year: queryYear,
    currentVehicleId: vehicle?.id,
  });

  const handleCopy = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  if (!queryBrand && !queryModel && !queryMotor) {
    return null;
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-5 shadow-2xs ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-orange-50 border border-orange-200 text-orange-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Base de connaissances pièces BFP Garage
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                {matches.length} référence{matches.length > 1 ? 's' : ''} trouvée{matches.length > 1 ? 's' : ''}
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des pièces montées sur véhicules similaires ({queryBrand || ''} {queryModel || ''} {queryMotor || ''})
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Caution notice */}
      <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-2 mb-3.5 text-xs text-orange-950">
        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <p className="leading-snug text-[11px]">
          <strong>Règle atelier :</strong> Une référence affichée ici a été{' '}
          <span className="font-semibold underline decoration-orange-400">
            déjà installée sur un véhicule similaire
          </span>
          . Elle n’est pas automatiquement garantie compatible : le mécanicien doit vérifier la concordance avec la motorisation exacte.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md bg-slate-50">
          Aucun historique de pièces répertorié pour {queryBrand} {queryModel} {queryMotor}.
          Dès qu'une pièce sera commandée sur ce modèle, elle sera mémorisée ici pour vos prochains passages.
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((item, idx) => {
            const { part, vehicle: similarVehicle } = item;
            const isCopied = copiedRef === part.reference;

            return (
              <div
                key={part.id || idx}
                className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{part.designation}</span>
                    {part.brand && (
                      <span className="text-[10px] px-2 py-0.2 bg-white text-slate-700 rounded border border-slate-200 font-medium">
                        {part.brand}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-orange-700 font-bold">
                      Réf : {part.reference || 'Non renseignée'}
                    </span>
                    {part.reference && (
                      <button
                        type="button"
                        onClick={() => handleCopy(part.reference || '')}
                        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                        title="Copier la référence"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>Montée sur :</span>
                    <span className="font-semibold text-slate-700">
                      {similarVehicle?.brand} {similarVehicle?.model} ({similarVehicle?.license_plate || 'Immat libre'})
                    </span>
                    {similarVehicle?.motorisation && (
                      <span>· {similarVehicle?.motorisation}</span>
                    )}
                    {part.supplier && (
                      <span>· Fournisseur : {part.supplier}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {onUsePart && (
                    <button
                      type="button"
                      onClick={() => onUsePart(part)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Réutiliser cette pièce</span>
                    </button>
                  )}
                  {similarVehicle && onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('vehicle-detail', similarVehicle.id)}
                      className="px-2 py-1 text-[10px] text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-white transition-colors"
                      title="Voir le véhicule d'origine"
                    >
                      Voir véhicule
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
