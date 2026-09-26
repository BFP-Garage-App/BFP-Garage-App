import React, { useState } from 'react';
import { DamagePoint } from '../../types/database';
import { Plus, Trash2, Info } from 'lucide-react';

interface DamageCarDiagramProps {
  points?: DamagePoint[] | null;
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

export const DamageCarDiagram: React.FC<DamageCarDiagramProps> = ({
  points = [],
  onChange,
  readOnly = false,
}) => {
  const currentPoints = points || [];
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const handleDiagramClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPoint: DamagePoint = {
      id: 'dp-' + Date.now(),
      x,
      y,
      view: 'top',
      label: 'Dommage constaté',
      severity: 'moyen',
    };

    onChange([...currentPoints, newPoint]);
    setSelectedPointId(newPoint.id);
  };

  const handleRemovePoint = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(currentPoints.filter((p) => p.id !== id));
    if (selectedPointId === id) setSelectedPointId(null);
  };

  const handleUpdatePoint = (id: string, updates: Partial<DamagePoint>) => {
    onChange(currentPoints.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const selectedPoint = currentPoints.find((p) => p.id === selectedPointId);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Relevé visuel des dommages (Facultatif)</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Cliquez sur la silhouette du véhicule pour positionner un repère visuel (choc, rayure, etc.).
          </p>
        </div>
        {!readOnly && currentPoints.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
          >
            Effacer tous les repères
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG CAR SILHOUETTE */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200 relative select-none">
          <div className="absolute top-2 left-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            AVANT (MOTEUR)
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            ARRIÈRE (COFFRE)
          </div>

          <svg
            viewBox="0 0 200 420"
            className={`w-48 sm:w-56 h-auto cursor-crosshair transition-all ${readOnly ? 'cursor-default' : ''}`}
            onClick={handleDiagramClick}
          >
            {/* Defs for gradients */}
            <defs>
              <linearGradient id="carBodyLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>

            {/* Wheels */}
            {/* Front Left */}
            <rect x="18" y="70" width="14" height="42" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Front Right */}
            <rect x="168" y="70" width="14" height="42" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Rear Left */}
            <rect x="18" y="300" width="14" height="42" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Rear Right */}
            <rect x="168" y="300" width="14" height="42" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />

            {/* Main Car Body Contour */}
            <path
              d="M 60 25 
                 C 75 18, 125 18, 140 25 
                 C 165 35, 172 65, 172 100 
                 C 172 145, 175 270, 172 320 
                 C 170 365, 160 395, 140 402 
                 C 125 408, 75 408, 60 402 
                 C 40 395, 30 365, 28 320 
                 C 25 270, 28 145, 28 100 
                 C 28 65, 35 35, 60 25 Z"
              fill="url(#carBodyLight)"
              stroke="#64748b"
              strokeWidth="2"
            />

            {/* Hood / Capot lines */}
            <path d="M 45 80 Q 100 95 155 80" fill="none" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Windshield / Pare-brise */}
            <path
              d="M 42 125 
                 C 55 110, 145 110, 158 125 
                 L 150 165 
                 C 140 155, 60 155, 50 165 Z"
              fill="#94a3b8"
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Roof / Pavillon */}
            <rect x="48" y="170" width="104" height="95" rx="10" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Rear window / Lunette arrière */}
            <path
              d="M 50 270 
                 C 60 280, 140 280, 150 270 
                 L 155 305 
                 C 145 315, 55 315, 45 305 Z"
              fill="#94a3b8"
              stroke="#64748b"
              strokeWidth="1.5"
            />

            {/* Mirrors / Rétroviseurs */}
            <rect x="18" y="125" width="12" height="20" rx="3" fill="#64748b" />
            <rect x="170" y="125" width="12" height="20" rx="3" fill="#64748b" />

            {/* DAMAGE PIN MARKERS */}
            {currentPoints.map((pt, idx) => {
              const isSelected = pt.id === selectedPointId;
              const posX = (pt.x / 100) * 200;
              const posY = (pt.y / 100) * 420;

              return (
                <g
                  key={pt.id}
                  transform={`translate(${posX}, ${posY})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointId(pt.id);
                  }}
                >
                  <circle
                    r={isSelected ? 14 : 10}
                    fill={
                      pt.severity === 'important'
                        ? '#dc2626'
                        : pt.severity === 'leger'
                        ? '#f59e0b'
                        : '#ea580c'
                    }
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="shadow-sm transition-all"
                  />
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="select-none pointer-events-none"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </svg>

          {!readOnly && (
            <div className="text-[10px] text-slate-500 mt-2 text-center">
              Cliquez n’importe où sur la voiture pour marquer un impact
            </div>
          )}
        </div>

        {/* SIDE LIST OF DAMAGE POINTS & EDITOR */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Points repérés ({currentPoints.length})</span>
            {currentPoints.length > 0 && <span className="text-slate-500 text-[11px]">Détails & sévérité</span>}
          </div>

          {currentPoints.length === 0 ? (
            <div className="p-5 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500 bg-slate-50">
              <Info className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
              Aucun dégât signalé. Le véhicule est déclaré sans choc ni rayure visible à l’arrivée.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {currentPoints.map((pt, idx) => {
                const isSelected = pt.id === selectedPointId;

                return (
                  <div
                    key={pt.id}
                    onClick={() => setSelectedPointId(pt.id)}
                    className={`p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-orange-50/70 border-orange-400'
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-[10px] ${
                            pt.severity === 'important'
                              ? 'bg-red-600'
                              : pt.severity === 'leger'
                              ? 'bg-amber-500'
                              : 'bg-orange-600'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {!readOnly ? (
                          <input
                            type="text"
                            value={pt.label || ''}
                            onChange={(e) => handleUpdatePoint(pt.id, { label: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Rayure, enfoncement, éclat..."
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 focus:outline-hidden focus:border-orange-500"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{pt.label || 'Dégât'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {!readOnly && (
                          <select
                            value={pt.severity || 'moyen'}
                            onChange={(e) =>
                              handleUpdatePoint(pt.id, { severity: e.target.value as any })
                            }
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-700"
                          >
                            <option value="leger">Léger</option>
                            <option value="moyen">Moyen</option>
                            <option value="important">Important</option>
                          </select>
                        )}

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={(e) => handleRemovePoint(pt.id, e)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Supprimer ce point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
